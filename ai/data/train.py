"""Offline training: fit the fill-rate model from the dataset.

Run: python3 ai/data/train.py
Writes the fitted parameters to ai/models/fill_rate.json, which the
prediction service loads at startup.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.prepare import load  # noqa: E402
from models.prediction_model import FillRateModel  # noqa: E402


def main():
    rows = load()
    model = FillRateModel.fit(rows)
    model.save()
    print(f"trained fill-rate model from {len(rows)} rows: slope={model.slope:.3f}")


if __name__ == "__main__":
    main()
