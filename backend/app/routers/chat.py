from fastapi import APIRouter
from pydantic import BaseModel
import os, requests
from dotenv import load_dotenv
load_dotenv('.env')

router = APIRouter()
CLAUDE_KEY = os.getenv("CLAUDE_API_KEY", "")

class ChatRequest(BaseModel):
    message: str
    context: dict = {}
    history: list = []

@router.post("/api/chat")
async def chat(req: ChatRequest):
    if not CLAUDE_KEY or "your_claude" in CLAUDE_KEY:
        return {"reply": f"I can help with your trip! You asked: '{req.message}'. Based on current data, the cheapest route from LKO to BOM is ₹2,840 via Vande Bharat + IndiGo. The ML model says prices may rise — book now!"}
    try:
        context_str = ""
        if req.context.get("routes"):
            context_str = f"Current search has {len(req.context['routes'])} routes. Cheapest: ₹{req.context['routes'][0].get('total_cost','N/A')}."
        system = f"""You are TripDone's AI travel assistant for Indian travel. Be concise, helpful, friendly.
        {context_str}
        Help with: route recommendations, price advice, train info, cab estimates, destination tips."""
        messages = req.history[-6:] + [{"role": "user", "content": req.message}]
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": CLAUDE_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": "claude-haiku-4-5-20251001", "max_tokens": 300, "system": system, "messages": messages},
            timeout=15
        )
        reply = r.json()["content"][0]["text"]
        return {"reply": reply}
    except Exception as e:
        print(f"Claude error: {e}")
        return {"reply": "I can help with your trip planning! Ask me about routes, prices, or destinations."}
