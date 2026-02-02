from app import db

class NGO(db.Model):
    __tablename__ = "ngos"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)

    area = db.Column(db.String(100))
    capacity = db.Column(db.Integer, default=50)

    fulfillment_rate = db.Column(db.Float, default=0.8)
    performance_score = db.Column(db.Float, default=75.0)

    is_verified = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area": self.area,
            "capacity": self.capacity,
            "performanceScore": self.performance_score
        }
