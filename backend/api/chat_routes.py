import time
from fastapi import APIRouter
from pydantic import BaseModel
from core.state import engine
from core.facilities import get_facility_status
from core.gemini_utils import call_gemini

router = APIRouter()

# Response cache with 60s TTL
# format: { message_lowercase: (response, expiry_timestamp) }
chat_cache = {}
CACHE_TTL = 60

class ChatRequest(BaseModel):
    message: str

def get_deterministic_response(message: str):
    """
    Check for keywords and return a rule-based response.
    Bypasses Gemini.
    """
    msg = message.lower()
    
    # Facility mapping
    facilities = {
        "washroom": ["washroom", "toilet", "restroom", "bathroom"],
        "food": ["food", "eat", "snack", "hungry", "burger", "taco", "drink", "beverage"],
        "exit": ["exit", "leave", "out", "gate"],
        "medical": ["medical", "first aid", "doctor", "injury", "help"]
    }

    target = None
    for key, keywords in facilities.items():
        if any(kw in msg for kw in keywords):
            target = key
            break
    
    if target:
        status = get_facility_status(target, engine.zones)
        if not status:
            return None
            
        # Recommend lowest density
        best = min(status, key=lambda x: x["density"])
        density_pct = int(best["density"] * 100)
        
        response = f"I recommend heading to **{best['name']}** in the **{best['zone_id']}**. "
        response += f"It currently has the lowest congestion level ({density_pct}% capacity)."
        
        if density_pct > 80:
            response += " Note: The stadium is currently very busy across all sectors."
            
        return response
        
    return None

@router.post("/chat")
async def chat(request: ChatRequest):
    message = request.message.strip()
    msg_key = message.lower()
    now = time.time()

    # 1. Check Deterministic Logic (Rule-based)
    det_response = get_deterministic_response(message)
    if det_response:
        print(f"[Chat Log]: Deterministic response used for: '{message}'")
        return {"response": det_response}

    # 2. Check Cache
    if msg_key in chat_cache:
        cached_resp, expiry = chat_cache[msg_key]
        if now < expiry:
            print(f"[Chat Log]: Cache hit for: '{message}'")
            return {"response": cached_resp}
        else:
            del chat_cache[msg_key]

    # 3. Call Gemini
    # Build a concise prompt with state
    food_status = get_facility_status("food", engine.zones)
    washroom_status = get_facility_status("washroom", engine.zones)
    
    prompt = f"""
    You are the 'Cortex Arena' AI Concierge. 
    Current Scenario: {engine.current_scenario}
    
    FACILITY DATA:
    - WASHROOMS: {", ".join([f"{f['name']} ({f['density']*100}%)" for f in washroom_status])}
    - FOOD: {", ".join([f"{f['name']} ({f['density']*100}%)" for f in food_status])}

    USER QUESTION: {message}
    
    RULES:
    - Be concise (max 2 sentences).
    - Use a professional, slightly 'high-tech' tone.
    - If rate limited, you won't see this, but handle general stadium questions.
    """

    response_text = call_gemini(prompt, source="chat")

    # 4. Handle Response & Caching
    if response_text == "RATE_LIMITED":
        return {"response": "I'm currently experiencing high load. Please try again in a few seconds."}
    
    if not response_text:
        return {"response": "System error. My diagnostics indicate a connection interruption. [Gemini Offline]"}

    # Store in cache
    chat_cache[msg_key] = (response_text, now + CACHE_TTL)
    return {"response": response_text}
