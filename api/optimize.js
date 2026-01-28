const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bio, vibe } = req.body;

  if (!bio) {
    return res.status(400).json({ error: 'Bio is required' });
  }

  try {
    const prompt = `
    You are a viral social media expert. 
    Analyze this bio: "${bio}"
    Target Vibe: ${vibe}

    1. Give it a brutally honest 1-sentence roast rating (out of 10).
    2. Write 3 significantly better versions optimized for conversion and followers.

    Output JSON format only:
    {
      "roast": "Rating: X/10. [Roast here]",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error', details: error.message });
  }
};
