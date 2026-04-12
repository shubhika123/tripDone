import asyncio
import os
from app.services.trains_service import get_trains, get_station_code

async def test_mapping():
    print("Testing station mapping...")
    print(f"Delhi -> {get_station_code('Delhi')}")
    print(f"Mumbai -> {get_station_code('Mumbai')}")
    print(f"New Delhi -> {get_station_code('New Delhi')}")
    print(f"Bangalore -> {get_station_code('Bangalore')}")
    print(f"Unknown -> {get_station_code('LKO')}")

async def test_fetch():
    print("\nTesting real-time fetch (might hit quota limit)...")
    trains = await get_trains("Delhi", "Mumbai", "2026-04-15")
    print(f"Fetched {len(trains)} trains.")
    for t in trains[:2]:
        print(f"Train: {t['name']} ({t['number']})")
        print(f"Classes: {t['classes']}")
        if t.get('is_offline'):
            print("Status: OFFLINE (Mock/Fallback)")
        else:
            print("Status: LIVE")

if __name__ == "__main__":
    os.environ["RAPIDAPI_KEY"] = "81099fd627mshb70533906a1e1b8p1596dcjsnf1c278d59590"
    asyncio.run(test_mapping())
    asyncio.run(test_fetch())
