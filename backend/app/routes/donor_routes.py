from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app import db
from app.models.donation_model import Donation
from app.utils.response_helper import success_response

donor_bp = Blueprint("donor", __name__, url_prefix="/api/donor")

@donor_bp.route("/donations", methods=["POST"])
@jwt_required()
def create_donation():
    donor_id = get_jwt_identity()
    data = request.json

    donation = Donation(
        donor_id=donor_id,
        food_type=data["foodType"],
        quantity=data["quantity"],
        expiry_hours=data["expiryHours"],
        pickup_address=data["pickupAddress"],
        notes=data.get("notes")
    )

    db.session.add(donation)
    db.session.commit()

    return success_response("Donation created successfully", donation.to_dict())

@donor_bp.route("/overview", methods=["GET"])
@jwt_required()
def donor_overview():
    donor_id = get_jwt_identity()

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

@donor_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def donor_dashboard():
    donor_id = get_jwt_identity()

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

@donor_bp.route("/donations", methods=["GET"])
@jwt_required()
def list_donations():
    donor_id = get_jwt_identity()

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
