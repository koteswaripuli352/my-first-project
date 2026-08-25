# Gemini Chat

A minimal React chat UI that talks directly to the Google Gemini API
(Generative Language API) from the browser.

## Setup

1. Get an API key: https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env` and paste your key into
   `VITE_GEMINI_API_KEY`. `VITE_GEMINI_MODEL` defaults to
   `gemini-2.5-flash` — change it if you want a different model id
   (see https://ai.google.dev/gemini-api/docs/models for current ids).
3. Install dependencies:

   ```
   npm install
   ```

4. Run the dev server:

   ```
   npm run dev
   ```

   Then open the printed `http://localhost:5173` URL.

## How it works

- [src/gemini.js](src/gemini.js) — a small fetch-based client that POSTs
  the running conversation to
  `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  and returns the reply text.
- [src/App.jsx](src/App.jsx) — chat UI: message list, input box, loading
  and error states. Keeps the whole conversation in React state and
  resends it each turn (the API is stateless per-request).

## ⚠️ API key exposure

This calls the Gemini API **directly from the browser**, so the API key
in `.env` ends up in the client bundle and is visible to anyone using
the page. That's fine for local/personal use, but before deploying this
anywhere public, put a small backend (or a serverless function) in
front of the Gemini API to hold the key server-side instead.

## Build

```
npm run build
```

Outputs a static site to `dist/`.
