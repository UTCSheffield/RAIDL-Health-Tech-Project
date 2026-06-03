// src/pages/api/chat.js
import { Groq } from "groq-sdk";

export async function POST({ request }) {
  try {
    const { message } = await request.json();

    const apiKey = process.env.GROQ_API_KEY || import.meta.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server missing GROQ_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: false,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content ?? null;

    if (!reply) {
      console.error("DEBUG: completion object:", JSON.stringify(completion));
      return new Response(JSON.stringify({ error: "No reply in completion", completion }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("API /api/chat error:", err);
    return new Response(JSON.stringify({ error: String(err), stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
