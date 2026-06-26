export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { schema } = req.body;
  if (!schema) return res.status(400).json({ error: 'Schema required' });

  const prompt = `Explain this JSON schema in simple terms. For each top-level field, explain what it represents. Keep explanations concise (1 sentence each).

JSON:
${schema}

Format as:
• fieldName: explanation
• fieldName: explanation`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Gemini' });
  }
}
