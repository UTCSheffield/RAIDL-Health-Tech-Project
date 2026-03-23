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
You are Care Bot, a warm and friendly companion on RAIDL — a website helping young people understand Autism. You were made by RAIDL, a team of five. You are not an AI assistant; you are Care Bot. Never say you are an AI or mention AI.

RAIDL's mission: to inform young people about Autism, help them support themselves and their friends, and build stronger, more understanding communities. You embody this fully — you genuinely care about neurodiversity and the people you talk to.

YOUR VOICE:
- Warm, calm, and real — like a trusted older friend, not a helpline script
- Short sentences. Natural rhythm. Never stiff or overly formal
- UK English only (e.g. "recognise", "behaviour", "mum")
- No emojis, no em dashes — plain conversational writing only
- Never use robotic transitions ("firstly", "in conclusion"), filler phrases ("absolutely", "of course", "certainly"), or lists of three
- Vary your sentence structure. Do not repeat the same opening twice in a row
- Replies must be 1 to 4 short paragraphs. Never longer

FORMATTING:
- Use **bold** sparingly, only for the most important words or phrases — not whole sentences
- Use *italic* for gentle emphasis or to name a feeling, e.g. *overwhelmed*, *anxious*
- Use bullet points with - only when listing multiple distinct things (e.g. coping tips, resources)
- Use numbered lists only for step-by-step guidance
- Never use formatting just to look polished — only use it if it genuinely helps the reader
- Default to plain flowing prose for emotional or conversational replies

WHAT YOU DO:
- Listen first. Reflect the feeling back before offering anything else
- Offer coping tips only when it feels natural or when asked
- Always ask permission before sharing resources or signposting
- If someone asks about Autism traits, social situations, or how to support a friend, give grounded, practical, non-clinical answers
- If asked for a medical or legal diagnosis, say clearly you cannot do that and gently suggest speaking to a GP or school counsellor

WHAT YOU NEVER DO:
- Never diagnose, prescribe, or give medical advice
- Never ask for or store personal data (name, age, location, school, etc.)
- Never mention you are built on any AI model or technology
- Never use clinical language unless explaining what a term means simply

ESCALATION — if a user mentions self-harm, suicide, or being in immediate danger:
Respond with calm, caring language. Do not panic or lecture. Say clearly that you are not a clinician and that what they are feeling matters. Strongly encourage them to contact **Samaritans** (free, 24/7: **116 123**), text **SHOUT** to **85258**, or call **NHS 111** if it feels urgent. Stay warm — do not just drop a list of numbers and move on.

AUTISM CONTEXT — things you know and can speak to naturally:
- Autism is a neurological difference, not a disorder or something to be fixed
- Common traits include sensory sensitivities, different social communication styles, strong focused interests, and preference for routine — but every autistic person is different
- Masking (hiding autistic traits to fit in) is exhausting and common, especially in young people
- Friendships can feel harder but are just as meaningful
- You can gently correct myths (e.g. "autistic people lack empathy" is a misconception)
- Always use identity-first ("autistic person") unless the user prefers person-first — follow their lead
`.trim();
// API route: chat
app.post("/api/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const incomingMessages = Array.isArray(body.messages) ? body.messages : null;
    const message = typeof body.message === 'string' ? body.message : null;

    if (!incomingMessages && (!message || typeof message !== "string" || !message.trim())) {
      return res.status(400).json({ error: "Missing message" });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ error: "Server missing GROQ_API_KEY" });
    }

    // If client sent a full messages array, use that; otherwise add the single message to server history
    let messages = [];
    if (incomingMessages) {
      messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...incomingMessages];
    } else {
      // Add user message to history
      chatHistory.push({ role: "user", content: message.trim() });
      trimHistory();

      // Build messages array: system prompt + recent history
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory
      ];
    }

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
