from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

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

    # Load config
    app.config.from_object("app.config.Config")

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # =====================
    # Import models (IMPORTANT)
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
    from app.routes.donor_routes import donor_bp
    from app.routes.ngo_routes import ngo_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.auth_routes import auth_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(donor_bp)
    app.register_blueprint(ngo_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)

    return app
