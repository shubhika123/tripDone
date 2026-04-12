import httpx
import asyncio
import os

async def test_flights_raw():
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_flights",
        "departure_id": "DEL",
        "arrival_id": "BOM",
        "outbound_date": "2026-04-20",
        "currency": "INR",
        "gl": "in",
        "api_key": "8a6f9c99ba71d50016922f214f3546f32e60e366bc2a4434c81b99a7c1ecce06"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(url, params=params)
        print(f"Status: {res.status_code}")
        print(res.json())

if __name__ == "__main__":
    asyncio.run(test_flights_raw())
