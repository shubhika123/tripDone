MOCK_SEARCH_RESPONSE = {
    "routes": [
        {
            "id": 0,
            "label": "cheapest",
            "name": "Budget Express",
            "total_cost": 2840,
            "duration": "9h 15m",
            "transfers": 1,
            "saving_vs_direct": 1360,
            "legs": [
                {"mode": "train", "name": "Vande Bharat 22436", "from": "LKO", "to": "NDLS", "dep": "06:00", "arr": "09:50", "price": 1200, "class": "CC"},
                {"mode": "flight", "name": "IndiGo 6E201", "from": "DEL", "to": "BOM", "dep": "11:30", "arr": "13:45", "price": 1640, "class": "Economy"}
            ]
        },
        {
            "id": 1,
            "label": "fastest",
            "name": "Non-stop Jet",
            "total_cost": 4200,
            "duration": "2h 10m",
            "transfers": 0,
            "saving_vs_direct": 0,
            "legs": [
                {"mode": "flight", "name": "IndiGo 6E441", "from": "LKO", "to": "BOM", "dep": "06:30", "arr": "08:40", "price": 4200, "class": "Economy"}
            ]
        },
        {
            "id": 2,
            "label": "comfortable",
            "name": "Overnight Rajdhani",
            "total_cost": 1950,
            "duration": "26h 30m",
            "transfers": 0,
            "saving_vs_direct": 2250,
            "legs": [
                {"mode": "train", "name": "Rajdhani Express 12533", "from": "LKO", "to": "CSTM", "dep": "20:00", "arr": "22:30+1", "price": 1950, "class": "2A"}
            ]
        },
        {
            "id": 3,
            "label": "other",
            "name": "Train + Bus Combo",
            "total_cost": 1100,
            "duration": "14h 00m",
            "transfers": 1,
            "saving_vs_direct": 3100,
            "legs": [
                {"mode": "train", "name": "Pushpak Express", "from": "LKO", "to": "NDLS", "dep": "08:15", "arr": "13:35", "price": 420, "class": "SL"},
                {"mode": "bus", "name": "RedBus Sleeper", "from": "NDLS", "to": "BOM", "dep": "18:00", "arr": "06:00+1", "price": 680, "class": "Sleeper"}
            ]
        }
    ],
    "flights": [
        {"airline": "Air India", "flight": "AI631", "dep": "08:45", "arr": "11:10", "duration": "2h 25m", "class": "Economy", "seats_left": 4, "price": 3499, "is_best": True, "platforms": [{"name": "MakeMyTrip", "price": 3499, "url": "https://makemytrip.com"}, {"name": "Air India Site", "price": 3520, "url": "https://airindia.com"}, {"name": "Goibibo", "price": 3550, "url": "https://goibibo.com"}]},
        {"airline": "IndiGo", "flight": "6E441", "dep": "06:30", "arr": "08:40", "duration": "2h 10m", "class": "Economy", "seats_left": 12, "price": 4200, "is_best": False, "platforms": [{"name": "IndiGo Site", "price": 4200, "url": "https://goindigo.in"}, {"name": "MakeMyTrip", "price": 4250, "url": "https://makemytrip.com"}]},
        {"airline": "SpiceJet", "flight": "SG116", "dep": "11:10", "arr": "13:25", "duration": "2h 15m", "class": "Economy", "seats_left": 6, "price": 3899, "is_best": False, "platforms": [{"name": "SpiceJet Site", "price": 3899, "url": "https://spicejet.com"}]},
        {"airline": "IndiGo", "flight": "6E203", "dep": "14:55", "arr": "17:05", "duration": "2h 10m", "class": "Economy", "seats_left": 22, "price": 3750, "is_best": False, "platforms": [{"name": "IndiGo Site", "price": 3750, "url": "https://goindigo.in"}]},
        {"airline": "Vistara", "flight": "UK871", "dep": "14:30", "arr": "17:00", "duration": "2h 30m", "class": "Business", "seats_left": 2, "price": 8200, "is_best": False, "platforms": [{"name": "Vistara Site", "price": 8200, "url": "https://airvistara.com"}]}
    ],
    "trains": [
        {"number": "22436", "name": "Vande Bharat Express", "dep": "06:00", "arr": "09:50", "duration": "3h 50m", "confidence_score": 91.4, "confidence_label": "High", "on_time_note": "91% on time (last 30 days)", "is_best": True, "classes": [{"class": "CC", "price": 1200, "available": True}, {"class": "EC", "price": 2400, "available": False}]},
        {"number": "12533", "name": "Pushpak Express", "dep": "08:15", "arr": "13:35", "duration": "5h 20m", "confidence_score": 74.2, "confidence_label": "Medium", "on_time_note": "74% on time (last 30 days)", "is_best": False, "classes": [{"class": "3A", "price": 980, "available": True}, {"class": "SL", "price": 420, "available": True}, {"class": "2A", "price": 1450, "available": True}]},
        {"number": "12229", "name": "LJN Rajdhani Express", "dep": "20:00", "arr": "22:30+1", "duration": "26h 30m", "confidence_score": 83.7, "confidence_label": "High", "on_time_note": "84% on time (last 30 days)", "is_best": False, "classes": [{"class": "2A", "price": 1950, "available": True}, {"class": "1A", "price": 3200, "available": True}]},
        {"number": "14235", "name": "Begampura Express", "dep": "11:40", "arr": "20:15", "duration": "8h 35m", "confidence_score": 52.1, "confidence_label": "Low", "on_time_note": "52% on time (last 30 days)", "is_best": False, "classes": [{"class": "SL", "price": 340, "available": True}, {"class": "3A", "price": 890, "available": True}]}
    ],
    "taxi": [
        {"provider": "Ola Mini", "price_min": 280, "price_max": 340, "type": "now", "eta_min": 3, "note": ""},
        {"provider": "Ola Prime", "price_min": 380, "price_max": 450, "type": "now", "eta_min": 5, "note": ""},
        {"provider": "Uber Go", "price_min": 310, "price_max": 370, "type": "now", "eta_min": 4, "note": ""},
        {"provider": "Uber Premier", "price_min": 480, "price_max": 560, "type": "now", "eta_min": 7, "note": ""},
        {"provider": "Rapido Bike", "price_min": 90, "price_max": 120, "type": "now", "eta_min": 2, "note": "estimated"},
        {"provider": "Rapido Auto", "price_min": 160, "price_max": 200, "type": "now", "eta_min": 4, "note": "estimated"}
    ],
    "buses": [
        {"operator": "RedBus Sleeper", "dep": "22:00", "arr": "06:00+1", "duration": "8h 00m", "class": "AC Sleeper", "price": 950, "seats_left": 8, "cancel_free_hours_before": 6, "is_best": True},
        {"operator": "VRL Travels", "dep": "20:30", "arr": "05:30+1", "duration": "9h 00m", "class": "Semi-Sleeper", "price": 650, "seats_left": 14, "cancel_free_hours_before": 12, "is_best": False},
        {"operator": "SRS Travels", "dep": "21:00", "arr": "07:00+1", "duration": "10h 00m", "class": "AC Seater", "price": 480, "seats_left": 3, "cancel_free_hours_before": 6, "is_best": False}
    ],
    "meta": {"source": "mock", "fetched_at": "2026-03-19T10:00:00Z", "search_id": "mock-001", "from_city": "LKO", "to_city": "BOM", "date": "2026-03-19"}
}

MOCK_PREDICT_RESPONSE = {
    "verdict": "buy",
    "confidence": 0.87,
    "reason": "Price is 12% below 14-day average. Model predicts spike before long weekend.",
    "current_price": 3499,
    "avg_14day": 3980,
    "predicted_peak": 4800,
    "predicted_low": 3200,
    "best_buy_date": "2026-03-19",
    "price_history": [
        {"date": "2026-03-05", "price": 5100, "predicted": False},
        {"date": "2026-03-06", "price": 4900, "predicted": False},
        {"date": "2026-03-07", "price": 4700, "predicted": False},
        {"date": "2026-03-08", "price": 4900, "predicted": False},
        {"date": "2026-03-09", "price": 5200, "predicted": False},
        {"date": "2026-03-10", "price": 4800, "predicted": False},
        {"date": "2026-03-11", "price": 4600, "predicted": False},
        {"date": "2026-03-12", "price": 4400, "predicted": False},
        {"date": "2026-03-13", "price": 4300, "predicted": False},
        {"date": "2026-03-14", "price": 4100, "predicted": False},
        {"date": "2026-03-15", "price": 4000, "predicted": False},
        {"date": "2026-03-16", "price": 4200, "predicted": False},
        {"date": "2026-03-17", "price": 3800, "predicted": False},
        {"date": "2026-03-18", "price": 3600, "predicted": False},
        {"date": "2026-03-19", "price": 3499, "predicted": False},
        {"date": "2026-03-20", "price": 3600, "predicted": True},
        {"date": "2026-03-21", "price": 3900, "predicted": True},
        {"date": "2026-03-22", "price": 4300, "predicted": True},
        {"date": "2026-03-23", "price": 4700, "predicted": True},
        {"date": "2026-03-24", "price": 4800, "predicted": True},
        {"date": "2026-03-25", "price": 4600, "predicted": True}
    ]
}

MOCK_ALERTS_RESPONSE = {"alert_id": "mock-alert-001", "status": "active", "message": "We will notify you when price drops below 3300", "next_check": "2026-03-19T16:00:00Z"}
MOCK_TRIPS_RESPONSE = {"trip_id": "mock-trip-001", "status": "saved", "message": "Trip saved to your dashboard"}
MOCK_GALLERY_UPLOAD_URL = {"upload_url": "https://api.cloudinary.com/v1_1/demo/image/upload", "signature": "mock-sig-abc123", "timestamp": 1710835200, "public_id": "tripdone/trips/mock-trip-001/photo"}
MOCK_CHAT_RESPONSE = {"reply": "The cheapest route right now is Budget Express at 2840 rupees total. That is 1360 rupees cheaper than a direct flight!"}
MOCK_NOTIFICATIONS = [
    {"id": "n1", "type": "price_drop", "title": "Price Drop", "message": "Air India LKO to BOM dropped to 3499 rupees. Save 701 rupees.", "is_urgent": True, "created_at": "2026-03-19T09:30:00Z"},
    {"id": "n2", "type": "delay_alert", "title": "Train Delay Alert", "message": "Vande Bharat 22436 is running 65 min late. Cancel your Ola cab for free until 11:30am.", "is_urgent": True, "created_at": "2026-03-19T08:00:00Z"},
    {"id": "n3", "type": "info", "title": "Flash Deal", "message": "SpiceJet LKO to BOM at 3200 rupees. 19 percent below average. Ends midnight.", "is_urgent": False, "created_at": "2026-03-18T21:00:00Z"}
]
MOCK_SAVED_TRIPS = [
    {"trip_id": "trip-001", "from": "Lucknow", "to": "Mumbai", "date": "2026-03-19", "total_cost": 2840, "legs": [{"mode": "train", "name": "Vande Bharat", "price": 1200}, {"mode": "flight", "name": "IndiGo 6E201", "price": 1640}], "status": "upcoming", "delay_alert_enabled": True},
    {"trip_id": "trip-002", "from": "Mumbai", "to": "Goa", "date": "2026-01-14", "total_cost": 650, "legs": [{"mode": "bus", "name": "RedBus Sleeper", "price": 650}], "status": "completed", "delay_alert_enabled": False}
]
