"""
CSV Parser for Tree Survivability Data
Handles environmental conditions and tree mortality rate data
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Dict, List


class TreeDataParser:
    """
    Parser for tree survivability and environmental data CSV files.
    """
    
    def __init__(self, csv_path: str):
        """
        Initialize the parser with a CSV file path.
        
        Args:
            csv_path: Path to the CSV file containing tree data
        """
        self.csv_path = Path(csv_path)
        self.data: Optional[pd.DataFrame] = None
        self.metadata: Dict = {}
        
    def load_data(self) -> pd.DataFrame:
        """
        Load the CSV file into a pandas DataFrame.
        
        Returns:
            DataFrame containing the loaded data
        """
        try:
            self.data = pd.read_csv(self.csv_path)
            print(f"✓ Successfully loaded {len(self.data)} rows from {self.csv_path}")
            return self.data
        except FileNotFoundError:
            raise FileNotFoundError(f"CSV file not found at {self.csv_path}")
        except Exception as e:
            raise Exception(f"Error loading CSV: {str(e)}")
    
    def explore_data(self) -> Dict:
        """
        Explore the loaded data and return summary statistics.
        
        Returns:
            Dictionary containing data exploration results
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        exploration = {
            'shape': self.data.shape,
            'columns': list(self.data.columns),
            'dtypes': self.data.dtypes.to_dict(),
            'missing_values': self.data.isnull().sum().to_dict(),
            'numeric_summary': self.data.describe().to_dict(),
            'sample_rows': self.data.head().to_dict('records')
        }
        
        self.metadata = exploration
        return exploration
    
    def print_summary(self):
        """
        Print a formatted summary of the dataset.
        """
        if self.data is None:
            print("No data loaded. Call load_data() first.")
            return
        
        print("\n" + "="*60)
        print("TREE SURVIVABILITY DATA SUMMARY")
        print("="*60)
        
        print(f"\nDataset Shape: {self.data.shape[0]} rows × {self.data.shape[1]} columns")
        
        print("\nColumns:")
        for i, col in enumerate(self.data.columns, 1):
            dtype = self.data[col].dtype
            missing = self.data[col].isnull().sum()
            missing_pct = (missing / len(self.data)) * 100
            print(f"  {i}. {col} ({dtype}) - {missing} missing ({missing_pct:.1f}%)")
        
        print("\nNumeric Columns Summary:")
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            print(self.data[numeric_cols].describe())
        else:
            print("  No numeric columns found")
        
        print("\nCategorical Columns:")
        categorical_cols = self.data.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            unique_count = self.data[col].nunique()
            print(f"  {col}: {unique_count} unique values")
            if unique_count <= 10:
                print(f"    Values: {list(self.data[col].unique())}")
        
        print("\nFirst 5 Rows:")
        print(self.data.head())
        print("="*60 + "\n")
    
    def identify_columns(self) -> Dict[str, List[str]]:
        """
        Attempt to identify environmental and target columns.
        
        Returns:
            Dictionary with categorized column names
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Common environmental condition keywords
        env_keywords = {
            'soil': ['soil', 'ph', 'quality', 'type', 'texture'],
            'climate': ['rainfall', 'temperature', 'temp', 'precipitation', 'humidity'],
            'geography': ['elevation', 'altitude', 'latitude', 'longitude', 'slope'],
            'disturbance': ['fire', 'wildfire', 'burn', 'disturbance'],
            'other': ['aspect', 'canopy', 'cover']
        }
        
        # Target variable keywords
        target_keywords = ['survival', 'mortality', 'death', 'alive', 'status', 'viability']
        
        categorized = {
            'environmental': [],
            'target': [],
            'identifier': [],
            'unknown': []
        }
        
        for col in self.data.columns:
            col_lower = col.lower()
            
            # Check if it's an identifier (ID, name, etc.)
            if any(keyword in col_lower for keyword in ['id', 'name', 'code']):
                categorized['identifier'].append(col)
            # Check if it's a target variable
            elif any(keyword in col_lower for keyword in target_keywords):
                categorized['target'].append(col)
            # Check if it's an environmental variable
            elif any(keyword in col_lower for keyword_list in env_keywords.values() 
                    for keyword in keyword_list):
                categorized['environmental'].append(col)
            else:
                categorized['unknown'].append(col)
        
        return categorized
    
    def clean_data(self, strategy: str = 'drop') -> pd.DataFrame:
        """
        Clean the data by handling missing values.
        
        Args:
            strategy: Strategy for handling missing values ('drop', 'fill_mean', 'fill_median')
        
        Returns:
            Cleaned DataFrame
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        data_cleaned = self.data.copy()
        
        if strategy == 'drop':
            data_cleaned = data_cleaned.dropna()
            print(f"Dropped rows with missing values. Rows remaining: {len(data_cleaned)}")
        
        elif strategy == 'fill_mean':
            numeric_cols = data_cleaned.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if data_cleaned[col].isnull().sum() > 0:
                    mean_val = data_cleaned[col].mean()
                    data_cleaned[col].fillna(mean_val, inplace=True)
                    print(f"Filled {col} missing values with mean: {mean_val:.2f}")
        
        elif strategy == 'fill_median':
            numeric_cols = data_cleaned.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if data_cleaned[col].isnull().sum() > 0:
                    median_val = data_cleaned[col].median()
                    data_cleaned[col].fillna(median_val, inplace=True)
                    print(f"Filled {col} missing values with median: {median_val:.2f}")
        
        self.data = data_cleaned
        return data_cleaned
    
    def save_processed_data(self, output_path: str):
        """
        Save the processed data to a new CSV file.
        
        Args:
            output_path: Path to save the processed CSV file
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        self.data.to_csv(output_path, index=False)
        print(f"✓ Saved processed data to {output_path}")


def parse_csv(csv_path: str, explore: bool = True, clean: bool = False) -> TreeDataParser:
    """
    Convenience function to parse a CSV file with tree data.
    
    Args:
        csv_path: Path to the CSV file
        explore: Whether to print exploration summary
        clean: Whether to clean the data (drop missing values)
    
    Returns:
        TreeDataParser instance with loaded data
    """
    parser = TreeDataParser(csv_path)
    parser.load_data()
    
    if explore:
        parser.print_summary()
        
        print("\nColumn Classification:")
        categorized = parser.identify_columns()
        for category, columns in categorized.items():
            if columns:
                print(f"\n{category.upper()}:")
                for col in columns:
                    print(f"  - {col}")
    
    if clean:
        parser.clean_data(strategy='drop')
    
    return parser


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python data_parser.py <path_to_csv>")
        print("\nExample:")
        print("  python data_parser.py data/tree_data.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    parser = parse_csv(csv_file, explore=True, clean=False)
    
    # Save exploration results
    print(f"\n✓ Data parsed successfully!")
    print(f"Access the data via parser.data (pandas DataFrame)")
