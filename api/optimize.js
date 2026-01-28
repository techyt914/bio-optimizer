const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bio, vibe } = req.body;

  if (!bio) {
    return res.status(400).json({ error: 'Bio is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up if Gemini adds markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResponse = JSON.parse(text);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error', details: error.message });
  }
};
