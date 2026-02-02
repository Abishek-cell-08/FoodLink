from flask import Blueprint, request
from app.models.user_model import User
from app import db
from app.utils.response_helper import success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/health", methods=["GET"])
def auth_health():
    return success_response("Auth service running")
