# Tree Survivability Prediction - CXC Hackathon 2026

## Project Overview

A Decision Support System for Reforestation that predicts tree species survivability based on environmental conditions.

**Award Tracks:**
- Best Use of AI for Good
- Most Creative Data Visualization

## Current Status: Data Parsing Phase

### What's Ready

✅ CSV Parser for tree survivability data  
✅ Automatic data exploration and summary statistics  
✅ Column identification (environmental vs. target variables)  
✅ Data cleaning utilities  
✅ Sample data template

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Prepare Your CSV Data

Place your CSV file in the `data/` directory. Your CSV should include:

**Environmental Columns** (features):
- `soil_ph` - Soil pH level
- `soil_quality` - Soil quality (categorical or numeric)
- `rainfall_mm` - Annual rainfall in millimeters
- `temperature_c` - Average temperature in Celsius
- `elevation` - Elevation in meters
- `wildfire_history` - Previous wildfire occurrence (Yes/No or binary)
- `latitude`, `longitude` - Geographic coordinates
- Other relevant environmental factors

**Target Column**:
- `survival_rate` - Tree survival rate (0-1 or percentage)
- OR `mortality_rate` - Tree mortality rate

**Optional Columns**:
- `tree_id` - Unique identifier
- `species` - Tree species name
- `location` - Location name

See `data/sample_tree_data.csv` for an example structure.

### 3. Parse Your Data

#### Option A: Quick Parse (Recommended)

```python
from data_parser import parse_csv

# Load and explore your data automatically
parser = parse_csv('data/your_data.csv', explore=True, clean=False)

# Access the loaded DataFrame
df = parser.data
print(df.head())
```

#### Option B: Command Line

```bash
python data_parser.py data/your_data.csv
```

#### Option C: Using the Example Script

```bash
python example_usage.py
```

### 4. What the Parser Does

The parser will automatically:
- ✅ Load your CSV file
- ✅ Display shape and column information
- ✅ Show data types and missing value counts
- ✅ Generate summary statistics for numeric columns
- ✅ Identify environmental vs. target columns
- ✅ Display sample rows

### 5. Try with Sample Data

```bash
# Test the parser with the included sample data
python data_parser.py data/sample_tree_data.csv
```

## Project Structure

```
/workspace/
├── data/                          # Data directory
│   └── sample_tree_data.csv      # Sample CSV template
├── data_parser.py                # Main CSV parser module
├── example_usage.py              # Example usage scripts
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## Next Steps

After you have your CSV data parsed:

1. **Data Exploration** - Analyze the distributions and relationships
2. **Feature Engineering** - Create derived features if needed
3. **Model Training** - Build Random Forest or XGBoost model
4. **LLM Integration** - Add Gemini/GPT for actionable advice
5. **Frontend** - Build interactive geospatial map

## Data Requirements

For the hackathon, aim for:
- **5000+ datapoints** minimum
- Multiple tree species
- Varied environmental conditions
- Geographic diversity

## Example Output

When you run the parser, you'll see:

```
============================================================
TREE SURVIVABILITY DATA SUMMARY
============================================================

Dataset Shape: 5000 rows × 11 columns

Columns:
  1. tree_id (int64) - 0 missing (0.0%)
  2. species (object) - 0 missing (0.0%)
  3. latitude (float64) - 0 missing (0.0%)
  4. elevation (float64) - 15 missing (0.3%)
  5. soil_ph (float64) - 23 missing (0.5%)
  ...

Column Classification:

ENVIRONMENTAL:
  - soil_ph
  - rainfall_mm
  - elevation
  - temperature_c

TARGET:
  - survival_rate
```

## Getting Help

If you encounter issues:
1. Check that your CSV file exists in the correct path
2. Verify your CSV has proper headers
3. Ensure numeric columns don't contain text values
4. Check for encoding issues (use UTF-8)

## Contact

CXC Hackathon 2026 - AI for Good & Data Visualization