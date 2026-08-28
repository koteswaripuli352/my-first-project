// Minimal client for the Google Gemini API (Generative Language API).
// Docs: https://ai.google.dev/gemini-api/docs

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Sends the full chat history to Gemini and returns the model's reply text.
 *
 * @param {{role: "user"|"model", text: string}[]} history - prior turns, oldest first
 * @param {string} apiKey - Gemini API key (from https://aistudio.google.com/apikey)
 * @param {string} model - model id, e.g. "gemini-3.6-flash"
 * @param {AbortSignal} [signal] - lets the caller cancel an in-flight request
 * @returns {Promise<string>} the model's reply text
 */
export async function sendMessage(history, apiKey, model, signal) {
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set VITE_GEMINI_API_KEY in web/.env and restart the dev server."
    );
  }

  const url = `${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message ?? JSON.stringify(errJson);
    } catch {
      detail = await res.text();
    }
    throw new Error(`Gemini API error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];

  // A prompt can be blocked by safety filters, in which case there is no candidate content.
  if (!candidate?.content?.parts?.length) {
    const reason = candidate?.finishReason ?? data?.promptFeedback?.blockReason;
    throw new Error(
      reason ? `Gemini returned no content (reason: ${reason}).` : "Gemini returned no content."
    );
  }

  return candidate.content.parts.map((p) => p.text ?? "").join("");
}
