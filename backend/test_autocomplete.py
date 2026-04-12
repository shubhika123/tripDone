import httpx
import asyncio
import os

async def test_autocomplete():
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_flights_autocomplete",
        "q": "Lucknow",
        "api_key": "8a6f9c99ba71d50016922f214f3546f32e60e366bc2a4434c81b99a7c1ecce06"
    }
    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params)
        print(res.json())

if __name__ == "__main__":
    asyncio.run(test_autocomplete())
