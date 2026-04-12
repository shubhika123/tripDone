import httpx
import os
import asyncio
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY", "8a6f9c99ba71d50016922f214f3546f32e60e366bc2a4434c81b99a7c1ecce06")

CITY_IATA_MAP = {
    # India - Major Airports
    "DELHI": "DEL",
    "NEW DELHI": "DEL",
    "MUMBAI": "BOM",
    "BOMBAY": "BOM",
    "BANGALORE": "BLR",
    "BENGALURU": "BLR",
    "HYDERABAD": "HYD",
    "CHENNAI": "MAA",
    "MADRAS": "MAA",
    "KOLKATA": "CCU",
    "CALCUTTA": "CCU",
    "AHMEDABAD": "AMD",
    "PUNE": "PNQ",
    "LUCKNOW": "LKO",
    "GOA": "GOI",
    "JAIPUR": "JAI",
    "KOCHI": "COK",
    "COCHIN": "COK",
    "GUWAHATI": "GAU",
    "CHANDIGARH": "IXC",
    "BHUBANESWAR": "BBI",
    "PATNA": "PAT",
    "INDORE": "IDR",
    "VARANASI": "VNS",
    "AMRITSAR": "ATQ",
    "SRINAGAR": "SXR",
    "VISHAKHAPATNAM": "VTZ",
    "RANCHI": "IXR",
    "THIRUVANANTHAPURAM": "TRV",
    "TRIVANDRUM": "TRV",
    "COIMBATORE": "CJB",

    # International - Major Hubs
    "LONDON": "LHR",
    "NEW YORK": "JFK",
    "NYC": "JFK",
    "DUBAI": "DXB",
    "SINGAPORE": "SIN",
    "BANGKOK": "BKK",
    "PARIS": "CDG",
    "FRANKFURT": "FRA",
    "TOKYO": "NRT",
    "SYDNEY": "SYD",
    "SAN FRANCISCO": "SFO",
    "SFO": "SFO",
    "LOS ANGELES": "LAX",
    "LAX": "LAX",
    "TORONTO": "YYZ"
}

def resolve_iata(city: str) -> str:
    """Helper to convert common city names to IATA codes."""
    city_upper = city.strip().upper()
    # If already a 3-letter code, assume it's IATA
    if len(city_upper) == 3 and city_upper.isalpha():
        return city_upper
    return CITY_IATA_MAP.get(city_upper, city_upper)

async def get_real_flights(from_city: str, to_city: str, date: str) -> List[Dict]:
    """
    Fetch real-time flight data from SerpApi Google Flights.
    Maps results to the app's internal format with robust city-to-IATA mapping.
    """
    if not SERPAPI_KEY:
        print("SERPAPI_KEY not found. Falling back to mock data.")
        return []

    dept_iata = resolve_iata(from_city)
    arr_iata = resolve_iata(to_city)
    
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_flights",
        "departure_id": dept_iata,
        "arrival_id": arr_iata,
        "outbound_date": date,
        "type": 2,  # 2 for One-way
        "currency": "INR",
        "gl": "in",
        "hl": "en",
        "api_key": SERPAPI_KEY
    }
    print(f"SerpApi Search: {from_city}({dept_iata}) -> {to_city}({arr_iata}) on {date}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        flights = data.get("best_flights", [])
        if not flights:
            flights = data.get("other_flights", [])

        real_flights = []
        for f in flights[:8]:  # Increased to 8 flights
            first_leg = f.get("flights", [{}])[0]
            airline = first_leg.get("airline", "Unknown Airline")
            flight_num = first_leg.get("flight_number", "")
            
            # Extract duration in formatted string "Xh Ym" and in minutes
            duration_min = f.get("total_duration", 0)
            duration_str = f"{duration_min // 60}h {duration_min % 60}m" if duration_min else "TBD"

            # Parse stops
            stops_count = len(f.get("flights", [])) - 1

            real_flights.append({
                "mode": "flight",
                "name": f"{airline} {flight_num}".strip(),
                "airline": airline,
                "flight_number": flight_num,
                "from": from_city.upper(),
                "to": to_city.upper(),
                "dep": dept_iata,
                "arr": arr_iata,
                "departureTime": first_leg.get("departure_airport", {}).get("time", "08:00")[-5:],
                "arrivalTime": first_leg.get("arrival_airport", {}).get("time", "11:00")[-5:],
                "price": f.get("price", 5000),
                "duration_min": duration_min,
                "duration": duration_str,
                "stops": stops_count,
                "airline_logo": first_leg.get("airline_logo")
            })
        
        return real_flights

    except Exception as e:
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"SerpApi Error Response: {response.text}")
        print(f"SerpApi Flight Search failed: {e}")
        return []

# For testing independently
if __name__ == "__main__":
    import json
    async def test():
        res = await get_real_flights("LKO", "BOM", "2026-04-15")
        print(json.dumps(res, indent=2))
    asyncio.run(test())
