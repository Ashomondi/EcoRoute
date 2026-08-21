#!/usr/bin/env python3
"""EcoRoute AI prediction service — /predict and /classify contracts.

Thin, stateless HTTP layer that the Go backend (waste_service.go /
smart_bin_service.go) calls for waste-level forecasting and smart-bin
classification. Prediction logic lives in predictor.py; the model is
trained offline by data/train.py. Runs on stdlib only.

Usage:
    python3 ai/services/api.py
    (defaults to 0.0.0.0:8000)
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from predictor import classify, predict  # noqa: E402


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
            body, status = self.route(payload)
        except (ValueError, TypeError):
            body = json.dumps({"error": "invalid payload"}).encode()
            status = 400

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def route(self, payload):
        if self.path == "/predict":
            result = predict(
                int(payload.get("current_level_pct", 0)),
                int(payload.get("days_since_last_collection", 1)),
            )
        elif self.path == "/classify":
            result = classify(
                payload.get("waste_point_id"),
                int(payload.get("current_level_pct", 0)),
                float(payload.get("max_capacity_kg", 200)),
                payload.get("category"),
            )
        else:
            return {"error": "not found"}, 404
        return json.dumps(result).encode(), 200

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("ai service listening on :8000")
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
