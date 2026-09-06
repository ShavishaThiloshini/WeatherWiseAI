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

## MySQL setup

Create a MySQL database named `weatherwise`, create a database user, and set
`DATABASE_URL` in `.env` using the connection string shown in `.env.example`.

The MySQL connection pool is available through `src/db.js`. Database-backed
features and schema migrations will be added in the next backend tasks.

## Endpoints

- `GET /` - API service information
- `GET /api/v1/health` - health check

The API is versioned under `/api/v1` and uses a routes/controllers/middleware structure described in the TRD.
