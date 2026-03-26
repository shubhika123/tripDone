from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import asyncio
from app.services.trains_service import get_trains
from app.core.mock_data import MOCK_SEARCH_RESPONSE

router = APIRouter()

class SearchRequest(BaseModel):
    from_city: str
    to_city: str
    date: str
    modes: List[str] = ["flight","train","cab","bus"]
    adults: int = 1

@router.post("/api/search")
async def search(req: SearchRequest):
    real_trains = await get_trains(req.from_city, req.to_city, req.date)
    return {
        "routes": MOCK_SEARCH_RESPONSE["routes"],
        "flights": MOCK_SEARCH_RESPONSE["flights"],
        "trains": real_trains,
        "taxi": MOCK_SEARCH_RESPONSE["taxi"],
        "buses": MOCK_SEARCH_RESPONSE["buses"],
        "meta": {
            "source": "live_trains_mock_flights",
            "from_city": req.from_city,
            "to_city": req.to_city,
            "date": req.date
        }
    }
