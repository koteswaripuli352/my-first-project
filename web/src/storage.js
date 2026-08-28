// Persists chat sessions (sidebar history) to localStorage so they survive
// a page reload. One browser = one private chat list; nothing is sent
// anywhere except the Gemini API calls themselves.

const STORAGE_KEY = "gemini-chat-app:v1";
const TITLE_MAX_LEN = 40;

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function deriveTitle(firstUserMessage) {
  const trimmed = firstUserMessage.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > TITLE_MAX_LEN
    ? `${trimmed.slice(0, TITLE_MAX_LEN).trimEnd()}…`
    : trimmed;
}

export function createChat() {
  return {
    id: newId(),
    title: "New chat",
    messages: [], // {role: "user"|"model", text: string}
    createdAt: Date.now(),
  };
}

/**
 * Reads persisted { chats, activeChatId, selectedModel } from localStorage.
 * Returns null if nothing is stored yet or the stored data is malformed
 * (e.g. from an older/incompatible version), so the caller can fall back
 * to sensible defaults instead of crashing on bad data.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.chats)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or unavailable (private browsing, quota, etc.) —
    // the app still works in-memory for the session, it just won't persist.
  }
}
