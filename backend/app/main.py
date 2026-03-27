from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from app.core.mock_data import (
    MOCK_SEARCH_RESPONSE, MOCK_ALERTS_RESPONSE,
    MOCK_TRIPS_RESPONSE, MOCK_GALLERY_UPLOAD_URL,
    MOCK_CHAT_RESPONSE, MOCK_NOTIFICATIONS, MOCK_SAVED_TRIPS
)
from app.ml.predict import predict_price

app = FastAPI(title="TripDone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://tripdone.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    from_city: str
    to_city: str
    date: str
    modes: List[str] = ["flight","train","cab","bus"]
    adults: int = 1

class AlertRequest(BaseModel):
    route: str
    mode: str
    current_price: float
    min_saving: float = 200
    travel_date: str
    notify_via: List[str] = ["email"]
    phone: Optional[str] = None
    email: Optional[str] = None

class TripRequest(BaseModel):
    route_id: int
    selected_legs: list
    total_cost: float
    delay_alert_enabled: bool = False
    travel_date: str

class ChatRequest(BaseModel):
    message: str
    context: dict = {}
    history: list = []

class GalleryUploadRequest(BaseModel):
    trip_id: str
    filename: str
    location: str = ""

@app.get("/")
def root():
    return {"status": "TripDone API running"}

@app.post("/api/search")
async def search(req: SearchRequest):
    return MOCK_SEARCH_RESPONSE

@app.get("/api/predict")
async def predict(route: str = "LKO-BOM", mode: str = "flight", date: str = "2026-03-30", current_price: float = 4200):
    return predict_price(route, date, current_price)

@app.post("/api/alerts")
async def create_alert(req: AlertRequest):
    return MOCK_ALERTS_RESPONSE

@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": [MOCK_ALERTS_RESPONSE]}

@app.post("/api/trips")
async def save_trip(req: TripRequest):
    return MOCK_TRIPS_RESPONSE

@app.get("/api/trips")
async def get_trips():
    return {"trips": MOCK_SAVED_TRIPS}

@app.post("/api/gallery/upload-url")
async def get_upload_url(req: GalleryUploadRequest):
    return MOCK_GALLERY_UPLOAD_URL

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return MOCK_CHAT_RESPONSE

@app.get("/api/notifications")
async def get_notifications():
    return {"notifications": MOCK_NOTIFICATIONS}

# Best time to travel endpoint
from app.routers.best_time import router as best_time_router
app.include_router(best_time_router)



from app.routers.best_time import router as best_time_router

app.include_router(best_time_router)

