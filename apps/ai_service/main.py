from fastapi import FastAPI

app = FastAPI(title="SmartMart AI Service")


@app.get('/health')
def health():
    return {"ok": True, "service": "smartmart-ai"}


@app.get('/predict/stockout')
def predict_stockout(units_left: int, units_per_hour: float):
    if units_per_hour <= 0:
        return {"hours_to_stockout": None, "message": "Insufficient velocity"}
    return {"hours_to_stockout": round(units_left / units_per_hour, 2)}
