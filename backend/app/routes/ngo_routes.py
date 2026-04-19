from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.donation_model import Donation
from app.models.pickup_model import Pickup
from app.models.request_model import Request
from app.models.user_model import User
from app.services.allocation_service import rank_donations_for_ngo, score_donation_for_ngo
from app.services.qr_service import verify_qr
from app.services.tracking_socket_service import emit_tracking_session_update
from app.utils.response_helper import success_response
from app.utils.role_guard import role_required

ngo_bp = Blueprint("ngo", __name__, url_prefix="/api/ngo")


@ngo_bp.route("/overview", methods=["GET"])
@jwt_required()
@role_required("NGO")
def ngo_overview():
    ngo_id = int(get_jwt_identity())
    ngo = User.query.get_or_404(ngo_id)

    ranked = [_serialize_ranked_donation(item) for item in rank_donations_for_ngo(ngo)[:3]]
    return success_response("NGO overview", ranked)


@ngo_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("NGO")
def ngo_dashboard():
    ngo_id = int(get_jwt_identity())
    ngo = User.query.get_or_404(ngo_id)

    ranked = [_serialize_ranked_donation(item) for item in rank_donations_for_ngo(ngo)]
    return success_response("NGO dashboard", ranked)


@ngo_bp.route("/browse", methods=["GET"])
@jwt_required()
@role_required("NGO")
def browse_food():
    ngo_id = int(get_jwt_identity())
    ngo = User.query.get_or_404(ngo_id)

    search = request.args.get("search", "")
    sort = request.args.get("sort", "RANK")
    page = int(request.args.get("page", 1))
    per_page = 10
    donations = Donation.query.filter(
        Donation.status == "PENDING",
        Donation.food_type.ilike(f"%{search}%"),
    ).all()

    ranked = rank_donations_for_ngo(ngo, donations=donations)

    if sort == "DISTANCE":
        ranked.sort(key=lambda item: item["distanceKm"] if item["distanceKm"] is not None else 999999)
    elif sort == "EXPIRY":
        ranked.sort(key=lambda item: item["donation"].expiry_datetime())
    else:
        ranked.sort(key=lambda item: item["priorityScore"], reverse=True)

    total = len(ranked)
    start = max(0, (page - 1) * per_page)
    end = start + per_page
    paged_items = ranked[start:end]

    results = [_serialize_ranked_donation(item) for item in paged_items]
    return success_response("Food marketplace", {
        "items": results,
        "total": total,
        "page": page,
        "perPage": per_page,
    })


@ngo_bp.route("/claim/<int:donation_id>", methods=["POST"])
@jwt_required()
@role_required("NGO")
def claim_donation(donation_id):
    ngo_id = int(get_jwt_identity())
    ngo = User.query.get_or_404(ngo_id)
    donation = Donation.query.get_or_404(donation_id)

    if donation.status != "PENDING":
        return {"message": "Donation already claimed"}, 400

    scored = score_donation_for_ngo(donation, ngo)
    donation.status = "ALLOCATED"

    request_entry = Request(
        donation_id=donation.id,
        ngo_id=ngo_id,
        priority_score=scored["priorityScore"],
    )

    db.session.add(request_entry)
    db.session.flush()

    pickup = Pickup(
        request_id=request_entry.id,
        status="TRACKING_ACTIVE",
        ngo_live_lat=ngo.lat,
        ngo_live_lng=ngo.lng,
        ngo_location_updated_at=datetime.utcnow() if ngo.lat is not None and ngo.lng is not None else None,
        donor_live_lat=donation.pickup_lat,
        donor_live_lng=donation.pickup_lng,
        donor_location_updated_at=datetime.utcnow() if donation.pickup_lat is not None and donation.pickup_lng is not None else None,
    )
    db.session.add(pickup)

    db.session.commit()
    return success_response("Donation claimed successfully")


@ngo_bp.route("/requests", methods=["GET"])
@jwt_required()
@role_required("NGO")
def active_requests():
    ngo_id = int(get_jwt_identity())
    page = int(request.args.get("page", 1))
    per_page = 10

    pagination = Request.query.filter_by(ngo_id=ngo_id) \
        .order_by(Request.id.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)
    response = []

    for request_row in pagination.items:
        donation = Donation.query.get(request_row.donation_id)
        pickup = Pickup.query.filter_by(request_id=request_row.id).first()
        if donation:
            response.append(
                {
                    "requestId": request_row.id,
                    **donation.to_dict(),
                    "status": donation.status,
                    "priorityScore": request_row.priority_score,
                    "trackingEnabled": pickup is not None and pickup.verified_at is None,
                    "trackingStatus": pickup.status if pickup else None,
                }
            )

    return success_response("Active requests", {
        "items": response,
        "total": pagination.total,
        "page": page,
        "perPage": per_page,
    })


@ngo_bp.route("/verify/<int:request_id>", methods=["POST"])
@jwt_required()
@role_required("NGO")
def qr_verify(request_id):
    if verify_qr(request_id):
        return success_response("Pickup verified")

    return {"message": "Verification failed"}, 400


@ngo_bp.route("/tracking/<int:request_id>", methods=["GET"])
@jwt_required()
@role_required("NGO")
def get_tracking_session(request_id):
    ngo_id = int(get_jwt_identity())
    request_row = Request.query.filter_by(id=request_id, ngo_id=ngo_id).first_or_404()
    donation = Donation.query.get_or_404(request_row.donation_id)
    pickup = Pickup.query.filter_by(request_id=request_row.id).first_or_404()
    ngo = User.query.get(ngo_id)

    return success_response("Tracking session", _serialize_tracking_session(request_row, donation, pickup, ngo))


@ngo_bp.route("/tracking/<int:request_id>/location", methods=["POST"])
@jwt_required()
@role_required("NGO")
def update_ngo_tracking_location(request_id):
    ngo_id = int(get_jwt_identity())
    request_row = Request.query.filter_by(id=request_id, ngo_id=ngo_id).first_or_404()
    pickup = Pickup.query.filter_by(request_id=request_id).first_or_404()

    payload = request.get_json(silent=True) or {}
    lat = payload.get("lat")
    lng = payload.get("lng")

    if lat is None or lng is None:
        return {"message": "lat and lng are required"}, 400

    pickup.ngo_live_lat = float(lat)
    pickup.ngo_live_lng = float(lng)
    pickup.ngo_location_updated_at = datetime.utcnow()
    if pickup.status == "SCHEDULED":
        pickup.status = "TRACKING_ACTIVE"

    db.session.commit()
    donation = Donation.query.get_or_404(request_row.donation_id)
    ngo = User.query.get(ngo_id)
    session_payload = _serialize_tracking_session(request_row, donation, pickup, ngo)
    emit_tracking_session_update(session_payload)
    return success_response("NGO live location updated", session_payload)


def _serialize_ranked_donation(item):
    donation = item["donation"]
    return {
        **donation.to_dict(),
        "distanceKm": item["distanceKm"],
        "priorityScore": item["priorityScore"],
        "priorityTier": item["priorityTier"],
        "scoreBreakdown": item["scoreBreakdown"],
        "decisionSignals": item["decisionSignals"],
        "explainability": item["explainability"],
    }


def _serialize_tracking_session(request_row, donation, pickup, ngo):
    return {
        "requestId": request_row.id,
        "donationId": donation.id,
        "foodType": donation.food_type,
        "quantity": donation.quantity,
        "trackingStatus": pickup.status,
        "verifiedAt": pickup.verified_at.isoformat() if pickup.verified_at else None,
        "pickupAddress": donation.pickup_address,
        "ngoName": ngo.name if ngo else None,
        "donorLocation": {
            "lat": pickup.donor_live_lat if pickup.donor_live_lat is not None else donation.pickup_lat,
            "lng": pickup.donor_live_lng if pickup.donor_live_lng is not None else donation.pickup_lng,
            "updatedAt": pickup.donor_location_updated_at.isoformat() if pickup.donor_location_updated_at else None,
        },
        "ngoLocation": {
            "lat": pickup.ngo_live_lat,
            "lng": pickup.ngo_live_lng,
            "updatedAt": pickup.ngo_location_updated_at.isoformat() if pickup.ngo_location_updated_at else None,
        },
        "destination": {
            "lat": donation.pickup_lat,
            "lng": donation.pickup_lng,
        },
    }
