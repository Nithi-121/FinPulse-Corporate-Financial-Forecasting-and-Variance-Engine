# FinPulse Premium Web Dashboard

This is the investor-grade, React-based frontend for the FinPulse financial analytics platform. Built with a modern tech stack (React 18, Vite, Tailwind CSS, Recharts, Framer Motion) to deliver a high-end fintech product experience.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Swapping in Real Pipeline Data

The dashboard currently uses a realistic mock dataset located in `src/data/mockData.ts`. This single file exports typed TypeScript structures (`FinancialMetric`, `Forecast`, `BacktestMetric`, `Anomaly`) that feed all charts and tables across the application.

To connect this dashboard to your real FinPulse DuckDB or Python pipeline outputs:

1. **JSON Export Approach (Easiest)**
   Update your Python pipeline (`src/export_dashboard.py`) to dump the required tables to JSON files in the `/public/data` directory:
   - `public/data/financials.json`
   - `public/data/forecasts.json`
   - `public/data/backtest.json`
   - `public/data/anomalies.json`
   
   Then, update `src/data/mockData.ts` to fetch these files using standard `fetch()` or React Query, casting the responses to the existing interfaces.

2. **API Backend Approach (Recommended for Production)**
   Build a fast, read-only API using **FastAPI** that queries the `finpulse.duckdb` file directly. 
   - Serve endpoints like `GET /api/financials?company=HPE`.
   - In `src/App.tsx`, integrate a data fetching library like React Query or SWR.
   - Replace the static imports of `financials` and `forecasts` in the components with your new API hooks.

## Project Structure
- `src/components/ui`: Reusable design system parts (`KpiCard`, `ChartCard`, `InsightCallout`).
- `src/components/Layout.tsx`: The main application shell and sidebar navigation.
- `src/pages/Overview.tsx`: The primary dashboard view. Other pages (`Forecasts`, `Variance`, `Models`) follow the same pattern.
- `src/data/mockData.ts`: The centralized data layer.
