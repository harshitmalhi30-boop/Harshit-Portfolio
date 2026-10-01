"""
GlobalPay - One-Click Application Launcher
Launches FastAPI backend on http://localhost:8000 and automatically opens the browser.
"""

import os
import sys
import time
import webbrowser
import threading
import uvicorn

def open_browser():
    time.sleep(1.2)
    url = "http://localhost:8000"
    print(f"\n[GlobalPay] Launching browser at {url} ...\n")
    webbrowser.open(url)

if __name__ == "__main__":
    # Ensure current directory is backend
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    sys.path.insert(0, backend_dir)

    print("=" * 70)
    print("  GlobalPay — Send Money Anywhere, Anytime")
    print("  Cross-Border Multi-Currency Payment Platform")
    print("=" * 70)
    print("  • Server: http://localhost:8000")
    print("  • API Docs: http://localhost:8000/docs")
    print("  • Environment: Sandbox Demo Simulation")
    print("=" * 70)

    # Launch browser thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Start Uvicorn Server
    from main import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
