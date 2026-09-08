# WeatherWise AI Backend

Express backend for the WeatherWise AI mobile application. The Day 3 MySQL
schema is maintained in `database/schema.sql` and is applied automatically at
startup when `DATABASE_URL` is configured.

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
The database user needs permission to create and alter the tables in the
`weatherwise` database. Start the API once to apply the schema.

The MySQL connection pool and schema initialization are available through
`src/db.js`. The schema includes users, preferences, locations, plants, weather
snapshots, forecast cache, history, alerts, notifications, travel analyses,
and AI conversations/messages.

For a fresh database, the schema can also be applied manually:

```powershell
mysql -u weatherwise -p weatherwise < database/schema.sql
```

The schema uses UUID string keys, foreign-key ownership constraints, JSON risk
factors, and indexes for user, location, cache, alert, and conversation reads.

## Endpoints

- `GET /` - API service information
- `GET /api/v1/health` - health check

The API is versioned under `/api/v1` and uses a routes/controllers/middleware structure described in the TRD.
