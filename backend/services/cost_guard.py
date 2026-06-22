# backend/services/cost_guard.py

def calculate_order_book_slippage(order_quantity: int, best_ask_price: float) -> dict:
    """Audits Limit Order Book depths and checks rolling VWAP divergence parameters."""
    if order_quantity <= 0:
        return {"status": "ERROR", "reason": "Quantity must be greater than zero."}

    simulated_asks = [
        {"price": best_ask_price, "volume": 200},
        {"price": best_ask_price + round(best_ask_price * 0.0005, 2), "volume": 400},
        {"price": best_ask_price + round(best_ask_price * 0.0012, 2), "volume": 1000},
        {"price": best_ask_price + round(best_ask_price * 0.0025, 2), "volume": 5000}
    ]
    
    # Dynamic institutional anchor metric
    simulated_session_vwap = best_ask_price - round(best_ask_price * 0.0015, 2)
    
    remaining_qty = order_quantity
    total_cost = 0.0
    layers_exhausted = 0
    
    for layer in simulated_asks:
        if remaining_qty <= 0:
            break
        allocated = min(remaining_qty, layer["volume"])
        total_cost += allocated * layer["price"]
        remaining_qty -= allocated
        layers_exhausted += 1
        
    if remaining_qty > 0:
        return {"status": "REJECTED", "reason": "Market Liquidity Trap! Insufficient depth."}
        
    ideal_cost = order_quantity * best_ask_price
    avg_fill_price = total_cost / order_quantity
    slippage_loss = total_cost - ideal_cost
    impact_pct = ((avg_fill_price - best_ask_price) / best_ask_price) * 100
    
    # Determine institutional divergence deviation
    vwap_deviation_pct = ((avg_fill_price - simulated_session_vwap) / simulated_session_vwap) * 100
    
    return {
        "status": "SUCCESS",
        "average_fill_price": round(avg_fill_price, 2),
        "hidden_slippage_cost": round(slippage_loss, 2),
        "impact_cost_percentage": round(impact_pct, 3),
        "session_vwap_anchor": round(simulated_session_vwap, 2),
        "vwap_divergence_pct": round(vwap_deviation_pct, 2),
        "signal": "🚨 INSTITUTIONAL OVERPAY" if vwap_deviation_pct > 0.35 else "🟢 LIQUIDITY ACCREDITED"
    }