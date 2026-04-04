from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import asyncio
from app.services.trains_service import get_trains
from app.services.taxi_service import get_taxi
from app.core.route_engine import build_routes, MOCK_FLIGHTS, MOCK_BUSES
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
    # Fetch real trains and calculated taxi simultaneously
    trains, taxi = await asyncio.gather(
        get_trains(req.from_city, req.to_city, req.date),
        get_taxi(req.from_city, req.to_city)
    )

    # Build dynamic routes from real data
    routes = build_routes(trains, taxi, req.date)

    return {
        "routes": routes,
        "flights": MOCK_FLIGHTS,
        "trains": trains,
        "taxi": taxi,
        "buses": MOCK_BUSES,
        "meta": {
            "source": "dynamic_routes_real_trains",
            "from_city": req.from_city,
            "to_city": req.to_city,
            "date": req.date
        }
    }
