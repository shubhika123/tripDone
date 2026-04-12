from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from supabase import create_client
from app.services.cloudinary_service import upload_image

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_db():
    if SUPABASE_URL and SUPABASE_KEY and "your_supabase" not in SUPABASE_URL:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None

class TripRequest(BaseModel):
    from_city: str
    to_city: str
    travel_date: str
    total_cost: float
    selected_legs: list
    delay_alert_enabled: bool = False
    user_id: str = "guest-user"

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
                "status": "upcoming",
                "user_id": req.user_id
            }).execute()
            trip_id = result.data[0]["id"] if result.data else None
            return {"trip_id": trip_id, "status": "saved", "message": "Trip saved"}
        except Exception as e:
            print(f"DB error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    return {"trip_id": "mock-trip-001", "status": "saved", "message": "Trip saved (mock)"}

@router.get("/api/trips")
async def get_trips(user_id: str = "guest-user"):
    db = get_db()
    if db:
        try:
            # Fetch trips with images
            result = db.table("trips").select("*, trip_images(*)").eq("user_id", user_id).execute()
            return {"trips": result.data}
        except Exception as e:
            print(f"DB error: {e}")
    from app.core.mock_data import MOCK_SAVED_TRIPS
    return {"trips": MOCK_SAVED_TRIPS}

@router.post("/api/trips/{trip_id}/images")
async def upload_trip_image(trip_id: str, user_id: str = Form(...), file: UploadFile = File(...)):
    db = get_db()
    if not db:
        return {"error": "Database connection not available"}
    
    try:
        # Read file content
        content = await file.read()
        
        # Define public_id for Cloudinary
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_id = str(uuid.uuid4())[:8]
        public_id = f"tripdone/{user_id}/{trip_id}/{unique_id}"
        
        # Upload to Cloudinary
        image_url = upload_image(content, public_id)
        
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to upload to Cloudinary")
            
        # Store in DB
        result = db.table("trip_images").insert({
            "trip_id": trip_id,
            "image_url": image_url
        }).execute()
        
        return {"id": result.data[0]["id"], "image_url": image_url}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/trips/images/{image_id}")
async def delete_trip_image(image_id: str):
    db = get_db()
    if not db:
        return {"error": "Database connection not available"}
    
    try:
        db.table("trip_images").delete().eq("id", image_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        print(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
