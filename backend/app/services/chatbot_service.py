import json
import re
from datetime import datetime, timedelta

from flask import current_app
from sqlalchemy import desc, func

from app import db
from app.models.donation_model import Donation
from app.models.pickup_model import Pickup
from app.models.request_model import Request
from app.models.user_model import User
from app.services.allocation_service import rank_donations_for_ngo

try:
    import google.genai as genai
except ImportError:
    try:
        import google.generativeai as genai
    except ImportError:  # pragma: no cover
        genai = None


INTENTS = {
    "FIND_FOOD",
    "PICKUP_SUGGEST",
    "FOOD_ESTIMATE",
    "FOOD_SAFETY",
    "CREATE_DONATION",
    "ANALYTICS",
    "UNKNOWN",
}


def process_message(user, role: str, message: str):
    intent_payload = _extract_intent(role=role, message=message)
    intent = intent_payload.get("intent", "UNKNOWN")
    details = intent_payload.get("details", {})

    if intent not in INTENTS:
        intent = "UNKNOWN"

    handler = {
        "FIND_FOOD": _handle_find_food,
        "PICKUP_SUGGEST": _handle_pickup_suggest,
        "FOOD_ESTIMATE": _handle_food_estimate,
        "FOOD_SAFETY": _handle_food_safety,
        "CREATE_DONATION": _handle_create_donation,
        "ANALYTICS": _handle_analytics,
    }.get(intent, _handle_unknown)

    result = handler(user=user, role=role, message=message, details=details)
    result["intent"] = intent
    result["role"] = role.value if hasattr(role, "value") else str(role)
    result["usedGemini"] = bool(intent_payload.get("used_gemini"))
    return result


def _extract_intent(role: str, message: str):
    gemini_api_key = current_app.config.get("GEMINI_API_KEY")
    gemini_model = "gemini-2.5-flash"  # ✅ correct model

    system_instruction = (
        "Return ONLY valid JSON. No explanation.\n"
        "Format: {\"intent\": \"...\", \"details\": {}}\n\n"
        "You are an AI assistant for a food donation platform.\n"
        "Allowed intents: FIND_FOOD, PICKUP_SUGGEST, FOOD_ESTIMATE, "
        "FOOD_SAFETY, CREATE_DONATION, ANALYTICS, UNKNOWN.\n"
        f"Current role: {role}.\n"
        "Extract useful details like quantity_text, food_type, expiry_hours, people_count.\n"
    )

    if gemini_api_key and genai is not None:
        try:
            # ✅ NEW Gemini API (correct for 2.5 models)
            client = genai.Client(api_key=gemini_api_key)

            response = client.models.generate_content(
                model=gemini_model,
                contents=[
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"{system_instruction}\n\nUser message: {message}"
                            }
                        ]
                    }
                ],
                config={
                    "temperature": 0.2
                }
            )

            # ✅ Extract response safely
            content = ""
            if hasattr(response, "text"):
                content = response.text
            else:
                try:
                    content = response.candidates[0].content.parts[0].text
                except:
                    content = ""

            content = (content or "").strip()

            # ✅ SAFE JSON extraction
            match = re.search(r"\{.*\}", content, re.DOTALL)

            if match:
                try:
                    payload = json.loads(match.group())
                except:
                    payload = {"intent": "UNKNOWN", "details": {}}
            else:
                print("RAW GEMINI RESPONSE:", content)
                payload = {"intent": "UNKNOWN", "details": {}}

            payload["used_gemini"] = True
            return payload

        except Exception as e:
            print("GEMINI ERROR:", e)

    # ✅ fallback if Gemini fails
    return _fallback_intent_parser(message)


def _extract_genai_response_text(response):
    if not response:
        return ""

    # google.genai response: candidates -> content -> parts -> text
    candidates = getattr(response, "candidates", None)
    if not candidates:
        return ""

    first = candidates[0]
    content = getattr(first, "content", None)
    if not content:
        return ""

    parts = getattr(content, "parts", None)
    if not parts:
        return ""

    text_pieces = []
    for part in parts:
        part_text = getattr(part, "text", None)
        if part_text:
            text_pieces.append(str(part_text))

    return "".join(text_pieces)


def _fallback_intent_parser(message: str):
    lowered = message.lower()

    if any(word in lowered for word in ["nearby food", "find food", "available now", "donation near", "near me"]):
        intent = "FIND_FOOD"
    elif any(word in lowered for word in ["pickup", "best option", "which should i collect", "collect first"]):
        intent = "PICKUP_SUGGEST"
    elif any(word in lowered for word in ["feed", "how much food", "quantity", "estimate meals", "serves"]):
        intent = "FOOD_ESTIMATE"
    elif any(word in lowered for word in ["safe", "spoil", "expired", "expiry", "still good"]):
        intent = "FOOD_SAFETY"
    elif any(word in lowered for word in [
    "post donation", "create donation", "donate", "list food",
    "i have", "leftover", "extra food", "remaining food"
]):
        intent = "CREATE_DONATION"
    elif any(word in lowered for word in ["analytics", "how much food saved", "highest demand", "report", "this week"]):
        intent = "ANALYTICS"
    else:
        intent = "UNKNOWN"

    details = {}
    people_count = _extract_people_count(message)
    if people_count:
        details["people_count"] = people_count

    expiry_hours = _extract_number_before_keywords(message, ["hour", "hours", "hr", "hrs"])
    if expiry_hours is not None:
        details["expiry_hours"] = expiry_hours

    quantity_text = _extract_quantity_text(message)
    if quantity_text:
        details["quantity_text"] = quantity_text

    return {
        "intent": intent,
        "details": details,
        "used_gemini": False,
    }


def _handle_find_food(user, role: str, message: str, details: dict):
    role_str = role.value if hasattr(role, "value") else str(role)
    if role_str != "NGO":
        return _role_restricted_reply("NGO", "finding nearby food")

    ranked = _rank_pending_donations_for_ngo(user)
    top_items = ranked[:5]

    if not top_items:
        return {
            "reply": "There is no pending food available right now near your NGO.",
            "data": {"matches": []},
            "suggestions": ["Try again in a few minutes", "Ask the donor network to post new donations"],
        }

    top = top_items[0]
    reply = (
        f"I found {len(top_items)} nearby options. "
        f"The best current match is {top['foodType']} at {top['distanceKm']} km away, "
        f"with about {top['expiryHours']} hours left."
    )

    return {
        "reply": reply,
        "data": {"matches": top_items},
        "suggestions": [
            "Claim the highest-priority donation first",
            "Check pickups with less than 2 hours remaining",
        ],
    }


def _handle_pickup_suggest(user, role: str, message: str, details: dict):
    role_str = role.value if hasattr(role, "value") else str(role)
    if role_str != "NGO":
        return _role_restricted_reply("NGO", "pickup suggestions")

    ranked = _rank_pending_donations_for_ngo(user)
    top_items = ranked[:3]

    if not top_items:
        return {
            "reply": "I could not find any pending pickups to recommend right now.",
            "data": {"recommendations": []},
            "suggestions": [],
        }

    reply = "These are the best pickup options based on operational urgency, travel feasibility, food risk, demand pressure, and your NGO's execution profile."
    return {
        "reply": reply,
        "data": {"recommendations": top_items},
        "suggestions": [
            "Prioritize the first item if your team can reach it soon",
            "Compare distance and expiry before confirming the route",
        ],
    }


def _handle_food_estimate(user, role: str, message: str, details: dict):
    people_count = details.get("people_count") or _extract_people_count(message)
    quantity_text = details.get("quantity_text") or _extract_quantity_text(message)

    if people_count:
        estimated_kg = round(people_count * 0.45, 1)
        reply = f"For about {people_count} people, plan roughly {estimated_kg} kg of prepared food."
        return {
            "reply": reply,
            "data": {
                "peopleCount": people_count,
                "estimatedKg": estimated_kg,
                "assumption": "0.45 kg prepared food per person",
            },
            "suggestions": [
                "Add a 10% buffer for mixed meals",
                "Use separate trays for rice, curry, and bread to reduce waste",
            ],
        }

    estimated_meals = _estimate_meals_from_quantity(quantity_text or message)
    if estimated_meals:
        reply = f"That quantity can roughly feed {estimated_meals} people, depending on the food type and portion size."
        return {
            "reply": reply,
            "data": {
                "quantityText": quantity_text or message,
                "estimatedMeals": estimated_meals,
            },
            "suggestions": [
                "Treat this as a quick planning estimate",
                "Mention whether the food is rice, curry, bread, or snacks for better accuracy",
            ],
        }

    return {
        "reply": "I can estimate this better if you share either the number of people or a quantity like 10 kg, 40 plates, or 5 trays.",
        "data": {},
        "suggestions": [
            "Example: How much food is needed for 50 people?",
            "Example: Can 12 kg biryani feed 30 people?",
        ],
    }


def _handle_food_safety(user, role: str, message: str, details: dict):
    expiry_hours = details.get("expiry_hours")
    if expiry_hours is None:
        expiry_hours = _extract_number_before_keywords(message, ["hour", "hours", "hr", "hrs"])

    food_type = _extract_food_type(message)
    risk_level = "MEDIUM"

    if food_type and any(word in food_type.lower() for word in ["meat", "chicken", "fish", "seafood", "dairy", "milk", "cream"]):
        risk_level = "HIGH"
    elif food_type and any(word in food_type.lower() for word in ["bread", "banana", "apple", "dry", "packaged"]):
        risk_level = "LOW"

    if expiry_hours is not None and expiry_hours <= 2:
        risk_level = "HIGH"

    if risk_level == "HIGH":
        reply = "This food should be treated as high risk. Prioritize quick pickup, temperature control, and a manual safety check before distribution."
    elif risk_level == "LOW":
        reply = "This looks lower risk, but it still needs a basic freshness and storage check before distribution."
    else:
        reply = "This food may still be usable, but the team should verify storage time, smell, temperature, and packaging condition first."

    return {
        "reply": reply,
        "data": {
            "foodType": food_type,
            "expiryHours": expiry_hours,
            "riskLevel": risk_level,
            "disclaimer": "This is operational guidance, not a certified food safety inspection.",
        },
        "suggestions": [
            "Reject food with bad odor, leakage, or unsafe temperature",
            "Keep hot food hot and cold food cold during pickup",
        ],
    }


def _handle_create_donation(user, role: str, message: str, details: dict):
    role_str = role.value if hasattr(role, "value") else str(role)
    if role_str != "DONOR":
        return _role_restricted_reply("DONOR", "donation posting help")

    quantity_text = details.get("quantity_text") or _extract_quantity_text(message)
    estimated_meals = _estimate_meals_from_quantity(quantity_text or message)
    food_type = _extract_food_type(message)
    suggested_expiry = _suggest_expiry_hours(food_type)

    reply = "I can help the donor post this quickly. I extracted the likely donation details and added a few suggestions."
    return {
        "reply": reply,
        "data": {
            "draftDonation": {
                "foodType": food_type,
                "quantity": quantity_text,
                "suggestedExpiryHours": suggested_expiry,
                "estimatedMeals": estimated_meals,
            }
        },
        "suggestions": [
            "Confirm the pickup address and food quantity before posting",
            "Mention whether the food is packed, refrigerated, or freshly cooked",
        ],
    }


def _handle_analytics(user, role: str, message: str, details: dict):
    role_str = role.value if hasattr(role, "value") else str(role)
    if role_str != "ADMIN":
        return _role_restricted_reply("ADMIN", "analytics questions")

    now = datetime.utcnow()
    week_start = now - timedelta(days=7)

    food_saved_this_week = Donation.query.filter(
        Donation.status == "PICKED_UP",
        Donation.created_at >= week_start
    ).count()

    created_this_week = Donation.query.filter(Donation.created_at >= week_start).count()

    top_area_row = db.session.query(
        User.location,
        func.count(Request.id).label("request_count")
    ).join(Request, Request.ngo_id == User.id).group_by(User.location).order_by(desc("request_count")).first()

    top_area = top_area_row[0] if top_area_row and top_area_row[0] else "Unknown"
    top_area_requests = int(top_area_row[1]) if top_area_row else 0

    completed_pickups = Pickup.query.filter(Pickup.verified_at.isnot(None)).count()
    total_pickups = Pickup.query.count()
    fulfillment_rate = round((completed_pickups / total_pickups) * 100, 2) if total_pickups else 0

    reply = (
        f"This week, {food_saved_this_week} donations were marked as picked up out of "
        f"{created_this_week} created. The area with the highest recorded demand is {top_area}."
    )

    return {
        "reply": reply,
        "data": {
            "foodSavedThisWeek": food_saved_this_week,
            "donationsCreatedThisWeek": created_this_week,
            "highestDemandArea": top_area,
            "highestDemandRequestCount": top_area_requests,
            "fulfillmentRate": fulfillment_rate,
        },
        "suggestions": [
            "Compare this with the admin dashboard for trend context",
            "Add quantity-in-kg tracking later for stronger analytics",
        ],
    }


def _handle_unknown(user, role: str, message: str, details: dict):
    return {
        "reply": (
            "I can help with nearby food, pickup suggestions, meal estimation, food safety guidance, "
            "donation posting help, or admin analytics."
        ),
        "data": {},
        "suggestions": [
            "NGO: Find nearby food available now",
            "Donor: Help me post this donation",
            "Admin: How much food was saved this week?",
        ],
    }


def _rank_pending_donations_for_ngo(user):
    ranked = []

    for item in rank_donations_for_ngo(user):
        donation = item["donation"]
        ranked.append(
            {
                "id": donation.id,
                "foodType": donation.food_type,
                "quantity": donation.quantity,
                "expiryHours": donation.expiry_hours,
                "pickupAddress": donation.pickup_address,
                "distanceKm": item["distanceKm"],
                "priorityScore": item["priorityScore"],
                "priorityTier": item["priorityTier"],
                "scoreBreakdown": item["scoreBreakdown"],
                "decisionSignals": item["decisionSignals"],
                "createdAt": donation.created_at.isoformat(),
            }
        )

    ranked.sort(key=lambda row: (row["priorityScore"], row["scoreBreakdown"]["urgency"]), reverse=True)
    return ranked


def _extract_people_count(message: str):
    match = re.search(r"(\d+)\s*(people|persons|meals|plates)", message.lower())
    return int(match.group(1)) if match else None


def _extract_number_before_keywords(message: str, keywords):
    pattern = r"(\d+)\s*(?:" + "|".join(re.escape(keyword) for keyword in keywords) + r")"
    match = re.search(pattern, message.lower())
    return int(match.group(1)) if match else None


def _extract_quantity_text(message: str):
    match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms|plates|plate|trays|tray|packets|packet|boxes|box)", message.lower())
    return match.group(0) if match else None


def _extract_food_type(message: str):
    food_keywords = [
        "biryani", "rice", "curry", "bread", "roti", "chapati", "milk",
        "dairy", "vegetables", "fruit", "snacks", "chicken", "meat",
        "fish", "seafood", "dessert", "packed meals", "meals"
    ]
    lowered = message.lower()
    for keyword in food_keywords:
        if keyword in lowered:
            return keyword
    return None


def _estimate_meals_from_quantity(text: str):
    if not text:
        return None

    match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms|plates|plate|trays|tray|packets|packet|boxes|box)", text.lower())
    if not match:
        return None

    amount = float(match.group(1))
    unit = match.group(2)

    if unit in {"kg", "kgs", "kilograms"}:
        return max(1, round(amount / 0.45))
    if unit in {"plate", "plates", "packet", "packets", "box", "boxes"}:
        return max(1, round(amount))
    if unit in {"tray", "trays"}:
        return max(1, round(amount * 8))

    return None


def _suggest_expiry_hours(food_type: str):
    if not food_type:
        return 4

    lowered = food_type.lower()
    if any(word in lowered for word in ["fish", "seafood", "milk", "dairy", "chicken", "meat"]):
        return 2
    if any(word in lowered for word in ["rice", "curry", "biryani", "meals"]):
        return 4
    if any(word in lowered for word in ["bread", "fruit", "snacks"]):
        return 6
    return 4


def _role_restricted_reply(expected_role: str, feature_name: str):
    return {
        "reply": f"This chat request is meant for {expected_role.lower()} users. Your current role does not support {feature_name}.",
        "data": {},
        "suggestions": [],
    }
