// api/chat.js (Vercel serverless)
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: false,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content ?? null;
    if (!reply) return res.status(500).json({ error: "No reply from model", completion });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
