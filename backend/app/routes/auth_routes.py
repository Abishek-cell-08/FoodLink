from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app import db
from app.models.user_model import User, UserRole
from app.utils.response_helper import success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# =====================
# Health Check
# =====================
@auth_bp.route("/health", methods=["GET"])
def auth_health():
    return success_response("Auth service running")

# =====================
# Register
# =====================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Basic validation
    required_fields = ["name", "email", "password", "role"]
    for field in required_fields:
        if field not in data:
            return {"message": f"Missing field: {field}"}, 400

    # Check if user already exists
    if User.query.filter_by(email=data["email"]).first():
        return {"message": "Email already registered"}, 400

    # Create user
    user = User(
        name=data["name"],
        email=data["email"],
        role=UserRole(data["role"]),
        location=data.get("location")
    )
    user.set_password(data["password"])

    # NGO-specific defaults
    if user.role == UserRole.NGO:
        user.verified = False
        user.performance_score = 50

    db.session.add(user)
    db.session.commit()

    return success_response("User registered successfully", user.to_dict())

# =====================
# Login
# =====================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if "email" not in data or "password" not in data:
        return {"message": "Email and password required"}, 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return {"message": "Invalid credentials"}, 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role.value}
    )

    return success_response("Login successful", {
        "token": access_token,
        "user": user.to_dict()
    })

# =====================
# Get Current User
# =====================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found"}, 404

    return success_response("User profile", user.to_dict())
