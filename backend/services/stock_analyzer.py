# backend/services/stock_analyzer.py
import yfinance as yf
import math
import os
import pandas as pd
from google import genai
from google.genai import types

def analyze_custom_ticker(symbol: str) -> dict:
    """
    Queries live yfinance data, computes key structural metrics, and utilizes 
    Gemini 2.5 Flash to generate explicit, structured trade suggestions.
    """
    symbol = symbol.strip().upper()
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="3mo")
        
        if hist.empty:
            return {"status": "ERROR", "reason": f"No active data matrix found for symbol '{symbol}'."}
            
        # --- DEFLATION LAYER: Flatten Multi-Index columns if yfinance wraps them ---
        if isinstance(hist.columns, pd.MultiIndex):
            hist = hist.xs(key=symbol, axis=1, level=1)
        
        # --- TECHNICAL CALCULATIONS CORE ---
        current_price = round(hist['Close'].iloc[-1], 2)
        previous_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
        
        sma_20 = hist['Close'].rolling(window=20).mean().iloc[-1]
        sma_50 = hist['Close'].rolling(window=50).mean().iloc[-1]
        sma_20 = round(sma_20 if not math.isnan(sma_20) else current_price, 2)
        sma_50 = round(sma_50 if not math.isnan(sma_50) else current_price, 2)
        
        session_change = current_price - previous_close
        session_change_pct = (session_change / previous_close) * 100
        
        high_3m = round(hist['High'].max(), 2)
        low_3m = round(hist['Low'].min(), 2)
        

        
        # Determine Baseline Trend
        if current_price > sma_20 and sma_20 > sma_50:
            trend_signal = "STRONG BULLISH BREAKOUT"
            theme = "emerald"
        elif current_price < sma_20 and sma_20 < sma_50:
            trend_signal = "AGGRESSIVE BEARISH CORRECTION"
            theme = "rose"
        else:
            trend_signal = "CONSOLIDATION SIDEWAYS DRIFT"
            theme = "amber"

        # --- GENERATE LIVE TRADE SUGGESTION VIA GEMINI ---
        ai_suggestion = "AI Copilot generation failed or API key missing."
        api_key = os.getenv("GEMINI_API_KEY")
        
        if api_key and not api_key.startswith("AIzaSyYourActualKey"):
            try:
                client = genai.Client(api_key=api_key)
                
                # Inside your backend stock analysis/scanner service file
                current_year = 2026

                prompt = f"""
                You are an elite institutional trading coach and quantitative behavior educator. 
                The current year is {current_year}. Optimize all structural, economic, and timeline descriptions relative to this present-day framework.

                Analyze this live asset profile structure:
                Asset: {symbol.upper()}
                Current Price: ₹{current_price}
                20 SMA Curve Anchor: ₹{sma_20}
                50 SMA Trend Baseline: ₹{sma_50}
                3-Month Dynamic Ceiling: ₹{high_3m}
                3-Month Structural Floor: ₹{low_3m}
                Trend Vector Status: {trend_signal}

                Generate a structured, high-value Educational Trade Suggestion Study. You MUST utilize this exact layout template structure:

                🎓 CORE ARCHITECTURAL PATTERN
                [Identify the specific educational price action setup forming here, e.g., Mean Reversion, VWAP Expansion Breakdown, or Ascending Triangle Consolidation.]

                ⚙️ QUANTITATIVE RISK & POSITION RULES
                - Proposed Entry Focus: Near ₹{current_price}
                - Risk Boundary (Stop-Loss): Calculate a logical technical stop level based on the SMAs/Low metrics.
                - Profit Objective (Target): Calculate a logical technical resistance target based on the High metrics.

                💡 MARKET MECHANICS & TRADER LESSON (The 'Why')
                [Write a concise 2-sentence explanation detailing why institutional order blocks interact at this specific price point, and what retail traps to avoid here.]

                🧠 BEHAVIORAL COACHING HOMEWORK
                [Provide 1 explicit educational takeaway task or psychological trap related to this trend state, e.g., 'Study volume expansion exhaustion to prevent chasing FOMO breakouts at multi-month highs.']

                CRITICAL FORMATTING INSTRUCTIONS:
                1. Do NOT use markdown bold headers like **Title:** or any double asterisks (**). 
                2. Do NOT use bullet symbols (•) under the Rules block; start each rule strictly with a clean single dash (-).
                3. Do NOT include preachy introductory conversational fluff. Begin directly with the first structural emoji block.
                Keep the tone professional, clinical, and authoritative, perfectly optimized for reading inside a tight dark-mode mobile application dashboard card view wrapper.
                """
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                if response.text:
                    ai_suggestion = response.text.strip()
            except Exception as ai_err:
                ai_suggestion = f"Intelligence Generation Error: {str(ai_err)}"
        else:
            ai_suggestion = "💡 System Notice: To unlock real-time institutional entry/exit suggestions, plug your free Gemini API key into your docker-compose.yml file."

        return {
            "status": "SUCCESS",
            "symbol": symbol.upper(),
            "name": ticker.info.get('longName', f"{symbol.upper()} Asset Node"),
            "price": current_price,
            "change": f"{'+' if session_change >= 0 else ''}{round(session_change, 2)}",
            "change_pct": f"{'+' if session_change >= 0 else ''}{round(session_change_pct, 2)}%",
            "metrics": {
                "sma_20": sma_20,
                "sma_50": sma_50,
                "high_3m": high_3m,
                "low_3m": low_3m
            },
            "trend_vector": trend_signal,
            "theme": theme,
            "trade_suggestion": ai_suggestion
        }
    except Exception as e:
        return {"status": "ERROR", "reason": f"Analysis execution failed: {str(e)}"}