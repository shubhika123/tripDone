import asyncio
import json
from app.services.serpapi_service import get_real_flights

async def test_mapping():
    print("Testing 'Mumbai' -> 'BOM' mapping...")
    res = await get_real_flights("Mumbai", "Delhi", "2026-11-01")
    print(f"Results found: {len(res)}")
    if res:
        print("First flight sample:")
        print(json.dumps(res[0], indent=2))
    
    print("\nTesting 'LKO' -> 'LKO' mapping (direct IATA)...")
    res2 = await get_real_flights("LKO", "BOM", "2026-11-01")
    print(f"Results found: {len(res2)}")
    if res2:
        print("First flight sample:")
        print(json.dumps(res2[0], indent=2))

if __name__ == "__main__":
    import sys
    import os
    # Add project root to path
    sys.path.append(os.getcwd())
    asyncio.run(test_mapping())
