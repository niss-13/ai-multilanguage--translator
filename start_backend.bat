@echo off
echo.
echo =============================================
echo   AI Multilanguage Translator - Backend
echo =============================================
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and add your Gemini API key.
    echo Get your key at: https://aistudio.google.com/app/apikey
    pause
    exit /b 1
)

echo Starting Flask backend on http://localhost:5000
echo Press Ctrl+C to stop.
echo.

venv\Scripts\python app.py

pause
