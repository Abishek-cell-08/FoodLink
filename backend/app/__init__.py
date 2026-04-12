import os

from flask import Flask, app
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy



# =====================
# Extensions
# =====================
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

# =====================
# App Factory
# =====================
def create_app():
    app = Flask(__name__)

    # =====================
    # Load config
    # =====================
    app.config.from_object("app.config.Config")

    # Safety check (optional but good practice)
    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("JWT_SECRET_KEY is not set in config.py")

    # =====================
    # Init extensions
    # =====================
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(
        app,
        origins=[
            "http://localhost",
            "https://localhost",
            "capacitor://localhost",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
        ],
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins="*")

    # =====================
    # Import models (IMPORTANT for migrations)
    # =====================
    from app.models.user_model import User
    from app.models.ngo_model import NGO
    from app.models.donation_model import Donation
    from app.models.request_model import Request
    from app.models.pickup_model import Pickup
    from app.models.prediction_model import Prediction

    # =====================
    # Register blueprints
    # =====================
    from app.routes.auth_routes import auth_bp
    from app.routes.donor_routes import donor_bp
    from app.routes.ngo_routes import ngo_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.chat_routes import chat_bp
    from app.services.tracking_socket_service import register_tracking_socket_handlers


    app.register_blueprint(auth_bp)
    app.register_blueprint(donor_bp)
    app.register_blueprint(ngo_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(chat_bp)
    register_tracking_socket_handlers(socketio)

    # =====================
    # Health check route (optional but useful)
    # =====================
    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "WasteFoodLink backend running"}, 200
    
    @app.route("/__whoami")
    def whoami():
     return {"app": "MAIN_BACKEND", "pid": os.getpid()}

    @app.route("/")
    def home():
        return "Backend is working!"

    return app
