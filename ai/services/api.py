#!/usr/bin/env python3
"""EcoRoute AI prediction service — /predict contract.

Thin, stateless HTTP layer that the Go backend (waste_service.go) calls for
waste-level forecasting. MVP model: linear fill-rate extrapolation.
Runs on stdlib only so it needs no pip install.

Usage:
    python3 ai/services/api.py
    (defaults to 0.0.0.0:8000)
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

COLLECT_THRESHOLD_PCT = 85.0
FILL_RATE_PER_DAY_PCT = 3.0


def predict(payload):
    level = int(payload.get("current_level_pct", 0))
    days = int(payload.get("days_since_last_collection", 1))
    predicted = min(100.0, level + FILL_RATE_PER_DAY_PCT * days)
    return {
        "predicted_level_tomorrow": round(predicted, 1),
        "recommend_collect": predicted >= COLLECT_THRESHOLD_PCT,
    }


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/predict":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
            body = json.dumps(predict(payload)).encode()
            status = 200
        except (ValueError, TypeError):
            body = json.dumps({"error": "invalid payload"}).encode()
            status = 400

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8000), Handler)
    print("ai service listening on :8000")
    server.serve_forever()
