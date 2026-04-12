import os

class Config:
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

    # =====================
    # Gemini
    # =====================
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-pro")

    PRIORITY_MODEL_PATH = os.getenv(
        "PRIORITY_MODEL_PATH",
        os.path.join(BASE_DIR, "ml_artifacts", "priority_model.json"),
    )
    SYNTHETIC_PRIORITY_DATA_PATH = os.getenv(
        "SYNTHETIC_PRIORITY_DATA_PATH",
        os.path.join(BASE_DIR, "ml_artifacts", "synthetic_priority_training_data.csv"),
    )
