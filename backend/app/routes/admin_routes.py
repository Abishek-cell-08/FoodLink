from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app import db
from app.models.ngo_model import NGO
from app.utils.response_helper import success_response

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin/ngos")

@admin_bp.route("", methods=["GET"])
@jwt_required()
def list_ngos():
    search = request.args.get("search", "")
    status = request.args.get("status")

    query = NGO.query

    if search:
        query = query.filter(
            NGO.name.ilike(f"%{search}%") |
            NGO.area.ilike(f"%{search}%")
        )

    if status:
        query = query.filter_by(is_verified=(status == "VERIFIED"))

    ngos = query.all()

    return success_response("NGO list", [
        {
            "id": ngo.id,
            "name": ngo.name,
            "area": ngo.area,
            "rate": f"{int(ngo.fulfillment_rate * 100)}%",
            "status": "VERIFIED" if ngo.is_verified else "PENDING"
        } for ngo in ngos
    ])

@admin_bp.route("/<int:ngo_id>", methods=["GET"])
@jwt_required()
def ngo_detail(ngo_id):
    ngo = NGO.query.get_or_404(ngo_id)

    return success_response("NGO details", {
        "id": ngo.id,
        "name": ngo.name,
        "area": ngo.area,
        "capacity": f"{ngo.capacity}kg/day",
        "rate": f"{int(ngo.fulfillment_rate * 100)}%",
        "status": "VERIFIED" if ngo.is_verified else "PENDING",
        "response": "28m"
    })

@admin_bp.route("/<int:ngo_id>/verify", methods=["POST"])
@jwt_required()
def verify_ngo(ngo_id):
    ngo = NGO.query.get_or_404(ngo_id)
    ngo.is_verified = True
    db.session.commit()
    return success_response("NGO verified")


@admin_bp.route("/<int:ngo_id>/suspend", methods=["POST"])
@jwt_required()
def suspend_ngo(ngo_id):
    ngo = NGO.query.get_or_404(ngo_id)
    ngo.is_verified = False
    db.session.commit()
    return success_response("NGO suspended")
