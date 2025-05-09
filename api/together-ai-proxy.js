// Save this file as api/together-ai-proxy.js in your project root for Vercel

// Vercel's Node.js environment (e.g., Node 18.x) includes global fetch.
// If you need to support older Node versions or prefer node-fetch, 
// you would install it (npm install node-fetch) and import it:
// const fetch = require("node-fetch"); 
// Or: import fetch from 'node-fetch'; (if using ES modules, configure Vercel accordingly)

module.exports = async (req, res) => {
    // Set CORS headers for all responses from this function
    // Vercel automatically handles OPTIONS preflight requests for routes that set these headers.
    res.setHeader("Access-Control-Allow-Origin", "*"); // Or specify your frontend domain for better security
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    // Vercel handles OPTIONS preflight requests automatically if the method below is POST only.
    // If you explicitly want to handle OPTIONS:
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    let prompt;
    try {
        // Vercel automatically parses JSON body if Content-Type is application/json
        prompt = req.body.prompt;
        if (!prompt) {
            throw new Error("Prompt is missing from the request body.");
        }
    } catch (e) {
        console.error("Error accessing request body or prompt missing:", e.message);
        res.status(400).json({ error: "Invalid request body. Ensure 'prompt' is provided." });
        return;
    }

    const API_KEY = process.env.TOGETHER_API_KEY;

    if (!API_KEY) {
        console.error("TOGETHER_API_KEY environment variable is not set.");
        res.status(500).json({ error: "Server configuration error: API key missing." });
        return;
    }

    const API_URL = "https://api.together.xyz/v1/completions";

    try {
        const togetherResponse = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                prompt: prompt,
                max_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                stop: ["", "\n\n"]
            })
        });

        const responseData = await togetherResponse.json();

        if (!togetherResponse.ok) {
            console.error("Together.ai API Error:", togetherResponse.status, responseData);
            res.status(togetherResponse.status).json({
                error: `Together.ai API request failed: ${togetherResponse.statusText}`,
                details: responseData
            });
            return;
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error calling Together.ai API or processing its response:", error.message, error.stack);
        res.status(500).json({ error: "Failed to generate strategy due to an internal server error." });
    }
};
