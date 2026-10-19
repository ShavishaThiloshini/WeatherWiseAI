# WeatherWise AI

WeatherWise AI is an intelligent, context-aware weather advisory mobile application built with React Native (Expo) and powered by a Node.js Express backend and a Python (FastAPI) deterministic recommendation engine.

---

## Architecture Overview

- **Mobile Client (`/mobile`)**: React Native + Expo mobile application featuring smart advice, severe weather warnings, clothing and hydration tips, plant care guidance, travel risk comparisons, and interactive weather maps.
- **Backend API (`/backend`)**: Express REST API providing authentication, MySQL persistence (with in-memory fallback for local development), caching, and proxies for AI recommendations and external weather providers.
- **AI Recommendation Engine (`/ai`)**: FastAPI service delivering deterministic, rule-based weather advice, risk classification, and assistant responses.
- **Project Documentation (`/Docs`)**: Complete documentation suite including PRD, TRD, App Flow Document (AFD), Backend Schema (BSD), UI/UX Design Brief, Test Strategy, and Risk Register.

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20
- Python >= 3.10
- npm >= 9

### 2. Start the AI Recommendation Engine
```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app:app --port 8001
```

### 3. Start the Backend API
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
The API starts on `http://localhost:3000`.

### 4. Start the Mobile Application
```powershell
cd mobile
npm install
npm start
```
Use the Expo Go app or an emulator to open the application.

---

## Running Verification Tests

- **Backend tests**:
  ```powershell
  cd backend
  npm test
  ```
- **Mobile tests**:
  ```powershell
  cd mobile
  npm run test:weather
  ```
- **Mobile TypeScript type check**:
  ```powershell
  cd mobile
  npx tsc --noEmit
  ```
- **AI service tests**:
  ```powershell
  cd ai
  python -m pytest
  ```

---

## Deployment Configuration

- **Backend**: Configure `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `AI_SERVICE_URL` in environment variables (see [`backend/.env.example`](backend/.env.example)).
- **Mobile**: Set `EXPO_PUBLIC_API_URL` to the production backend endpoint (see [`mobile/.env.example`](mobile/.env.example)).
- **Database**: Run `backend/database/schema.sql` against your target MySQL database, or allow `initializeDatabase()` in `backend/src/db.js` to initialize tables automatically when `DATABASE_URL` is set.
