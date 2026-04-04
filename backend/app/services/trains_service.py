import requests
import os
from app.ml.confidence_score import get_confidence

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "81099fd627mshb70533906a1e1b8p1596dcjsnf1c278d59590")

async def get_trains(from_city: str, to_city: str, date: str):
    try:
        date_formatted = date.replace("-", "")
        r = requests.get(
            "https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations",
            params={"fromStationCode":from_city,"toStationCode":to_city,"dateOfJourney":date_formatted},
            headers={"x-rapidapi-key":RAPIDAPI_KEY,"x-rapidapi-host":"irctc1.p.rapidapi.com"},
            timeout=30
        )
        if r.status_code != 200:
            return get_mock_trains()
        data = r.json()
        if not data.get("status") or not data.get("data"):
            return get_mock_trains()

        trains = []
        for t in data["data"][:6]:
            number = t.get("train_number","")
            name = t.get("train_name","Unknown")
            conf = get_confidence(number, name)
            trains.append({
                "number": number,
                "name": name,
                "dep": t.get("from_std","00:00"),
                "arr": t.get("to_std","00:00"),
                "duration": t.get("duration","N/A"),
                "confidence_score": conf["confidence_score"],
                "confidence_label": conf["confidence_label"],
                "confidence_color": conf["confidence_color"],
                "on_time_note": conf["on_time_note"],
                "is_best": conf["confidence_score"] >= 85,
                "classes": [
                    {"class":"SL","price":350,"available":True},
                    {"class":"3A","price":900,"available":True},
                    {"class":"2A","price":1400,"available":True},
                    {"class":"1A","price":2400,"available":True},
                ]
            })

        trains.sort(key=lambda x: x["confidence_score"], reverse=True)
        print(f"Trains: {len(trains)} fetched with real confidence scores")
        return trains

    except Exception as e:
        print(f"Trains API error: {e}")
        return get_mock_trains()


def get_mock_trains():
    from app.ml.confidence_score import get_confidence
    trains = [
        {"number":"22436","name":"Vande Bharat Express","dep":"06:00","arr":"09:50","duration":"3h 50m"},
        {"number":"12533","name":"Pushpak Express","dep":"08:15","arr":"13:35","duration":"5h 20m"},
        {"number":"12229","name":"LJN Rajdhani","dep":"20:00","arr":"22:30+1","duration":"26h 30m"},
    ]
    result = []
    for t in trains:
        conf = get_confidence(t["number"], t["name"])
        result.append({**t, **conf, "is_best": conf["confidence_score"] >= 85,
            "classes":[{"class":"SL","price":350,"available":True},{"class":"3A","price":900,"available":True}]})
    return result
