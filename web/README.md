# Data Cleaning & Visualization (Web)

This is the GitHub Pages–ready web app for the project.

It runs entirely in the browser using:

- DuckDB-WASM for data processing (SQL + analytics)
- React + TypeScript + Vite for UI

## Features

- Load a sample dataset
- Upload a CSV locally
- Load a CSV from URL (CORS required)
- Clean data in-browser (mirrors the Python pipeline rules)
- Preview raw/cleaned data
- Charts
- SQL explorer
- Export cleaned CSV

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages

Deployment is handled by GitHub Actions (see `.github/workflows/pages.yml`).
Ensure your repository Pages settings are set to use **GitHub Actions**.
