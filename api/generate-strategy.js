export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const { prompt } = req.body;

  const response = await fetch('https://api.together.xyz/v1/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "togethercomputer/llama-3-70b-instruct",
      prompt,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
TOGETHER_API_KEY="tgp_v1_l1fatYNMkPkwiSacIWTAdBLrl6-BehQOmJLiaeCnDTQ"
