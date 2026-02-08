
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Load the dataset
df = pd.read_csv('backend/Features&Labels.csv')

# Define features and target
features = ['elevation', 'temperature', 'humidity', 
            'soil_TN', 'soil_TP', 'soil_AP', 'soil_AN']
X = df[features]
y = df['health_class']

# Split into train (60%), val (20%), test (20%)
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.4, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

# Initialize and train the Random Forest model
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)

# Make predictions on all sets
y_pred_train = rf_model.predict(X_train)
y_pred_val = rf_model.predict(X_val)
y_pred_test = rf_model.predict(X_test)

# Calculate accuracies
train_acc = accuracy_score(y_train, y_pred_train)
val_acc = accuracy_score(y_val, y_pred_val)
test_acc = accuracy_score(y_test, y_pred_test)

# Evaluate the model
print("")
print("Random Forest Model Evaluation:")
print("=" * 50)
print(f"Training Accuracy: {train_acc:.4f}")
print(f"Validation Accuracy: {val_acc:.4f}")
print(f"Testing Accuracy: {test_acc:.4f}")

# Feature importance
print("")
print("Feature Importance:")
print("=" * 50)
for feature, importance in zip(features, rf_model.feature_importances_):
    print(f"{feature}: {importance:.4f}")

# Optional: Save the model
import joblib
joblib.dump(rf_model, 'backend/tree_health_rf_model.pkl')
print("")
print("Model saved as 'backend/tree_health_rf_model.pkl'")