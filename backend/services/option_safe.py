# backend/services/option_safe.py
import math
import yfinance as yf
import os
import re
from datetime import datetime, timedelta
from google import genai

def fetch_real_option_metrics(symbol: str, target_strike: float, expiry_date: str = None) -> dict:
    symbol = symbol.strip().upper()
    
    # 🇮🇳 Explicitly catch National Stock Exchange or Bombay Stock Exchange suffix indicators
    is_indian_asset = symbol.endswith('.NS') or symbol.endswith('.BO')
    currency_label = "₹" if is_indian_asset else "$"

    try:
        tk = yf.Ticker(symbol)
        hist = tk.history(period="1d")
        if hist.empty:
            return {"status": "ERROR", "reason": f"Could not resolve active price baseline for symbol: {symbol}"}
        
        spot_price = float(hist['Close'].iloc[-1])
        available_expiries = tk.options
        
        # Base structural variables
        data_mode = "QUANT_SIMULATION_NODE"
        selected_expiry = expiry_date
        strike = target_strike
        iv = 0.18
        volume = 120
        open_interest = 450
        
        # Path A: Fetch live exchange options chains if available (US equities)
        if available_expiries and len(available_expiries) > 0 and not is_indian_asset:
            data_mode = "LIVE_EXCHANGE_DATA"
            selected_expiry = expiry_date if expiry_date in available_expiries else available_expiries[0]
            chain = tk.option_chain(selected_expiry)
            calls = chain.calls
            
            if not calls.empty:
                closest_row_idx = (calls['strike'] - target_strike).abs().idxmin()
                target_contract = calls.loc[closest_row_idx]
                
                strike = float(target_contract['strike'])
                iv_raw = float(target_contract['impliedVolatility'])
                iv = iv_raw if iv_raw > 0.01 else 0.25
                volume = int(target_contract.get('volume', 0))
                open_interest = int(target_contract.get('openInterest', 0))
                
                days_to_expiry = max((datetime.strptime(selected_expiry, "%Y-%m-%d") - datetime.now()).days, 1)
                t = days_to_expiry / 365.0
                r = 0.052
        else:
            # Path B: Simulation defaults for missing or non-US options assets
            today = datetime.now()
            gen_expiry = (today + timedelta(days=(3 - today.weekday() + 21) % 7 + 7)).strftime("%Y-%m-%d")
            selected_expiry = expiry_date if expiry_date else gen_expiry
            available_expiries = [selected_expiry]
            t = 15 / 365.0
            r = 0.065

        # Black-Scholes Formula Calculations
        try:
            d1 = (math.log(spot_price / strike) + (r + (iv ** 2) / 2) * t) / (iv * math.sqrt(t))
            nd1 = 0.5 * (1.0 + math.erf(d1 / math.sqrt(2.0)))
            pdf_d1 = (1.0 / math.sqrt(2.0 * math.pi)) * math.exp(-0.5 * (d1 ** 2))
            
            delta = round(nd1, 3)
            gamma = round(pdf_d1 / (spot_price * iv * math.sqrt(t)), 4)
            vega = round((spot_price * math.sqrt(t) * pdf_d1) / 100.0, 3)
            theta = round((-(spot_price * pdf_d1 * iv) / (2 * math.sqrt(t)) - r * strike * math.exp(-r * t) * nd1) / 365.0, 2)
        except:
            delta, gamma, vega, theta = 0.0, 0.0, 0.0, 0.0

        # --- GENERATE PLAIN-ENGLISH TRANSLATION VIA GEMINI ---
        ai_translation = "AI Risk analysis unavailable."
        api_key = os.getenv("GEMINI_API_KEY")
        
        if api_key and not api_key.startswith("AIzaSyYourActualKey"):
            try:
                client = genai.Client(api_key=api_key)
                current_year = 2026

                prompt = f"""
                You are an options trading risk coach. The current year is {current_year}.
                Explain this specific option contract status in plain English to a retail trader:
                Asset: {symbol}
                Current Stock Price: {currency_label}{spot_price}
                Selected Strike Price: {currency_label}{strike}
                Days to Expiry: Contracts expire on {selected_expiry}
                Implied Volatility: {round(iv * 100, 1)}%
                Calculated Metrics: Delta is {delta}, Theta (daily time decay loss) is {currency_label}{theta}, Volume is {volume}.

                Provide a direct, punchy 2-sentence risk breakdown. 
                - Evaluate expiration relative to the current year ({current_year}) so your timeline references are chronologically accurate.
                - If Delta is near 0 and strike is far from stock price, warn them that this option is a 'lottery ticket' highly likely to expire worthless.
                - Explain what the high/low volume means for entering/exiting.
                
                CRITICAL FORMATTING RULES: 
                - Do NOT use markdown bold headers like **Title:**, hash headers (#), or double asterisks (**). 
                - Do NOT use bullet points or list structures. Output a clean, continuous plain text paragraph.
                - CURRENCY CONSTRAINT: Use the EXACT currency symbol provided in the parameters above ({currency_label}). Do NOT use dollars ($) if the asset is provided in rupees ({currency_label}).
                Do not use preachy introduction fluff. Be direct.
                """
                response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
                if response.text:
                    # Strip out any legacy markdown double asterisks safely
                    ai_translation = re.sub(r'\*\*+', '', response.text).strip()
            except Exception as e:
                ai_translation = f"Analysis Translation Error: {str(e)}"
        else:
            ai_translation = "💡 Connect your Gemini API key to display live, plain-English option contract risk translations."

        # Hard sweep catch-all for Indian tickers
        if is_indian_asset:
            ai_translation = ai_translation.replace("$", "₹")

        return {
            "status": "SUCCESS",
            "data_mode": data_mode,
            "symbol": symbol,
            "spot_price": round(spot_price, 2),
            "strike_matched": strike,
            "expiry_used": selected_expiry,
            "all_expiries": list(available_expiries)[:5],
            "implied_volatility": round(iv * 100, 2),
            "open_interest": open_interest,
            "volume": volume,
            "greeks": {"delta": delta, "gamma": gamma, "theta": theta, "vega": vega},
            "risk_translation": ai_translation
        }
    except Exception as e:
        return {"status": "ERROR", "reason": f"Derivatives engine crash: {str(e)}"}