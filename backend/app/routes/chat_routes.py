from flask_jwt_extended import jwt_required
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.services.chatbot_service import process_message
from app.models.user_model import User
from app import db

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/api/chat", methods=["POST"])
@jwt_required()
def chat():
    try:
        data = request.get_json()
        message = data.get("message")

        if not message:
            return jsonify({
                "success": False,
                "message": "Message is required",
                "data": {}
            }), 400

        # ✅ Get logged-in user
        user_id = get_jwt_identity()

        user = None
        role = "DONOR"  # default fallback

        if user_id:
            user = User.query.get(user_id)
            if user:
                role = user.role

        # ✅ Call chatbot correctly
        ai_result = process_message(user=user, role=role, message=message)

        return jsonify({
            "success": True,
            "message": "Chat processed successfully",
            "data": ai_result
        })

    except Exception as e:
        print("CHAT ERROR:", e)

        return jsonify({
            "success": False,
            "message": "The assistant could not reach the chat service right now.",
            "data": {}
        }), 500