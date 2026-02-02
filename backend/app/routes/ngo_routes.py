from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.donation_model import Donation
from app.models.ngo_model import NGO
from app.models.request_model import Request
from app.models.pickup_model import Pickup

from app.services.allocation_service import calculate_priority
from app.services.qr_service import verify_qr
from app.utils.response_helper import success_response

ngo_bp = Blueprint("ngo", __name__, url_prefix="/api/ngo")

@ngo_bp.route("/overview", methods=["GET"])
@jwt_required()
def ngo_overview():
    ngo = NGO.query.get(get_jwt_identity())

    donations = Donation.query.filter_by(status="PENDING").all()
    ranked = []

    for d in donations:
        distance_km = 5  # placeholder (location_service later)
        score = calculate_priority(d, ngo, distance_km)
        ranked.append({**d.to_dict(), "priorityScore": score})

    ranked.sort(key=lambda x: x["priorityScore"], reverse=True)

    return success_response("NGO overview", ranked[:3])

@ngo_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def ngo_dashboard():
    ngo = NGO.query.get(get_jwt_identity())
    donations = Donation.query.filter_by(status="PENDING").all()

    ranked = []
    for d in donations:
        distance_km = 5
        ranked.append({**d.to_dict(),
            "priorityScore": calculate_priority(d, ngo, distance_km)
        })

    ranked.sort(key=lambda x: x["priorityScore"], reverse=True)
    return success_response("NGO dashboard", ranked)

@ngo_bp.route("/browse", methods=["GET"])
@jwt_required()
def browse_food():
    ngo = NGO.query.get(get_jwt_identity())
    search = request.args.get("search", "")

    donations = Donation.query.filter(
        Donation.status == "PENDING",
        Donation.food_type.ilike(f"%{search}%")
    ).all()

    results = []
    for d in donations:
        results.append({**d.to_dict(),
            "priorityScore": calculate_priority(d, ngo, 5)
        })

    return success_response("Food marketplace", results)

@ngo_bp.route("/claim/<int:donation_id>", methods=["POST"])
@jwt_required()
def claim_donation(donation_id):
    ngo_id = get_jwt_identity()
    donation = Donation.query.get_or_404(donation_id)

    if donation.status != "PENDING":
        return {"message": "Donation already claimed"}, 400

    donation.status = "ALLOCATED"

    request_entry = Request(
        donation_id=donation.id,
        ngo_id=ngo_id,
        priority_score=0
    )

    pickup = Pickup(request_id=request_entry.id)

    db.session.add(request_entry)
    db.session.add(pickup)
    db.session.commit()

    return success_response("Donation claimed")

@ngo_bp.route("/requests", methods=["GET"])
@jwt_required()
def active_requests():
    ngo_id = get_jwt_identity()

    requests = Request.query.filter_by(ngo_id=ngo_id).all()
    response = []

    for r in requests:
        donation = Donation.query.get(r.donation_id)
        response.append({
            "requestId": r.id,
            **donation.to_dict(),
            "status": donation.status
        })

    return success_response("Active requests", response)

@ngo_bp.route("/verify/<int:request_id>", methods=["POST"])
@jwt_required()
def qr_verify(request_id):
    if verify_qr(request_id):
        return success_response("Pickup verified")
    return {"message": "Verification failed"}, 400
