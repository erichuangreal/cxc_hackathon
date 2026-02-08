# Use pandas for high-level data manipulation and loading the CSV
import pandas as pd

# Use numpy for low-level numerical operations and array handling
import numpy as np

# A function in sklearn library that can be used to split dataset into training, validation, and test sets
from sklearn.model_selection import train_test_split

# Import the base XG Boost Model
from xgboost import XGBClassifier

# A function in sklearn to determine the hit/miss rate of our model's predictions 
# based on the actual labels associated with each subset of features
from sklearn.metrics import accuracy_score

# Load the dataset from the file
df = pd.read_csv('backend/Features&Labels.csv')

# Define features and target

#Pulls only the values from these headers
features = ['elevation', 'temperature', 'humidity', 'soil_TN', 'soil_TP', 'soil_AP', 'soil_AN']
X = df[features]

# Our labels
y = df['health_class']

# Split into train (60%), val (20%), test (20%)
# Separate the training dataset from the main dataset first
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.4, random_state=42, stratify=y
)

# Split the remaining dataset in half for validation set and test set
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

# Initialize and train the XGBoost model
xgb_model = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.05,
    random_state=42,
    n_jobs=-1
)

xgb_model.fit(X_train, y_train)

# Make predictions on all sets
y_pred_train = xgb_model.predict(X_train)
y_pred_val = xgb_model.predict(X_val)
y_pred_test = xgb_model.predict(X_test)

# Calculate accuracies
train_acc = accuracy_score(y_train, y_pred_train)
val_acc = accuracy_score(y_val, y_pred_val)
test_acc = accuracy_score(y_test, y_pred_test)

# Evaluate the model
print(f"Train Accuracy: {train_acc:.4f}")
print(f"Validation Accuracy: {val_acc:.4f}")
print(f"Test Accuracy: {test_acc:.4f}")

for feature, importance in zip(features, xgb_model.feature_importances_):
    print(f"{feature}: {importance:.4f}")
    
# Risks->Because each subsequent tree tries to fix the errors of the tree before it, likely to overfit