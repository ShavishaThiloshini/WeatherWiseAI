# WeatherWise AI Backend

Day 1 backend foundation for the WeatherWise AI mobile application.

## Run locally

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Endpoints

- `GET /` - API service information
- `GET /api/v1/health` - health check

The API is versioned under `/api/v1` and uses a routes/controllers/middleware structure described in the TRD.
