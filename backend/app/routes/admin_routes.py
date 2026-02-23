from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.utils.role_guard import role_required
from sqlalchemy import func
from datetime import datetime, timedelta

from app import db
from app.models.user_model import User, UserRole
from app.models.donation_model import Donation
from app.models.request_model import Request
from app.models.pickup_model import Pickup
from app.utils.response_helper import success_response

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# =====================
# Admin Overview
# =====================
@admin_bp.route("/overview", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def admin_overview():
    total_donors = User.query.filter_by(role=UserRole.DONOR).count()
    total_ngos = User.query.filter_by(role=UserRole.NGO).count()
    total_donations = Donation.query.count()
    total_pickups = Pickup.query.count()

    pending_donations = Donation.query.filter_by(status="PENDING").count()
    unverified_ngos = User.query.filter_by(role=UserRole.NGO, verified=False).count()

    # KPIs
    kpis = [
        {"label": "Total Donors", "val": str(total_donors), "change": "Active"},
        {"label": "Total NGOs", "val": str(total_ngos), "change": f"{unverified_ngos} Pending"},
        {"label": "Total Donations", "val": str(total_donations), "change": "+"},
        {"label": "Completed Pickups", "val": str(total_pickups), "change": "+"},
    ]

    # Alerts (simple logic, you can improve later)
    alerts = []

    if pending_donations > 10:
        alerts.append({
            "type": "WARNING",
            "msg": f"{pending_donations} donations are still pending allocation",
            "time": "Now"
        })

    if unverified_ngos > 0:
        alerts.append({
            "type": "INFO",
            "msg": f"{unverified_ngos} NGOs are waiting for verification",
            "time": "Now"
        })

    # Trend: last 7 days pickups
    trend = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.session.query(func.count(Pickup.id)) \
            .join(Request, Pickup.request_id == Request.id) \
            .join(Donation, Request.donation_id == Donation.id) \
            .filter(func.date(Donation.created_at) == day) \
            .scalar()

        trend.append({
            "name": day.strftime("%d %b"),
            "val": count or 0
        })

    return success_response("Admin overview", {
        "kpis": kpis,
        "alerts": alerts,
        "trend": trend
    })


# =====================
# List NGOs
# =====================
@admin_bp.route("/ngos", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_ngos():
    search = request.args.get("search", "")
    status = request.args.get("status")

    query = User.query.filter_by(role=UserRole.NGO)

    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") |
            User.location.ilike(f"%{search}%")
        )

    if status:
        if status == "VERIFIED":
            query = query.filter(User.verified == True)
        elif status == "PENDING":
            query = query.filter(User.verified == False)

    ngos = query.all()

    result = []
    for ngo in ngos:
        result.append({
            "id": ngo.id,
            "name": ngo.name,
            "area": ngo.location or "-",
            "capacity": "-",  # You can add real capacity later if you want
            "rate": f"{int((ngo.performance_score or 0))}%",
            "status": "VERIFIED" if ngo.verified else "PENDING",
            "response": "-"  # Placeholder for now
        })

    return success_response("NGO list", result)


# =====================
# NGO Detail
# =====================
@admin_bp.route("/ngos/<int:ngo_id>", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def ngo_detail(ngo_id):
    ngo = User.query.filter_by(id=ngo_id, role=UserRole.NGO).first_or_404()

    return success_response("NGO details", {
        "id": ngo.id,
        "name": ngo.name,
        "area": ngo.location or "-",
        "capacity": "-",
        "rate": f"{int((ngo.performance_score or 0))}%",
        "status": "VERIFIED" if ngo.verified else "PENDING",
        "response": "-"
    })


# =====================
# Verify NGO
# =====================
@admin_bp.route("/ngos/<int:ngo_id>/verify", methods=["POST"])
@jwt_required()
@role_required("ADMIN")
def verify_ngo(ngo_id):
    ngo = User.query.filter_by(id=ngo_id, role=UserRole.NGO).first_or_404()
    ngo.verified = True
    db.session.commit()
    return success_response("NGO verified", ngo.to_dict())


# =====================
# Suspend NGO
# =====================
@admin_bp.route("/ngos/<int:ngo_id>/suspend", methods=["POST"])
@jwt_required()
@role_required("ADMIN")
def suspend_ngo(ngo_id):
    ngo = User.query.filter_by(id=ngo_id, role=UserRole.NGO).first_or_404()
    ngo.verified = False
    db.session.commit()
    return success_response("NGO suspended", ngo.to_dict())


# =====================
# Admin Reports
# =====================
@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def admin_reports():
    range_param = request.args.get("range", "30D")

    query = Donation.query

    if range_param == "30D":
        since = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Donation.created_at >= since)
    elif range_param == "90D":
        since = datetime.utcnow() - timedelta(days=90)
        query = query.filter(Donation.created_at >= since)
    # ALL = no filter

    donations = query.all()

    # Aggregate by day
    buckets = {}
    for d in donations:
        day = d.created_at.strftime("%d %b")
        if day not in buckets:
            buckets[day] = {"saved": 0, "wasted": 0, "predicted": 0}

        if d.status == "PICKED_UP":
            buckets[day]["saved"] += 1
        else:
            buckets[day]["wasted"] += 1

        buckets[day]["predicted"] += 1  # simple baseline

    data = []
    for day, vals in buckets.items():
        data.append({
            "name": day,
            "saved": vals["saved"],
            "wasted": vals["wasted"],
            "predicted": vals["predicted"]
        })

    # Sort by date label (rough sort)
    data.sort(key=lambda x: x["name"])

    return success_response("Admin reports", data)