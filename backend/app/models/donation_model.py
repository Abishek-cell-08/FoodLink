from datetime import datetime
from app import db

class Donation(db.Model):
    __tablename__ = "donations"

    id = db.Column(db.Integer, primary_key=True)

    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    food_type = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.String(100), nullable=False)

    expiry_hours = db.Column(db.Integer, nullable=False)
    pickup_address = db.Column(db.String(255), nullable=False)

    notes = db.Column(db.Text)

    status = db.Column(db.String(50), default="PENDING")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "foodType": self.food_type,
            "quantity": self.quantity,
            "expiryWindow": f"{self.expiry_hours} hrs",
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
            "distanceKm": None  # computed later via location_service
        }
