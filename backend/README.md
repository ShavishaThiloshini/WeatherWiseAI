# WeatherWise AI Backend

REST API for the WeatherWise AI mobile application. Node.js + Express.js backend with OpenAPI 3.0.3 documentation.

## Run locally

```powershell
cd backend
npm install
npm run dev    # or: npm start
```

The API runs on **port 8001** by default (configurable via `PORT` or `AI_PORT` environment variables).

## API Documentation (Swagger UI)

Once the server is running, access the interactive API documentation:

- **Swagger UI (Interactive)**: [http://localhost:8001/api-docs](http://localhost:8001/api-docs)
- **OpenAPI Spec (JSON)**: [http://localhost:8001/api-docs.json](http://localhost:8001/api-docs.json)

The Swagger UI lets you:
- ✅ Browse all endpoints (implemented and planned)
- ✅ View request/response schemas
- ✅ Test endpoints interactively
- ✅ See authentication requirements
- ✅ Download the OpenAPI spec

## Database Setup (Optional for Day 1)

Create a MySQL database named `weatherwise` and set `DATABASE_URL` in `.env`:

```env
DATABASE_URL=mysql://username:password@localhost/weatherwise
```

The MySQL connection pool is available via `src/db.js`. Migrations and models will be added in Phase 2.

## Project Structure

```
src/
├── server.js            # Entry point; HTTP listener
├── app.js               # Express app setup; middleware & routes
├── swagger.js           # OpenAPI 3.0.3 specification
├── db.js                # MySQL connection pool (optional)
├── routes/              # API route definitions
│   ├── index.js         # Route aggregator
│   └── health.routes.js # Health check endpoint
├── controllers/         # Route handlers
│   └── health.controller.js
└── middleware/          # Custom middleware
    └── error-handler.js # Error response formatting
```

## Core Endpoints (Currently Implemented)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Service info + links |
| GET | `/api/v1/health` | Service health check |

## Planned Endpoints (Documented in Swagger)

**Authentication:**
- POST `/api/v1/auth/register` - Create new account
- POST `/api/v1/auth/login` - Login and get JWT

**Weather:**
- GET `/api/v1/weather/current` - Current conditions
- GET `/api/v1/weather/forecast` - Multi-day forecast

**Recommendations:**
- GET `/api/v1/advice/today` - Smart daily advice
- POST `/api/v1/assistant/ask` - Ask AI assistant

**Travel & Locations:**
- POST `/api/v1/travel/compare` - Travel risk score
- GET/POST `/api/v1/locations` - Manage saved locations

**Plants & History:**
- GET/POST `/api/v1/plants` - Plant care profiles
- GET `/api/v1/history` - Weather history & trends

**Alerts & Preferences:**
- GET `/api/v1/alerts` - Severe weather alerts
- GET/PATCH `/api/v1/users/preferences` - User settings

All endpoints except health are documented in the OpenAPI spec and ready for implementation.

## Response Format

All responses follow a consistent JSON structure:

**Success (200):**
```json
{
  "data": { /* response payload */ }
}
```

**Error (4xx/5xx):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional debug info */ }
  }
}
```

## Environment Variables

```env
# Server
PORT=8001                    # Default port
NODE_ENV=development         # development|staging|production

# Database (optional)
DATABASE_URL=mysql://...     

# AI Service (for future integration)
AI_SERVICE_URL=http://localhost:8000
```

## Dependencies

- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **morgan** - HTTP logging
- **swagger-ui-express** - Interactive API docs
- **mysql2** - MySQL database driver
- **dotenv** - Environment configuration

## Development

### Run in watch mode
```bash
npm run dev
```

### Run in production
```bash
npm start
```

### Add a new endpoint

1. Create route file: `src/routes/feature.routes.js`
2. Create controller: `src/controllers/feature.controller.js`
3. Import and mount in `src/routes/index.js`
4. Add OpenAPI spec to `src/swagger.js`
5. Test via `/api-docs`

## Notes

- The Express backend proxies all external API calls (weather, maps, AI) for centralized security and caching
- JWT authentication will be added in Phase 2
- Database schema is pending (see `Docs/BSD.md` for design)
- Swagger spec covers all planned endpoints per the TRD
