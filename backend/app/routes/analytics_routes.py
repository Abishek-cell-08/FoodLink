from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from sqlalchemy import func
from datetime import datetime, timedelta

from app import db
from app.models.donation_model import Donation
from app.models.request_model import Request
from app.models.pickup_model import Pickup
from app.models.ngo_model import NGO
from app.utils.response_helper import success_response

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/admin")

@analytics_bp.route("/overview", methods=["GET"])
@jwt_required()
def admin_overview():
    today = datetime.utcnow().date()

    total_saved_today = db.session.query(
        func.sum(Donation.expiry_hours)
    ).filter(
        func.date(Donation.created_at) == today
    ).scalar() or 0

    live_requests = Request.query.count()

    avg_pickup_time = 38  # placeholder (can be computed later)

    total_pickups = Pickup.query.count()
    completed_pickups = Pickup.query.filter(Pickup.verified_at.isnot(None)).count()
    fulfillment_rate = round((completed_pickups / total_pickups) * 100, 2) if total_pickups else 0

    alerts = [
        {
            "type": "CRITICAL",
            "msg": "3 donations in Sector 5 expiring within 45 mins.",
            "time": "Just now"
        },
        {
            "type": "WARNING",
            "msg": 'NGO "Community Kitchen" fulfillment rate dropped below 70%.',
            "time": "12m ago"
        },
        {
            "type": "INFO",
            "msg": "High demand surge detected in West Side Corporate Hub.",
            "time": "1h ago"
        }
    ]

    return success_response("Admin system overview", {
        "kpis": {
            "totalSavedToday": f"{total_saved_today} kg",
            "liveRequests": live_requests,
            "avgPickup": "38m",
            "fulfillmentRate": f"{fulfillment_rate}%"
        },
        "alerts": alerts
    })

@analytics_bp.route("/reports", methods=["GET"])
@jwt_required()
def admin_reports():
    data = [
        {"name": "Week 1", "saved": 400, "wasted": 240, "predicted": 420},
        {"name": "Week 2", "saved": 300, "wasted": 139, "predicted": 350},
        {"name": "Week 3", "saved": 500, "wasted": 98, "predicted": 480},
        {"name": "Week 4", "saved": 600, "wasted": 80, "predicted": 590},
        {"name": "Week 5", "saved": 750, "wasted": 45, "predicted": 720},
    ]

    return success_response("Impact reports", data)
