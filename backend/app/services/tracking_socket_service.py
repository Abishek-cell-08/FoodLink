from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from app import socketio
from app.models.donation_model import Donation
from app.models.request_model import Request


def get_tracking_room(request_id: int) -> str:
    return f"tracking:{request_id}"


def emit_tracking_session_update(session_payload):
    request_id = session_payload.get("requestId")
    if request_id is None:
        return

    socketio.emit("tracking:update", session_payload, to=get_tracking_room(int(request_id)))


def register_tracking_socket_handlers(socket_instance):
    @socket_instance.on("tracking:join")
    def handle_tracking_join(payload):
        payload = payload or {}
        request_id = payload.get("requestId")
        token = payload.get("token")

        if request_id is None or not token:
            emit("tracking:error", {"message": "requestId and token are required"})
            return

        try:
            request_id = int(request_id)
            decoded = decode_token(token)
            user_id = int(decoded["sub"])
        except Exception:
            emit("tracking:error", {"message": "Unauthorized tracking subscription"})
            return

        if not _user_has_tracking_access(user_id, request_id):
            emit("tracking:error", {"message": "You do not have access to this tracking room"})
            return

        join_room(get_tracking_room(request_id))
        emit("tracking:joined", {"requestId": request_id, "sid": request.sid})

    @socket_instance.on("tracking:leave")
    def handle_tracking_leave(payload):
        payload = payload or {}
        request_id = payload.get("requestId")

        if request_id is None:
            return

        leave_room(get_tracking_room(int(request_id)))


def _user_has_tracking_access(user_id: int, request_id: int) -> bool:
    request_row = Request.query.filter_by(id=request_id).first()
    if request_row is None:
        return False

    if request_row.ngo_id == user_id:
        return True

    donation = Donation.query.filter_by(id=request_row.donation_id).first()
    return donation is not None and donation.donor_id == user_id
