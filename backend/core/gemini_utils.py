import time
import os
from google import genai

class GeminiLimiter:
    def __init__(self, cooldown_seconds=12):
        self.cooldown_seconds = cooldown_seconds
        self.last_chat_call = 0
        self.last_orchestrator_call = 0
        self.model_name = "gemini-flash-lite-latest"

    def can_call_chat(self):
        now = time.time()
        if now - self.last_chat_call > self.cooldown_seconds:
            self.last_chat_call = now
            return True
        return False

    def can_call_orchestrator(self):
        now = time.time()
        if now - self.last_orchestrator_call > self.cooldown_seconds:
            self.last_orchestrator_call = now
            return True
        return False

limiter = GeminiLimiter()

def call_gemini(prompt: str, source: str = "chat"):
    """
    Unified call to Gemini with separate cooldowns for chat and orchestrator.
    source: 'chat' or 'orchestrator'
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[Gemini Error]: GOOGLE_API_KEY not found in environment.")
        return None

    # Check cooldown
    if source == "chat":
        if not limiter.can_call_chat():
            print(f"[Gemini Log]: Chat cooldown active. Skipping call.")
            return "RATE_LIMITED"
    else:
        if not limiter.can_call_orchestrator():
            print(f"[Gemini Log]: Orchestrator cooldown active. Skipping call.")
            return "RATE_LIMITED"

    try:
        print(f"[Gemini Log]: Calling {limiter.model_name} for source: {source}")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=limiter.model_name,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Error]: {e}")
        # Detect 429 specifically if possible (though genai lib might wrap it)
        if "429" in str(e) or "quota" in str(e).lower():
            print("[Gemini Log]: Rate limit (429) detected via Gemini API.")
            return "RATE_LIMITED"
        return None
