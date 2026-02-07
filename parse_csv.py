import pandas as pd

# Read the original CSV
df = pd.read_csv('forest_health_data_with_target.csv')

# Create features dataframe with the specified columns
features = df[['Elevation', 'Temperature', 'Humidity', 'Soil_TN', 'Soil_TP', 'Fire_Risk_Index']]

# Rename columns to match the requested format (lowercase with underscores)
features.columns = ['elevation', 'temperature', 'humidity', 'total nitrogen (Soil_TN)', 'total phosphorus (Soil_TP)', 'fire_risk_index']

# Create labels dataframe with health_status column
labels = df[['Health_Status']]
labels.columns = ['health_status']

# Save to separate CSV files
features.to_csv('features.csv', index=False)
labels.to_csv('labels.csv', index=False)

print("Successfully created features.csv and labels.csv")
print(f"Features shape: {features.shape}")
print(f"Labels shape: {labels.shape}")
