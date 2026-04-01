# AI Multilanguage Translator 🌐

A college-level AI-powered multilanguage translation web app using **Google Gemini GenAI**, **Python Flask** backend, and a pure **HTML/CSS/JavaScript** frontend.

---

## 📁 Project Structure

```
ai-translator/
├── backend/
│   ├── app.py              ← Flask API server (main backend)
│   ├── requirements.txt    ← Python dependencies
│   ├── .env                ← Your API key goes here (create this)
│   └── .env.example        ← Template for .env
├── frontend/
│   ├── index.html          ← Main HTML page
│   ├── style.css           ← All styles
│   └── app.js              ← All JavaScript logic
├── start_backend.bat       ← Double-click to run backend (Windows)
└── README.md
```

---

## 🚀 Setup & Run

### Step 1: Get a API Key (FREE)


### Step 2: Add your API key
Open `backend/.env` and replace:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
With your actual key:
```
GEMINI_API_KEY=AIza...your_actual_key...
```

### Step 3: Start the Backend
**Option A — Double-click** `start_backend.bat`

**Option B — Manual (PowerShell/CMD):**
```bash
cd backend
venv\Scripts\python app.py
```

You should see:
```
==================================================
   AI Multilanguage Translator - Backend
==================================================
   Supported languages: 73
   Running at: http://localhost:5000
==================================================
```

### Step 4: Open the Frontend
Just **double-click** `frontend/index.html` — it opens in your browser.

> ✅ Make sure the backend is running before opening the frontend!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌍 70+ Languages | English, Hindi, French, Arabic, Japanese, and many more |
| 🤖 AI Translation | Google Gemini Flash for accurate, contextual translations |
| 🔍 Auto Detect | Automatically detect the source language |
| ⇄ Swap Languages | Instantly swap source ↔ target languages |
| ⎘ Copy | One-click copy translated text to clipboard |
| ⌨️ Shortcut | Press `Ctrl+Enter` to translate quickly |

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check if backend is running |
| GET | `/api/languages` | Get list of all supported languages |
| POST | `/api/translate` | Translate text |
| POST | `/api/detect` | Detect language of text |

### Example: Translate
```bash
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello World\", \"source_lang\": \"English\", \"target_lang\": \"Hindi\"}"
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **AI / GenAI** | Google Gemini 1.5 Flash |
| **Backend** | Python 3.x, Flask, Flask-CORS |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **API** | RESTful JSON API |

---

## 📋 College Project Info

- **Subject**: Artificial Intelligence / Web Development
- **Purpose**: Demonstrates GenAI API integration with a full-stack web app
- **AI Model Used**: Google Gemini 1.5 Flash (free tier available)
- **No paid subscriptions required** (Gemini has a free quota)
