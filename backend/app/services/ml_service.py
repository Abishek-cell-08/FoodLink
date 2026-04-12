import csv
import json
import math
import os
import random
from functools import lru_cache


FEATURE_NAMES = [
    "remaining_hours",
    "created_hours_ago",
    "distance_km",
    "travel_hours",
    "slack_hours",
    "feasibility_ratio",
    "perishability_risk",
    "ideal_window",
    "service_value",
    "estimated_meals",
    "quantity_confidence",
    "demand_pressure",
    "nearby_density",
    "type_density",
    "ngo_success_rate",
    "ngo_open_load",
    "ngo_performance",
    "ngo_verified",
    "donor_reliability",
]

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "ml_artifacts",
    "priority_model.json",
)


def predict_priority_score(feature_map, model_path=None):
    model_path = model_path or DEFAULT_MODEL_PATH
    model = load_priority_model(model_path)
    if not model:
        return None

    values = [float(feature_map.get(name, 0.0)) for name in FEATURE_NAMES]
    normalized = []
    for value, mean, std in zip(values, model["means"], model["stds"]):
        normalized.append((value - mean) / (std or 1.0))

    score = model["bias"]
    for weight, value in zip(model["weights"], normalized):
        score += weight * value

    return round(_clamp(score, 0.0, 100.0), 1)


@lru_cache(maxsize=4)
def load_priority_model(model_path):
    if not os.path.exists(model_path):
        return None

    with open(model_path, "r", encoding="utf-8") as file:
        artifact = json.load(file)

    if artifact.get("feature_names") != FEATURE_NAMES:
        return None

    return artifact


def clear_model_cache():
    load_priority_model.cache_clear()


def train_priority_model_from_csv(csv_path, output_path=None, epochs=700, learning_rate=0.01):
    rows = _read_training_rows(csv_path)
    if not rows:
        raise ValueError("No rows found in training dataset.")

    random.Random(42).shuffle(rows)
    split_index = max(1, int(len(rows) * 0.8))
    train_rows = rows[:split_index]
    test_rows = rows[split_index:]

    train_x = [[row[name] for name in FEATURE_NAMES] for row in train_rows]
    train_y = [row["target_priority"] for row in train_rows]
    means, stds = _compute_normalization(train_x)
    norm_train_x = [_normalize_vector(vector, means, stds) for vector in train_x]

    weights = [0.0] * len(FEATURE_NAMES)
    bias = sum(train_y) / len(train_y)

    for _ in range(epochs):
        for features, target in zip(norm_train_x, train_y):
            prediction = bias + sum(weight * value for weight, value in zip(weights, features))
            error = prediction - target
            bias -= learning_rate * error
            for index, value in enumerate(features):
                weights[index] -= learning_rate * error * value

    metrics = _evaluate_model(weights, bias, means, stds, test_rows or train_rows)
    artifact = {
        "feature_names": FEATURE_NAMES,
        "weights": [round(weight, 8) for weight in weights],
        "bias": round(bias, 8),
        "means": means,
        "stds": stds,
        "metrics": metrics,
        "training_rows": len(train_rows),
        "test_rows": len(test_rows),
        "model_type": "standardized_linear_regression_sgd",
    }

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as file:
            json.dump(artifact, file, indent=2)
        clear_model_cache()

    return artifact


def generate_synthetic_priority_dataset(output_path, rows=3000, seed=42):
    randomizer = random.Random(seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=FEATURE_NAMES + ["target_priority", "pickup_success_probability"],
        )
        writer.writeheader()

        for _ in range(rows):
            sample = _synthetic_sample(randomizer)
            writer.writerow(sample)


def _synthetic_sample(randomizer):
    perishability_risk, ideal_window, service_value = randomizer.choice(
        [
            (1.0, 2.0, 0.95),
            (0.82, 4.0, 1.0),
            (0.58, 6.0, 0.88),
            (0.35, 8.0, 0.55),
        ]
    )
    remaining_hours = round(randomizer.uniform(0.35, ideal_window + 3.5), 2)
    created_hours_ago = round(randomizer.uniform(0.05, max(0.5, ideal_window * 1.1)), 2)
    distance_km = round(randomizer.uniform(0.0, 18.0), 2)
    travel_hours = round(distance_km / randomizer.uniform(18.0, 28.0), 2)
    slack_hours = round(remaining_hours - (travel_hours + randomizer.uniform(0.25, 1.1)), 2)
    feasibility_ratio = round(max(0.1, remaining_hours / max(travel_hours + 0.35, 0.25)), 2)
    estimated_meals = round(randomizer.uniform(2, 180), 2)
    quantity_confidence = round(randomizer.uniform(0.55, 1.0), 2)
    demand_pressure = round(randomizer.uniform(0.05, 1.0), 3)
    nearby_density = randomizer.randint(1, 18)
    type_density = randomizer.randint(1, 12)
    ngo_success_rate = round(randomizer.uniform(0.45, 0.98), 3)
    ngo_open_load = round(randomizer.uniform(0.0, 1.0), 3)
    ngo_performance = round(randomizer.uniform(0.4, 0.98), 3)
    ngo_verified = randomizer.choice([0.0, 1.0])
    donor_reliability = round(randomizer.uniform(0.35, 0.98), 3)

    urgency_signal = 100 * math.exp(-remaining_hours / max(1.3, 5.0 - perishability_risk * 2.6))
    travel_signal = 100 * min(
        1.0,
        0.62 * math.exp(-distance_km / 7.0) + 0.38 * (1 / (1 + math.exp(-slack_hours * 1.7))),
    )
    quantity_signal = 100 * min(
        1.0,
        (math.log1p(estimated_meals) / math.log(190)) * service_value * (0.75 + 0.25 * quantity_confidence),
    )
    capability_signal = 100 * min(
        1.0,
        0.42 * ngo_success_rate + 0.28 * ngo_performance + 0.18 * (1 - ngo_open_load) + 0.12 * ngo_verified,
    )
    demand_signal = 100 * min(
        1.0,
        0.5 * demand_pressure + 0.3 * (1 / max(1, min(type_density, 8))) + 0.2 * min(1.0, nearby_density / 10),
    )

    target_priority = (
        0.30 * urgency_signal
        + 0.17 * travel_signal
        + 0.16 * quantity_signal
        + 0.14 * capability_signal
        + 0.13 * demand_signal
        + 10 * perishability_risk
        + 6 * donor_reliability
        + (4 if slack_hours > 0.8 and remaining_hours < 2.5 else 0)
        + (3 if estimated_meals > 30 and perishability_risk > 0.7 else 0)
        - (12 if slack_hours < 0 else 0)
        - (7 if ngo_open_load > 0.8 else 0)
        + randomizer.uniform(-4.5, 4.5)
    )
    target_priority = round(_clamp(target_priority, 0.0, 100.0), 1)

    success_probability = _clamp(
        0.18
        + 0.0045 * target_priority
        + 0.10 * ngo_verified
        + 0.08 * donor_reliability
        - 0.16 * max(0, -slack_hours)
        - 0.10 * ngo_open_load
        + randomizer.uniform(-0.06, 0.06),
        0.01,
        0.99,
    )

    return {
        "remaining_hours": remaining_hours,
        "created_hours_ago": created_hours_ago,
        "distance_km": distance_km,
        "travel_hours": travel_hours,
        "slack_hours": slack_hours,
        "feasibility_ratio": feasibility_ratio,
        "perishability_risk": perishability_risk,
        "ideal_window": ideal_window,
        "service_value": service_value,
        "estimated_meals": estimated_meals,
        "quantity_confidence": quantity_confidence,
        "demand_pressure": demand_pressure,
        "nearby_density": nearby_density,
        "type_density": type_density,
        "ngo_success_rate": ngo_success_rate,
        "ngo_open_load": ngo_open_load,
        "ngo_performance": ngo_performance,
        "ngo_verified": ngo_verified,
        "donor_reliability": donor_reliability,
        "target_priority": target_priority,
        "pickup_success_probability": round(success_probability, 3),
    }


def _read_training_rows(csv_path):
    with open(csv_path, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        rows = []
        for row in reader:
            parsed = {name: float(row[name]) for name in FEATURE_NAMES}
            parsed["target_priority"] = float(row["target_priority"])
            rows.append(parsed)
        return rows


def _compute_normalization(vectors):
    means = []
    stds = []
    for values in zip(*vectors):
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / len(values)
        std = math.sqrt(variance) or 1.0
        means.append(round(mean, 8))
        stds.append(round(std, 8))
    return means, stds


def _normalize_vector(vector, means, stds):
    return [(value - mean) / (std or 1.0) for value, mean, std in zip(vector, means, stds)]


def _evaluate_model(weights, bias, means, stds, rows):
    absolute_errors = []
    squared_errors = []

    for row in rows:
        vector = [row[name] for name in FEATURE_NAMES]
        normalized = _normalize_vector(vector, means, stds)
        prediction = bias + sum(weight * value for weight, value in zip(weights, normalized))
        prediction = _clamp(prediction, 0.0, 100.0)
        target = row["target_priority"]
        error = prediction - target
        absolute_errors.append(abs(error))
        squared_errors.append(error ** 2)

    mae = sum(absolute_errors) / len(absolute_errors)
    rmse = math.sqrt(sum(squared_errors) / len(squared_errors))
    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
    }


def _clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))
