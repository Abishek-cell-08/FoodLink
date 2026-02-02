import os

class Config:
    # =====================
    # Flask
    # =====================
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # =====================
    # Database (PostgreSQL)
    # =====================
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
         "postgresql://postgres:Ani%402008@localhost:5432/wastefoodlink"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =====================
    # JWT
    # =====================
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")

    # =====================
    # Environment
    # =====================
    DEBUG = True
