const ML_API_URL = "http://127.0.0.1:8000/predict";

async function predictAttack(trafficData) {
  try {
    const response = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourcePort: Number(trafficData.sourcePort || 0),
        destinationPort: Number(trafficData.destinationPort || 0),
        packetCount: Number(trafficData.packetCount || 0),
        bytes: Number(trafficData.bytes || 0),
        duration: Number(trafficData.duration || 0),
        flowRate: Number(trafficData.flowRate || 0),
      }),
    });

    if (!response.ok) {
      throw new Error(`ML API returned status ${response.status}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("ML prediction error:", error.message);

    return {
      success: false,
      prediction: "Unknown",
      attackType: "Unknown",
      confidence: 0,
      risk: "Unknown",
      error: error.message,
    };
  }
}

module.exports = {
  predictAttack,
};