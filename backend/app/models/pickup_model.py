from datetime import datetime
from app import db

class Pickup(db.Model):
    __tablename__ = "pickups"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("requests.id"), nullable=False)

    status = db.Column(db.String(50), default="SCHEDULED")
    verified_at = db.Column(db.DateTime)
    ngo_live_lat = db.Column(db.Float, nullable=True)
    ngo_live_lng = db.Column(db.Float, nullable=True)
    ngo_location_updated_at = db.Column(db.DateTime, nullable=True)
    donor_live_lat = db.Column(db.Float, nullable=True)
    donor_live_lng = db.Column(db.Float, nullable=True)
    donor_location_updated_at = db.Column(db.DateTime, nullable=True)
