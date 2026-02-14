from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()

            # 🔎 DEBUG PRINTS
            print("JWT identity:", get_jwt_identity())
            print("JWT claims:", get_jwt())

            claims = get_jwt()
            user_role = claims.get("role")

            print("Extracted role:", user_role)
            print("Required role:", required_role)

            if user_role != required_role:
                return {"message": "Access denied: insufficient permissions"}, 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
