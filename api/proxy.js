export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get API key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: { 
        message: 'GEMINI_API_KEY not configured on server' 
      } 
    });
  }

  try {
    // Extract model and payload from request body
    const { model, payload } = req.body;
    
    if (!model || !payload) {
      return res.status(400).json({ 
        error: { 
          message: 'Missing required parameters: model and payload' 
        } 
      });
    }

    // Build Google Gemini API URL
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Forward request to Google Gemini API
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Return the response with the same status code
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'Internal server error' 
      } 
    });
  }
}
