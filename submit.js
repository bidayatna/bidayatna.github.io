// This is a serverless function for handling Together.ai requests securely

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || prompt.length > 1000) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          { role: "system", content: "You are a world-class marketing strategist. Respond clearly and concisely." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        stop: null
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ reply: data.choices?.[0]?.message?.content || "No reply" });
    } else {
      return res.status(500).json({ error: data.error?.message || 'Unknown error from Together.ai' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
