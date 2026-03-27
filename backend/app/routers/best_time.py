from fastapi import APIRouter
import numpy as np

router = APIRouter()

@router.get("/api/best-time")
async def best_time(from_city: str = "LKO", to_city: str = "BOM", mode: str = "flight"):
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    base = 4200
    seasonal = [0.9, 0.85, 1.0, 1.1, 1.2, 1.15, 1.05, 1.0, 0.95, 1.1, 1.2, 1.3]
    data = []
    for i, m in enumerate(months):
        price = round(base * seasonal[i] + np.random.randint(-200,200))
        data.append({
            "month": m,
            "avg_price": price,
            "is_cheapest": i in [1, 2],
            "is_expensive": i in [10, 11],
            "label": "Best time" if i in [1,2] else ("Avoid" if i in [10,11] else "")
        })
    cheapest = min(data, key=lambda x: x["avg_price"])
    return {
        "route": f"{from_city}-{to_city}",
        "mode": mode,
        "monthly_prices": data,
        "best_month": cheapest["month"],
        "best_price": cheapest["avg_price"],
        "tip": f"Book in {cheapest['month']} to save up to 30% on this route"
    }
