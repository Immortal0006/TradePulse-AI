# backend/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.cost_guard import calculate_order_book_slippage  # 🧠 Import your core math service!

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Define the data structure the frontend slider sends over
class SlippageRequest(BaseModel):
    quantity: int
    base_price: float
    profile: str

@router.get("/risk-profile")
def get_account_risk_profile():
    # ... your existing risk profile code ...
    pass

@router.post("/slippage")
def check_order_slippage(payload: SlippageRequest):
    """
    Pipes the live frontend slider variables directly into your 
    institutional limit order book simulation matrix.
    """
    try:
        # Pass the UI values straight into your service layer
        result = calculate_order_book_slippage(
            order_quantity=payload.quantity, 
            best_ask_price=payload.base_price
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liquidity Engine Fault: {str(e)}")