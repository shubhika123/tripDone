from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import asyncio
from app.services.trains_service import get_trains
from app.services.taxi_service   import calculate_taxi
from app.core.mock_data           import MOCK_SEARCH_RESPONSE

router = APIRouter()


class SearchRequest(BaseModel):
    from_city: str
    to_city:   str
    date:      str
    modes:     List[str] = ["flight", "train", "cab", "bus"]
    adults:    int = 1


@router.post("/api/search")
async def search(req: SearchRequest):
    """
    Main search endpoint.
    - Trains:  real IRCTC data via RapidAPI (falls back to mock on error)
    - Flights: mock data (5 hardcoded flights — real API needs Amadeus business approval)
    - Taxi:    calculated via distance × rate formula (no public Ola/Uber API exists)
    - Buses:   mock data
    - Routes:  mock route combinations (dynamic graph search is roadmap)

    All three data sources run in parallel via asyncio.gather for ~2s total response.
    """
    from_c = req.from_city.upper().strip()
    to_c   = req.to_city.upper().strip()

    # Run trains fetch and taxi calc in parallel
    trains, taxis = await asyncio.gather(
        get_trains(from_c, to_c, req.date),
        asyncio.to_thread(calculate_taxi, from_c, to_c),
    )

    return {
        "routes":  MOCK_SEARCH_RESPONSE["routes"],
        "flights": MOCK_SEARCH_RESPONSE["flights"],
        "trains":  trains,
        "taxi":    taxis,
        "buses":   MOCK_SEARCH_RESPONSE["buses"],
        "meta": {
            "source":    "live_trains_calculated_taxi_mock_flights",
            "from_city": req.from_city,
            "to_city":   req.to_city,
            "date":      req.date,
        }
    }
