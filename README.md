# Data Cleaning & Visualization

![CI](https://github.com/kanyingidickson-dev/Data-Cleaning-Visualization/actions/workflows/ci.yml/badge.svg)

A small data project that turns a deliberately messy, real-world-style CSV into a cleaned dataset and a set of insights.

The focus is:
- documenting cleaning decisions
- making transformations explicit
- producing a few clear, meaningful charts

## Tech stack

- Python
- pandas
- matplotlib / seaborn
- React + TypeScript (Vite)
- DuckDB-WASM (in-browser analytics)

## Folder structure

- `data/raw/` input CSVs
- `data/cleaned/` generated cleaned outputs
- `src/` cleaning + analysis + visualization modules
- `reports/figures/` generated charts

## How to run locally

### Python pipeline

```bash
pip install -r requirements.txt
python -m src.cleaning
python -m src.analysis
python -m src.visualization
```

### Web app (GitHub Pages-ready)

```bash
cd web
npm install
npm run dev
```

Build:

```bash
cd web
npm run build
```

Outputs:
- `data/cleaned/cleaned_dataset.csv`
- `reports/insights.md`
- `reports/figures/` (3 PNG charts)

## Dataset

A small sample HR-style dataset with common issues:
- missing salaries
- mixed salary formats ("$70,000", "70000", "N/A")
- inconsistent categorical values (department naming)
- a few invalid ages

## Design decisions

- Salary is parsed into a numeric column `salary_usd`.
- Missing salary values are imputed using median salary within the department, falling back to global median.
- Invalid ages (e.g. `< 16` or `> 80`) are removed.
- Department names are normalized to a canonical set.

## Web app features

- Load data from a sample dataset, local CSV upload, or a CSV URL (CORS required)
- Clean the dataset in-browser (mirrors the Python rules)
- Preview raw and cleaned data
- Interactive charts
- SQL explorer
- Export cleaned CSV
