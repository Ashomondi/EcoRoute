"""Waste-level prediction model (alias).

Kept as a stable import path; the implementation lives in
prediction_model.py so both services and scripts import one source.
"""

from models.prediction_model import FillRateModel  # noqa: F401
