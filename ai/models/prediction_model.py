"""Fill-rate prediction model.

A deliberately small, stdlib-only linear model: predicts tomorrow's fill
level as current level plus a learned fill rate (slope) times the days
since the last collection. Training is offline (data/train.py) and the
predictor loads the fitted parameters at startup.
"""

import json
import os

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fill_rate.json")

DEFAULT_SLOPE = 3.0
COLLECT_THRESHOLD_PCT = 85.0


class FillRateModel:
    def __init__(self, slope):
        self.slope = slope

    @classmethod
    def fit(cls, rows):
        numerator = 0.0
        denominator = 0.0
        for row in rows:
            days = float(row.get("days_since_last_collection", 0) or 0)
            level = float(row.get("level_pct", 0) or 0)
            if days > 0 and level >= 0:
                numerator += level
                denominator += days
        slope = (numerator / denominator) if denominator else DEFAULT_SLOPE
        return cls(slope)

    def predict(self, level, days):
        return min(100.0, round(level + self.slope * days, 1))

    def recommend_collect(self, predicted):
        return predicted >= COLLECT_THRESHOLD_PCT

    def save(self, path=None):
        with open(path or MODEL_PATH, "w") as f:
            json.dump({"slope": self.slope}, f)

    @classmethod
    def load(cls, path=None):
        try:
            with open(path or MODEL_PATH) as f:
                return cls(float(json.load(f).get("slope", DEFAULT_SLOPE)))
        except (OSError, ValueError, TypeError):
            return cls(DEFAULT_SLOPE)
