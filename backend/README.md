# WeatherWise AI Backend

Day 1 backend foundation for the WeatherWise AI mobile application, plus a Gemini-powered AI assistant route.

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

## Gemini AI setup

The backend proxies chat requests to Gemini through `POST /api/v1/assistant/ask`.
Configure these variables in `.env`:

- `GEMINI_API_KEY` - your Gemini API key
- `GEMINI_MODEL` - defaults to `gemini-1.5-flash`
- `GEMINI_TIMEOUT_MS` - defaults to `15000`

## npm commands

- `npm run dev` - start the backend in development mode with nodemon
- `npm start` - start the backend in production mode

## Endpoints

- `GET /` - API service information
- `GET /api/v1/health` - health check
- `POST /api/v1/assistant/ask` - Gemini assistant chat proxy

The API is versioned under `/api/v1` and uses a routes/controllers/middleware structure described in the TRD.
