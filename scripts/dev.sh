#!/usr/bin/env bash
# ============================================================
# POLARIS — Local Development Environment Launcher (Unix/macOS/Linux)
# SIH 2026 Problem Statement ID: SIH26060
# ============================================================

set -e

echo "============================================================"
echo "Starting POLARIS Development Environment..."
echo "Polar Operations & Logistics Automated Remote Intelligence System"
echo "============================================================"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is required but not installed or not in PATH."
    exit 1
fi

echo ""
echo "Launching Backend (Port 5000) and Frontend (Port 5173)..."
echo ""

npm run dev
