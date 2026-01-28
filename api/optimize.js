// No libraries needed. No "require @google..."
// Just pure, standard JavaScript.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bio, vibe } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!bio) {
    return res.status(400).json({ error: 'Bio is required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Config Error: API Key missing in Vercel' });
  }

  // 1. The Setup: We talk directly to the URL. No SDK "middleman".
  // using 'gemini-1.5-pro' for your $300 credit quality.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

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

  try {
    // 2. The Request: Standard 'fetch' call.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    // Error handling for the raw API
    if (data.error) {
      throw new Error(data.error.message);
    }

    // 3. The Extraction: Pull the text out of the messy JSON structure
    let text = data.candidates[0].content.parts[0].text;
    
    // Clean up if the AI added markdown (```json ...)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResponse = JSON.parse(text);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: 'AI generation failed', details: error.message });
  }
};
