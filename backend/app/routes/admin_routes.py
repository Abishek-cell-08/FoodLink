from collections import OrderedDict
from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required
from app.utils.role_guard import role_required
from sqlalchemy import func
from datetime import date, datetime, timedelta

from app import db
from app.models.user_model import User, UserRole
from app.models.donation_model import Donation
from app.models.request_model import Request
from app.models.pickup_model import Pickup
from app.services.allocation_service import rank_donations_for_ngo
from app.services.ml_service import load_priority_model
from app.utils.response_helper import success_response

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


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
# List Donors
# =====================
@admin_bp.route("/donors", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_donors():
    search = request.args.get("search", "")

    donation_counts = dict(
        db.session.query(Donation.donor_id, func.count(Donation.id))
        .group_by(Donation.donor_id)
        .all()
    )

    query = User.query.filter_by(role=UserRole.DONOR)

    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.location.ilike(f"%{search}%")
        )

    donors = query.order_by(User.name.asc()).all()

    result = []
    for donor in donors:
        result.append({
            "id": donor.id,
            "name": donor.name,
            "email": donor.email,
            "location": donor.location or "-",
            "totalDonations": donation_counts.get(donor.id, 0),
        })

    return success_response("Donor list", result)


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
    today = datetime.utcnow().date()

    query = Donation.query

    if range_param == "30D":
        since = datetime.utcnow() - timedelta(days=29)
        query = query.filter(Donation.created_at >= since)
        granularity = "day"
        bucket_start = since.date()
        bucket_end = today
    elif range_param == "90D":
        since = datetime.utcnow() - timedelta(days=89)
        query = query.filter(Donation.created_at >= since)
        granularity = "week"
        bucket_start = _start_of_week(since.date())
        bucket_end = _start_of_week(today)
    else:
        first_donation = db.session.query(func.min(Donation.created_at)).scalar()
        granularity = "month"
        bucket_start = _start_of_month(first_donation.date()) if first_donation else _start_of_month(today)
        bucket_end = _start_of_month(today)

    donations = query.all()

    buckets = OrderedDict()
    cursor = bucket_start
    while cursor <= bucket_end:
        buckets[cursor] = {"saved": 0, "pending": 0, "wasted": 0}
        cursor = _next_bucket(cursor, granularity)

    for donation in donations:
        donation_day = donation.created_at.date()
        if granularity == "day":
            bucket_key = donation_day
        elif granularity == "week":
            bucket_key = _start_of_week(donation_day)
        else:
            bucket_key = _start_of_month(donation_day)

        if bucket_key not in buckets:
            buckets[bucket_key] = {"saved": 0, "pending": 0, "wasted": 0}

        if donation.status == "PICKED_UP":
            buckets[bucket_key]["saved"] += 1
        elif donation.status == "REJECTED":
            buckets[bucket_key]["wasted"] += 1
        else:
            buckets[bucket_key]["pending"] += 1

    points = []
    total_saved = 0
    total_pending = 0
    total_wasted = 0
    peak_bucket_label = "-"
    peak_bucket_total = 0

    for bucket_date, vals in buckets.items():
        total = vals["saved"] + vals["pending"] + vals["wasted"]
        completion_rate = round((vals["saved"] / total) * 100) if total else 0
        label = _format_bucket_label(bucket_date, granularity)

        total_saved += vals["saved"]
        total_pending += vals["pending"]
        total_wasted += vals["wasted"]

        if total > peak_bucket_total:
            peak_bucket_total = total
            peak_bucket_label = label

        points.append({
            "label": label,
            "saved": vals["saved"],
            "pending": vals["pending"],
            "wasted": vals["wasted"],
            "total": total,
            "completionRate": completion_rate,
        })

    return success_response("Admin reports", {
        "points": points,
        "summary": {
            "totalDonations": total_saved + total_pending + total_wasted,
            "saved": total_saved,
            "pending": total_pending,
            "wasted": total_wasted,
            "peakLabel": peak_bucket_label,
            "peakTotal": peak_bucket_total,
            "granularity": granularity,
        }
    })


@admin_bp.route("/priority-insights", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def priority_insights():
    ngo_id = request.args.get("ngoId", type=int)

    ngo_query = User.query.filter_by(role=UserRole.NGO)
    ngos = ngo_query.order_by(User.verified.desc(), User.name.asc()).all()
    if not ngos:
        return success_response(
            "Priority intelligence",
            {
                "selectedNgo": None,
                "ngos": [],
                "summary": {
                    "pendingDonations": 0,
                    "strategicCount": 0,
                    "avgFinalScore": 0,
                    "avgMlLift": 0,
                    "mlEnabled": False,
                },
                "model": None,
                "items": [],
            },
        )

    selected_ngo = next((ngo for ngo in ngos if ngo.id == ngo_id), None)
    if selected_ngo is None:
        selected_ngo = next((ngo for ngo in ngos if ngo.verified), ngos[0])

    ranked = rank_donations_for_ngo(selected_ngo)
    donor_ids = {item["donation"].donor_id for item in ranked}
    donors = {
        user.id: user
        for user in User.query.filter(User.id.in_(donor_ids)).all()
    } if donor_ids else {}

    items = []
    ml_lifts = []
    strategic_count = 0
    total_final_score = 0.0

    for item in ranked[:20]:
        donation = item["donation"]
        donor = donors.get(donation.donor_id)
        explainability = item["explainability"]
        heuristic_score = explainability.get("heuristicScore")
        ml_score = explainability.get("mlScore")
        final_score = item["priorityScore"]
        if ml_score is not None:
            ml_lifts.append(round(final_score - heuristic_score, 2))
        if item["priorityTier"] == "STRATEGIC":
            strategic_count += 1
        total_final_score += final_score

        items.append(
            {
                "id": donation.id,
                "foodType": donation.food_type,
                "quantity": donation.quantity,
                "status": donation.status,
                "pickupAddress": donation.pickup_address,
                "donorName": donor.name if donor else "Donor",
                "donorLocation": donor.location if donor else donation.pickup_address,
                "distanceKm": item["distanceKm"],
                "priorityTier": item["priorityTier"],
                "finalScore": final_score,
                "heuristicScore": heuristic_score,
                "mlScore": ml_score,
                "scoreBreakdown": item["scoreBreakdown"],
                "decisionSignals": item["decisionSignals"],
                "explainability": explainability,
                "createdAt": donation.created_at.isoformat(),
                "expiresAt": (donation.created_at + timedelta(hours=donation.expiry_hours)).isoformat(),
            }
        )

    model_artifact = load_priority_model(current_app.config.get("PRIORITY_MODEL_PATH"))
    model_summary = None
    if model_artifact:
        model_summary = {
            "type": model_artifact.get("model_type"),
            "metrics": model_artifact.get("metrics", {}),
            "trainingRows": model_artifact.get("training_rows"),
            "testRows": model_artifact.get("test_rows"),
        }

    avg_final_score = round(total_final_score / len(items), 1) if items else 0
    avg_ml_lift = round(sum(ml_lifts) / len(ml_lifts), 2) if ml_lifts else 0

    return success_response(
        "Priority intelligence",
        {
            "selectedNgo": {
                "id": selected_ngo.id,
                "name": selected_ngo.name,
                "location": selected_ngo.location,
                "verified": selected_ngo.verified,
                "performanceScore": selected_ngo.performance_score,
            },
            "ngos": [
                {
                    "id": ngo.id,
                    "name": ngo.name,
                    "location": ngo.location,
                    "verified": ngo.verified,
                }
                for ngo in ngos
            ],
            "summary": {
                "pendingDonations": len(items),
                "strategicCount": strategic_count,
                "avgFinalScore": avg_final_score,
                "avgMlLift": avg_ml_lift,
                "mlEnabled": bool(model_artifact),
            },
            "model": model_summary,
            "items": items,
        },
    )
