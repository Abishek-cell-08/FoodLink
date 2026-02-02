from app import db
import enum
from werkzeug.security import generate_password_hash, check_password_hash

class UserRole(enum.Enum):
    DONOR = 'DONOR'
    NGO = 'NGO'
    ADMIN = 'ADMIN'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)

    # Common fields
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)

    # Shared (optional)
    location = db.Column(db.String(200))

    # NGO-specific (nullable for others)
    verified = db.Column(db.Boolean, default=False)
    performance_score = db.Column(db.Float)

    # -----------------------
    # Auth helpers
    # -----------------------
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # -----------------------
    # Role-aware serialization
    # -----------------------
    def to_dict(self):
        base = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role.value
        }

        if self.role in [UserRole.DONOR, UserRole.NGO]:
            base["location"] = self.location

        if self.role == UserRole.NGO:
            base["verified"] = self.verified
            base["performanceScore"] = self.performance_score

        return base
