from app import db

class Prediction(db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    period = db.Column(db.String(50))          # e.g. Week 1
    predicted_kg = db.Column(db.Float)
    actual_kg = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "period": self.period,
            "predictedKg": self.predicted_kg,
            "actualKg": self.actual_kg
        }
