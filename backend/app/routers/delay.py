from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv('.env')

router = APIRouter()

class DelayAlertRequest(BaseModel):
    train_number: str
    train_name: str
    delay_minutes: int
    cab_provider: str
    cab_pickup_time: str
    cancel_deadline: str
    phone: str

@router.post("/api/delay-alert")
async def send_delay_alert(req: DelayAlertRequest):
    try:
        from twilio.rest import Client
        client = Client(os.getenv('TWILIO_SID'), os.getenv('TWILIO_TOKEN'))
        msg = client.messages.create(
            body=f"TripDone Delay Alert: Your {req.train_name} is running {req.delay_minutes} min late. Cancel your {req.cab_provider} cab FREE before {req.cancel_deadline}.",
            from_='whatsapp:+14155238886',
            to=f'whatsapp:{req.phone}'
        )
        return {"status":"sent","sid":msg.sid}
    except Exception as e:
        return {"status":"error","message":str(e)}

@router.get("/api/train-status/{train_number}")
async def train_status(train_number: str):
    import random
    delay = random.choice([0,0,0,15,30,90])
    return {
        "train_number": train_number,
        "delay_minutes": delay,
        "status": "on_time" if delay < 15 else "delayed",
        "message": f"Running {'on time' if delay < 15 else str(delay)+' minutes late'}"
    }
