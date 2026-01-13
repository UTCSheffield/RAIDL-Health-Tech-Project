// server.js
import express from "express";

const app = express();
app.use(express.json());

// Allow simple CORS for testing; tighten in production
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // change to your origin in production
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return res.status(500).json({ error: "Server missing GROQ_API_KEY" });

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        stream: false,
        max_completion_tokens: 512
      })
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return res.status(500).json({ error: "Groq API error", details: data || await resp.text() });
    }

    const reply = data?.choices?.[0]?.message?.content ?? null;
    if (!reply) return res.status(500).json({ error: "No reply from model", completion: data });

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// Railway provides PORT; default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
