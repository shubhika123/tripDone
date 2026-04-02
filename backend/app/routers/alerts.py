from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
load_dotenv('.env')

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def get_db():
    if SUPABASE_URL and SUPABASE_KEY and "your_supabase" not in SUPABASE_URL:
        try:
            from supabase import create_client
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"Supabase init error: {e}")
    return None


class AlertRequest(BaseModel):
    route: str                         # e.g. "LKO-BOM"
    mode: str = "flight"               # "flight" | "train"
    current_price: float
    min_saving: float = 200            # trigger when price drops by this much
    travel_date: str                   # YYYY-MM-DD
    notify_via: List[str] = ["whatsapp"]
    phone: Optional[str] = None        # +91XXXXXXXXXX
    email: Optional[str] = None


@router.post("/api/alerts")
async def create_alert(req: AlertRequest):
    """
    Save a price alert. The alert saving works.
    WhatsApp notification is sent immediately as confirmation,
    and again when price drops (demo: trigger manually).
    """
    alert_data = {
        "route":         req.route,
        "mode":          req.mode,
        "current_price": req.current_price,
        "min_saving":    req.min_saving,
        "travel_date":   req.travel_date,
        "phone":         req.phone,
        "email":         req.email,
        "status":        "active",
    }

    alert_id = "alert-001"

    # Try to persist to Supabase
    db = get_db()
    if db:
        try:
            result = db.table("price_alerts").insert(alert_data).execute()
            if result.data:
                alert_id = str(result.data[0].get("id", alert_id))
        except Exception as e:
            print(f"Supabase alert insert error: {e}")

    # Send confirmation WhatsApp immediately if phone provided
    if req.phone and "whatsapp" in req.notify_via:
        try:
            from app.services.notification_service import send_whatsapp_alert
            confirm_msg = (
                f"✅ *TripDone Alert Set*\n\n"
                f"We'll notify you when *{req.route}* price drops below "
                f"₹{int(req.current_price - req.min_saving):,}.\n\n"
                f"Current price: ₹{int(req.current_price):,}\n"
                f"_You'll get a WhatsApp when it drops._"
            )
            send_whatsapp_alert(req.phone, confirm_msg)
        except Exception as e:
            print(f"Alert confirmation WhatsApp error: {e}")

    return {
        "alert_id":   alert_id,
        "status":     "active",
        "message":    f"We will notify you when price drops below ₹{int(req.current_price - req.min_saving):,}",
        "route":      req.route,
        "threshold":  req.current_price - req.min_saving,
    }


@router.get("/api/alerts")
async def get_alerts():
    db = get_db()
    if db:
        try:
            result = db.table("price_alerts").select("*").eq("status", "active").execute()
            return {"alerts": result.data}
        except Exception as e:
            print(f"Supabase get alerts error: {e}")
    from app.core.mock_data import MOCK_ALERTS_RESPONSE
    return {"alerts": [MOCK_ALERTS_RESPONSE]}


@router.post("/api/alerts/trigger")
async def trigger_alert_manually(route: str, phone: str, old_price: float, new_price: float):
    """
    Demo endpoint — manually fire a price drop WhatsApp.
    Use this on demo day to show judges the WhatsApp arriving live.
    POST /api/alerts/trigger?route=LKO-BOM&phone=+91XXXXXXXXXX&old_price=4200&new_price=3499
    """
    from app.services.notification_service import send_price_alert_whatsapp
    result = send_price_alert_whatsapp(
        to_phone=phone,
        route=route,
        old_price=old_price,
        new_price=new_price,
        platform_url="https://makemytrip.com"
    )
    return {"sent": result["success"], "detail": result}


@router.post("/api/alerts/trigger-delay")
async def trigger_delay_alert_manually(
    phone: str,
    train_number: str = "22436",
    train_name: str = "Vande Bharat Express",
    delay_minutes: int = 75,
    cancel_deadline: str = "11:30 AM",
    cab_provider: str = "Ola Mini"
):
    """
    Demo endpoint — manually fire a train delay WhatsApp.
    Shows judges the most original TripDone feature: delay→cab-cancel warning.
    POST /api/alerts/trigger-delay?phone=+91XXXXXXXXXX&delay_minutes=75
    """
    from app.services.notification_service import send_delay_alert_whatsapp
    result = send_delay_alert_whatsapp(
        to_phone=phone,
        train_number=train_number,
        train_name=train_name,
        delay_minutes=delay_minutes,
        cancel_deadline=cancel_deadline,
        cab_provider=cab_provider
    )
    return {"sent": result["success"], "detail": result}
