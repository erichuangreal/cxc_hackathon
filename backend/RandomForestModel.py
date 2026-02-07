
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder

# Load the dataset
df = pd.read_csv('us_tree_health_realistic.csv')

# Define features and target
features = ['elevation', 'temperature', 'humidity', 
            'soil_TN', 'soil_TP', 'soil_AP', 'soil_AN']
X = df[features]
y = df['health_class']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Initialize and train the Random Forest model
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)

# Make predictions
y_pred = rf_model.predict(X_test)

# Evaluate the model
print("Model Evaluation:")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("Classification Report:")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Feature importance
print("Feature Importance:")
print("=" * 50)
for feature, importance in zip(features, rf_model.feature_importances_):
    print(f"{feature}: {importance:.4f}")

# Optional: Save the model
import joblib
joblib.dump(rf_model, 'tree_health_rf_model.pkl')
print("Model saved as 'tree_health_rf_model.pkl'")

# Optional: Create a function for making new predictions
def predict_health(elevation, temperature, humidity, soil_TN, soil_TP, soil_AP, soil_AN):
    """Predict tree health class for new data"""
    data = [[elevation, temperature, humidity, soil_TN, soil_TP, soil_AP, soil_AN]]
    prediction = rf_model.predict(data)
    class_labels = {
        0: 'unhealthy',
        1: 'subhealthy', 
        2: 'healthy',
        3: 'very_healthy'
    }
    return {
        'class': int(prediction[0]),
        'label': class_labels[prediction[0]]
    }

# Example prediction
print("Example Prediction:")
print("=" * 50)
example_pred = predict_health(
    elevation=500.0,
    temperature=20.0,
    humidity=70.0,
    soil_TN=3.0,
    soil_TP=1.2,
    soil_AP=0.2,
    soil_AN=0.1
)
print(f"Prediction: Class {example_pred['class']} ({example_pred['label']})")
