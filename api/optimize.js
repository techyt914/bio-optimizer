module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bio, vibe } = req.body;

  if (!bio) {
    return res.status(400).json({ error: 'Bio is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error', details: 'Missing API Key' });
  }

  try {
    const prompt = `
    You are a viral social media expert. 
    Analyze this bio: "${bio}"
    Target Vibe: ${vibe}

    1. Give it a brutally honest 1-sentence roast rating (out of 10).
    2. Write 3 significantly better versions optimized for conversion and followers.

    Output STRICT JSON format only. Do not add markdown backticks.
    Example structure:
    {
      "roast": "Rating: 2/10. Boring.",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
    `;

    // DIAGNOSTIC MODE: List available models
    // If we are here, the previous attempts failed. Let's see what the key CAN see.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error("API Key Error: " + data.error.message);
    }

    // If we find a model, try to use it immediately
    const validModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    if (validModels.length === 0) {
      res.status(200).json({ 
        roast: "Diagnostic: No models found.", 
        options: ["Your API Key has access to 0 models.", "Enable 'Generative Language API' in Google Cloud Console.", "Check Billing."]
      });
      return;
    }

    // Pick the first available model
    const chosenModel = validModels[0].name.replace("models/", ""); // e.g. "gemini-1.5-flash"

    // NOW RUN THE REAL REQUEST WITH THE FOUND MODEL
    const runResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    const runData = await runResponse.json();
    
    if (runData.error) {
       throw new Error(runData.error.message);
    }

    let text = runData.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonResponse = JSON.parse(text);
    
    // Add a debug note so we know which model worked
    jsonResponse.roast += ` (Model Used: ${chosenModel})`;
    
    res.status(200).json(jsonResponse);

  } catch (error) {

    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'AI Error', details: error.message });
  }
};
