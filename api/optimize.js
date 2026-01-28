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

    // Direct fetch to Google API (No library)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResponse = JSON.parse(text);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'AI Error', details: error.message });
  }
};
