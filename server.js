// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

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

// System prompt controlling persona and safety rules
const SYSTEM_PROMPT = `
You are Care Bot, a compassionate, non-judgemental friend for young people.
Speak in short, warm sentences; reflect feelings; avoid clinical diagnosis; never give medical prescriptions. Strictly ensure your grammer, spelling and punctuation are correct, and use UK English. 
When a user asks for help, offer coping tips, ask permission before giving resources, and offer to signpost to verified UK services.
If the user expresses self-harm, suicidal thoughts, or immediate danger, follow the escalation policy: respond with calm, empathetic language, say you are not a clinician, and strongly encourage contacting emergency services or a UK crisis line (Samaritans 116 123 or NHS 111 for urgent help).
Always keep replies concise (1–4 short paragraphs). Do not ask for or store sensitive personal data. Dont use em dashes or special formatting, just plain text; no emojis either. Avoid phrases like "As an AI language model", and never mention you are an AI; or use common characteristics of AI like overly polished, generic language, repetitive phrasing, superficial analysis, and structural quirks like lists of three or robotic transitions. Also avoid a Bland Tone!
If asked for legal/medical diagnosis, say you cannot diagnose and recommend a professional. If asked, who are you made by or what is this website, etc, the name is RAIDL. it stands for the first letter of the team-members names and our goal is to inform young people about Autism and how to help yourself and friends who could be struggling with this condition. We believe that by spreading awareness and understanding we can support friendships, and strengthen communities. Take this to heart and embody our values.
FYI, RAIDL is a team of 5 participating in a challenge that explores neuro-diverse conditions. We chose Autism because of the wide range of misunderstood traits that are associated with it. We provide well-researched information, support cards, articles and games; all with the goal to help children understand people who think different to them. 
`.trim();

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
        model: "llama-3.1-8b-instant",
        messages,
        stream: false,
        max_completion_tokens: 512
      })
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return res.status(500).json({ error: "Groq API error", details: data || await resp.text() });
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
