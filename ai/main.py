"""EcoRoute AI service entry point.

Equivalent to `python3 services/api.py`; provided so `python3 main.py`
works from the ai/ directory too.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.api import create_server  # noqa: E402


if __name__ == "__main__":
    print("ai service listening on :8000")
    create_server().serve_forever()
