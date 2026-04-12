import requests
import os
from app.ml.confidence_score import get_confidence

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "81099fd627mshb70533906a1e1b8p1596dcjsnf1c278d59590")

CITY_TO_STATION = {
    "DELHI": "NDLS",
    "NEW DELHI": "NDLS",
    "MUMBAI": "BOM",
    "BOMBAY": "BOM",
    "BANGALORE": "SBC",
    "BENGALURU": "SBC",
    "PUNE": "PUNE",
    "KOLKATA": "HWH",
    "CALCUTTA": "HWH",
    "CHENNAI": "MAS",
    "MADRAS": "MAS",
    "LUCKNOW": "LKO",
    "CHANDIGARH": "CDG",
    "HYDERABAD": "SC",
    "AHMEDABAD": "ADI",
    "JAIPUR": "JP"
}

def get_station_code(city: str) -> str:
    city_upper = city.upper().split(",")[0].strip()
    return CITY_TO_STATION.get(city_upper, city_upper)

async def get_train_fare(train_no: str, from_code: str, to_code: str, date: str):
    """Fetches real-time fare for a specific train."""
    try:
        date_formatted = date.replace("-", "")
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v2/getFare",
            params={
                "trainNo": train_no,
                "fromStationCode": from_code,
                "toStationCode": to_code,
                "dateOfJourney": date_formatted
            },
            headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "irctc1.p.rapidapi.com"},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("status") and data.get("data"):
                fares = data["data"]
                # Return mapped classes with real prices
                classes = []
                for cls, price in fares.items():
                    if isinstance(price, (int, float)):
                        classes.append({"class": cls, "price": float(price), "available": True})
                return classes
    except Exception as e:
        print(f"Fare API error for {train_no}: {e}")
    return None

async def get_real_time_status(train_no: str, date: str):
    """Fetches real-time status/delay for a specific train."""
    try:
        # Note: startDay '1' means today, '2' yesterday, etc.
        # This is a simplification; a real implementation would check the date difference.
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus",
            params={"trainNo": train_no, "startDay": "1"},
            headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "irctc1.p.rapidapi.com"},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("status") and data.get("data"):
                return data["data"]
    except Exception as e:
        print(f"Live Status API error for {train_no}: {e}")
    return None

async def get_trains(from_city: str, to_city: str, date: str):
    from_code = get_station_code(from_city)
    to_code = get_station_code(to_city)
    
    try:
        date_formatted = date.replace("-", "")
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations",
            params={"fromStationCode": from_code, "toStationCode": to_code, "dateOfJourney": date_formatted},
            headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "irctc1.p.rapidapi.com"},
            timeout=20
        )
        
        if r.status_code == 429 or "quota" in r.text.lower():
            print("IRCTC API Quota exceeded. Using smart fallback.")
            return get_mock_trains()
            
        if r.status_code != 200:
            return get_mock_trains()
            
        data = r.json()
        if not data.get("status") or not data.get("data"):
            return get_mock_trains()

        trains = []
        # Process top 3 trains to fetch real-time delays without hitting quota too fast
        for t in data["data"][:5]:
            number = t.get("train_number", "")
            name = t.get("train_name", "Unknown")
            
            # Fetch real-time delay data
            live_data = await get_real_time_status(number, date)
            delay = live_data.get("delay_minutes", 0) if live_data else None
            
            # Generate confidence score using real delay data if available
            conf = get_confidence(number, name, delay=delay)
            
            # Fetch real fares
            real_classes = await get_train_fare(number, from_code, to_code, date)
            
            trains.append({
                "number": number,
                "name": name,
                "dep": t.get("from_std", "00:00"),
                "arr": t.get("to_std", "00:00"),
                "duration": t.get("duration", "N/A"),
                "confidence_score": conf["confidence_score"],
                "confidence_label": conf["confidence_label"],
                "confidence_color": conf["confidence_color"],
                "on_time_note": conf["on_time_note"],
                "is_best": conf["confidence_score"] >= 85,
                "is_real_time": delay is not None,
                "classes": real_classes if real_classes else [
                    {"class": "SL", "price": 350, "available": True},
                    {"class": "3A", "price": 900, "available": True}
                ]
            })

        trains.sort(key=lambda x: x["confidence_score"], reverse=True)
        return trains

    except Exception as e:
        print(f"Trains API error: {e}")
        return get_mock_trains()

def get_mock_trains():
    from app.ml.confidence_score import get_confidence
    trains = [
        {"number": "22436", "name": "Vande Bharat Express", "dep": "06:00", "arr": "21:50", "duration": "15h 50m"},
        {"number": "12431", "name": "Rajdhani Express", "dep": "11:55", "arr": "06:10+1", "duration": "18h 15m"},
        {"number": "12533", "name": "Pushpak Express", "dep": "20:10", "arr": "17:35+1", "duration": "21h 25m"},
    ]
    result = []
    for t in trains:
        conf = get_confidence(t["number"], t["name"])
        result.append({
            **t, **conf, "is_best": conf["confidence_score"] >= 85,
            "classes": [
                {"class": "SL", "price": 420, "available": True},
                {"class": "3A", "price": 1150, "available": True}
            ],
            "is_offline": True,
            "is_real_time": False
        })
    return result
