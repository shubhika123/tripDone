import pandas as pd
import numpy as np
import os

def generate_price_data():
    np.random.seed(42)
    routes = [("LKO","BOM"),("DEL","BOM"),("LKO","DEL"),("BOM","BLR"),("DEL","BLR")]
    records = []
    for from_city, to_city in routes:
        base = np.random.randint(3000, 7000)
        for days in range(1, 91):
            dow = days % 7
            price = base + np.sin(days/30*np.pi)*500 + np.random.normal(0,200) + (1 if dow>=5 else 0)*400 + max(0,7-days)*100
            records.append({"route":f"{from_city}-{to_city}","days_to_departure":days,"day_of_week":dow,"is_weekend":1 if dow>=5 else 0,"price":max(1500,round(price)),"avg_7day":base})
    df = pd.DataFrame(records)
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/price_history.csv", index=False)
    print(f"Generated {len(df)} records")
    return df

if __name__ == "__main__":
    generate_price_data()
