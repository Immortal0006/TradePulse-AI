# backend/orders.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models
from models import User, Trade # Ensure it matches your file configuration naming exactly
from database import get_db
# Assuming your auth.py exports a helper dependency to verify JWT tokens and return the current user profile
from auth import get_current_user 

router = APIRouter(prefix="/api/orders", tags=["orders"])

class OrderExecutionRequest(BaseModel):
    symbol: str
    type: str          # Must match "BUY" or "SELL"
    quantity: int
    entry_price: float
    stop_loss: float = None
    take_profit: float = None # Matches your model structure perfectly
    is_paper_trade: bool = True

@router.post("/execute")
def execute_order(
    payload: OrderExecutionRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 🔒 Locks position to the active session user account
):
    """
    Safely captures the trade execution payload and assigns it directly 
    to the active authenticated user's relational storage ledger tables.
    """
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Execution quantity must be greater than zero.")
    
    try:
        # Calculate base structural metrics matching your ledger definitions
        new_trade = Trade(
            user_id=current_user.id, # Binds the trade directly to your existing user relationship map
            symbol=payload.symbol.strip().upper(),
            type=payload.type.upper(),
            quantity=payload.quantity,
            entry_price=payload.entry_price,
            stop_loss=payload.stop_loss,
            take_profit=payload.take_profit,
            status="OPEN",
            is_paper_trade=payload.is_paper_trade,
            behavioral_tag="DISCIPLINED" # Defaults to clean state tracking
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
        raise HTTPException(status_code=500, detail=f"Order routing execution node failure: {str(e)}")