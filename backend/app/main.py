from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from app.core.mock_data import (
    MOCK_ALERTS_RESPONSE, MOCK_TRIPS_RESPONSE,
    MOCK_GALLERY_UPLOAD_URL, MOCK_CHAT_RESPONSE,
    MOCK_NOTIFICATIONS, MOCK_SAVED_TRIPS
)
from app.ml.predict import predict_price

app = FastAPI(title="TripDone API", version="1.0.0")

# In production, specify your Vercel domains for better security
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://tripdone.vercel.app", # Replace with your actual domain
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from app.routers.trips import router as trips_router
from app.routers.best_time import best_time
from app.routers.delay import router as delay_router
from app.services.cloudinary_service import get_upload_url

app.include_router(search_router)
app.include_router(chat_router)
app.include_router(trips_router)
app.include_router(delay_router)

class AlertRequest(BaseModel):
    route: str
    mode: Optional[str] = "flight"
    current_price: float = 0.0
    min_saving: float = 200
    travel_date: Optional[str] = None
    date: Optional[str] = None  # alternate field name from frontend
    notify_via: List[str] = ["email"]
    phone: Optional[str] = None
    email: Optional[str] = None

class GalleryUploadRequest(BaseModel):
    trip_id: str
    filename: str
    location: str = ""

@app.api_route("/", methods=["GET", "HEAD", "POST"])
def root():
    return {"status": "TripDone API running", "version": "1.0.0"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok", "service": "TripDone API"}

@app.get("/api/predict")
async def predict(route: str = "LKO-BOM", mode: str = "flight",
                  date: str = "2026-03-30", current_price: float = 4200):
    return predict_price(route, date, current_price)

@app.post("/api/alerts")
async def create_alert(req: AlertRequest):
    return MOCK_ALERTS_RESPONSE

@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": [MOCK_ALERTS_RESPONSE]}

@app.post("/api/gallery/upload-url")
async def gallery_upload(req: GalleryUploadRequest):
    return get_upload_url(req.trip_id, req.filename, req.location)

@app.get("/api/notifications")
async def get_notifications():
    return {"notifications": MOCK_NOTIFICATIONS}

@app.get("/api/best-time")
async def best_time_route(from_city: str = "LKO", to_city: str = "BOM", mode: str = "flight"):
    return await best_time(from_city, to_city, mode)
