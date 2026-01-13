// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API route
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
    if (!resp.ok) return res.status(500).json({ error: "Groq API error", details: data || await resp.text() });

    const reply = data?.choices?.[0]?.message?.content ?? null;
    if (!reply) return res.status(500).json({ error: "No reply from model", completion: data });

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// Serve static files from Astro build output
const staticDir = path.join(__dirname, "dist");
app.use(express.static(staticDir));

// SPA / fallback: serve index.html for unknown GET routes so client-side routing works
// Replace this block:
// app.get("*", (req, res) => {
//   res.sendFile(path.join(staticDir, "index.html"), (err) => {
//     if (err) {
//       res.status(404).send("Not found");
//     }
//   });
// });

// With this middleware fallback:
app.use((req, res, next) => {
  // Only serve index.html for GET requests that accept HTML
  if (req.method === "GET" && req.headers.accept && req.headers.accept.includes("text/html")) {
    return res.sendFile(path.join(staticDir, "index.html"), (err) => {
      if (err) {
        console.error("Error sending index.html:", err);
        return res.status(500).send("Server error");
      }
    });
  }
  // For other requests, continue to next handler (so API routes still work)
  next();
});


// Railway provides PORT; default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
