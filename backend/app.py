import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenRouter client
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key or api_key == "your_openrouter_api_key_here":
    print("[WARNING] OPENROUTER_API_KEY not set in .env file!")
    print("   Get your free key at: https://openrouter.ai/keys")
    print("   Then add it to backend/.env file")
    client = None
else:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    print("[OK] OpenRouter API configured successfully")

# Supported languages
LANGUAGES = [
    "Afrikaans", "Albanian", "Arabic", "Armenian", "Azerbaijani",
    "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian",
    "Catalan", "Chinese (Simplified)", "Chinese (Traditional)", "Croatian", "Czech",
    "Danish", "Dutch", "English", "Estonian", "Finnish",
    "French", "Galician", "Georgian", "German", "Greek",
    "Gujarati", "Haitian Creole", "Hebrew", "Hindi", "Hungarian",
    "Icelandic", "Indonesian", "Irish", "Italian", "Japanese",
    "Kannada", "Kazakh", "Korean", "Latin", "Latvian",
    "Lithuanian", "Macedonian", "Malay", "Malayalam", "Maltese",
    "Marathi", "Nepali", "Norwegian", "Persian", "Polish",
    "Portuguese", "Punjabi", "Romanian", "Russian", "Serbian",
    "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish",
    "Swahili", "Swedish", "Tamil", "Telugu", "Thai",
    "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese",
    "Welsh", "Yiddish", "Zulu"
]

# OpenRouter model to use (free Gemini Flash via OpenRouter)
MODEL_ID = "google/gemini-2.0-flash-001"


def get_client():
    if client is None:
        raise RuntimeError("OpenRouter API key not configured. Add OPENROUTER_API_KEY to backend/.env")
    return client


def call_model(prompt: str) -> str:
    """Call the OpenRouter API and return the text response."""
    c = get_client()
    response = c.chat.completions.create(
        model=MODEL_ID,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()


@app.route("/", methods=["GET"])
def index():
    """Root route - helpful message when visiting the backend directly."""
    return jsonify({
        "message": "AI Translator Backend is running!",
        "hint": "Open frontend/index.html in your browser to use the app.",
        "endpoints": ["/api/health", "/api/languages", "/api/translate", "/api/detect"]
    })


@app.route("/api/languages", methods=["GET"])
def get_languages():
    """Return list of supported languages."""
    return jsonify({"languages": LANGUAGES, "count": len(LANGUAGES)})


@app.route("/api/translate", methods=["POST"])
def translate():
    """
    Translate text using OpenRouter / Gemini.
    Body: { "text": str, "source_lang": str, "target_lang": str }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        text = data.get("text", "").strip()
        source_lang = data.get("source_lang", "Auto Detect").strip()
        target_lang = data.get("target_lang", "English").strip()

        if not text:
            return jsonify({"error": "No text provided"}), 400

        if not target_lang:
            return jsonify({"error": "Target language is required"}), 400

        if len(text) > 5000:
            return jsonify({"error": "Text too long. Maximum 5000 characters allowed."}), 400

        # Build prompt
        if source_lang in ("Auto Detect", ""):
            source_info = "Detect the source language automatically"
        else:
            source_info = f"Source language: {source_lang}"

        prompt = f"""You are a professional language translator.

Task: Translate the following text to {target_lang}.
{source_info}

Rules:
- Provide ONLY the translated text with no explanation, no extra notes, no quotation marks
- Preserve the original formatting (newlines, punctuation style)
- Keep proper nouns, brand names, and technical terms as appropriate
- If the text is already in {target_lang}, return it as-is

Text to translate:
{text}

Translation:"""

        translated = call_model(prompt)

        return jsonify({
            "success": True,
            "original_text": text,
            "translated_text": translated,
            "source_lang": source_lang,
            "target_lang": target_lang
        })

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "authentication" in error_msg.lower() or "UNAUTHENTICATED" in error_msg:
            return jsonify({"error": "Invalid or missing OpenRouter API key. Please check your .env file."}), 401
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            return jsonify({"error": "API rate limit exceeded. Please try again in a moment."}), 429
        return jsonify({"error": f"Translation failed: {error_msg}"}), 500


@app.route("/api/detect", methods=["POST"])
def detect_language():
    """
    Detect the language of given text.
    Body: { "text": str }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "No text provided"}), 400

        if len(text) > 1000:
            text = text[:1000]  # Only use first 1000 chars for detection

        prompt = f"""Detect the language of the following text. Reply with ONLY the language name in English (e.g. "French", "Hindi", "Arabic"). No explanation, no extra text.

Text: {text}

Language:"""

        detected = call_model(prompt).strip('"\'.,.').strip()

        return jsonify({
            "success": True,
            "detected_language": detected,
            "text_sample": text[:100]
        })

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "authentication" in error_msg.lower():
            return jsonify({"error": "Invalid or missing OpenRouter API key. Please check your .env file."}), 401
        return jsonify({"error": f"Detection failed: {error_msg}"}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    api_configured = client is not None
    return jsonify({
        "status": "running",
        "api_configured": api_configured,
        "provider": "OpenRouter",
        "model": MODEL_ID,
        "supported_languages": len(LANGUAGES),
        "message": "AI Multilanguage Translator Backend"
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405


if __name__ == "__main__":
    print("\n" + "="*50)
    print("   AI Multilanguage Translator - Backend")
    print("="*50)
    print(f"   Provider            : OpenRouter")
    print(f"   Model               : {MODEL_ID}")
    print(f"   Supported languages : {len(LANGUAGES)}")
    print(f"   Running at          : http://localhost:5000")
    print(f"   Health check        : http://localhost:5000/api/health")
    print("="*50 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
