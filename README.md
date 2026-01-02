# InvigilateX-Ai

An exam proctoring and management app with a Vite + React frontend and an Express + MongoDB backend. Teachers create exams, manage questions, review logs, and publish results; students sit exams, get live proctoring, and track their progress.

## Features
- Role-based flows for teachers (create/manage exams, logs, results) and students (take exams, view results, tasks).
- Exam creation with question banks, coding/MCQ support, and result publishing.
- Proctoring integrations: webcam (react-webcam), cheating logs, and alert review.
- Dashboards with charts, data grids, and rich theming via MUI v7.
- Auth with JWT cookies, protected routes, and profile management including avatar upload.

## Tech Stack
- Frontend: React 19, Vite, React Router, Redux Toolkit, MUI, Chart.js, Monaco, React Webcam, React Toastify.
- Backend: Node.js, Express, MongoDB via Mongoose, JWT auth, bcrypt, CORS, cookie-parser.

## Project Structure
- [frontend/](frontend/) — Vite app (UI, routes, theme, Redux slices).
- [backend/](backend/) — Express API, Mongo, JWT auth, and exam logic.

## Prerequisites
- Node.js 18+ and npm
- MongoDB connection string

## Setup (local)
1) Install dependencies
- In frontend: `cd frontend && npm install`
- In backend: `cd backend && npm install`

2) Configure environment variables
- Create [backend/.env](backend/.env) with at least:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/invigilatex
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```
- Adjust ports/URLs if you change defaults.

3) Run in development
- Backend API: `npm run dev` (from backend) — starts Express with nodemon on PORT (default 5000).
- Frontend app: `npm run dev` (from frontend) — Vite dev server (default 5173).
- Open http://localhost:5173 and ensure the API URL matches your `.env`.

4) Build and preview frontend
- Build: `npm run build` (from frontend)
- Preview production build: `npm run preview`

## Available Scripts
- Frontend (from frontend/): `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
- Backend (from backend/): `npm run dev`, `npm run start`.

## Deployment Notes
- Frontend: Vercel-ready (Vite) — set `VITE_API_URL` if you expose it in the client.
- Backend: Provide production `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`; start with `npm start`.

## Tips
- If you see CORS/auth issues, confirm `CLIENT_URL` matches the frontend origin.
- Keep JWT secret long and random; never commit your real `.env` values.
- Seed tasks on the Tasks page are local-only; wire to your API when ready.
