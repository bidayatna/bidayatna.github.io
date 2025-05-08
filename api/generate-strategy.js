// api/generate-strategy.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { prompt } = req.body;
  const API_KEY = process.env.TOGETHER_API_KEY; // Use environment variable for API key
  const API_URL = "https://api.together.xyz/v1/completions";

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "togethercomputer/llama-3-70b-instruct",
        prompt: prompt,
        max_tokens: 3000,
        temperature: 0.7,
        top_p: 0.9,
        stop: ["", "\n\n"]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating strategy:", error);
    res.status(500).json({ error: 'There was an error generating your strategy.' });
  }
}
