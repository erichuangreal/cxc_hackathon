
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import xgboost as xgb
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# Check XGBoost version
print(f"XGBoost version: {xgb.__version__}")

# Load the data
df = pd.read_csv('backend/forest_health_data_with_target.csv')

#print(f"Dataset shape: {df.shape}")
#print(f"Columns: {list(df.columns)}")
#print(f"Target column found: 'Health_Status'")

# Prepare features and target
# Remove ONLY identifier columns (Plot_ID, Latitude, Longitude)
identifier_cols = ['Plot_ID', 'Latitude', 'Longitude', 'DBH', 'Tree_Height', 'Crown_Width_North_South', 'Crown_Width_East_West', 'Menhinick_Index', 'Gleason_Index', 'Disturbance_Level']
X = df.drop(['Health_Status'] + identifier_cols, axis=1)
y = df['Health_Status']

#print(f"Features after removing identifiers: {X.shape}")
#print(f"Features used: {list(X.columns)}")

le = LabelEncoder()
le.fit(y)

health_mapping = {
    'Unhealthy': 0,       # Worst health status
    'Sub-healthy': 1,     # Poor but recovering
    'Healthy': 2,         # Normal health
    'Very Healthy': 3     # Optimal health
}

# Apply the ordinal mapping instead of alphabetical encoding
y_encoded = y.map(health_mapping)

# Verify all values were mapped
missing_classes = set(y.unique()) - set(health_mapping.keys())
if missing_classes:
    raise ValueError(f"Missing mapping for classes: {missing_classes}")

print(f"Label mapping (ORDINAL HEALTH PROGRESSION):")
for class_name, code in sorted(health_mapping.items(), key=lambda x: x[1]):
    print(f"  {class_name} -> {code}")

# Split into train, validation, and test sets (70-15-15)
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

print(f"Data split:")
print(f"Training set: {X_train.shape} ({X_train.shape[0]/len(df)*100:.1f}%)")
print(f"Validation set: {X_val.shape} ({X_val.shape[0]/len(df)*100:.1f}%)")
print(f"Test set: {X_test.shape} ({X_test.shape[0]/len(df)*100:.1f}%)")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

# Build and train XGBoost model
print("" + "="*50)
print("Training XGBoost model...")
print("="*50)

# VERSION 1: For older XGBoost (if you get early_stopping_rounds error)
model = XGBClassifier(
    n_estimators=200,  # Reduced for faster training
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=1,
    gamma=0,
    reg_alpha=0,
    reg_lambda=1,
    objective='multi:softprob',
    num_class=len(le.classes_),
    eval_metric='mlogloss',
    use_label_encoder=False,
    random_state=42,
    n_jobs=-1
)

# SIMPLE TRAINING WITHOUT EARLY STOPPING
model.fit(X_train_scaled, y_train)

print("Training completed!")

# Make predictions
y_train_pred = model.predict(X_train_scaled)
y_val_pred = model.predict(X_val_scaled)
y_test_pred = model.predict(X_test_scaled)

# Get probabilities
y_test_prob = model.predict_proba(X_test_scaled)

# Calculate accuracies
train_acc = accuracy_score(y_train, y_train_pred)
val_acc = accuracy_score(y_val, y_val_pred)
test_acc = accuracy_score(y_test, y_test_pred)

print("" + "="*50)
print("MODEL PERFORMANCE")
print("="*50)
print(f"Training Accuracy:    {train_acc:.4f} ({train_acc*100:.2f}%)")
print(f"Validation Accuracy:  {val_acc:.4f} ({val_acc*100:.2f}%)")
print(f"Test Accuracy:        {test_acc:.4f} ({test_acc*100:.2f}%)")

print("Test Set Classification Report:")
print(classification_report(y_test, y_test_pred, target_names=le.classes_))

# Confusion matrix
cm = confusion_matrix(y_test, y_test_pred)
print("Confusion Matrix:")
print(cm)

# Feature importance
print("" + "="*50)
print("FEATURE IMPORTANCE")
print("="*50)

# Get feature importance
importance_scores = model.feature_importances_
feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': importance_scores
}).sort_values('Importance', ascending=False)

print("Top 10 Most Important Features:")
for i, (feature, importance) in enumerate(zip(feature_importance['Feature'][:10],
                                              feature_importance['Importance'][:10]), 1):
    print(f"{i:2}. {feature:30} {importance:.4f}")

# Function to make new predictions
def predict_health_status(features_dict):
    """
    Predict health status for new data

    Parameters:
    features_dict: Dictionary with feature names and values
    Returns: Dictionary with predicted class and probabilities
    """
    # Create dataframe from input
    input_df = pd.DataFrame([features_dict])

    # Ensure all columns are in correct order and present
    missing_cols = set(X.columns) - set(input_df.columns)
    extra_cols = set(input_df.columns) - set(X.columns)

    if missing_cols:
        raise ValueError(f"Missing features: {missing_cols}")
    if extra_cols:
        print(f"Warning: Extra features provided: {extra_cols}")
        input_df = input_df[X.columns]  # Keep only needed columns

    # Scale the input
    input_scaled = scaler.transform(input_df)

    # Make prediction
    pred_numeric = model.predict(input_scaled)[0]
    pred_proba = model.predict_proba(input_scaled)[0]

    # Get class name
    pred_class = le.inverse_transform([pred_numeric])[0]

    # Create result dictionary
    result = {
        'predicted_class': pred_class,
        'predicted_class_numeric': int(pred_numeric),
        'probabilities': {le.classes_[i]: float(prob) for i, prob in enumerate(pred_proba)}
    }

    return result

# Example usage
print("" + "="*50)
print("EXAMPLE PREDICTION")
print("="*50)

# Get feature names
feature_names = X.columns.tolist()
print(f"Required features ({len(feature_names)}): {feature_names}")

# Create example input using median values from training data
example_features = {}
for col in feature_names:
    example_features[col] = float(X_train[col].median())

print(f"Example input (median values from training data):")
for k, v in example_features.items():
    print(f"  {k}: {v:.4f}")

try:
    prediction = predict_health_status(example_features)
    print(f"Prediction: {prediction['predicted_class']}")
    print(f"Probabilities:")
    for class_name, prob in prediction['probabilities'].items():
        print(f"  {class_name}: {prob:.4f}")
except Exception as e:
    print(f"Error: {e}")

# Save the model components
import joblib

model_components = {
    'model': model,
    'scaler': scaler,
    'label_encoder': le,
    'feature_names': feature_names,
    'label_mapping': dict(zip(le.classes_, range(len(le.classes_)))),
    'class_distribution': dict(zip(le.classes_, np.bincount(y_encoded)))
}

joblib.dump(model_components, 'forest_health_model.pkl')
print("" + "="*50)
print(f"Model saved as 'forest_health_model.pkl'")
print("="*50)

# Test loading the model
print("Testing saved model load...")
loaded_components = joblib.load('forest_health_model.pkl')
loaded_model = loaded_components['model']
loaded_scaler = loaded_components['scaler']
loaded_le = loaded_components['label_encoder']

# Make a test prediction
test_input_scaled = loaded_scaler.transform(X_test.iloc[:1])
test_pred = loaded_model.predict(test_input_scaled)
test_pred_class = loaded_le.inverse_transform(test_pred)[0]
actual_class = loaded_le.inverse_transform([y_test[0]])[0]

print(f"Test prediction from saved model:")
print(f"  Actual: {actual_class}")
print(f"  Predicted: {test_pred_class}")
print(f"  Match: {actual_class == test_pred_class}")

print("" + "="*50)
print("MODEL SUMMARY")
print("="*50)
print(f"Features used: {len(feature_names)}")
print(f"Classes: {list(le.classes_)}")
print(f"Test accuracy: {test_acc*100:.2f}%")
print(f"Model is ready for deployment!")
