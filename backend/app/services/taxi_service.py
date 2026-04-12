"""
Taxi/Cab Price Calculator
Uses distance × rate formula (same approach used by MakeMyTrip, Yatra etc.)
All major travel aggregators use this because Ola/Uber/Rapido have no public APIs.
"""

# Approximate road distances in km between major city pairs
CITY_DISTANCES = {
    ("LKO", "BOM"): 1200,  ("BOM", "LKO"): 1200,
    ("LKO", "CSTM"): 1230, ("CSTM", "LKO"): 1230,
    ("DEL", "BOM"): 1400,  ("BOM", "DEL"): 1400,
    ("NDLS", "BOM"): 1400, ("BOM", "NDLS"): 1400,
    ("LKO", "NDLS"): 510,  ("NDLS", "LKO"): 510,
    ("LKO", "DEL"): 500,   ("DEL", "LKO"): 500,
    ("BOM", "GOA"): 590,   ("GOA", "BOM"): 590,
    ("DEL", "AGR"): 230,   ("AGR", "DEL"): 230,
    ("DEL", "JAI"): 280,   ("JAI", "DEL"): 280,
    ("CHN", "BLR"): 350,   ("BLR", "CHN"): 350,
    ("HYD", "BLR"): 570,   ("BLR", "HYD"): 570,
    ("MAA", "BLR"): 350,   ("BLR", "MAA"): 350,
}

# Provider config: name, base_fare, per_km_rate, surge_factor (for max), type
PROVIDERS = [
    {"provider": "Ola Mini",    "base": 49,  "rate": 8,  "surge": 1.22, "eta_min": 3, "note": ""},
    {"provider": "Ola Prime",   "base": 75,  "rate": 12, "surge": 1.18, "eta_min": 5, "note": ""},
    {"provider": "Uber Go",     "base": 49,  "rate": 10, "surge": 1.20, "eta_min": 4, "note": ""},
    {"provider": "Uber Premier","base": 99,  "rate": 15, "surge": 1.16, "eta_min": 7, "note": ""},
    {"provider": "Rapido Bike", "base": 20,  "rate": 4,  "surge": 1.15, "eta_min": 2, "note": "estimated"},
    {"provider": "Rapido Auto", "base": 30,  "rate": 6,  "surge": 1.18, "eta_min": 4, "note": "estimated"},
]

DEFAULT_DISTANCE_KM = 300  # fallback if city pair not in table


def get_distance(from_city: str, to_city: str) -> int:
    """Return approx road distance in km between two station/city codes."""
    key = (from_city.upper(), to_city.upper())
    return CITY_DISTANCES.get(key, DEFAULT_DISTANCE_KM)


def calculate_taxi(from_city: str, to_city: str) -> list:
    """
    Return list of cab providers with min/max price ranges.
    Min = base estimate, Max = base × surge_factor (accounts for peak hour surge).
    """
    distance = get_distance(from_city, to_city)
    results = []
    for p in PROVIDERS:
        base_price = p["base"] + (distance * p["rate"])
        price_min  = round(base_price)
        price_max  = round(base_price * p["surge"])
        results.append({
            "provider":  p["provider"],
            "price_min": price_min,
            "price_max": price_max,
            "type":      "now",
            "eta_min":   p["eta_min"],
            "note":      p["note"],
            "distance_km": distance,
        })
    return results

async def get_taxi(from_city: str, to_city: str) -> list:
    """Async-compatible wrapper that returns cab price estimates."""
    return calculate_taxi(from_city, to_city)

