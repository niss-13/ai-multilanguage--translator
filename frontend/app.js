/**
 * AI Multilanguage Translator
 * Frontend JavaScript
 * College Project – Powered by Google Gemini + Python Flask
 */

const API_BASE = "http://localhost:5000/api";

// ── DOM Elements ──────────────────────────────────────────────
const sourceLangEl    = document.getElementById("sourceLang");
const targetLangEl    = document.getElementById("targetLang");
const sourceTextEl    = document.getElementById("sourceText");
const resultAreaEl    = document.getElementById("resultArea");
const translateBtn    = document.getElementById("translateBtn");
const btnText         = document.getElementById("btnText");
const btnSpinner      = document.getElementById("btnSpinner");
const swapBtn         = document.getElementById("swapBtn");
const detectBtn       = document.getElementById("detectBtn");
const clearBtn        = document.getElementById("clearBtn");
const copyBtn         = document.getElementById("copyBtn");
const charCountEl     = document.getElementById("charCount");
const errorBox        = document.getElementById("errorBox");
const errorMessage    = document.getElementById("errorMessage");
const statusBadge     = document.getElementById("statusBadge");
const statusText      = document.getElementById("statusText");
const detectedBadge   = document.getElementById("detectedLangBadge");

// ── State ─────────────────────────────────────────────────────
let translatedText = "";
let isTranslating  = false;

// ── Init ──────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  loadLanguages();
  setupEventListeners();
});

// ── Health Check ──────────────────────────────────────────────
async function checkHealth() {
  try {
    const res  = await fetch(`${API_BASE}/health`);
    const data = await res.json();

    if (res.ok && data.status === "running") {
      setStatus("online", "Backend Online");
    } else {
      setStatus("offline", "Backend Error");
    }
  } catch {
    setStatus("offline", "Backend Offline");
  }
}

function setStatus(type, text) {
  statusBadge.className = `status-badge ${type}`;
  statusText.textContent = text;
}

// ── Load Languages ────────────────────────────────────────────
async function loadLanguages() {
  try {
    const res  = await fetch(`${API_BASE}/languages`);
    const data = await res.json();
    const langs = data.languages || [];

    // Source lang — add Auto Detect first (already in HTML), then all others
    langs.forEach(lang => {
      const opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang;
      sourceLangEl.appendChild(opt);
    });

    // Target lang — no auto detect option
    langs.forEach((lang, i) => {
      const opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang;
      if (lang === "Hindi") opt.selected = true; // default target
      targetLangEl.appendChild(opt);
    });

  } catch (err) {
    showError("Could not load languages. Make sure the backend is running at http://localhost:5000");
  }
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
  translateBtn.addEventListener("click", handleTranslate);
  detectBtn.addEventListener("click", handleDetect);
  swapBtn.addEventListener("click", handleSwap);
  clearBtn.addEventListener("click", handleClear);
  copyBtn.addEventListener("click", handleCopy);

  sourceTextEl.addEventListener("input", () => {
    updateCharCount();
    hideError();
    hidePlaceholder();
  });

  // Ctrl+Enter shortcut
  sourceTextEl.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleTranslate();
    }
  });
}

// ── Character Count ───────────────────────────────────────────
function updateCharCount() {
  const len = sourceTextEl.value.length;
  charCountEl.textContent = `${len} / 5000`;
  charCountEl.className = "char-count";
  if (len > 4500) charCountEl.classList.add("danger");
  else if (len > 4000) charCountEl.classList.add("warning");
}

// ── Translate ─────────────────────────────────────────────────
async function handleTranslate() {
  const text       = sourceTextEl.value.trim();
  const sourceLang = sourceLangEl.value;
  const targetLang = targetLangEl.value;

  if (!text) {
    showError("Please enter some text to translate.");
    sourceTextEl.focus();
    return;
  }

  if (!targetLang) {
    showError("Please select a target language.");
    return;
  }

  hideError();
  setTranslating(true);
  setResultLoading();

  try {
    const res = await fetch(`${API_BASE}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    translatedText = data.translated_text;
    showResult(translatedText);

    // Enable copy
    copyBtn.disabled = false;

    // If auto-detect was used, show detected language in source select
    if (sourceLang === "Auto Detect") {
      // We can run a detect to show it
      detectAndUpdateBadge(text);
    } else {
      detectedBadge.classList.add("hidden");
    }

  } catch (err) {
    showError(err.message || "Translation failed. Check backend connection.");
    setResultPlaceholder();
    copyBtn.disabled = true;
    translatedText = "";
  } finally {
    setTranslating(false);
  }
}

// ── Detect Language ───────────────────────────────────────────
async function handleDetect() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    showError("Please enter some text to detect language.");
    return;
  }

  hideError();
  detectBtn.disabled = true;
  detectBtn.textContent = "🔄 Detecting...";

  try {
    const res  = await fetch(`${API_BASE}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Detection failed");

    const detected = data.detected_language;

    // Try to select the detected language in source dropdown
    const options = Array.from(sourceLangEl.options);
    const match   = options.find(o => o.value.toLowerCase() === detected.toLowerCase());
    if (match) {
      sourceLangEl.value = match.value;
    }

    showDetectedBadge(`Detected: ${detected}`);

  } catch (err) {
    showError(err.message || "Language detection failed.");
  } finally {
    detectBtn.disabled = false;
    detectBtn.textContent = "🔎 Detect";
  }
}

async function detectAndUpdateBadge(text) {
  try {
    const res  = await fetch(`${API_BASE}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (res.ok) showDetectedBadge(`Auto-detected: ${data.detected_language}`);
  } catch {}
}

// ── Swap Languages ────────────────────────────────────────────
function handleSwap() {
  const currentSource = sourceLangEl.value;
  const currentTarget = targetLangEl.value;
  const currentResult = translatedText;

  // Only swap if source isn't Auto Detect
  if (currentSource === "Auto Detect") {
    // Set source to previous target
    const match = Array.from(sourceLangEl.options).find(o => o.value === currentTarget);
    if (match) sourceLangEl.value = currentTarget;
  } else {
    // Swap both
    const sourceMatch = Array.from(targetLangEl.options).find(o => o.value === currentSource);
    const targetMatch = Array.from(sourceLangEl.options).find(o => o.value === currentTarget);
    if (sourceMatch) targetLangEl.value = currentSource;
    if (targetMatch) sourceLangEl.value = currentTarget;
  }

  // Put translated text into source if available
  if (currentResult) {
    sourceTextEl.value = currentResult;
    updateCharCount();
    setResultPlaceholder();
    translatedText = "";
    copyBtn.disabled = true;
    detectedBadge.classList.add("hidden");
  }

  hideError();
}

// ── Clear ─────────────────────────────────────────────────────
function handleClear() {
  sourceTextEl.value = "";
  updateCharCount();
  setResultPlaceholder();
  translatedText = "";
  copyBtn.disabled = true;
  detectedBadge.classList.add("hidden");
  hideError();
  sourceTextEl.focus();
}

// ── Copy ──────────────────────────────────────────────────────
async function handleCopy() {
  if (!translatedText) return;

  try {
    await navigator.clipboard.writeText(translatedText);
    copyBtn.textContent  = "✓ Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "⎘ Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = translatedText;
    ta.style.position = "fixed";
    ta.style.opacity  = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => { copyBtn.textContent = "⎘ Copy"; }, 2000);
  }
}

// ── UI Helpers ────────────────────────────────────────────────
function setTranslating(state) {
  isTranslating       = state;
  translateBtn.disabled = state;
  swapBtn.disabled    = state;
  detectBtn.disabled  = state;

  if (state) {
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
  } else {
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

function setResultLoading() {
  resultAreaEl.className = "result-area loading";
  resultAreaEl.innerHTML = `
    <div class="spinner" style="border-color:rgba(37,99,235,0.2);border-top-color:var(--primary);"></div>
    Translating...
  `;
}

function showResult(text) {
  resultAreaEl.className = "result-area";
  resultAreaEl.textContent = text;
}

function setResultPlaceholder() {
  resultAreaEl.className = "result-area";
  resultAreaEl.innerHTML = '<span class="placeholder-text">Translation will appear here...</span>';
}

function hidePlaceholder() {
  // Already handled by setResultLoading/showResult
}

function showError(msg) {
  errorBox.classList.remove("hidden");
  errorMessage.textContent = msg;
}

function hideError() {
  errorBox.classList.add("hidden");
}

function showDetectedBadge(text) {
  detectedBadge.textContent = text;
  detectedBadge.classList.remove("hidden");
}
