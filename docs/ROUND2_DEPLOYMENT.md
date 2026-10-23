# JobGuard AI — SRIMT Parakram Hackathon 2026 (AI-04)

## Status of this package

This ZIP contains the application's frontend, backend, tests, Supabase SQL, and cloud configuration templates. **It is NOT deployed.** No public HTTPS frontend/backend URLs are verified at the time this package was prepared. User authorization and account-based deployment are required.

## Intended architecture

Judge/browser → HTTPS Vercel (React + Vite) → HTTPS Render (FastAPI + deterministic job scam analysis). Supabase Auth/DB is optional; the analyzer can work without Supabase or an AI API key.

## Recommended order

1. Extract the ZIP. Verify the project folder directly contains `frontend/`, `backend/`, `render.yaml` and this document.
2. Push the project files to the intended GitHub repository. Exclude real `.env` files, private tokens, local dependencies, and virtualenvs (see `.gitignore`). Keep the source repository private if desired.
3. Create Render Web Service using GitHub integration. Runtime Python; build `pip install -r requirements.txt`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; health path `/health`. Select a plan explicitly without starting a paid plan unintentionally.
4. Set Render environment variables: `PYTHON_VERSION=3.11.9`, `MAX_INPUT_CHARS=12000`, `RATE_LIMIT_PER_MINUTE=30`, `AI_ENABLED=false`. After the Vercel URL is known, set `CORS_ORIGINS` to its exact HTTPS origin (no trailing `/`) and redeploy. Optional Supabase/AI settings are documented in `backend/.env.example`.
5. Create Vercel Project from the same GitHub repository. Framework Vite; build `npm run build`; output `dist`; set production environment variable `VITE_API_BASE_URL` to the real Render HTTPS base URL (no `/health` and no trailing `/`). Deploy/redeploy after setting it.
6. Test `https://<render-actual-domain>/health`, `https://<render-actual-domain>/api/samples`, and analysis from the deployed Vercel site. Test the suspicious and legitimate examples, validation errors, and mobile UI.
7. Capture real deployment logs/screenshots, note provider plan and limitations, and submit live links to judges. Do not substitute Canvas or local previews for publicly hosted URLs.

## Critical: repository folder paths

If you upload the contents of the ZIP as the repository **root**, use Render root directory `backend` and Vercel root directory `frontend`. Then you may optionally deploy Render from the root `render.yaml` Blueprint.

If updating the existing GitHub repository `iausercustomer-stack/jobguard-ai04` **without restructuring it**, its current main branch has another `jobguard-ai04/` folder inside. In this case, for manual setup use **Render root `jobguard-ai04/backend`** and **Vercel root `jobguard-ai04/frontend`**. A Render Blueprint from the repository root will NOT automatically read the nested `jobguard-ai04/render.yaml`; move the blueprint to the repository root and adjust its `rootDir` if you want to use Blueprint.

## Expected user-entered values (do NOT guess)

- Render URL: NOT ASSIGNED; copy after successful live deployment.
- Vercel URL: NOT ASSIGNED; copy after successful live deployment.
- `VITE_API_BASE_URL`: ACTUAL Render HTTPS base URL.
- `CORS_ORIGINS`: ACTUAL Vercel HTTPS origin.
- Supabase project keys: OMIT unless intentionally configured.

## Verification record

- ZIP integrity: verified by ZIP CRC check on packaging.
- Backend unit tests: 13/13 passed locally with `PYTHONPATH=. python -m unittest discover -s tests -v` on 2026-10-23.
- Frontend production build: NOT VERIFIED (Node dependencies not installed in this environment).
- Real cloud deployment and cross-origin production tests: NOT VERIFIED.

## Live judging walkthrough (~90 seconds)

Open the Vercel URL, select the suspicious sample, run the analyzer, explain score and specific flags, then run the legitimate sample. Open the Render `/health` endpoint, briefly explain that the score is a heuristic risk indicator rather than verification of the employer's legal identity. If a free-tier backend has gone idle, wake it with `/health` before the demo. Supabase login/history and AI explanations are optional and should not be presented as active unless actually configured and tested.
