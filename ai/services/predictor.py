"""Prediction service logic: loads the trained model and serves predictions.

The model is loaded once at startup and reused for every request; training
is a separate offline step (data/train.py).

Also serves the smart-bin /classify contract: given a bin's designated
category, fill level and capacity, it estimates the total weight (kg) and a
category composition of the waste inside. Deterministic per bin (seeded from
the bin id) so readings are stable across calls.
"""

import hashlib
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.prediction_model import FillRateModel  # noqa: E402

_model = None

COMMON_CATEGORIES = ["plastic", "paper", "organic", "glass", "metal", "textile"]


def _get_model():
    global _model
    if _model is None:
        _model = FillRateModel.load()
    return _model


def predict(current_level_pct, days_since_last_collection):
    model = _get_model()
    predicted = model.predict(current_level_pct, days_since_last_collection)
    return {
        "predicted_level_tomorrow": predicted,
        "recommend_collect": model.recommend_collect(predicted),
    }


def classify(waste_point_id, current_level_pct, max_capacity_kg, category):
    fill = max(0.0, min(1.0, int(current_level_pct or 0) / 100.0))
    capacity = float(max_capacity_kg or 200)
    rnd = random.Random(hashlib.md5(str(waste_point_id or "bin").encode()).hexdigest())

    total_kg = round(capacity * fill * (0.78 + rnd.uniform(0.0, 0.08)), 1)
    if total_kg <= 0:
        return {
            "total_kg": 0.0,
            "composition": {},
            "primary_category": category or "other",
            "confidence": 0.0,
        }

    primary = category if category in COMMON_CATEGORIES else "other"
    share = 0.82 + rnd.uniform(-0.06, 0.06)
    others = [c for c in COMMON_CATEGORIES if c != primary][:3]
    composition = {}
    composition[primary] = round(total_kg * share, 1)

    remaining = total_kg - composition[primary]
    if remaining > 0 and others:
        weights = [rnd.uniform(0.2, 1.0) for _ in others]
        total_w = sum(weights)
        assigned = 0.0
        for i, other in enumerate(others):
            part = round(remaining * (weights[i] / total_w), 1)
            composition[other] = part
            assigned += part
        if others:
            last = others[-1]
            composition[last] = round(composition[last] + (remaining - assigned), 1)

    comp_sum = sum(composition.values())
    if comp_sum != total_kg and comp_sum > 0:
        composition[primary] = round(composition[primary] + (total_kg - comp_sum), 1)

    return {
        "total_kg": total_kg,
        "composition": composition,
        "primary_category": primary,
        "confidence": round(0.55 + fill * 0.42, 2),
    }
