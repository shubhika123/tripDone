from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import os
from supabase import create_client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_db():
    if SUPABASE_URL and SUPABASE_KEY and "your_supabase" not in SUPABASE_URL:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None

class TripRequest(BaseModel):
    route_id: int
    selected_legs: list
    total_cost: float
    delay_alert_enabled: bool = False
    travel_date: str
    from_city: str = ""
    to_city: str = ""

@router.post("/api/trips")
async def save_trip(req: TripRequest):
    db = get_db()
    if db:
        try:
            result = db.table("trips").insert({
                "from_city": req.from_city,
                "to_city": req.to_city,
                "travel_date": req.travel_date,
                "total_cost": req.total_cost,
                "selected_legs": req.selected_legs,
                "delay_alert_enabled": req.delay_alert_enabled,
                "status": "upcoming"
            }).execute()
            trip_id = result.data[0]["id"] if result.data else "new-trip"
            return {"trip_id": trip_id, "status": "saved", "message": "Trip saved"}
        except Exception as e:
            print(f"DB error: {e}")
    return {"trip_id": "mock-trip-001", "status": "saved", "message": "Trip saved (mock)"}

@router.get("/api/trips")
async def get_trips():
    db = get_db()
    if db:
        try:
            result = db.table("trips").select("*").execute()
            return {"trips": result.data}
        except Exception as e:
            print(f"DB error: {e}")
    from app.core.mock_data import MOCK_SAVED_TRIPS
    return {"trips": MOCK_SAVED_TRIPS}
