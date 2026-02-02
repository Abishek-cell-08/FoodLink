from datetime import datetime
from app import db
from app.models.pickup_model import Pickup
from app.models.donation_model import Donation

def verify_qr(request_id):
    pickup = Pickup.query.filter_by(request_id=request_id).first()
    if not pickup:
        return False

    pickup.status = "VERIFIED"
    pickup.verified_at = datetime.utcnow()

    donation = Donation.query.get(pickup.request_id)
    donation.status = "PICKED_UP"

    db.session.commit()
    return True
