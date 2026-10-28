from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import actions, events, investigations, measurement, projects
from app.config import settings

app = FastAPI(title=settings.app_name, description="Synthetic-only patient safety and improvement program workspace", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

for router in (events.router, investigations.router, actions.router, projects.router, measurement.router):
    app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "synthetic_only": True}