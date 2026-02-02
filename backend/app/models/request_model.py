from datetime import datetime
from app import db

class Request(db.Model):
    __tablename__ = "requests"

    id = db.Column(db.Integer, primary_key=True)

    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id"), nullable=False)
    ngo_id = db.Column(db.Integer, db.ForeignKey("ngos.id"), nullable=False)

    priority_score = db.Column(db.Float)
    status = db.Column(db.String(50), default="ALLOCATED")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
