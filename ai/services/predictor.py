"""Prediction service logic: loads the trained model and serves predictions.

The model is loaded once at startup and reused for every request; training
is a separate offline step (data/train.py).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.prediction_model import FillRateModel  # noqa: E402

_model = None


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
