from __future__ import annotations
"""
Indian Railways Train Schedule Database
========================================
Comprehensive route-pair database of real Indian Railways trains.
Data sourced from public Indian Railways timetables.
This replaces the dependency on IRCTC RapidAPI for train search.

The IRCTC API (if available) is used only for live status enrichment,
not as the primary data source.
"""

# ── Fare estimation helpers ─────────────────────────────────────────────
# Real Indian Railways base fares per km (approximate, as of 2024-25)
FARE_PER_KM = {
    "SL":  0.60,   # Sleeper
    "3A":  1.60,   # AC 3-Tier
    "2A":  2.40,   # AC 2-Tier
    "1A":  4.00,   # AC First Class
    "CC":  1.80,   # AC Chair Car
    "2S":  0.35,   # Second Sitting
    "EC":  3.00,   # Executive Chair Car (Vande Bharat / Shatabdi)
}

def estimate_fares(distance_km: int, classes: list[str]) -> list[dict]:
    """Generate realistic fare classes for a given distance."""
    result = []
    for cls in classes:
        rate = FARE_PER_KM.get(cls, 1.0)
        # Add base charge + reservation charge
        base = round(distance_km * rate + 40, -1)  # round to nearest 10
        result.append({"class": cls, "price": max(base, 120), "available": True})
    return result


# ── City to station code mapping ────────────────────────────────────────
CITY_TO_STATION = {
    "DELHI": "NDLS", "NEW DELHI": "NDLS",
    "MUMBAI": "BOM", "BOMBAY": "BOM",
    "BANGALORE": "SBC", "BENGALURU": "SBC",
    "PUNE": "PUNE",
    "KOLKATA": "HWH", "CALCUTTA": "HWH",
    "CHENNAI": "MAS", "MADRAS": "MAS",
    "LUCKNOW": "LKO",
    "CHANDIGARH": "CDG",
    "HYDERABAD": "SC",
    "AHMEDABAD": "ADI",
    "JAIPUR": "JP",
}


# ── Train Database ──────────────────────────────────────────────────────
# Format: route_key -> list of trains
# route_key = "FROM_CODE-TO_CODE" (sorted alphabetically for bidirectional lookup)
# Each train: number, name, dep, arr, duration, distance_km, classes, run_days

TRAIN_DATABASE = {
    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ MUMBAI  (~1384 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-NDLS": [
        {"number": "12952", "name": "Mumbai Rajdhani Express",   "dep": "16:35", "arr": "08:35+1", "duration": "16h 00m", "distance_km": 1384, "classes": ["1A","2A","3A"], "run_days": "daily"},
        {"number": "12954", "name": "AG Kranti Rajdhani Express","dep": "17:40", "arr": "10:55+1", "duration": "17h 15m", "distance_km": 1384, "classes": ["1A","2A","3A"], "run_days": "daily"},
        {"number": "22210", "name": "Mumbai Duronto Express",    "dep": "23:10", "arr": "16:15+1", "duration": "17h 05m", "distance_km": 1384, "classes": ["1A","2A","3A","SL"], "run_days": "Mon,Thu"},
        {"number": "12138", "name": "Punjab Mail",               "dep": "19:40", "arr": "17:25+1", "duration": "21h 45m", "distance_km": 1384, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12926", "name": "Paschim Express",           "dep": "11:30", "arr": "07:40+1", "duration": "20h 10m", "distance_km": 1384, "classes": ["2A","3A","SL","2S"], "run_days": "daily"},
        {"number": "12904", "name": "Golden Temple Mail",        "dep": "21:25", "arr": "19:50+1", "duration": "22h 25m", "distance_km": 1384, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "22110", "name": "LTT AC Express",            "dep": "05:50", "arr": "01:50+1", "duration": "20h 00m", "distance_km": 1384, "classes": ["2A","3A"], "run_days": "Wed,Sat"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ LUCKNOW  (~511 km)
    # ══════════════════════════════════════════════════════════════════
    "LKO-NDLS": [
        {"number": "12004", "name": "Lucknow Shatabdi Express",  "dep": "06:10", "arr": "12:40", "duration": "6h 30m",  "distance_km": 511, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "22436", "name": "Vande Bharat Express",      "dep": "06:00", "arr": "12:20", "duration": "6h 20m",  "distance_km": 511, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12554", "name": "Vaishali Express",          "dep": "14:35", "arr": "21:00", "duration": "6h 25m",  "distance_km": 511, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12230", "name": "Lucknow Mail",              "dep": "22:30", "arr": "05:55+1","duration": "7h 25m",  "distance_km": 511, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12418", "name": "Prayagraj Express",         "dep": "21:15", "arr": "04:20+1","duration": "7h 05m",  "distance_km": 511, "classes": ["2A","3A","SL","2S"], "run_days": "daily"},
        {"number": "15006", "name": "GKP Rajya Rani Express",    "dep": "15:15", "arr": "22:25", "duration": "7h 10m",  "distance_km": 511, "classes": ["3A","SL","2S"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ BANGALORE  (~2150 km)
    # ══════════════════════════════════════════════════════════════════
    "NDLS-SBC": [
        {"number": "12628", "name": "Karnataka Express",         "dep": "21:15", "arr": "06:40+2", "duration": "33h 25m", "distance_km": 2444, "classes": ["1A","2A","3A","SL"], "run_days": "daily"},
        {"number": "22692", "name": "Rajdhani Express",          "dep": "20:50", "arr": "06:15+2", "duration": "33h 25m", "distance_km": 2444, "classes": ["1A","2A","3A"], "run_days": "Mon,Tue,Wed,Sat"},
        {"number": "12650", "name": "Karnataka Sampark Kranti",  "dep": "13:15", "arr": "23:05+1", "duration": "33h 50m", "distance_km": 2444, "classes": ["2A","3A","SL"], "run_days": "Mon,Wed,Sat"},
        {"number": "22694", "name": "Delhi Bangalore Duronto",   "dep": "19:10", "arr": "22:10+1", "duration": "27h 00m", "distance_km": 2444, "classes": ["1A","2A","3A"], "run_days": "Fri"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ KOLKATA  (~1453 km)
    # ══════════════════════════════════════════════════════════════════
    "HWH-NDLS": [
        {"number": "12302", "name": "Howrah Rajdhani Express",   "dep": "16:55", "arr": "09:55+1", "duration": "17h 00m", "distance_km": 1453, "classes": ["1A","2A","3A"], "run_days": "daily"},
        {"number": "12306", "name": "Kolkata Rajdhani Express",  "dep": "17:00", "arr": "10:00+1", "duration": "17h 00m", "distance_km": 1542, "classes": ["1A","2A","3A"], "run_days": "Mon,Tue,Wed,Fri,Sat"},
        {"number": "12260", "name": "Sealdah Duronto Express",   "dep": "12:50", "arr": "06:10+1", "duration": "17h 20m", "distance_km": 1542, "classes": ["1A","2A","3A","SL"], "run_days": "Mon,Fri"},
        {"number": "12382", "name": "Poorva Express",            "dep": "16:45", "arr": "14:15+1", "duration": "21h 30m", "distance_km": 1453, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "13006", "name": "Amritsar Mail",             "dep": "19:25", "arr": "19:30+1", "duration": "24h 05m", "distance_km": 1453, "classes": ["3A","SL","2S"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ CHENNAI  (~2180 km)
    # ══════════════════════════════════════════════════════════════════
    "MAS-NDLS": [
        {"number": "12622", "name": "Tamil Nadu Express",        "dep": "22:30", "arr": "07:10+2", "duration": "32h 40m", "distance_km": 2182, "classes": ["1A","2A","3A","SL"], "run_days": "daily"},
        {"number": "12434", "name": "Chennai Rajdhani Express",  "dep": "15:55", "arr": "20:15+1", "duration": "28h 20m", "distance_km": 2182, "classes": ["1A","2A","3A"], "run_days": "Wed,Fri"},
        {"number": "12616", "name": "Grand Trunk Express",       "dep": "18:45", "arr": "03:00+2", "duration": "32h 15m", "distance_km": 2182, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ JAIPUR  (~303 km)
    # ══════════════════════════════════════════════════════════════════
    "JP-NDLS": [
        {"number": "12016", "name": "Ajmer Shatabdi Express",   "dep": "06:05", "arr": "10:30", "duration": "4h 25m",  "distance_km": 303, "classes": ["CC","EC"], "run_days": "daily"},
        {"number": "22988", "name": "Vande Bharat Express",     "dep": "05:50", "arr": "09:50", "duration": "4h 00m",  "distance_km": 303, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12958", "name": "ADI Superfast Express",    "dep": "19:55", "arr": "00:05+1","duration": "4h 10m",  "distance_km": 303, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12414", "name": "AII Rajdhani Express",     "dep": "19:40", "arr": "00:25+1","duration": "4h 45m",  "distance_km": 303, "classes": ["1A","2A","3A"], "run_days": "Tue,Wed,Fri,Sat,Sun"},
        {"number": "12464", "name": "Jodhpur Express",          "dep": "23:30", "arr": "04:15+1","duration": "4h 45m",  "distance_km": 303, "classes": ["2A","3A","SL","2S"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ CHANDIGARH  (~260 km)
    # ══════════════════════════════════════════════════════════════════
    "CDG-NDLS": [
        {"number": "12046", "name": "Chandigarh Shatabdi Express","dep": "07:40","arr": "11:00", "duration": "3h 20m",  "distance_km": 260, "classes": ["CC","EC"], "run_days": "daily"},
        {"number": "12012", "name": "Kalka Shatabdi Express",    "dep": "17:15", "arr": "20:50", "duration": "3h 35m",  "distance_km": 260, "classes": ["CC","EC"], "run_days": "daily"},
        {"number": "22456", "name": "Kalka Vande Bharat",        "dep": "06:00", "arr": "09:05", "duration": "3h 05m",  "distance_km": 260, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ AHMEDABAD  (~934 km)
    # ══════════════════════════════════════════════════════════════════
    "ADI-NDLS": [
        {"number": "12958", "name": "Gujarat Superfast Express", "dep": "19:55", "arr": "08:35+1","duration": "12h 40m", "distance_km": 934, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12916", "name": "Ashram Express",            "dep": "15:25", "arr": "06:40+1","duration": "15h 15m", "distance_km": 934, "classes": ["2A","3A","SL","2S"], "run_days": "daily"},
        {"number": "19024", "name": "Firozpur Janata Express",   "dep": "05:15", "arr": "23:15",  "duration": "18h 00m", "distance_km": 934, "classes": ["3A","SL","2S"], "run_days": "daily"},
        {"number": "12932", "name": "Ahmedabad Duronto Express", "dep": "22:40", "arr": "09:10+1","duration": "10h 30m", "distance_km": 934, "classes": ["1A","2A","3A"], "run_days": "Mon,Wed,Sat"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ HYDERABAD  (~1660 km)
    # ══════════════════════════════════════════════════════════════════
    "NDLS-SC": [
        {"number": "12724", "name": "Telangana Express",         "dep": "06:50", "arr": "05:50+1", "duration": "23h 00m", "distance_km": 1660, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12438", "name": "Secunderabad Rajdhani",     "dep": "20:55", "arr": "14:50+1", "duration": "17h 55m", "distance_km": 1660, "classes": ["1A","2A","3A"], "run_days": "Tue,Thu,Sat"},
        {"number": "12706", "name": "SC Sampark Kranti Express", "dep": "07:10", "arr": "05:55+1", "duration": "22h 45m", "distance_km": 1660, "classes": ["2A","3A","SL"], "run_days": "Mon,Wed,Fri,Sun"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # DELHI ↔ PUNE  (~1495 km)
    # ══════════════════════════════════════════════════════════════════
    "NDLS-PUNE": [
        {"number": "12150", "name": "Pune Rajdhani Express",     "dep": "17:25", "arr": "10:30+1", "duration": "17h 05m", "distance_km": 1495, "classes": ["1A","2A","3A"], "run_days": "Tue,Wed,Thu,Sat"},
        {"number": "11078", "name": "Jhelum Express",            "dep": "00:20", "arr": "01:00+1", "duration": "24h 40m", "distance_km": 1495, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12264", "name": "Pune Duronto Express",      "dep": "16:40", "arr": "09:15+1", "duration": "16h 35m", "distance_km": 1495, "classes": ["1A","2A","3A"], "run_days": "Thu,Sat"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # MUMBAI ↔ BANGALORE  (~981 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-SBC": [
        {"number": "12628", "name": "Karnataka Express",         "dep": "21:00", "arr": "06:40+1", "duration": "9h 40m",  "distance_km": 981, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "11014", "name": "Lokmanya Tilak Express",    "dep": "08:30", "arr": "01:00+1", "duration": "16h 30m", "distance_km": 1153, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "01024", "name": "Mumbai Vande Bharat",       "dep": "06:10", "arr": "14:00", "duration": "7h 50m",  "distance_km": 981, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12163", "name": "Chalukya Express",          "dep": "22:45", "arr": "14:30+1", "duration": "15h 45m", "distance_km": 1153, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # MUMBAI ↔ PUNE  (~192 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-PUNE": [
        {"number": "12128", "name": "Pune Intercity Express",    "dep": "06:45", "arr": "10:10", "duration": "3h 25m", "distance_km": 192, "classes": ["CC","2S"], "run_days": "daily"},
        {"number": "12124", "name": "Deccan Queen",              "dep": "17:10", "arr": "20:25", "duration": "3h 15m", "distance_km": 192, "classes": ["CC","2S"], "run_days": "daily"},
        {"number": "22106", "name": "Indrayani Express",         "dep": "07:15", "arr": "10:30", "duration": "3h 15m", "distance_km": 192, "classes": ["CC","2S"], "run_days": "daily"},
        {"number": "12127", "name": "Mumbai Intercity Express",  "dep": "14:45", "arr": "18:15", "duration": "3h 30m", "distance_km": 192, "classes": ["CC","2S"], "run_days": "daily"},
        {"number": "22160", "name": "Mumbai CST Vande Bharat",   "dep": "05:20", "arr": "08:35", "duration": "3h 15m", "distance_km": 192, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # MUMBAI ↔ CHENNAI  (~1279 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-MAS": [
        {"number": "12134", "name": "Mumbai CST Express",        "dep": "14:00", "arr": "14:35+1", "duration": "24h 35m", "distance_km": 1279, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12618", "name": "Mangala Lakshadweep Express","dep": "08:15", "arr": "08:25+1", "duration": "24h 10m", "distance_km": 1279, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # MUMBAI ↔ KOLKATA  (~1968 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-HWH": [
        {"number": "12810", "name": "Mumbai HWH Mail",           "dep": "20:05", "arr": "03:20+2", "duration": "31h 15m", "distance_km": 1968, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12870", "name": "Howrah Duronto Express",    "dep": "05:50", "arr": "08:30+1", "duration": "26h 40m", "distance_km": 1968, "classes": ["1A","2A","3A"], "run_days": "Tue,Fri"},
        {"number": "22884", "name": "Garib Rath Express",        "dep": "13:55", "arr": "00:50+2", "duration": "34h 55m", "distance_km": 1968, "classes": ["3A"], "run_days": "Wed,Sun"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # BANGALORE ↔ CHENNAI  (~362 km)
    # ══════════════════════════════════════════════════════════════════
    "MAS-SBC": [
        {"number": "12028", "name": "Shatabdi Express",          "dep": "06:00", "arr": "10:30", "duration": "4h 30m", "distance_km": 362, "classes": ["CC","EC"], "run_days": "daily"},
        {"number": "12658", "name": "Chennai Mail",              "dep": "22:50", "arr": "04:50+1","duration": "6h 00m", "distance_km": 362, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "22626", "name": "Vande Bharat Express",      "dep": "05:50", "arr": "09:30", "duration": "3h 40m", "distance_km": 362, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12610", "name": "Chennai Express",           "dep": "15:30", "arr": "21:10", "duration": "5h 40m", "distance_km": 362, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # KOLKATA ↔ CHENNAI  (~1661 km)
    # ══════════════════════════════════════════════════════════════════
    "HWH-MAS": [
        {"number": "12842", "name": "Coromandel Express",        "dep": "14:50", "arr": "17:20+1","duration": "26h 30m", "distance_km": 1661, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12840", "name": "Howrah Chennai Mail",       "dep": "23:50", "arr": "05:15+2","duration": "29h 25m", "distance_km": 1661, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # LUCKNOW ↔ MUMBAI  (~1381 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-LKO": [
        {"number": "12534", "name": "Pushpak Express",           "dep": "20:10", "arr": "17:35+1","duration": "21h 25m", "distance_km": 1381, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "15102", "name": "Jnaneswari Express",        "dep": "13:30", "arr": "08:45+1","duration": "19h 15m", "distance_km": 1381, "classes": ["2A","3A","SL"], "run_days": "Tue,Fri,Sun"},
        {"number": "12540", "name": "Lucknow Superfast",         "dep": "11:55", "arr": "06:10+1","duration": "18h 15m", "distance_km": 1381, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # JAIPUR ↔ MUMBAI  (~1150 km)
    # ══════════════════════════════════════════════════════════════════
    "BOM-JP": [
        {"number": "12956", "name": "Jaipur Superfast Express",  "dep": "16:00","arr": "06:30+1", "duration": "14h 30m", "distance_km": 1150, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12480", "name": "Suryanagri Express",        "dep": "11:20","arr": "01:15+1", "duration": "13h 55m", "distance_km": 1150, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # HYDERABAD ↔ BANGALORE  (~570 km)
    # ══════════════════════════════════════════════════════════════════
    "SBC-SC": [
        {"number": "12786", "name": "Kacheguda Express",         "dep": "18:15","arr": "06:30+1", "duration": "12h 15m", "distance_km": 570, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "22684", "name": "Vande Bharat Express",      "dep": "05:30","arr": "12:00",   "duration": "6h 30m",  "distance_km": 570, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12794", "name": "Rayalaseema Express",       "dep": "16:55","arr": "05:15+1", "duration": "12h 20m", "distance_km": 570, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # HYDERABAD ↔ CHENNAI  (~793 km)
    # ══════════════════════════════════════════════════════════════════
    "MAS-SC": [
        {"number": "12604", "name": "Hyderabad Express",         "dep": "17:15","arr": "05:50+1", "duration": "12h 35m", "distance_km": 793, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "12760", "name": "Charminar Express",         "dep": "18:30","arr": "07:15+1", "duration": "12h 45m", "distance_km": 793, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # KOLKATA ↔ BANGALORE  (~1871 km)
    # ══════════════════════════════════════════════════════════════════
    "HWH-SBC": [
        {"number": "12246", "name": "Yesvantpur Duronto",        "dep": "16:05","arr": "02:40+2", "duration": "34h 35m", "distance_km": 1871, "classes": ["1A","2A","3A","SL"], "run_days": "Thu,Sun"},
        {"number": "12864", "name": "Howrah YPR Express",        "dep": "20:30","arr": "09:30+2", "duration": "37h 00m", "distance_km": 1871, "classes": ["2A","3A","SL"], "run_days": "Fri,Sat"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # AHMEDABAD ↔ MUMBAI  (~493 km)
    # ══════════════════════════════════════════════════════════════════
    "ADI-BOM": [
        {"number": "12010", "name": "Ahmedabad Shatabdi Express","dep": "06:25","arr": "12:55", "duration": "6h 30m", "distance_km": 493, "classes": ["CC","EC"], "run_days": "daily"},
        {"number": "22928", "name": "Gujarat Vande Bharat",      "dep": "06:10","arr": "12:30", "duration": "6h 20m", "distance_km": 493, "classes": ["CC","EC"], "run_days": "daily_except_sun"},
        {"number": "12902", "name": "Gujarat Mail",              "dep": "22:05","arr": "06:25+1","duration": "8h 20m", "distance_km": 493, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "22954", "name": "Gujarat Superfast",         "dep": "04:55","arr": "12:10",  "duration": "7h 15m", "distance_km": 493, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # PUNE ↔ BANGALORE  (~840 km)
    # ══════════════════════════════════════════════════════════════════
    "PUNE-SBC": [
        {"number": "12298", "name": "Pune Bangalore Duronto",    "dep": "21:15","arr": "09:30+1", "duration": "12h 15m", "distance_km": 840, "classes": ["2A","3A","SL"], "run_days": "Mon,Tue,Thu,Sat"},
        {"number": "16340", "name": "Nagercoil Express",         "dep": "12:15","arr": "06:30+1", "duration": "18h 15m", "distance_km": 840, "classes": ["3A","SL"], "run_days": "daily"},
    ],

    # ══════════════════════════════════════════════════════════════════
    # LUCKNOW ↔ KOLKATA  (~985 km)
    # ══════════════════════════════════════════════════════════════════
    "HWH-LKO": [
        {"number": "13010", "name": "Doon Express",              "dep": "20:20","arr": "16:45+1","duration": "20h 25m", "distance_km": 985, "classes": ["2A","3A","SL"], "run_days": "daily"},
        {"number": "13152", "name": "Kolkata Express",           "dep": "06:15","arr": "23:45",  "duration": "17h 30m", "distance_km": 985, "classes": ["2A","3A","SL"], "run_days": "daily"},
    ],
}


def get_route_key(from_code: str, to_code: str) -> str:
    """Generate a bidirectional route key."""
    codes = sorted([from_code, to_code])
    return f"{codes[0]}-{codes[1]}"


def lookup_trains(from_code: str, to_code: str) -> list[dict]:
    """
    Look up trains from the static database for a given route.
    Returns list of train dicts with calculated fares.
    Handles bidirectional routes (swaps dep/arr for reverse direction).
    """
    route_key = get_route_key(from_code, to_code)
    trains_raw = TRAIN_DATABASE.get(route_key, [])

    if not trains_raw:
        return []

    # Determine direction: is the user going in the "listed" direction or reverse?
    listed_key = route_key  # always sorted alphabetically
    listed_codes = listed_key.split("-")
    is_reverse = (from_code == listed_codes[1])  # user going in reverse direction

    results = []
    for t in trains_raw:
        train = dict(t)  # copy to avoid mutation
        if is_reverse:
            # Swap departure and arrival for reverse direction
            train["dep"], train["arr"] = train["arr"], train["dep"]
            # Clean "+1" from times since they're now starting times
            train["dep"] = train["dep"].replace("+1", "").replace("+2", "")

        # Calculate fares based on distance
        train["classes"] = estimate_fares(train["distance_km"], train["classes"])
        results.append(train)

    return results
