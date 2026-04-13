"""
Train service: uses local schedule database as primary source,
with optional IRCTC RapidAPI enrichment for live status/delay data.
No API dependency for basic train search.
"""
from __future__ import annotations
import requests
import os
from app.ml.confidence_score import get_confidence
from app.data.train_database import lookup_trains, estimate_fares, CITY_TO_STATION as DB_CITY_TO_STATION

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")

CITY_TO_STATION = {
    **DB_CITY_TO_STATION,
    # Extend with any additional mappings
    "GOA": "MAO",
    "MADURAI": "MDU",
    "VARANASI": "BSB",
    "AGRA": "AGC",
    "PATNA": "PNBE",
    "BHOPAL": "BPL",
    "INDORE": "INDB",
    "COIMBATORE": "CBE",
    "KOCHI": "ERS",
    "THIRUVANANTHAPURAM": "TVC",
    "SURAT": "ST",
    "NAGPUR": "NGP",
    "KANPUR": "CNB",
}

def get_station_code(city: str) -> str:
    city_upper = city.upper().split(",")[0].strip()
    return CITY_TO_STATION.get(city_upper, city_upper)


async def try_irctc_live_status(train_no: str) -> dict | None:
    """Attempt to fetch live delay from IRCTC API. Returns None if unavailable."""
    if not RAPIDAPI_KEY:
        return None
    try:
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus",
            params={"trainNo": train_no, "startDay": "1"},
            headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "irctc1.p.rapidapi.com"},
            timeout=8
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("status") and data.get("data"):
                return data["data"]
    except Exception as e:
        print(f"Live Status API (optional enrichment) error for {train_no}: {e}")
    return None


async def try_irctc_train_search(from_code: str, to_code: str, date: str) -> list | None:
    """Attempt IRCTC trainBetweenStations API. Returns None if unavailable/quota exceeded."""
    if not RAPIDAPI_KEY:
        return None
    try:
        date_formatted = date.replace("-", "")
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations",
            params={"fromStationCode": from_code, "toStationCode": to_code, "dateOfJourney": date_formatted},
            headers={"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "irctc1.p.rapidapi.com"},
            timeout=15
        )
        if r.status_code == 429 or "quota" in r.text.lower():
            print("IRCTC API quota exceeded — using local database.")
            return None
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get("status") and data.get("data"):
            return data["data"]
    except Exception as e:
        print(f"IRCTC API error: {e}")
    return None


def _format_train(t: dict, conf: dict, delay: int | None = None, source: str = "database") -> dict:
    """Format a train dict for the frontend with all expected fields."""
    classes = t.get("classes", [
        {"class": "SL", "price": 420, "available": True},
        {"class": "3A", "price": 1150, "available": True}
    ])
    top_price = min((c["price"] for c in classes if "price" in c), default=500)

    dep = t.get("dep", "00:00")
    arr = t.get("arr", "00:00")
    number = t.get("number", "")

    return {
        # Route engine fields
        "number": number,
        "dep": dep,
        "arr": arr,
        # Frontend fields
        "trainNumber": number,
        "name": t.get("name", "Express"),
        "departureTime": dep,
        "arrivalTime": arr,
        "duration": t.get("duration", "N/A"),
        "price": top_price,
        "confidence_score": conf["confidence_score"],
        "confidence_label": conf["confidence_label"],
        "confidence_color": conf["confidence_color"],
        "on_time_note": conf["on_time_note"],
        "is_best": conf["confidence_score"] >= 85,
        "is_real_time": delay is not None,
        "source": source,
        "classes": classes,
        "run_days": t.get("run_days", "daily"),
    }


async def get_trains(from_city: str, to_city: str, date: str):
    from_code = get_station_code(from_city)
    to_code = get_station_code(to_city)

    # ── 1. Try IRCTC API first (if key available) ────────────────────
    api_trains = await try_irctc_train_search(from_code, to_code, date)

    if api_trains:
        print(f"✓ Using IRCTC live data for {from_code}→{to_code}")
        trains = []
        for t in api_trains[:8]:
            number = t.get("train_number", "")
            name = t.get("train_name", "Unknown")

            # Try live delay enrichment (only for first 3 to save quota)
            delay = None
            if len(trains) < 3:
                live = await try_irctc_live_status(number)
                delay = live.get("delay_minutes", 0) if live else None

            conf = get_confidence(number, name, delay=delay)

            trains.append(_format_train({
                "number": number,
                "name": name,
                "dep": t.get("from_std", "00:00"),
                "arr": t.get("to_std", "00:00"),
                "duration": t.get("duration", "N/A"),
                "classes": [
                    {"class": "SL", "price": 350, "available": True},
                    {"class": "3A", "price": 900, "available": True}
                ],
            }, conf, delay, source="irctc_api"))

        trains.sort(key=lambda x: x["confidence_score"], reverse=True)
        return trains

    # ── 2. Use local database (primary free source) ──────────────────
    db_trains = lookup_trains(from_code, to_code)

    if db_trains:
        print(f"✓ Using local train database for {from_code}→{to_code} ({len(db_trains)} trains)")
        trains = []
        for t in db_trains:
            conf = get_confidence(t["number"], t["name"])
            trains.append(_format_train(t, conf, source="schedule_database"))

        trains.sort(key=lambda x: x["confidence_score"], reverse=True)
        return trains

    # ── 3. Generic fallback for uncovered routes ─────────────────────
    print(f"⚠ No data for {from_code}→{to_code}, using generic fallback")
    return _generate_generic_trains(from_city, to_city, from_code, to_code)


def _generate_generic_trains(from_city: str, to_city: str, from_code: str, to_code: str) -> list:
    """
    Generate plausible train options for routes not in the database.
    Uses distance estimation to create realistic timings and fares.
    """
    # Rough city coordinates for distance estimation
    CITY_COORDS = {
        "NDLS": (28.64, 77.22), "BOM": (19.08, 72.88), "SBC": (12.98, 77.57),
        "MAS": (13.08, 80.27), "HWH": (22.58, 88.34), "LKO": (26.85, 80.95),
        "JP": (26.92, 75.78), "CDG": (30.73, 76.78), "SC": (17.38, 78.49),
        "ADI": (23.02, 72.57), "PUNE": (18.53, 73.88), "MAO": (15.40, 73.88),
        "BSB": (25.32, 83.01), "AGC": (27.18, 78.02), "PNBE": (25.60, 85.10),
        "BPL": (23.27, 77.41), "INDB": (22.72, 75.86), "CBE": (11.00, 76.96),
        "ERS": (10.07, 76.28), "TVC": (8.49, 76.95), "ST": (21.21, 72.83),
        "NGP": (21.15, 79.09), "CNB": (26.45, 80.35),
    }
    import math

    coord_from = CITY_COORDS.get(from_code, (22.0, 78.0))
    coord_to = CITY_COORDS.get(to_code, (22.0, 78.0))

    # Haversine-ish rough distance
    dlat = abs(coord_from[0] - coord_to[0])
    dlon = abs(coord_from[1] - coord_to[1])
    distance_km = int(math.sqrt(dlat**2 + dlon**2) * 111)  # 1 degree ≈ 111 km
    distance_km = max(distance_km, 200)  # minimum 200km

    # Estimate travel time: ~55 km/h average for Indian trains
    hours = distance_km / 55
    dur_h = int(hours)
    dur_m = int((hours - dur_h) * 60)

    from_name = from_city.title()
    to_name = to_city.title()

    generic_trains = [
        {
            "number": f"{12000 + (hash(from_code + to_code) % 999):05d}",
            "name": f"{to_name} Superfast Express",
            "dep": "06:15", "arr": _add_hours("06:15", dur_h, dur_m),
            "duration": f"{dur_h}h {dur_m:02d}m",
            "classes": ["2A", "3A", "SL"],
            "distance_km": distance_km,
            "run_days": "daily"
        },
        {
            "number": f"{22000 + (hash(to_code + from_code) % 999):05d}",
            "name": f"{from_name} {to_name} Express",
            "dep": "16:30", "arr": _add_hours("16:30", dur_h + 2, dur_m),
            "duration": f"{dur_h + 2}h {dur_m:02d}m",
            "classes": ["2A", "3A", "SL"],
            "distance_km": distance_km,
            "run_days": "daily"
        },
        {
            "number": f"{15000 + (hash(from_code) % 999):05d}",
            "name": f"{to_name} Mail",
            "dep": "22:00", "arr": _add_hours("22:00", dur_h + 4, dur_m),
            "duration": f"{dur_h + 4}h {dur_m:02d}m",
            "classes": ["3A", "SL", "2S"],
            "distance_km": distance_km,
            "run_days": "daily"
        },
    ]

    result = []
    for t in generic_trains:
        t["classes"] = estimate_fares(t["distance_km"], t["classes"])
        conf = get_confidence(t["number"], t["name"])
        result.append(_format_train(t, conf, source="estimated"))

    result.sort(key=lambda x: x["confidence_score"], reverse=True)
    return result


def _add_hours(base_time: str, add_h: int, add_m: int) -> str:
    """Add hours and minutes to a HH:MM time string."""
    parts = base_time.split(":")
    h = int(parts[0]) + add_h
    m = int(parts[1]) + add_m
    if m >= 60:
        h += 1
        m -= 60
    day_marker = ""
    if h >= 48:
        day_marker = "+2"
        h -= 48
    elif h >= 24:
        day_marker = "+1"
        h -= 24
    return f"{h:02d}:{m:02d}{day_marker}"
