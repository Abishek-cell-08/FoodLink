from datetime import datetime, timedelta
from app import db

class Donation(db.Model):
    __tablename__ = "donations"

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    food_type = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.String(100), nullable=False)

    expiry_hours = db.Column(db.Integer, nullable=False)
    pickup_address = db.Column(db.String(255), nullable=False)

    # ✅ NEW: coordinates
    pickup_lat = db.Column(db.Float, nullable=True)
    pickup_lng = db.Column(db.Float, nullable=True)

    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default="PENDING")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        expires_at = self.created_at + timedelta(hours=self.expiry_hours)

        return {
            "id": self.id,
            "foodType": self.food_type,
            "quantity": self.quantity,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
            "expiresAt": expires_at.isoformat(),
            "pickupLat": self.pickup_lat,
            "pickupLng": self.pickup_lng,
            "distanceKm": None
        }