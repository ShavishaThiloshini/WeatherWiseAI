# Danu Summary

## Completed tasks

- Reviewed the project structure and mapped the app into frontend, backend, and AI layers.
- Understood the product goal from the PRD and the core recommendation engine design.
- Verified the backend health and database-backed auth flow using the live API.
- Connected the backend to a Railway MySQL instance and fixed the URL parsing issue by switching from placeholder values to the real public host/port.
- Confirmed the backend registration endpoint works and returns a JWT token.
- Started the Expo app locally and fixed the mobile app connection issue from localhost to the correct device network host.
- Removed the login and registration gate so the app opens directly to the main WeatherWise tabs.
- Removed the Profile logout action and authentication callback plumbing from the mobile navigation flow.
- Added a working map screen to replace the placeholder weather map screen.
- Installed the Expo-compatible map dependency (`react-native-maps`).
- Added a backend `.env.example` template for Railway setup.
- Added a mobile `.env.example` template for configuring the Expo API address on a physical device.
- Verified the TypeScript build for the mobile app passes after the map and authentication-flow changes.
- Verified Railway MySQL connectivity with a direct database query and a database-backed auth request through the backend LAN address.
- Replaced a stale local backend process that returned HTTP 500 responses; the current backend returns the expected HTTP 401 for invalid login credentials, confirming the database path is active.

## Current setup status

- Backend API is running and responding on port 3001.
- Database connection is active through Railway MySQL.
- Mobile app is running through Expo.
- Weather map placeholder has been replaced by a real map view.
- The mobile app opens directly to the main navigation without login, registration, or logout actions.
- Expo on a physical device uses `EXPO_PUBLIC_API_URL=http://172.20.10.6:3001/api/v1` in `mobile/.env.local`.

## Notes

- The app architecture is split into:
  - Mobile app: React Native / Expo
  - Backend: Express.js + MySQL
  - AI service: Python FastAPI recommendation engine
- The backend should be used as the only app-to-database connection layer.
- The mobile app should not connect directly to MySQL.
- For a backend deployed in the same Railway project as MySQL, configure `DATABASE_URL` as a Railway reference to `MYSQL_URL`; use `MYSQL_PUBLIC_URL` only for external/local access.
- Railway's dashboard SSH database-view error does not prevent the backend from connecting through the MySQL URL.

## Important files

- `backend/.env`
- `backend/.env.example`
- `backend/src/db.js`
- `backend/src/routes/auth.routes.js`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/App.tsx`
- `mobile/src/screens/ProfileScreen.tsx`
- `mobile/src/services/api.ts`
- `mobile/src/screens/WeatherMapScreen.tsx`
