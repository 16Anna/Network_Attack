import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# -----------------------------------
# 1. Load Dataset
# -----------------------------------

data = pd.read_csv("data.csv")

print("Dataset loaded successfully!")
print("Total records:", len(data))
print()


# -----------------------------------
# 2. Select Features and Target
# -----------------------------------

features = [
    "sourcePort",
    "destinationPort",
    "packetCount",
    "bytes",
    "duration",
    "flowRate"
]

X = data[features]
y = data["label"]


# -----------------------------------
# 3. Encode Attack Labels
# -----------------------------------

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)


# -----------------------------------
# 4. Split Dataset
# -----------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)


# -----------------------------------
# 5. Create ML Model
# -----------------------------------

model = RandomForestClassifier(
    n_estimators=150,
    random_state=42,
    class_weight="balanced"
)


# -----------------------------------
# 6. Train Model
# -----------------------------------

print("Training the Random Forest model...")

model.fit(X_train, y_train)

print("Training completed!")
print()


# -----------------------------------
# 7. Test Model
# -----------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("Model Accuracy:", round(accuracy * 100, 2), "%")
print()

print("Classification Report:")
print(
    classification_report(
        y_test,
        predictions,
        target_names=label_encoder.classes_,
        zero_division=0
    )
)


# -----------------------------------
# 8. Save Model
# -----------------------------------

joblib.dump(
    model,
    "network_attack_model.pkl"
)

joblib.dump(
    label_encoder,
    "label_encoder.pkl"
)

print()
print("Model saved successfully!")
print("Created files:")
print("- network_attack_model.pkl")
print("- label_encoder.pkl")