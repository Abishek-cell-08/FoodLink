from datetime import datetime
from app import db

class Pickup(db.Model):
    __tablename__ = "pickups"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("requests.id"), nullable=False)

    status = db.Column(db.String(50), default="SCHEDULED")
    verified_at = db.Column(db.DateTime)
