import math
import re
from datetime import datetime

from sqlalchemy import case, func

from app import db
from app.models.donation_model import Donation
from app.models.pickup_model import Pickup
from app.models.request_model import Request
from app.services.ml_service import predict_priority_score


EARTH_RADIUS_KM = 6371

PERISHABILITY_PROFILES = {
    "ultra_perishable": {
        "keywords": {"fish", "seafood", "milk", "cream", "dairy"},
        "risk": 1.0,
        "ideal_window": 2.0,
        "service_value": 0.95,
    },
    "high_perishable": {
        "keywords": {"chicken", "meat", "biryani", "curry", "rice", "meals"},
        "risk": 0.82,
        "ideal_window": 4.0,
        "service_value": 1.0,
    },
    "moderate_perishable": {
        "keywords": {"bread", "roti", "chapati", "dessert", "vegetables"},
        "risk": 0.58,
        "ideal_window": 6.0,
        "service_value": 0.88,
    },
    "stable": {
        "keywords": {"fruit", "banana", "apple", "snacks", "packed", "packet", "dry", "juice", "water", "drink", "beverage"},
        "risk": 0.35,
        "ideal_window": 8.0,
        "service_value": 0.55,
    },
}

QUANTITY_UNITS = {
    "kg": 2.2,
    "kgs": 2.2,
    "kilogram": 2.2,
    "kilograms": 2.2,
    "plate": 1.0,
    "plates": 1.0,
    "tray": 8.0,
    "trays": 8.0,
    "packet": 1.0,
    "packets": 1.0,
    "box": 1.5,
    "boxes": 1.5,
    "bottle": 0.35,
    "bottles": 0.35,
    "liter": 2.2,
    "liters": 2.2,
    "litre": 2.2,
    "litres": 2.2,
}


def calculate_priority(donation, ngo, distance_km):
    return score_donation_for_ngo(donation, ngo, distance_km=distance_km)["priorityScore"]


def score_donation_for_ngo(donation, ngo, distance_km=None, context=None):
    context = context or build_allocation_context(ngo)
    distance_km = _safe_distance(distance_km)
    donor_metrics = context["donor_metrics"].get(donation.donor_id, _default_donor_metrics())
    ngo_metrics = context["ngo_metrics"]
    demand_metrics = _compute_demand_pressure(donation, ngo, context)

    quantity_analysis = _parse_quantity(donation.quantity)
    food_profile = _infer_food_profile(donation.food_type)
    freshness = _freshness_metrics(donation)
    travel = _travel_metrics(distance_km, freshness["remaining_hours"])

    component_scores = {
        "urgency": _score_urgency(
            remaining_hours=freshness["remaining_hours"],
            created_hours_ago=freshness["created_hours_ago"],
            perishability_risk=food_profile["risk"],
            travel_hours=travel["travel_hours"],
        ),
        "travel_feasibility": _score_travel_feasibility(
            distance_km=distance_km,
            slack_hours=travel["slack_hours"],
            feasibility_ratio=travel["feasibility_ratio"],
        ),
        "food_risk": _score_food_risk(
            profile_risk=food_profile["risk"],
            remaining_hours=freshness["remaining_hours"],
            ideal_window=food_profile["ideal_window"],
        ),
        "quantity_utility": _score_quantity_utility(
            estimated_meals=quantity_analysis["estimated_meals"],
            service_value=food_profile["service_value"],
            quantity_confidence=quantity_analysis["confidence"],
        ),
        "demand_pressure": _score_demand_pressure(demand_metrics),
        "ngo_capability": _score_ngo_capability(
            ngo_metrics=ngo_metrics,
            travel=travel,
            food_profile=food_profile,
            quantity_analysis=quantity_analysis,
        ),
        "donor_reliability": _score_donor_reliability(donor_metrics),
    }

    heuristic_score = (
        component_scores["urgency"] * 0.24
        + component_scores["travel_feasibility"] * 0.18
        + component_scores["food_risk"] * 0.14
        + component_scores["quantity_utility"] * 0.12
        + component_scores["demand_pressure"] * 0.12
        + component_scores["ngo_capability"] * 0.14
        + component_scores["donor_reliability"] * 0.06
    )

    synergy = _compute_synergy_bonus(component_scores, travel, freshness, quantity_analysis)
    penalty = _compute_operational_penalty(travel, freshness, ngo_metrics)
    heuristic_score = max(0.0, min(100.0, round(heuristic_score + synergy - penalty, 1)))

    feature_map = _build_ml_feature_map(
        distance_km=distance_km,
        freshness=freshness,
        travel=travel,
        food_profile=food_profile,
        quantity_analysis=quantity_analysis,
        demand_metrics=demand_metrics,
        ngo_metrics=ngo_metrics,
        donor_metrics=donor_metrics,
    )
    ml_score = predict_priority_score(feature_map)
    final_score = heuristic_score if ml_score is None else round((heuristic_score * 0.58) + (ml_score * 0.42), 1)
    final_score = max(0.0, min(100.0, final_score))

    return {
        "priorityScore": final_score,
        "priorityTier": _priority_tier(final_score),
        "scoreBreakdown": {key: round(val, 1) for key, val in component_scores.items()},
        "explainability": {
            "heuristicScore": heuristic_score,
            "mlScore": ml_score,
            "mlEnabled": ml_score is not None,
            "remainingHours": freshness["remaining_hours"],
            "travelHours": travel["travel_hours"],
            "slackHours": travel["slack_hours"],
            "estimatedMeals": quantity_analysis["estimated_meals"],
            "foodProfile": food_profile["label"],
            "demandPressure": round(demand_metrics["pressure"], 3),
            "ngoLoadIndex": round(ngo_metrics["open_load"], 3),
            "donorReliability": round(donor_metrics["reliability"], 3),
        },
        "decisionSignals": _build_decision_signals(
            component_scores=component_scores,
            freshness=freshness,
            travel=travel,
            quantity_analysis=quantity_analysis,
            food_profile=food_profile,
            demand_metrics=demand_metrics,
            ngo_metrics=ngo_metrics,
        ),
    }


def rank_donations_for_ngo(ngo, donations=None):
    donations = donations or Donation.query.filter_by(status="PENDING").all()
    context = build_allocation_context(ngo, donations=donations)
    ranked = []

    for donation in donations:
        distance_km = _distance_between(
            ngo.lat,
            ngo.lng,
            donation.pickup_lat,
            donation.pickup_lng,
        )
        scored = score_donation_for_ngo(
            donation,
            ngo,
            distance_km=distance_km,
            context=context,
        )
        ranked.append(
            {
                "donation": donation,
                "distanceKm": None if distance_km is None else round(distance_km, 2),
                **scored,
            }
        )

    ranked.sort(
        key=lambda item: (
            item["priorityScore"],
            item["scoreBreakdown"]["urgency"],
            -item["distanceKm"] if item["distanceKm"] is not None else -9999,
        ),
        reverse=True,
    )
    return ranked


def build_allocation_context(ngo, donations=None):
    donations = donations or Donation.query.filter_by(status="PENDING").all()
    ngo_metrics = _build_ngo_metrics(ngo)
    donor_metrics = _build_donor_metrics()
    area_density = _build_area_density(donations)
    type_density = _build_food_type_density(donations)

    return {
        "ngo_metrics": ngo_metrics,
        "donor_metrics": donor_metrics,
        "area_density": area_density,
        "type_density": type_density,
        "pending_count": len(donations),
    }


def _build_ngo_metrics(ngo):
    total_requests = Request.query.filter_by(ngo_id=ngo.id).count()
    verified_pickups = (
        db.session.query(func.count(Pickup.id))
        .join(Request, Request.id == Pickup.request_id)
        .filter(Request.ngo_id == ngo.id, Pickup.verified_at.isnot(None))
        .scalar()
        or 0
    )
    open_allocations = Request.query.filter(
        Request.ngo_id == ngo.id,
        Request.status.in_(["ALLOCATED", "PENDING"]),
    ).count()

    success_rate = verified_pickups / total_requests if total_requests else (ngo.performance_score or 60) / 100
    open_load = min(1.0, open_allocations / 6.0)
    verified_multiplier = 1.0 if getattr(ngo, "verified", False) else 0.7
    performance = (ngo.performance_score or 60) / 100

    return {
        "success_rate": min(1.0, success_rate),
        "open_load": open_load,
        "verified_multiplier": verified_multiplier,
        "performance": min(1.0, performance),
        "open_allocations": open_allocations,
    }


def _build_donor_metrics():
    rows = (
        db.session.query(
            Donation.donor_id,
            func.count(Donation.id).label("total"),
            func.sum(case((Donation.status == "PICKED_UP", 1), else_=0)).label("picked_up"),
        )
        .group_by(Donation.donor_id)
        .all()
    )

    metrics = {}
    for donor_id, total, picked_up in rows:
        total = int(total or 0)
        picked_up = int(picked_up or 0)
        reliability = picked_up / total if total else 0.55
        metrics[donor_id] = {
            "total": total,
            "picked_up": picked_up,
            "reliability": min(1.0, max(0.35, reliability)),
        }
    return metrics


def _build_area_density(donations):
    area_density = {}
    for donation in donations:
        key = _grid_key(donation.pickup_lat, donation.pickup_lng)
        area_density[key] = area_density.get(key, 0) + 1
    return area_density


def _build_food_type_density(donations):
    density = {}
    for donation in donations:
        normalized = _normalize_food_type(donation.food_type)
        density[normalized] = density.get(normalized, 0) + 1
    return density


def _compute_demand_pressure(donation, ngo, context):
    nearby_density = context["area_density"].get(_grid_key(donation.pickup_lat, donation.pickup_lng), 1)
    type_density = context["type_density"].get(_normalize_food_type(donation.food_type), 1)
    ngo_area_density = context["area_density"].get(_grid_key(ngo.lat, ngo.lng), 1)

    scarcity = 1 / min(6, type_density)
    neighborhood_pressure = min(1.0, nearby_density / max(1, context["pending_count"]))
    ngo_pull = min(1.0, ngo_area_density / max(1, context["pending_count"]))
    pressure = min(1.0, 0.45 * scarcity + 0.35 * neighborhood_pressure + 0.20 * ngo_pull)

    return {
        "pressure": pressure,
        "nearby_density": nearby_density,
        "type_density": type_density,
    }


def _score_urgency(remaining_hours, created_hours_ago, perishability_risk, travel_hours):
    if remaining_hours <= 0:
        return 0.0

    decay = math.exp(-remaining_hours / max(1.6, 5.2 - perishability_risk * 2.2))
    aging_factor = min(1.0, created_hours_ago / max(1.0, remaining_hours + 1))
    pickup_pressure = 1.0 - min(1.0, remaining_hours / max(1.0, travel_hours + 1.5))
    return 100 * min(1.0, 0.55 * decay + 0.20 * aging_factor + 0.25 * pickup_pressure)


def _score_travel_feasibility(distance_km, slack_hours, feasibility_ratio):
    if distance_km is None:
        return 18.0

    distance_component = math.exp(-distance_km / 8.0)
    slack_component = 1 / (1 + math.exp(-slack_hours * 1.4))
    ratio_component = min(1.0, feasibility_ratio)
    return 100 * min(1.0, 0.45 * distance_component + 0.35 * slack_component + 0.20 * ratio_component)


def _score_food_risk(profile_risk, remaining_hours, ideal_window):
    risk_pressure = profile_risk * (1.0 - min(1.0, remaining_hours / max(ideal_window, 1.0)))
    stability_penalty = 1.0 - (remaining_hours / max(ideal_window * 2, 1.0))
    return 100 * min(1.0, max(0.05, 0.72 * risk_pressure + 0.28 * max(0.0, stability_penalty)))


def _score_quantity_utility(estimated_meals, service_value, quantity_confidence):
    base = min(1.0, math.log1p(max(0, estimated_meals)) / math.log(65))
    confidence_floor = 0.7 + (0.3 * quantity_confidence)
    return 100 * min(1.0, base * service_value * confidence_floor)


def _score_demand_pressure(demand_metrics):
    return 100 * demand_metrics["pressure"]


def _score_ngo_capability(ngo_metrics, travel, food_profile, quantity_analysis):
    travel_fit = min(1.0, travel["slack_hours"] / max(0.75, food_profile["ideal_window"] / 2))
    load_penalty = 1.0 - ngo_metrics["open_load"]
    size_fit = 1.0 if quantity_analysis["estimated_meals"] <= 160 else max(0.55, 220 / max(quantity_analysis["estimated_meals"], 220))

    score = (
        0.34 * ngo_metrics["performance"]
        + 0.28 * ngo_metrics["success_rate"]
        + 0.18 * travel_fit
        + 0.12 * load_penalty
        + 0.08 * size_fit
    ) * ngo_metrics["verified_multiplier"]

    return 100 * min(1.0, score)


def _score_donor_reliability(donor_metrics):
    return 100 * donor_metrics["reliability"]


def _compute_synergy_bonus(component_scores, travel, freshness, quantity_analysis):
    bonus = 0.0
    if component_scores["urgency"] >= 70 and component_scores["travel_feasibility"] >= 65:
        bonus += 5.5
    if freshness["remaining_hours"] <= 2.5 and travel["slack_hours"] >= 0.75:
        bonus += 4.0
    if quantity_analysis["estimated_meals"] >= 40 and component_scores["ngo_capability"] >= 60:
        bonus += 2.5
    if quantity_analysis["estimated_meals"] >= 12 and component_scores["food_risk"] >= 50:
        bonus += 2.0
    return bonus


def _compute_operational_penalty(travel, freshness, ngo_metrics):
    penalty = 0.0
    if travel["slack_hours"] < 0:
        penalty += min(18.0, abs(travel["slack_hours"]) * 10)
    if freshness["remaining_hours"] <= 0:
        penalty += 40.0
    if ngo_metrics["open_load"] > 0.8:
        penalty += 5.0
    if freshness["remaining_hours"] <= 1.5 and travel["slack_hours"] < 0.35:
        penalty += 8.0
    return penalty


def _build_decision_signals(component_scores, freshness, travel, quantity_analysis, food_profile, demand_metrics, ngo_metrics):
    signals = []

    if freshness["remaining_hours"] <= 2:
        signals.append("Critical expiry window")
    if travel["slack_hours"] >= 1:
        signals.append("Reachable within safe handling window")
    if component_scores["food_risk"] >= 55:
        signals.append(f"High perishability: {food_profile['label']}")
    if quantity_analysis["estimated_meals"] >= 50:
        signals.append(f"High service impact: ~{quantity_analysis['estimated_meals']} meals")
    if demand_metrics["pressure"] >= 0.5:
        signals.append("Scarce or strategically valuable food type")
    if ngo_metrics["open_load"] >= 0.7:
        signals.append("NGO load is elevated, so execution risk was adjusted")

    return signals[:4]


def _freshness_metrics(donation):
    created_at = donation.created_at or datetime.utcnow()
    age_hours = max(0.0, (datetime.utcnow() - created_at).total_seconds() / 3600)
    remaining_hours = max(0.0, float(donation.expiry_hours or 0) - age_hours)
    return {
        "created_hours_ago": round(age_hours, 2),
        "remaining_hours": round(remaining_hours, 2),
    }


def _travel_metrics(distance_km, remaining_hours):
    if distance_km is None:
        return {
            "travel_hours": 1.6,
            "buffer_hours": 0.5,
            "slack_hours": round(remaining_hours - 2.1, 2),
            "feasibility_ratio": 0.35,
        }

    urban_speed_kmh = 22.0
    travel_hours = distance_km / urban_speed_kmh
    handling_buffer = 0.35 + min(0.9, distance_km / 25)
    required_hours = travel_hours + handling_buffer
    slack_hours = remaining_hours - required_hours
    feasibility_ratio = remaining_hours / max(required_hours, 0.25)
    return {
        "travel_hours": round(travel_hours, 2),
        "buffer_hours": round(handling_buffer, 2),
        "slack_hours": round(slack_hours, 2),
        "feasibility_ratio": round(feasibility_ratio, 2),
    }


def _parse_quantity(quantity_text):
    if not quantity_text:
        return {"estimated_meals": 8, "normalized_units": 8.0, "confidence": 0.45}

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|plates|plate|trays|tray|packets|packet|boxes|box|bottles|bottle|liters|liter|litres|litre)",
        quantity_text.lower(),
    )
    if not match:
        return {"estimated_meals": 8, "normalized_units": 8.0, "confidence": 0.45}

    amount = float(match.group(1))
    unit = match.group(2)
    multiplier = QUANTITY_UNITS.get(unit, 1.0)
    estimated_meals = max(1, round(amount * multiplier))

    return {
        "estimated_meals": estimated_meals,
        "normalized_units": round(amount * multiplier, 2),
        "confidence": 1.0,
    }


def _infer_food_profile(food_type):
    lowered = (food_type or "").lower()

    for label, config in PERISHABILITY_PROFILES.items():
        if any(keyword in lowered for keyword in config["keywords"]):
            return {
                "label": label.replace("_", " "),
                "risk": config["risk"],
                "ideal_window": config["ideal_window"],
                "service_value": config["service_value"],
            }

    return {
        "label": "mixed prepared food",
        "risk": 0.68,
        "ideal_window": 4.5,
        "service_value": 0.82,
    }


def _priority_tier(score):
    if score >= 85:
        return "STRATEGIC"
    if score >= 70:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


def _build_ml_feature_map(distance_km, freshness, travel, food_profile, quantity_analysis, demand_metrics, ngo_metrics, donor_metrics):
    return {
        "remaining_hours": freshness["remaining_hours"],
        "created_hours_ago": freshness["created_hours_ago"],
        "distance_km": 0.0 if distance_km is None else round(distance_km, 2),
        "travel_hours": travel["travel_hours"],
        "slack_hours": travel["slack_hours"],
        "feasibility_ratio": travel["feasibility_ratio"],
        "perishability_risk": food_profile["risk"],
        "ideal_window": food_profile["ideal_window"],
        "service_value": food_profile["service_value"],
        "estimated_meals": quantity_analysis["estimated_meals"],
        "quantity_confidence": quantity_analysis["confidence"],
        "demand_pressure": demand_metrics["pressure"],
        "nearby_density": demand_metrics["nearby_density"],
        "type_density": demand_metrics["type_density"],
        "ngo_success_rate": ngo_metrics["success_rate"],
        "ngo_open_load": ngo_metrics["open_load"],
        "ngo_performance": ngo_metrics["performance"],
        "ngo_verified": 1.0 if ngo_metrics["verified_multiplier"] >= 1.0 else 0.0,
        "donor_reliability": donor_metrics["reliability"],
    }


def _grid_key(lat, lng):
    if lat is None or lng is None:
        return "unknown"
    return f"{round(lat, 1)}:{round(lng, 1)}"


def _normalize_food_type(food_type):
    lowered = (food_type or "unknown").lower()
    lowered = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip() or "unknown"


def _default_donor_metrics():
    return {"total": 0, "picked_up": 0, "reliability": 0.55}


def _safe_distance(distance_km):
    if distance_km is None:
        return None
    return max(0.0, float(distance_km))


def _distance_between(lat1, lng1, lat2, lng2):
    if None in {lat1, lng1, lat2, lng2}:
        return None

    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c
