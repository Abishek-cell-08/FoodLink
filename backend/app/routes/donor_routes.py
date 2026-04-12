from collections import OrderedDict
from datetime import date, datetime, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.role_guard import role_required
from sqlalchemy import func
import qrcode
import io
import base64
from app.models.request_model import Request

from app import db
from app.models.donation_model import Donation
from app.models.pickup_model import Pickup
from app.models.user_model import User
from app.services.tracking_socket_service import emit_tracking_session_update
from app.utils.response_helper import success_response

donor_bp = Blueprint("donor", __name__, url_prefix="/api/donor")


def _start_of_week(value: date) -> date:
    return value - timedelta(days=value.weekday())


def _start_of_month(value: date) -> date:
    return value.replace(day=1)


def _next_bucket(value: date, granularity: str) -> date:
    if granularity == "day":
        return value + timedelta(days=1)
    if granularity == "week":
        return value + timedelta(days=7)
    if value.month == 12:
        return value.replace(year=value.year + 1, month=1, day=1)
    return value.replace(month=value.month + 1, day=1)


def _format_bucket_label(value: date, granularity: str) -> str:
    if granularity == "day":
        return value.strftime("%d %b")
    if granularity == "week":
        return value.strftime("%d %b")
    return value.strftime("%b %Y")

# =====================
# Create Donation
# =====================
@donor_bp.route("/donations", methods=["POST"])
@jwt_required()
@role_required("DONOR")
def create_donation():
    donor_id = int(get_jwt_identity())  # JWT identity is string → convert to int
    data = request.json

    donation = Donation(
    donor_id=donor_id,
    food_type=data["foodType"],
    quantity=data["quantity"],
    expiry_hours=data["expiryHours"],
    pickup_address=data["pickupAddress"],
    pickup_lat=data.get("pickupLat"),
    pickup_lng=data.get("pickupLng"),
    notes=data.get("notes")
)

    db.session.add(donation)
    db.session.commit()

    return success_response("Donation created successfully", donation.to_dict())

# =====================
# Donor Overview
# =====================
@donor_bp.route("/overview", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def donor_overview():
    donor_id = int(get_jwt_identity())
    range_param = request.args.get("range", "30D")

    total_donations = db.session.query(func.count(Donation.id)) \
        .filter(Donation.donor_id == donor_id).scalar()

    status_counts = db.session.query(
        Donation.status, func.count(Donation.id)
    ).filter(
        Donation.donor_id == donor_id
    ).group_by(Donation.status).all()

    recent = Donation.query \
        .filter_by(donor_id=donor_id) \
        .order_by(Donation.created_at.desc()) \
        .limit(5).all()

    today = datetime.utcnow().date()
    timeline_query = Donation.query.filter(Donation.donor_id == donor_id)

    if range_param == "7D":
        since = datetime.utcnow() - timedelta(days=6)
        timeline_query = timeline_query.filter(Donation.created_at >= since)
        granularity = "day"
        bucket_start = since.date()
        bucket_end = today
    elif range_param == "30D":
        since = datetime.utcnow() - timedelta(days=29)
        timeline_query = timeline_query.filter(Donation.created_at >= since)
        granularity = "day"
        bucket_start = since.date()
        bucket_end = today
    else:
        first_donation = db.session.query(func.min(Donation.created_at)) \
            .filter(Donation.donor_id == donor_id).scalar()
        granularity = "month"
        bucket_start = _start_of_month(first_donation.date()) if first_donation else _start_of_month(today)
        bucket_end = _start_of_month(today)

    timeline_rows = timeline_query.order_by(Donation.created_at.asc()).all()

    timeline = OrderedDict()
    cursor = bucket_start
    while cursor <= bucket_end:
        timeline[cursor] = {"completed": 0, "active": 0, "missed": 0}
        cursor = _next_bucket(cursor, granularity)

    for donation in timeline_rows:
        donation_day = donation.created_at.date()
        if granularity == "day":
            bucket = donation_day
        elif granularity == "week":
            bucket = _start_of_week(donation_day)
        else:
            bucket = _start_of_month(donation_day)

        if bucket not in timeline:
            timeline[bucket] = {"completed": 0, "active": 0, "missed": 0}

        if donation.status == "PICKED_UP":
            timeline[bucket]["completed"] += 1
        elif donation.status == "REJECTED":
            timeline[bucket]["missed"] += 1
        else:
            timeline[bucket]["active"] += 1

    timeline_points = []
    total_completed = 0
    total_active = 0
    total_missed = 0
    peak_day = "-"
    peak_total = 0

    for day, values in timeline.items():
        total = values["completed"] + values["active"] + values["missed"]
        completion_rate = round((values["completed"] / total) * 100) if total else 0
        label = _format_bucket_label(day, granularity)

        total_completed += values["completed"]
        total_active += values["active"]
        total_missed += values["missed"]

        if total > peak_total:
            peak_total = total
            peak_day = label

        timeline_points.append({
            "label": label,
            "completed": values["completed"],
            "active": values["active"],
            "missed": values["missed"],
            "total": total,
            "completionRate": completion_rate,
        })

    return success_response("Donor overview loaded", {
        "totalDonations": total_donations,
        "statusDistribution": {
            status: count for status, count in status_counts
        },
        "recentActivity": [d.to_dict() for d in recent],
        "timeline": {
            "points": timeline_points,
            "summary": {
                "completed": total_completed,
                "active": total_active,
                "missed": total_missed,
                "peakLabel": peak_day,
                "peakTotal": peak_total,
                "granularity": granularity,
                "range": range_param,
            }
        }
    })

# =====================
# Donor Dashboard
# =====================
@donor_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def donor_dashboard():
    donor_id = int(get_jwt_identity())

    recent = Donation.query \
        .filter_by(donor_id=donor_id) \
        .order_by(Donation.created_at.desc()) \
        .limit(5).all()

    pending_count = Donation.query.filter_by(
        donor_id=donor_id, status="PENDING"
    ).count()

    return success_response("Dashboard data", {
        "activeAllocations": pending_count,
        "recentDonations": [d.to_dict() for d in recent]
    })

# =====================
# List Donations (with search & filter)
# =====================
@donor_bp.route("/donations", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def list_donations():
    donor_id = int(get_jwt_identity())

    search = request.args.get("search", "")
    status = request.args.get("status", "ALL")
    page = int(request.args.get("page", 1))
    per_page = 10

    query = Donation.query.filter(Donation.donor_id == donor_id)

    if search:
        query = query.filter(Donation.food_type.ilike(f"%{search}%"))

    if status != "ALL":
        query = query.filter(Donation.status == status)

    pagination = query.order_by(Donation.created_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return success_response("Donations fetched", {
        "items": [d.to_dict() for d in pagination.items],
        "total": pagination.total,
        "page": page
    })

# =====================
# Get Donation Details
# =====================
@donor_bp.route("/donations/<int:donation_id>", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def get_donation_details(donation_id):
    donor_id = int(get_jwt_identity())

    donation = Donation.query.filter_by(id=donation_id, donor_id=donor_id).first_or_404()
    req = Request.query.filter_by(donation_id=donation.id).first()
    pickup = Pickup.query.filter_by(request_id=req.id).first() if req else None
    ngo = User.query.get(req.ngo_id) if req else None

    return success_response("Donation details", {
        **donation.to_dict(),
        "requestId": req.id if req else None,
        "ngoName": ngo.name if ngo else None,
        "trackingEnabled": pickup is not None and pickup.verified_at is None,
        "trackingStatus": pickup.status if pickup else None,
    })

# =====================
# Get QR Code for Donation
# =====================
@donor_bp.route("/donations/<int:donation_id>/qr", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def get_donation_qr(donation_id):
    donor_id = int(get_jwt_identity())

    donation = Donation.query.filter_by(id=donation_id, donor_id=donor_id).first_or_404()

    # Find request (only exists if NGO has claimed it)
    req = Request.query.filter_by(donation_id=donation.id).first()
    if not req:
        return {"message": "Donation not yet allocated to any NGO"}, 400

    # QR payload = request_id
    qr_data = f"REQUEST:{req.id}"

    img = qrcode.make(qr_data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    base64_img = base64.b64encode(buf.read()).decode("utf-8")

    return success_response("QR generated", {
        "requestId": req.id,
        "qrBase64": base64_img
    })


@donor_bp.route("/donations/<int:donation_id>/tracking", methods=["GET"])
@jwt_required()
@role_required("DONOR")
def get_donation_tracking(donation_id):
    donor_id = int(get_jwt_identity())
    donation = Donation.query.filter_by(id=donation_id, donor_id=donor_id).first_or_404()
    req = Request.query.filter_by(donation_id=donation.id).first_or_404()
    pickup = Pickup.query.filter_by(request_id=req.id).first_or_404()
    ngo = User.query.get(req.ngo_id)

    return success_response("Donor tracking session", _serialize_tracking_session(donation, req, pickup, ngo))


@donor_bp.route("/donations/<int:donation_id>/tracking/location", methods=["POST"])
@jwt_required()
@role_required("DONOR")
def update_donor_tracking_location(donation_id):
    donor_id = int(get_jwt_identity())
    donation = Donation.query.filter_by(id=donation_id, donor_id=donor_id).first_or_404()
    req = Request.query.filter_by(donation_id=donation.id).first_or_404()
    pickup = Pickup.query.filter_by(request_id=req.id).first_or_404()
    ngo = User.query.get(req.ngo_id)

    payload = request.get_json(silent=True) or {}
    lat = payload.get("lat")
    lng = payload.get("lng")

    if lat is None or lng is None:
        return {"message": "lat and lng are required"}, 400

    pickup.donor_live_lat = float(lat)
    pickup.donor_live_lng = float(lng)
    pickup.donor_location_updated_at = datetime.utcnow()
    if pickup.status == "SCHEDULED":
        pickup.status = "TRACKING_ACTIVE"

    db.session.commit()
    session_payload = _serialize_tracking_session(donation, req, pickup, ngo)
    emit_tracking_session_update(session_payload)
    return success_response("Donor live location updated", session_payload)


def _serialize_tracking_session(donation, request_row, pickup, ngo):
    return {
        "requestId": request_row.id,
        "donationId": donation.id,
        "foodType": donation.food_type,
        "quantity": donation.quantity,
        "pickupAddress": donation.pickup_address,
        "trackingStatus": pickup.status,
        "verifiedAt": pickup.verified_at.isoformat() if pickup.verified_at else None,
        "ngoName": ngo.name if ngo else None,
        "ngoLocation": {
            "lat": pickup.ngo_live_lat,
            "lng": pickup.ngo_live_lng,
            "updatedAt": pickup.ngo_location_updated_at.isoformat() if pickup.ngo_location_updated_at else None,
        },
        "donorLocation": {
            "lat": pickup.donor_live_lat if pickup.donor_live_lat is not None else donation.pickup_lat,
            "lng": pickup.donor_live_lng if pickup.donor_live_lng is not None else donation.pickup_lng,
            "updatedAt": pickup.donor_location_updated_at.isoformat() if pickup.donor_location_updated_at else None,
        },
        "destination": {
            "lat": donation.pickup_lat,
            "lng": donation.pickup_lng,
        },
    }
