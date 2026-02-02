def success_response(message, data=None):
    return {
        "success": True,
        "message": message,
        "data": data
    }, 200
