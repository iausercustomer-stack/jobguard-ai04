# JobGuard AI — Local Setup, Supabase & Deployment Guide

## 1. Prerequisites

- **Python:** 3.11 or newer
- **Node.js:** 18.x or 20.x LTS (with `npm`)
- **Optional:** A free-tier [Supabase](https://supabase.com) project (only required if you want cloud authentication and persistent report history)
- **Optional:** An OpenAI-compatible API key (only required if you want optional AI-generated narrative summaries; the deterministic analyzer works without it)

## 2. Local Development Setup on Windows (PowerShell)

### Step A: Clone or Extract the Project

```powershell
cd jobguard-ai04
```

### Step B: Configure and Run the FastAPI Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health check URL: `http://127.0.0.1:8000/health`
- Interactive OpenAPI docs: `http://127.0.0.1:8000/docs`

### Step C: Configure and Run the React + Vite Frontend

Open a second Windows PowerShell terminal:

```powershell
cd jobguard-ai04\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

- Open `http://localhost:5173` in your browser.

## 3. Supabase Database & Authentication Setup

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in Supabase, paste the entire contents of `supabase/schema.sql`, and click **Run**.
   - This creates `public.analyses`, adds indexes and check constraints, revokes `anon` access, enables and forces Row Level Security (`RLS`), and creates policies restricting `SELECT`, `INSERT`, and `DELETE` to `auth.uid() = user_id`.
3. Under **Authentication -> Providers -> Email**, ensure **Email** provider is enabled. (For rapid hackathon demos without SMTP setup, you can toggle off *"Confirm email"* in Supabase Auth settings).
4. Under **Project Settings -> API**, copy your **Project URL** and **`anon` `public` key** (never copy the `service_role` secret key):
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`.
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env`.

## 4. Production Deployment Guide

### Deploying the Backend to Render

1. Push the repository to GitHub (verify `.env` is ignored via `.gitignore`).
2. In Render, create a new **Web Service** pointing to the `jobguard-ai04/backend` root directory.
3. Set Build Command:
   ```bash
   pip install -r requirements.txt
   ```
4. Set Start Command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Configure Environment Variables in Render:
   - `CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173`
   - `MAX_INPUT_CHARS=12000`
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` (if using Supabase)
   - `AI_ENABLED=false` (or `true` with `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`)
6. Set Health Check Path to `/health`.
7. **Free-Tier Hosting Note:** Free-tier web services on Render spin down after periods of inactivity and may take 30–50 seconds on the first cold-start request. Warm up `/health` 1 minute before a live hackathon demo.

### Deploying the Frontend to Vercel

1. Import the repository into Vercel and set the **Root Directory** to `jobguard-ai04/frontend`.
2. Framework Preset: **Vite**
3. Build Command: `npm run build` | Output Directory: `dist`
4. Set Environment Variables in Vercel:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
   - `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key`
5. Deploy and verify that your Vercel domain is listed in the backend's `CORS_ORIGINS`.

## 5. Troubleshooting

- **`Could not connect to the JobGuard AI backend`:** Verify `uvicorn` is running on port `8000` and `VITE_API_BASE_URL` has no trailing slash.
- **CORS error in browser console:** Ensure the exact frontend origin (e.g. `http://localhost:5173`) is included in `CORS_ORIGINS` in `backend/.env` and restart `uvicorn`.
- **`Analysis Succeeded, Report Not Saved`:** This message appears intentionally when `"Save to Private Report History"` is checked without an active Supabase session or when `SUPABASE_URL` / `SUPABASE_ANON_KEY` are not configured on the backend.
