from flask import Flask, app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os



# =====================
# Extensions
# =====================
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

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
    CORS(app, supports_credentials=True)

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

    app.register_blueprint(auth_bp)
    app.register_blueprint(donor_bp)
    app.register_blueprint(ngo_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)

    # =====================
    # Health check route (optional but useful)
    # =====================
    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "WasteFoodLink backend running"}, 200
    
    @app.route("/__whoami")
    def whoami():
     return {"app": "MAIN_BACKEND", "pid": os.getpid()}


    return app
