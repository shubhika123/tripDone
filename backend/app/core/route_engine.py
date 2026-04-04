"""
Route engine: takes real trains + mock flights + calculated taxi
and dynamically computes cheapest, fastest, and other combinations.
"""

MOCK_FLIGHTS = [
    {"mode":"flight","name":"Air India AI631","from":"LKO","to":"BOM","dep":"08:45","arr":"11:10","price":3499,"duration_min":145},
    {"mode":"flight","name":"IndiGo 6E441","from":"LKO","to":"BOM","dep":"06:30","arr":"08:40","price":4200,"duration_min":130},
    {"mode":"flight","name":"SpiceJet SG116","from":"LKO","to":"BOM","dep":"11:10","arr":"13:25","price":3899,"duration_min":135},
]

MOCK_BUSES = [
    {"mode":"bus","name":"RedBus AC Sleeper","from":"LKO","to":"BOM","dep":"22:00","arr":"06:00+1","price":950,"duration_min":480},
    {"mode":"bus","name":"VRL Travels","from":"LKO","to":"BOM","dep":"20:30","arr":"05:30+1","price":650,"duration_min":540},
]

def parse_duration(duration_str: str) -> int:
    """Convert '3h 50m' to minutes"""
    try:
        parts = duration_str.replace('h','').replace('m','').split()
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return int(parts[0]) * 60
    except:
        return 300

def build_routes(trains: list, taxi: list, date: str) -> list:
    """
    Dynamically builds route combinations and labels cheapest/fastest.
    Each route = one or more legs (train + cab, flight + cab, etc.)
    """
    combinations = []

    # Combination 1: Direct flights
    for f in MOCK_FLIGHTS:
        cab = taxi[0] if taxi else {"provider":"Ola Mini","price_min":280}
        total_cost = f["price"] + cab["price_min"]
        total_min = f["duration_min"] + 45  # 45 min for cab to airport
        combinations.append({
            "legs": [f, {"mode":"cab","name":cab["provider"],"price":cab["price_min"]}],
            "total_cost": total_cost,
            "duration_min": total_min,
            "duration": f"{total_min//60}h {total_min%60}m",
            "transfers": 1,
            "modes": ["flight","cab"]
        })

    # Combination 2: Train only / train + cab
    for t in trains[:4]:
        dur_min = parse_duration(t.get("duration","5h 0m"))
        cheapest_class = min(t.get("classes",[{"price":500}]), key=lambda x: x["price"])
        train_price = cheapest_class.get("price", 500)
        cab = taxi[0] if taxi else {"provider":"Ola Mini","price_min":280}
        total_cost = train_price + cab["price_min"]
        total_min = dur_min + 30
        combinations.append({
            "legs": [
                {"mode":"train","name":t["name"],"number":t["number"],
                 "dep":t.get("dep","06:00"),"arr":t.get("arr","12:00"),
                 "price":train_price,"class":cheapest_class.get("class","SL")},
                {"mode":"cab","name":cab["provider"],"price":cab["price_min"]}
            ],
            "total_cost": total_cost,
            "duration_min": total_min,
            "duration": f"{total_min//60}h {total_min%60}m",
            "transfers": 1,
            "modes": ["train","cab"]
        })

    # Combination 3: Bus options
    for b in MOCK_BUSES:
        combinations.append({
            "legs": [b],
            "total_cost": b["price"],
            "duration_min": b["duration_min"],
            "duration": f"{b['duration_min']//60}h {b['duration_min']%60}m",
            "transfers": 0,
            "modes": ["bus"]
        })

    # Sort by cost to find cheapest, by time to find fastest
    sorted_by_cost = sorted(combinations, key=lambda x: x["total_cost"])
    sorted_by_time = sorted(combinations, key=lambda x: x["duration_min"])

    cheapest = sorted_by_cost[0]
    fastest = sorted_by_time[0]

    # Build final routes list with labels
    routes = []
    seen = set()

    def add_route(combo, label, idx):
        key = combo["total_cost"]
        if key in seen:
            return
        seen.add(key)
        leg_descriptions = []
        for leg in combo["legs"]:
            leg_descriptions.append({
                "mode": leg["mode"],
                "name": leg.get("name",""),
                "from": leg.get("from",""),
                "to": leg.get("to",""),
                "dep": leg.get("dep",""),
                "arr": leg.get("arr",""),
                "price": leg.get("price", leg.get("price_min",0)),
                "class": leg.get("class","")
            })
        routes.append({
            "id": idx,
            "label": label,
            "name": " + ".join(m.title() for m in combo["modes"]),
            "total_cost": combo["total_cost"],
            "duration": combo["duration"],
            "transfers": combo["transfers"],
            "saving_vs_direct": 0,
            "legs": leg_descriptions
        })

    add_route(cheapest, "cheapest", 0)
    add_route(fastest, "fastest", 1)

    # Add remaining as "other"
    for i, combo in enumerate(sorted_by_cost[1:5]):
        add_route(combo, "other", i+2)

    # Calculate savings vs most expensive
    if routes:
        max_cost = max(r["total_cost"] for r in routes)
        for r in routes:
            r["saving_vs_direct"] = max(0, max_cost - r["total_cost"])

    return routes
