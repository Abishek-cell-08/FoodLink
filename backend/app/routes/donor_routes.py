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
from app.utils.response_helper import success_response

donor_bp = Blueprint("donor", __name__, url_prefix="/api/donor")

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
        .limit(3).all()

    return success_response("Donor overview loaded", {
        "totalDonations": total_donations,
        "statusDistribution": {
            status: count for status, count in status_counts
        },
        "recentActivity": [d.to_dict() for d in recent]
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

    return success_response("Donation details", donation.to_dict())

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
