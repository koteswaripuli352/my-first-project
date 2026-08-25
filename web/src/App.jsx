import { useEffect, useRef, useState } from "react";
import { sendMessage } from "./gemini";
import "./App.css";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const MODEL = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash";

export default function App() {
  const [messages, setMessages] = useState([]); // {role: "user"|"model", text: string}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendMessage(nextMessages, API_KEY, MODEL);
      setMessages([...nextMessages, { role: "model", text: reply }]);
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1>Gemini Chat</h1>
        <span className="model-badge">{MODEL}</span>
      </header>

      {!API_KEY && (
        <div className="banner banner-warn">
          No API key found. Copy <code>.env.example</code> to <code>.env</code>, set{" "}
          <code>VITE_GEMINI_API_KEY</code>, and restart <code>npm run dev</code>.
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-hint">Say something to start the conversation.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble-${m.role}`}>
            <div className="bubble-role">{m.role === "user" ? "You" : "Gemini"}</div>
            <div className="bubble-text">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="bubble bubble-model bubble-loading">
            <div className="bubble-role">Gemini</div>
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
          placeholder="Message Gemini…"
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
