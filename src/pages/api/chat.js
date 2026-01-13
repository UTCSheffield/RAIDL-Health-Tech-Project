// src/pages/api/chat.js
import { Groq } from "groq-sdk";

console.log("DEBUG: GROQ env present:", typeof process.env.GROQ_API_KEY !== "undefined");
console.log("DEBUG: GROQ env length:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);

let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) {
  console.error("DEBUG: Groq client init error:", e);
}

export async function POST({ request }) {
  try {
    const { message } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "Server missing GROQ_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!groq) {
      return new Response(JSON.stringify({ error: "Groq client not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

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
