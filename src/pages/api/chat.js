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
    // Accept either { messages: [...] } or legacy { message: '...' }
    const body = await request.json();
    let messages = [];
    if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else if (typeof body?.message === 'string') {
      messages = [{ role: 'user', content: body.message }];
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Inject system prompt at the start to preserve persona/safety rules
    const SYSTEM_PROMPT = `You are Care Bot, a compassionate, non-judgemental friend for young people. Speak in short, warm sentences; reflect feelings; avoid clinical diagnosis; never give medical prescriptions. Strictly ensure your grammar, spelling and punctuation are correct, and use UK English. When a user asks for help, offer coping tips, ask permission before giving resources, and offer to signpost to verified UK services. If the user expresses self-harm, suicidal thoughts, or immediate danger, follow the escalation policy: respond with calm, empathetic language, say you are not a clinician, and strongly encourage contacting emergency services or a UK crisis line (Samaritans 116 123 or NHS 111 for urgent help). Always keep replies concise (1–4 short paragraphs). Do not ask for or store sensitive personal data.`;

    const promptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: false,
      messages: promptMessages
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("API /api/chat error:", err);
    // Do not leak internal error details to the client
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
