from datetime import datetime
from app import db
from app.models.pickup_model import Pickup
from app.models.request_model import Request
from app.models.donation_model import Donation

def verify_qr(request_id):
    pickup = Pickup.query.filter_by(request_id=request_id).first()
    if not pickup:
        return False

    # Mark pickup as verified
    pickup.status = "VERIFIED"
    pickup.verified_at = datetime.utcnow()

    # Get the request
    req = Request.query.get(request_id)
    if not req:
        return False

    # Get the donation linked to this request
    donation = Donation.query.get(req.donation_id)
    if not donation:
        return False

    # Update donation status
    donation.status = "PICKED_UP"

    db.session.commit()
    return True
