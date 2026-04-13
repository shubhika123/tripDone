from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.mock_data import (
    MOCK_NOTIFICATIONS
)
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from app.routers.trips import router as trips_router
from app.routers.best_time import router as best_time_router
from app.routers.delay import router as delay_router
from app.routers.alerts import router as alerts_router
from app.routers.predict import router as predict_router
from app.routers.gallery import router as gallery_router

app = FastAPI(title="TripDone API", version="1.0.0")

# In production, specify your Vercel domains for better security
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://tripdone.vercel.app",
    "https://tripdone-live.vercel.app",
    "https://tripdone-xi.vercel.app",
    "https://tripdone-five.vercel.app",
    "https://tripdone-git-main-shubhika-jains-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Also allow any vercel.app preview/branch deploy
    allow_origin_regex=r"https://tripdone.*\.vercel\.app",
)

# Include all routers
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(trips_router)
app.include_router(delay_router)
app.include_router(alerts_router)
app.include_router(best_time_router)
app.include_router(predict_router)
app.include_router(gallery_router)

@app.api_route("/", methods=["GET", "HEAD", "POST"])
def root():
    return {"status": "TripDone API running", "version": "1.0.0"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok", "service": "TripDone API"}

@app.get("/api/notifications")
async def get_notifications():
    return {"notifications": MOCK_NOTIFICATIONS}

