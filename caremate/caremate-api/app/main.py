from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, family_histories, health, health_context, supplement_design, users
from app.core.config import settings

app = FastAPI(title="CareMate API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(health_context.router)
app.include_router(family_histories.router)
app.include_router(supplement_design.router)
