@echo off
REM ============================================================
REM POLARIS — Local Development Environment Launcher (Windows)
REM SIH 2026 Problem Statement ID: SIH26060
REM ============================================================

echo ============================================================
echo Starting POLARIS Development Environment...
echo Polar Operations ^& Logistics Automated Remote Intelligence System
echo ============================================================

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but not installed or not in PATH.
    exit /b 1
)

echo.
echo Launching Backend (Port 5000) and Frontend (Port 5173)...
echo.

call npm run dev
