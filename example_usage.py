"""
Example usage of the TreeDataParser

This script demonstrates how to use the data_parser module
to load and analyze tree survivability data.
"""

from data_parser import TreeDataParser, parse_csv

# Example 1: Quick parsing with automatic exploration
print("="*60)
print("EXAMPLE 1: Quick Parse with Auto-Exploration")
print("="*60)

# Replace 'your_data.csv' with your actual CSV file path
csv_file = "data/tree_data.csv"

try:
    # This will load the data and print a summary
    parser = parse_csv(csv_file, explore=True, clean=False)
    
    # Access the data
    df = parser.data
    print(f"\nLoaded DataFrame shape: {df.shape}")
    
except FileNotFoundError:
    print(f"\n⚠ CSV file not found at '{csv_file}'")
    print("Please place your CSV file in the correct location and update the path.")
    print("\nExpected CSV structure:")
    print("  - Environmental columns: soil_ph, rainfall, elevation, temperature, etc.")
    print("  - Target column: survival_rate, mortality_rate, or similar")
    print("  - Optional: tree_species, location coordinates, etc.")


# Example 2: Manual step-by-step parsing
print("\n\n" + "="*60)
print("EXAMPLE 2: Manual Step-by-Step Parsing")
print("="*60)

try:
    # Create parser instance
    parser = TreeDataParser(csv_file)
    
    # Load data
    data = parser.load_data()
    
    # Explore data structure
    exploration = parser.explore_data()
    
    # Identify column types
    categorized = parser.identify_columns()
    
    print("\nIdentified Columns:")
    print(f"  Environmental: {categorized['environmental']}")
    print(f"  Target: {categorized['target']}")
    print(f"  Identifiers: {categorized['identifier']}")
    
    # Clean data (if needed)
    # parser.clean_data(strategy='drop')  # Remove rows with missing values
    # parser.clean_data(strategy='fill_mean')  # Fill with column mean
    
    # Save processed data
    # parser.save_processed_data('data/processed_tree_data.csv')
    
except FileNotFoundError:
    print(f"\n⚠ Please add your CSV file to proceed")


# Example 3: Working with the data for ML preparation
print("\n\n" + "="*60)
print("EXAMPLE 3: Preparing Data for Machine Learning")
print("="*60)

print("""
Once you have your data loaded, you can prepare it for ML:

# Separate features and target
X = df[environmental_columns]  # Features
y = df[target_column]  # Target (survival rate)

# Split into train/test sets
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Ready for Random Forest or XGBoost!
""")
