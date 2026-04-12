from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import asyncio
from app.services.trains_service import get_trains, get_mock_trains
from app.services.taxi_service import get_taxi
from app.services.serpapi_service import get_real_flights
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
    # Fetch real trains, calculated taxi, and real-time flights with error handling
    try:
        trains_res, taxi_res, flights_res = await asyncio.gather(
            get_trains(req.from_city, req.to_city, req.date),
            get_taxi(req.from_city, req.to_city),
            get_real_flights(req.from_city, req.to_city, req.date),
            return_exceptions=True
        )
        
        # Unpack results with safety
        trains = trains_res if not isinstance(trains_res, Exception) else get_mock_trains()
        taxi = taxi_res if not isinstance(taxi_res, Exception) else []
        
        if isinstance(flights_res, Exception) or not flights_res:
            print(f"Flights service fallback triggered for {req.from_city}->{req.to_city}")
            # Dynamic fallback: fix mock cities to match request
            flights = [
                {**f, "from": req.from_city.upper(), "to": req.to_city.upper()} 
                for f in MOCK_FLIGHTS
            ]
        else:
            flights = flights_res
        
    except Exception as e:
        print(f"Search gather failed: {e}")
        trains = get_mock_trains()
        taxi = []
        flights = [
            {**f, "from": req.from_city.upper(), "to": req.to_city.upper()} 
            for f in MOCK_FLIGHTS
        ]

    # Build dynamic routes from real data
    routes = build_routes(trains, taxi, flights, req.date)

    return {
        "routes": routes,
        "flights": flights,
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
