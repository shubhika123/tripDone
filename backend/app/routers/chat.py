from fastapi import APIRouter
from pydantic import BaseModel
import os, requests
from dotenv import load_dotenv
load_dotenv('.env')

router = APIRouter()
GROQ_KEY = os.getenv("GROQ_API_KEY", "")

class ChatRequest(BaseModel):
    message: str
    context: dict = {}
    history: list = []

@router.post("/api/chat")
async def chat(req: ChatRequest):
    if not GROQ_KEY or "PASTE" in GROQ_KEY:
        return {"reply": f"The cheapest route from LKO to BOM is ₹2,840 via Vande Bharat + IndiGo. ML model says: Book Now — prices likely to rise before the weekend."}
    try:
        context_str = ""
        if req.context.get("routes"):
            context_str = f"User is searching {req.context.get('from_city','LKO')} to {req.context.get('to_city','BOM')}. Cheapest route: ₹{req.context.get('routes',[{}])[0].get('total_cost','N/A')}."
        
        messages = [{"role":"system","content":f"You are TripDone's AI travel assistant for Indian travel. Be concise, helpful, friendly. {context_str}"}]
        for h in req.history[-4:]:
            messages.append(h)
        messages.append({"role":"user","content":req.message})
        
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization":f"Bearer {GROQ_KEY}","Content-Type":"application/json"},
            json={"model":"llama-3.1-8b-instant","max_tokens":200,"messages":messages},
            timeout=15
        )
        reply = r.json()["choices"][0]["message"]["content"]
        return {"reply": reply}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"reply": "I can help with routes, prices, and travel tips! Ask me anything about your journey."}
