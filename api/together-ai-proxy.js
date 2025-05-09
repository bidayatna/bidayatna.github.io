// Save this file as api/together-ai-proxy.js in your project root for Vercel

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    // MODIFICATION: Using a hardcoded simple prompt for testing
    const hardcodedTestPrompt = "Tell me a short joke.";
    console.log("PROXY_LOG: Using hardcoded test prompt:", hardcodedTestPrompt);
    
    // Original prompt logic (commented out for this test)
    /*
    let prompt;
    try {
        prompt = req.body.prompt;
        if (!prompt) {
            throw new Error("Prompt is missing from the request body.");
        }
    } catch (e) {
        console.error("PROXY_LOG: Error accessing request body or prompt missing:", e.message);
        res.status(400).json({ error: "Invalid request body. Ensure 'prompt' is provided." });
        return;
    }
    */

    const API_KEY = process.env.TOGETHER_API_KEY;

    if (!API_KEY) {
        console.error("PROXY_LOG: TOGETHER_API_KEY environment variable is not set.");
        res.status(500).json({ error: "Server configuration error: API key missing." });
        return;
    }

    const API_URL = "https://api.together.xyz/v1/completions";
    console.log(`PROXY_LOG: Sending request to Together.ai with hardcoded prompt...`);

    try {
        const togetherResponse = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                prompt: hardcodedTestPrompt, // Using the hardcoded prompt
                max_tokens: 100, // Reduced max_tokens for a short joke
                temperature: 0.7,
                top_p: 0.9,
                // stop: ["", "\n\n"] // Stop parameter remains commented out
            })
        });

        const responseText = await togetherResponse.text();
        console.log(`PROXY_LOG: Received raw response text from Together.ai (status ${togetherResponse.status}):`, responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("PROXY_LOG: Failed to parse Together.ai response as JSON:", parseError.message);
            if (togetherResponse.ok) {
                 res.status(500).json({ error: "Received non-JSON response from AI API", details: responseText });
            } else {
                 res.status(togetherResponse.status).json({
                    error: `Together.ai API request failed: ${togetherResponse.statusText}`,
                    details: responseText 
                });
            }
            return;
        }
        
        console.log("PROXY_LOG: Parsed response data from Together.ai:", JSON.stringify(responseData, null, 2));

        if (!togetherResponse.ok) {
            console.error("PROXY_LOG: Together.ai API Error (after parsing):", togetherResponse.status, responseData);
            res.status(togetherResponse.status).json({
                error: `Together.ai API request failed: ${togetherResponse.statusText}`,
                details: responseData
            });
            return;
        }
        
        console.log("PROXY_LOG: Sending successful response back to client:", JSON.stringify(responseData, null, 2));
        res.status(200).json(responseData);

    } catch (error) {
        console.error("PROXY_LOG: Error calling Together.ai API or processing its response:", error.message, error.stack);
        res.status(500).json({ error: "Failed to generate strategy due to an internal server error." });
    }
};
