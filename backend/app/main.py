from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv('.env')

from app.ml.predict import load_model, predict_price
load_model()

app = FastAPI(
    title="TripDone API",
    description="Multi-modal Indian travel planner — real IRCTC trains, XGBoost price ML, Groq AI chat",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # wide open for demo; tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "TripDone API running", "version": "1.0.0"}

# ── Include all routers ───────────────────────────────────────────────────────
from app.routers.search       import router as search_router
from app.routers.predict      import router as predict_router
from app.routers.alerts       import router as alerts_router
from app.routers.trips        import router as trips_router
from app.routers.chat         import router as chat_router
from app.routers.best_time    import router as best_time_router
from app.routers.gallery      import router as gallery_router

app.include_router(search_router)
app.include_router(predict_router)
app.include_router(alerts_router)
app.include_router(trips_router)
app.include_router(chat_router)
app.include_router(best_time_router)
app.include_router(gallery_router)

# ── Notifications (read-only, no router file needed) ──────────────────────────
from app.core.mock_data import MOCK_NOTIFICATIONS

@app.get("/api/notifications")
async def get_notifications():
    return {"notifications": MOCK_NOTIFICATIONS}
