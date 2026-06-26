export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });

  const prompt = `Generate a JavaScript-compatible regular expression for: "${description}"

Requirements:
- Return ONLY the regex pattern (no slashes, no flags in the pattern itself)
- Provide a brief explanation of how it works
- Consider edge cases

Format:
PATTERN: [regex pattern here]
EXPLANATION: [brief explanation]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Gemini' });
  }
}
