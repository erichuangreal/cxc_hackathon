"""
CSV Data Parser for Tree Survivability Project
Parses Tree_Data.csv and extracts environmental variables and mortality rates
"""

import pandas as pd
import numpy as np

def parse_tree_data(filepath='Tree_Data.csv'):
    """
    Parse the tree data CSV file and extract relevant variables
    
    Returns:
        df_clean: Cleaned dataframe with environmental features and target variable
        feature_columns: List of environmental feature column names
        target_column: Name of the target variable (survival/mortality)
    """
    
    # Load the CSV file
    print("Loading CSV file...")
    df = pd.read_csv(filepath)
    
    # Display basic info
    print(f"\n=== Dataset Overview ===")
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    print(f"\nColumn names:\n{df.columns.tolist()}")
    
    # Identify target variable (Event: 0=survived, 1=died)
    target_column = 'Event'
    
    # Identify environmental/condition feature columns
    feature_columns = [
        'Light_ISF',      # Light availability (continuous)
        'Light_Cat',      # Light category (categorical)
        'Soil',           # Soil type (categorical)
        'Sterile',        # Sterile status (categorical)
        'Conspecific',    # Conspecific status (categorical)
        'Myco',           # Mycorrhizal type (categorical)
        'SoilMyco',       # Soil mycorrhizal type (categorical)
        'AMF',            # Arbuscular Mycorrhizal Fungi (continuous)
        'EMF',            # Ectomycorrhizal Fungi (continuous)
        'Phenolics',      # Phenolic compounds (continuous)
        'Lignin',         # Lignin content (continuous)
        'NSC',            # Non-structural carbohydrates (continuous)
        'Time',           # Time in study (continuous)
    ]
    
    # Additional columns that might be useful
    additional_columns = [
        'Species',        # Tree species (could be target or feature)
        'Plot',           # Plot location
        'Subplot',        # Subplot location
        'Core',           # Core year
    ]
    
    # Select relevant columns
    columns_to_keep = additional_columns + feature_columns + [target_column]
    df_clean = df[columns_to_keep].copy()
    
    # Display info about target variable
    print(f"\n=== Target Variable: {target_column} ===")
    print(f"Event = 0: Tree survived")
    print(f"Event = 1: Tree died/mortality event")
    print(f"\nTarget variable distribution:")
    print(df_clean[target_column].value_counts())
    mortality_rate = df_clean[target_column].mean() * 100
    print(f"\nOverall Mortality Rate: {mortality_rate:.2f}%")
    print(f"Overall Survival Rate: {100 - mortality_rate:.2f}%")
    
    # Display info about species
    print(f"\n=== Tree Species ===")
    print(f"Number of unique species: {df_clean['Species'].nunique()}")
    print(f"\nSpecies distribution:")
    print(df_clean['Species'].value_counts())
    
    # Display info about environmental features
    print(f"\n=== Environmental Features ===")
    print(f"Total features: {len(feature_columns)}")
    
    # Continuous features
    continuous_features = ['Light_ISF', 'AMF', 'EMF', 'Phenolics', 'Lignin', 'NSC', 'Time']
    print(f"\nContinuous features ({len(continuous_features)}):")
    for col in continuous_features:
        if col in df_clean.columns:
            print(f"  - {col}")
    
    # Categorical features
    categorical_features = ['Light_Cat', 'Soil', 'Sterile', 'Conspecific', 'Myco', 'SoilMyco']
    print(f"\nCategorical features ({len(categorical_features)}):")
    for col in categorical_features:
        if col in df_clean.columns:
            print(f"  - {col} ({df_clean[col].nunique()} unique values)")
    
    # Check for missing values
    print(f"\n=== Missing Values ===")
    missing_counts = df_clean.isnull().sum()
    missing_cols = missing_counts[missing_counts > 0]
    if len(missing_cols) > 0:
        print("Columns with missing values:")
        for col, count in missing_cols.items():
            pct = (count / len(df_clean)) * 100
            print(f"  - {col}: {count} ({pct:.2f}%)")
    else:
        print("No missing values found!")
    
    # Display sample statistics for continuous variables
    print(f"\n=== Summary Statistics (Continuous Features) ===")
    print(df_clean[continuous_features].describe())
    
    return df_clean, feature_columns, target_column


def save_parsed_data(df_clean, output_path='parsed_tree_data.csv'):
    """
    Save the parsed and cleaned data to a new CSV file
    """
    df_clean.to_csv(output_path, index=False)
    print(f"\n✓ Parsed data saved to: {output_path}")
    print(f"  Rows: {len(df_clean)}")
    print(f"  Columns: {len(df_clean.columns)}")


if __name__ == "__main__":
    # Parse the data
    df_clean, feature_columns, target_column = parse_tree_data('Tree_Data.csv')
    
    # Save parsed data
    save_parsed_data(df_clean, 'parsed_tree_data.csv')
    
    print(f"\n{'='*50}")
    print("DATA PARSING COMPLETE!")
    print(f"{'='*50}")
    print(f"\nYou now have:")
    print(f"  1. Cleaned dataframe: 'df_clean'")
    print(f"  2. Feature list: 'feature_columns' ({len(feature_columns)} features)")
    print(f"  3. Target variable: '{target_column}'")
    print(f"  4. Saved file: 'parsed_tree_data.csv'")
    print(f"\nReady for model training!")
