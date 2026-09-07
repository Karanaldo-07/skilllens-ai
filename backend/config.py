import os

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://skilllens-ai-henna.vercel.app,https://skilllens-ai-karans-projects-c69fa512.vercel.app,http://localhost:5173",
)
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skilllens.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
