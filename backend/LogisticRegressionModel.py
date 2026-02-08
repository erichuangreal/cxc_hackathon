
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler

# Load the dataset
df = pd.read_csv('backend/Features&Labels.csv')


# Define features and target
features = ['elevation', 'temperature', 'humidity', 
            'soil_TN', 'soil_TP', 'soil_AP', 'soil_AN']
X = df[features]
y = df['health_class']

# Split into train (60%), validation (20%), test (20%)
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.4, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

# Scale the features (important for logistic regression)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

# Initialize and train the Logistic Regression model
logreg_model = LogisticRegression(
    solver='lbfgs',  # good solver for multiclass problems
    max_iter=1000,  # increase iterations for convergence
    random_state=42
)

logreg_model.fit(X_train_scaled, y_train)

# Make predictions on all sets
y_train_pred = logreg_model.predict(X_train_scaled)
y_val_pred = logreg_model.predict(X_val_scaled)
y_test_pred = logreg_model.predict(X_test_scaled)

# Calculate accuracies
train_accuracy = accuracy_score(y_train, y_train_pred)
val_accuracy = accuracy_score(y_val, y_val_pred)
test_accuracy = accuracy_score(y_test, y_test_pred)

print(f"Training set accuracy: {train_accuracy:.4f}")
print(f"Validation set accuracy: {val_accuracy:.4f}")
print(f"Test set accuracy: {test_accuracy:.4f}")


# The model calculates a weighted sum of inputs and passes it 
# through a 'Softmax' function to output probabilities for all 4 classes.
# The class with the highest probability (e.g., 0.85 for 'Healthy') is the prediction.
# It's more linear and usually less optimal for multivariate problems with more complex relations