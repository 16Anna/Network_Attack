from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib


app = FastAPI(
    title="Network Attack ML API",
    description="AI-based network attack prediction API",
    version="1.0"
)


# Load trained model
model = joblib.load("network_attack_model.pkl")
label_encoder = joblib.load("label_encoder.pkl")


# Input format
class TrafficData(BaseModel):
    sourcePort: int
    destinationPort: int
    packetCount: int
    bytes: int
    duration: float
    flowRate: float


@app.get("/")
def home():
    return {
        "status": "ML API is running",
        "message": "Network Attack Prediction Model"
    }


@app.post("/predict")
def predict(data: TrafficData):

    input_data = pd.DataFrame(
        [[
            data.sourcePort,
            data.destinationPort,
            data.packetCount,
            data.bytes,
            data.duration,
            data.flowRate
        ]],
        columns=[
            "sourcePort",
            "destinationPort",
            "packetCount",
            "bytes",
            "duration",
            "flowRate"
        ]
    )

    # Prediction
    prediction = model.predict(input_data)[0]

    # Convert encoded label back to attack name
    attack_type = label_encoder.inverse_transform(
        [prediction]
    )[0]

    # Prediction probabilities
    probabilities = model.predict_proba(input_data)[0]

    confidence = float(max(probabilities) * 100)

    # Risk level
    if confidence >= 85:
        risk = "High"
    elif confidence >= 60:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "success": True,
        "prediction": attack_type,
        "attackType": attack_type,
        "confidence": round(confidence, 2),
        "risk": risk
    }