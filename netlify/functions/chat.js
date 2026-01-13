// netlify/functions/chat.js
// Netlify functions run on Node 18+ and support global fetch

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const message = body.message?.trim();

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing message" }) };
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server missing GROQ_API_KEY" }) };
    }

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

    // If Groq returns non-JSON or an error, forward it
    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Groq API error", details: data || await resp.text() })
      };
    }

    const reply = data?.choices?.[0]?.message?.content ?? null;
    if (!reply) {
      return { statusCode: 500, body: JSON.stringify({ error: "No reply from model", completion: data }) };
    }

    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
