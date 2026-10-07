// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { SYSTEM_PROMPT } from "./src/utils/chatPrompt.js";

let chatHistory = []; // in-memory history (process-lifetime)
const HISTORY_LIMIT = 20; // keep last N messages

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Helper to trim history
function trimHistory() {
  if (chatHistory.length > HISTORY_LIMIT) {
    chatHistory = chatHistory.slice(-HISTORY_LIMIT);
  }
}

// API route: chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing message" });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ error: "Server missing GROQ_API_KEY" });
    }
    const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    // Add user message to history
    chatHistory.push({ role: "user", content: message.trim() });
    trimHistory();

    // Build messages array: system prompt + recent history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory
    ];

    // Call Groq / OpenAI-compatible chat completions endpoint
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        stream: false,
        max_completion_tokens: 512
      })
    });

    const responseText = await resp.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: { message: responseText || resp.statusText } };
    }

    if (!resp.ok) {
      const details = data?.error?.message || data?.message || "Groq returned an unexpected error";
      console.error(`Groq API error (${resp.status}):`, details);
      return res.status(502).json({ error: "Groq API error", details, upstreamStatus: resp.status });
    }

    const reply = data?.choices?.[0]?.message?.content ?? null;
    if (!reply) {
      return res.status(500).json({ error: "No reply from model", completion: data });
    }

    // Store assistant reply in history and trim
    chatHistory.push({ role: "assistant", content: reply });
    trimHistory();

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// Endpoint to reset conversation history
app.post("/api/reset", (req, res) => {
  chatHistory = [];
  res.json({ ok: true });
});

// Serve static files from Astro build output
const staticDir = path.join(__dirname, "dist");
app.use(express.static(staticDir));

// SPA / fallback: serve index.html for GET requests that accept HTML
app.use((req, res, next) => {
  if (req.method === "GET" && req.headers.accept && req.headers.accept.includes("text/html")) {
    return res.sendFile(path.join(staticDir, "index.html"), (err) => {
      if (err) {
        console.error("Error sending index.html:", err);
        return res.status(500).send("Server error");
      }
    });
  }
  next();
});

// Railway provides PORT; default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
