import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib, os
from generate_data import generate_price_data

def train():
    df = generate_price_data()
    X = df[["days_to_departure","day_of_week","is_weekend","avg_7day"]]
    y = df["price"]
    X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2,random_state=42)
    sc = StandardScaler()
    Xt = sc.fit_transform(X_train)
    model = xgb.XGBRegressor(n_estimators=100,max_depth=4,learning_rate=0.1,random_state=42)
    model.fit(Xt, y_train)
    score = model.score(sc.transform(X_test), y_test)
    print(f"Model R² score: {score:.3f}")
    joblib.dump(model, "model.pkl")
    joblib.dump(sc, "scaler.pkl")
    print("Saved model.pkl and scaler.pkl")

if __name__ == "__main__":
    train()
