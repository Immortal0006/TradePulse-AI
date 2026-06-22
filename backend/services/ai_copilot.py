# ai_copilot.py
from google import genai
import os
import re

def generate_behavioral_audit(journal_history: list) -> str:
    """
    Pipes historical trade metrics and emotional text inputs into Gemini 
    to extract actionable psychological patterns and corrections.
    """
    try:
        api_key_env = os.environ.get("GEMINI_API_KEY")
        
        # Initialize the modern corporate AI SDK client instance
        client = genai.Client(api_key=api_key_env)
        
        payload_context = str(journal_history)
        
        prompt = f"""
        You are an elite institutional trading psychologist running an internal performance audit for a professional desk.
        Analyze this historical log array of retail execution entries and active mindset data:
        {payload_context}
        
        Deliver a highly concise, blunt, three-bullet psychological critique mapping:
        1. The primary emotional bias pattern detected (e.g., FOMO, revenge trading, structural impatience).
        2. The quantitative damage vector (how this mindset choice causes entry slippage or stops out too early).
        3. A direct, clear one-sentence operational action rule to fix this exact behavior tomorrow morning.
        
        CRITICAL FORMATTING RULE: Do NOT use markdown bold headers like **Title:** or asterisks. 
        Start each bullet point directly with a clean, single dash (-) followed immediately by the text statement.
        Keep your response brief and optimized for direct display on a modern mobile application dashboard container screen.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        clean_text = re.sub(r'\*\*+', '', response.text)
        return clean_text.strip()
    except Exception as e:
        return f"AI Copilot Audit Stream briefly unavailable: {str(e)}"