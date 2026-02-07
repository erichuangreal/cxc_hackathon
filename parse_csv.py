import pandas as pd

df = pd.read_csv('forest_health_data_with_target.csv')

# features = df[['Elevation', 'Temperature', 'Humidity', 'Soil_TN', 'Soil_TP', 'Fire_Risk_Index']]
features = df[['Elevation', 'Humidity', 'Soil_TP']]

labels = df[['Health_Status']]
labels.columns = ['health_status']

features.to_csv('features.csv', index=False)
labels.to_csv('labels.csv', index=False)

print("Successfully created features.csv and labels.csv")
print(f"Features shape: {features.shape}")
print(f"Labels shape: {labels.shape}")
