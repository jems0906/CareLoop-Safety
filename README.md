# CareLoop Safety

CareLoop Safety is a synthetic-only patient-safety and process-improvement program workspace for assisted living, group home, and independent living examples. It demonstrates how fictional event reports can feed a human-reviewed investigation, assigned corrective actions, effectiveness checks, and a scoped improvement project.

**This is a portfolio demonstration, not a clinical system.** It contains no real people or patient identifiers, does not define or recommend clinical care, and does not produce automated incident conclusions. Do not enter real safety narratives, patient data, or documents. There is no file upload. This project makes no HIPAA compliance claim.

## Status and evidence

- The backend tests and frontend production build passed locally; the backend CI import-path fix is included in commit `f78c434`.
- The synthetic demo is deployed to Railway: [frontend](https://frontend-production-bf4a0.up.railway.app) and [backend health](https://backend-production-e254.up.railway.app/health). Railway PostgreSQL is attached. These services were deployed from local CLI uploads and are not yet connected to GitHub auto-deploy.
- No clinician approvals, user research, stakeholder meetings, or cross-functional execution are claimed.
- All event, measure, role, feedback, and project records supplied by the demo seed are fictional and constructed. They are not empirical findings or evidence of causality.
- The demonstration uses a 48-hour process window and a 72-hour discrepancy checkpoint solely as fixed example definitions; neither is a clinical protocol.

## Local setup

Requirements: Python 3.12+, Node.js 22+, npm, and Docker Desktop for the three-service Compose setup.

### Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open the frontend at `http://127.0.0.1:8080`; API health is `http://127.0.0.1:8000/health` and OpenAPI is `http://127.0.0.1:8000/docs`. PostgreSQL data persists in the `careloop-data` volume. The example database password is for local development only. Set a non-empty local `ADMIN_API_KEY` in `.env` to enable write controls; anonymous access is read-only. Vite API URLs are public build-time endpoints only, never secrets.

### Local Python and Vite

In PowerShell terminal one:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m alembic upgrade head
python -m scripts.seed_demo
$env:ADMIN_API_KEY = "local-demo-only-change-me"
uvicorn app.main:app --reload
```

In terminal two:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Paste the same local key into **Admin access** to enable writes. The key stays in browser memory and is cleared by refresh. The seeder is idempotent and only creates the synthetic demo profile; it does not reset existing records.

## Screenshots

These are local mobile-width captures of the synthetic demo, not a deployed service:

- [Program overview](docs/careloop-overview.png)
- [Measurement and equity review](docs/careloop-measurement.png)

## Railway deployment

The live project currently has three services: PostgreSQL, backend, and frontend. The backend was uploaded from `backend/` and frontend from `frontend/`, each using its Dockerfile. For GitHub auto-deploy, connect both application services to `jems0906/CareLoop-Safety` on `main` and configure service root directories `/backend` and `/frontend` respectively.

1. Attach PostgreSQL and map its connection string to `DATABASE_URL`. The backend normalizes Railway's `postgres://` and `postgresql://` schemes to `postgresql+psycopg://`.
2. Set backend `APP_ENV=production`, a strong private `ADMIN_API_KEY`, and `CORS_ORIGINS` to the exact frontend HTTPS origin (no wildcard, path, or trailing slash). Keep `DATABASE_URL` private.
3. The backend image applies Alembic migrations and runs the idempotent synthetic seeder before Uvicorn starts. The service binds to Railway's `PORT`; configure the public target port to the same port (normally 8000). Verify `/health` after deploy.
4. Set frontend build argument `VITE_API_URL` to the backend's full HTTPS origin. It contains no credentials. Expose port 8080; set the frontend public-domain target to 8080. Nginx serves the SPA and falls back to `index.html` for deep-link refresh.
5. After deploy, verify CORS preflight from the exact frontend origin, migrations, backend health, a frontend deep-link refresh, process restart persistence, read-only anonymous behavior, and gated admin writes. Do not add real data.

Verified on the current deployment: migrations and synthetic seeding completed; backend health returns `200`; exact-origin CORS preflight succeeds; the frontend and measurement deep link render; anonymous event writes return `403`; and the seeded PostgreSQL records remain after a backend restart. No real data was used. GitHub auto-deploy is not configured yet.

## Quality checks

```powershell
cd backend
pip install -r requirements-dev.txt
pytest -q
```

```powershell
cd frontend
npm ci
npm run build
```

CI runs the backend suite and TypeScript/Vite build on pushes and pull requests. The checks cover write access, duplicate event and PDSA IDs, investigation sign-off invalidation, action-state/evidence boundaries, zero denominators, numerator/denominator validation, and aggregate CSV export.

## Project map

- `backend/app/api/routes/`: read-only case, investigation, action, PDSA, project, and aggregate-measure APIs; administrative writes require `X-Admin-Key`.
- `backend/app/services/`: action transition rules, PDSA duplicate handling, and denominator-safe run-chart calculations.
- `fixtures/`: constructed event scenarios and weekly setting-level process, outcome, and balancing measures.
- `docs/`: charter, A3, investigation/action record, measure plan, data dictionary, stakeholder pack, PDSA, sustainment, leadership outline, and limitations.

Read `docs/limitations.md` and `docs/measurement_plan.md` before adapting this portfolio. A real deployment would require separate security/privacy review, clinical governance, clinician-approved protocol definitions, identity and access management, hosting and contractual review, accessibility review, and validation with consenting participants. No EHR, payer, or CMS integration is included.