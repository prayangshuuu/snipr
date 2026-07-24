/**
 * app.js — Frontend logic for snipr.
 *
 * Handles the shorten form, copy-to-clipboard, total count,
 * and stats lookup. No dependencies, no build step.
 */

// --- DOM references ---
const shortenForm  = document.getElementById("shorten-form");
const urlInput     = document.getElementById("url-input");
const aliasInput   = document.getElementById("alias-input");
const shortenBtn   = document.getElementById("shorten-btn");
const formError    = document.getElementById("form-error");

const resultCard   = document.getElementById("result-card");
const shortUrlEl   = document.getElementById("short-url");
const copyBtn      = document.getElementById("copy-btn");
const originalUrl  = document.getElementById("original-url");

const totalCountEl = document.getElementById("total-count");

const statsInput   = document.getElementById("stats-input");
const statsBtn     = document.getElementById("stats-btn");
const statsResult  = document.getElementById("stats-result");
const statsClicks  = document.getElementById("stats-clicks");
const statsUrl     = document.getElementById("stats-url");
const statsError   = document.getElementById("stats-error");

// --- Shorten form ---
shortenForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;
  resultCard.hidden = true;

  const body = { url: urlInput.value.trim() };
  const alias = aliasInput.value.trim();
  if (alias) body.customCode = alias;

  shortenBtn.disabled = true;
  shortenBtn.textContent = "Shortening…";

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      formError.textContent = data.error || data.issues?.join(", ") || "Something went wrong";
      formError.hidden = false;
      return;
    }

    // Show result
    shortUrlEl.value = data.shortUrl;
    originalUrl.textContent = data.originalUrl;
    resultCard.hidden = false;

    // Refresh total count
    fetchTotalCount();

    // Clear inputs
    urlInput.value = "";
    aliasInput.value = "";
  } catch {
    formError.textContent = "Network error. Please try again.";
    formError.hidden = false;
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "Shorten";
  }
});

// --- Copy to clipboard ---
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shortUrlEl.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
  } catch {
    // Fallback: select the text
    shortUrlEl.select();
  }
});

// --- Total count ---
async function fetchTotalCount() {
  try {
    const res = await fetch("/api/count");
    const data = await res.json();
    totalCountEl.textContent = data.count.toLocaleString();
  } catch {
    totalCountEl.textContent = "—";
  }
}

// Fetch on page load
fetchTotalCount();

// --- Stats lookup ---
statsBtn.addEventListener("click", async () => {
  statsError.hidden = true;
  statsResult.hidden = true;

  const code = statsInput.value.trim();
  if (!code) return;

  try {
    const res = await fetch(`/api/stats/${encodeURIComponent(code)}`);
    const data = await res.json();

    if (!res.ok) {
      statsError.textContent = data.error || "Not found";
      statsError.hidden = false;
      return;
    }

    statsClicks.textContent = Number(data.clicks).toLocaleString();
    statsUrl.textContent = data.originalUrl;
    statsResult.hidden = false;
  } catch {
    statsError.textContent = "Network error.";
    statsError.hidden = false;
  }
});
