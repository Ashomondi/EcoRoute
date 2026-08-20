"""Data preparation for the fill-rate model.

Generates the historical dataset (dataset.csv) if it does not already
exist, and provides a loader used by the training step.
"""

import csv
import os
import random

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset.csv")

POINTS = ["kondele", "nyalenda", "market-a", "manyatta"]


def generate(path=DATA_PATH, rows_per_point=25, seed=42):
    random.seed(seed)
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["waste_point_id", "level_pct", "days_since_last_collection"])
        for point in POINTS:
            for _ in range(rows_per_point):
                days = random.randint(1, 20)
                level = random.randint(10, 90)
                writer.writerow([point, level, days])


def load(path=DATA_PATH):
    rows = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    return rows


if __name__ == "__main__":
    if not os.path.exists(DATA_PATH):
        generate()
        print(f"generated {DATA_PATH}")
    else:
        print(f"{DATA_PATH} already exists ({len(load())} rows)")
