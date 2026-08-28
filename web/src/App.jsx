import { useEffect, useRef, useState } from "react";
import { sendMessage } from "./gemini";
import { loadState, saveState, createChat, deriveTitle } from "./storage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { BotAvatar, UserAvatar } from "./components/Icons";
import "./App.css";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
// gemini-2.5-flash was retired; gemini-3.6-flash is the current default.
const ENV_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-3.6-flash";

function prettifyModel(id) {
  return id
    .split("-")
    .map((part) => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

// Only list model ids that are actually confirmed to work with this API
// key/endpoint — add more entries here once you've verified them.
const AVAILABLE_MODELS = [{ id: ENV_MODEL, label: prettifyModel(ENV_MODEL) }];

function initialState() {
  const loaded = loadState();
  if (loaded && loaded.chats.length > 0) {
    const activeChatId = loaded.chats.some((c) => c.id === loaded.activeChatId)
      ? loaded.activeChatId
      : loaded.chats[0].id;
    const selectedModel = AVAILABLE_MODELS.some((m) => m.id === loaded.selectedModel)
      ? loaded.selectedModel
      : ENV_MODEL;
    return { chats: loaded.chats, activeChatId, selectedModel };
  }
  const chat = createChat();
  return { chats: [chat], activeChatId: chat.id, selectedModel: ENV_MODEL };
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  // Keyed by chat id so switching chats doesn't show one chat's spinner/error
  // banner over another's.
  const [loadingChatIds, setLoadingChatIds] = useState(() => new Set());
  const [errorsByChat, setErrorsByChat] = useState({});
  const controllersRef = useRef(new Map()); // chat id -> AbortController

  const bottomRef = useRef(null);

  const activeChat =
    state.chats.find((c) => c.id === state.activeChatId) ?? state.chats[0];
  const messages = activeChat?.messages ?? [];
  const loading = activeChat ? loadingChatIds.has(activeChat.id) : false;
  const error = activeChat ? (errorsByChat[activeChat.id] ?? null) : null;

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleNewChat() {
    const chat = createChat();
    setState((prev) => ({ ...prev, chats: [chat, ...prev.chats], activeChatId: chat.id }));
    setInput("");
  }

  function handleSelectChat(id) {
    setState((prev) => ({ ...prev, activeChatId: id }));
    setInput("");
  }

  function handleDeleteChat(id) {
    // Abort any in-flight request for this chat so its reply (and the
    // token spend behind it) isn't produced only to be thrown away.
    controllersRef.current.get(id)?.abort();
    controllersRef.current.delete(id);

    setLoadingChatIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setErrorsByChat((prev) => {
      if (!(id in prev)) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

    setState((prev) => {
      const remaining = prev.chats.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const chat = createChat();
        return { ...prev, chats: [chat], activeChatId: chat.id };
      }
      const activeChatId = prev.activeChatId === id ? remaining[0].id : prev.activeChatId;
      return { ...prev, chats: remaining, activeChatId };
    });
  }

  function handleSelectModel(modelId) {
    setState((prev) => ({ ...prev, selectedModel: modelId }));
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || !activeChat) return;

    const chatId = activeChat.id;
    const isFirstMessage = activeChat.messages.length === 0;
    const nextMessages = [...activeChat.messages, { role: "user", text }];

    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((c) =>
        c.id === chatId
          ? { ...c, messages: nextMessages, title: isFirstMessage ? deriveTitle(text) : c.title }
          : c
      ),
    }));
    setInput("");
    setErrorsByChat((prev) => ({ ...prev, [chatId]: null }));
    setLoadingChatIds((prev) => new Set(prev).add(chatId));

    const controller = new AbortController();
    controllersRef.current.set(chatId, controller);

    try {
      const reply = await sendMessage(nextMessages, API_KEY, state.selectedModel, controller.signal);
      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((c) =>
          c.id === chatId ? { ...c, messages: [...nextMessages, { role: "model", text: reply }] } : c
        ),
      }));
    } catch (err) {
      if (err.name === "AbortError") return; // chat was deleted mid-request
      setErrorsByChat((prev) => ({ ...prev, [chatId]: err.message ?? String(err) }));
    } finally {
      controllersRef.current.delete(chatId);
      setLoadingChatIds((prev) => {
        if (!prev.has(chatId)) return prev;
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        chats={state.chats}
        activeChatId={activeChat?.id}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
      />

      <div className="main-pane">
        <Header
          title="My Gemini App"
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          models={AVAILABLE_MODELS}
          selectedModel={state.selectedModel}
          onSelectModel={handleSelectModel}
        />

        {!API_KEY && (
          <div className="banner banner-warn">
            No API key found. Copy <code>.env.example</code> to <code>.env</code>, set{" "}
            <code>VITE_GEMINI_API_KEY</code>, and restart <code>npm run dev</code>.
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="bubble bubble-model bubble-greeting">
              <BotAvatar className="bubble-avatar" />
              <div className="bubble-text">Hello! How can I help you today?</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble bubble-${m.role}`}>
              {m.role === "model" && <BotAvatar className="bubble-avatar" />}
              <div className="bubble-text">{m.text}</div>
              {m.role === "user" && <UserAvatar className="bubble-avatar" />}
            </div>
          ))}
          {loading && (
            <div className="bubble bubble-model bubble-loading">
              <BotAvatar className="bubble-avatar" />
              <div className="bubble-text">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Gemini"
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
