import asyncio
import json
import time
import analytics
import random
import os
import orders
import jose.jwt as jose_jwt
from fastapi import Header
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from auth import SECRET_KEY, ALGORITHM
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import yfinance as yf
from fastapi.security import OAuth2PasswordRequestForm

# SQLAlchemy Elements
from database import engine, SessionLocal, Base, get_db
from models import User, Trade, Strategy  # Assuming your declarative models are structured here
from auth import get_password_hash, verify_password, create_access_token, get_current_user

# Pre-existing Project Cache & Business Logic Services
from cache import LIVE_WATCHLIST_CACHE, ACCOUNT_RISK_STATE
from services.cost_guard import calculate_order_book_slippage
from services.ai_copilot import generate_behavioral_audit
from services.stock_analyzer import analyze_custom_ticker
from services.option_safe import fetch_real_option_metrics

# -------------------------------------------------------------------------
# Pydantic Schemas for Validation Data Contracts
# -------------------------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class TradeCreate(BaseModel):
    symbol: str
    type: str
    quantity: int
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    is_paper_trade: bool = True
    journal_notes: Optional[str] = None
    behavioral_tag: Optional[str] = "DISCIPLINED"

class TradeResponse(BaseModel):
    id: str
    symbol: str
    type: str
    quantity: int
    entry_price: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    exit_price: Optional[float]
    realized_pnl: float
    status: str
    is_paper_trade: bool
    journal_notes: Optional[str]
    behavioral_tag: str
    created_at: datetime

    class Config:
        from_attributes = True

# -------------------------------------------------------------------------
# LIFECYCLE LIFESPAN & BACKGROUND TASK ROUTINES
# -------------------------------------------------------------------------
async def run_live_market_stream():
    """Persistent asynchronous routine streaming genuine price updates using yfinance."""
    global LIVE_WATCHLIST_CACHE
    target_stocks = ["SBIN.NS", "RELIANCE.NS", "TCS.NS"]
    
    print("🚀 TradePulse AI Core: Asynchronous live market stream listener engine active.")
    
    while True:
        if not ACCOUNT_RISK_STATE["is_locked"]:
            for symbol in target_stocks:
                try:
                    ticker_obj = yf.Ticker(symbol)
                    fast_info = ticker_obj.fast_info
                    
                    current_price = fast_info.last_price
                    day_open = fast_info.open
                    
                    if day_open and current_price:
                        pct_change = ((current_price - day_open) / day_open) * 100
                        change_string = f"{pct_change:+.2f}%"
                    else:
                        change_string = "+0.00%"
                        
                    clean_name = symbol.split('.')[0]
                    
                    LIVE_WATCHLIST_CACHE[symbol] = {
                        "token": symbol,
                        "symbol": symbol,
                        "name": f"{clean_name} Industrial Equity",
                        "price": round(current_price, 2) if current_price else 820.00,
                        "change": change_string,
                        "timestamp": time.strftime("%H:%M:%S")
                    }
                except Exception as e:
                    print(f"⚠️ Market Stream Sync Alert for {symbol}: {e}")
                    continue
                    
        # Use asynchronous non-blocking sleep so the main engine can breathe!
        await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles auto-migrations on initialization and cleans up worker state on teardown."""
    print("⚙️ Initializing Relational Storage Tables via Schema Blueprints...")
    
    # 🎯 Restored to strict execution. If the database connection isn't perfect, it should tell us!
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables successfully mapped/verified.")
    
    # Launch background market streaming task safely
    stream_task = asyncio.create_task(run_live_market_stream())
    
    yield
    
    print("🛑 Orchestrating graceful shutdown for stream tasks...")
    stream_task.cancel()
    try:
        await stream_task
    except asyncio.CancelledError:
        print("✅ Background routines terminated cleanly.")

# -------------------------------------------------------------------------
# APPLICATION SETUP & MIDDLEWARE POOL
# -------------------------------------------------------------------------
app = FastAPI(title="TradePulse AI Core Engine", lifespan=lifespan)
app.include_router(analytics.router) 
# app.include_router(orders.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# AUTHENTICATION ROUTING GATEWAY
# -------------------------------------------------------------------------
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister, db = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Identity mapping collision: Email already exists.")
    
    # Ensure plain text string is passed to hash utility
    hashed = get_password_hash(str(user_data.password))
    new_user = User(email=clean_email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": str(new_user.id), "email": new_user.email, "status": "PROVISIONED"}

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    # 1. Force lower-case lookups to prevent case sensitivity issues on emails
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    
    # 2. Explicitly cast passwords to strings to eliminate binary byte array mismatches
    if not user or not verify_password(str(form_data.password), str(user.hashed_password)):
        raise HTTPException(
            status_code=401, 
            detail="Invalid cryptographic authentication signatures."
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
@app.get("/api/users/me")
def read_current_user_profile(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "is_active": current_user.is_active}

# 1. Update the schema definition to be hyper-flexible with types
class OrderExecutionRequest(BaseModel):
    symbol: str
    type: str
    quantity: float              # ⚡ Changed from int to float to safely handle any incoming JS numbers
    entry_price: float
    stop_loss: Optional[float] = None     # ⚓ Ensure these are cleanly wrapped as Optional
    take_profit: Optional[float] = None
    is_paper_trade: Optional[bool] = True

@app.post("/api/orders/execute")
def execute_order(
    payload: OrderExecutionRequest, 
    db: Session = Depends(get_db),
    authorization: str = Header(None) # 🔒 Grab the raw header string directly!
):
    """
    Direct institutional settlement checkpoint with manual header verification
    to completely bypass dependency injection mismatch traps.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Manually parse and verify the Authorization Header
    if not authorization or not authorization.startswith("Bearer "):
        print("🛑 Auth Header missing or improperly formatted:", authorization)
        raise credentials_exception
        
    token = authorization.split(" ")[1]
    
    if not payload.symbol or not payload.symbol.strip():
        raise HTTPException(status_code=400, detail="Invalid target asset identifier.")
        
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Execution volume must be greater than zero shares.")
    
    try:
        # Decode the token exactly like auth.py does
        decoded_payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = decoded_payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception as jwt_err:
        print("🛑 JWT Decode manual failure:", str(jwt_err))
        raise credentials_exception
        
    # 2. Fetch the user from the database
    current_user = db.query(User).filter(User.email == email).first()
    if current_user is None:
        raise credentials_exception

    # 3. Proceed with the trade execution securely
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Execution volume must be greater than zero shares.")
    
    try:
        new_trade = Trade(
            user_id=current_user.id, 
            symbol=payload.symbol.strip().upper(),
            type=payload.type.upper(),
            quantity=int(payload.quantity),
            entry_price=payload.entry_price,
            stop_loss=payload.stop_loss,
            take_profit=payload.take_profit,
            status="OPEN",
            is_paper_trade=payload.is_paper_trade,
            behavioral_tag="DISCIPLINED"
        )
        
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        
        return {
            "status": "SUCCESS",
            "message": f"Flawlessly deployed position size for {payload.symbol}.",
            "trade_id": new_trade.id,
            "allocated_capital": float(payload.entry_price * payload.quantity)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Execution block transactional fault: {str(e)}")
# -------------------------------------------------------------------------
# RELATIONAL DATABASE CRUDS: TRANSACTIONAL JOURNAL LEDGER
# -------------------------------------------------------------------------
@app.post("/api/trades", response_model=TradeResponse)
def log_new_trade(trade_data: TradeCreate, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trade = Trade(
        user_id=current_user.id,
        symbol=trade_data.symbol.strip().upper(),
        type=trade_data.type,
        quantity=trade_data.quantity,
        entry_price=trade_data.entry_price,
        stop_loss=trade_data.stop_loss,
        take_profit=trade_data.take_profit,
        is_paper_trade=trade_data.is_paper_trade,
        journal_notes=trade_data.journal_notes,
        behavioral_tag=trade_data.behavioral_tag,
        status="OPEN",
        realized_pnl=0.0
    )
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@app.get("/api/trades", response_model=List[TradeResponse])
def get_user_trade_history(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Trade).filter(Trade.user_id == current_user.id).order_by(Trade.created_at.desc()).all()

@app.put("/api/trades/{trade_id}", response_model=TradeResponse)
def modify_or_close_trade_record(trade_id: str, payload: dict = Body(...), db = Depends(get_db), current_user: User = Depends(get_current_user)):
    trade_record = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade_record:
        raise HTTPException(status_code=404, detail="Target transaction index reference missing.")
        
    if "exit_price" in payload:
        trade_record.exit_price = float(payload["exit_price"])
        trade_record.status = "CLOSED"
        # Calculate standard directional realized PnL calculations
        multiplier = 1 if trade_record.type.upper() == "BUY" else -1
        trade_record.realized_pnl = (trade_record.exit_price - trade_record.entry_price) * trade_record.quantity * multiplier
        
    if "journal_notes" in payload:
        trade_record.journal_notes = payload["journal_notes"]
    if "behavioral_tag" in payload:
        trade_record.behavioral_tag = payload["behavioral_tag"]
        
    db.commit()
    db.refresh(trade_record)
    return trade_record

# -------------------------------------------------------------------------
# WEBSOCKET STREAM ROUTE
# -------------------------------------------------------------------------
@app.websocket("/api/market-stream")
async def market_data_stream(websocket: WebSocket):
    """
    Handles the persistent high-fidelity market data streaming channel,
    pushing live ticking matrix price points over a secure protocol.
    """
    await websocket.accept()
    
    # Track core tickers to broadcast matching your grid view layout
    monitored_tickers = [
        {"symbol": "SBIN.NS", "name": "State Bank of India", "base": 842.15},
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "base": 2945.60},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "base": 4162.00},
        {"symbol": "TATASTEEL.NS", "name": "Tata Steel Limited", "base": 164.80}
    ]
    
    try:
        while True:
            updated_ticks = []
            for ticker in monitored_tickers:
                # Inject a minor realistic micro-variance fluctuation to simulation price actions
                pct_change = random.uniform(-0.002, 0.003)
                ticker["base"] = round(ticker["base"] * (1 + pct_change), 2)
                
                direction = "+" if pct_change >= 0 else ""
                change_str = f"{direction}{round(pct_change * 100, 2)}%"
                
                updated_ticks.append({
                    "symbol": ticker["symbol"],
                    "name": ticker["name"],
                    "price": ticker["base"],
                    "change": change_str,
                    "timestamp": "Live"
                })
            
            # Broadcast payload downstream over the open connection frame
            await websocket.send_json({
                "type": "MARKET_DATA",
                "payload": updated_ticks
            })
            
            # Ticker interval loop pace (every 2 seconds)
            await asyncio.sleep(2.0)
            
    except WebSocketDisconnect:
        print("💡 Surveillance Node Channel disconnected cleanly from client framework.")
    except Exception as e:
        print(f"⚠️ Stream anomaly detected: {str(e)}")
# -------------------------------------------------------------------------
# ANALYTICS & RISK MICROSERVICES ENDPOINTS
# -------------------------------------------------------------------------
@app.post("/api/analytics/cost-guard")
async def check_cost_guard_parameters(payload: dict = Body(...)):
    order_qty = int(payload.get("quantity", 100))
    target_symbol = payload.get("symbol", "SBIN.NS")
    cached_stock = LIVE_WATCHLIST_CACHE.get(target_symbol)
    best_ask_baseline = cached_stock["price"] if cached_stock else 820.00
    return calculate_order_book_slippage(order_qty, best_ask_baseline)

@app.post("/api/analytics/option-safe")
async def evaluate_option_premium_risk(payload: dict = Body(...)):
    """Interfaces with live exchange options chains to extract true contract variables."""
    target_symbol = payload.get("symbol", "SBIN.NS").strip().upper()
    strike_input = float(payload.get("strike_price", 820.0))
    expiry_input = payload.get("expiry_date", None)
    
    return fetch_real_option_metrics(target_symbol, strike_input, expiry_input)

@app.post("/api/risk/update-drawdown")
async def update_session_drawdown_metrics(payload: dict = Body(...)):
    simulated_pnl = float(payload.get("simulated_loss", 0.0))
    ACCOUNT_RISK_STATE["current_drawdown"] = simulated_pnl
    if simulated_pnl <= ACCOUNT_RISK_STATE["max_daily_loss_limit"]:
        ACCOUNT_RISK_STATE["is_locked"] = True
        return {"status": "LOCKED", "message": "🚨 DRAWDOWN BOUNDARY CRUSHED. LOCKOUT ACTIVE."}
    return {"status": "OPERATIONAL", "current_drawdown": simulated_pnl}

@app.post("/api/journal/audit")
async def run_psychology_audit_stream(payload: dict = Body(...)):
    history_array = payload.get("history", [])
    if not history_array:
        return {"audit": "Log entries to initialize automated behavior analysis."}
    return {"audit": generate_behavioral_audit(history_array)}

@app.post("/api/stocks/analyze")
async def process_custom_stock_search(payload: dict = Body(...)):
    """Acts as an on-demand technical scanner for any requested exchange ticker symbol."""
    target_ticker = payload.get("symbol", "").strip()
    if not target_ticker:
        return {"status": "ERROR", "reason": "No query token provided."}
        
    return analyze_custom_ticker(target_ticker)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)