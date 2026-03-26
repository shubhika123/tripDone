from fastapi import APIRouter
from app.ml.predict import predict_price

router = APIRouter()

@router.get("/api/predict")
async def predict(route: str = "LKO-BOM", mode: str = "flight", date: str = "2026-03-30", current_price: float = 4200):
    return predict_price(route, date, current_price)
