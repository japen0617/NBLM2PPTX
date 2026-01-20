// Vercel Serverless Function - Gemini API Proxy
// This proxy protects the API key by keeping it server-side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: { 
        message: 'GEMINI_API_KEY is not configured on the server' 
      } 
    });
  }

  try {
    // Extract model and payload from request body
    const { model, payload } = req.body;

    if (!model || !payload) {
      return res.status(400).json({ 
        error: { 
          message: 'Missing required fields: model and payload' 
        } 
      });
    }

    // Construct the Google Gemini API URL
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Forward the request to Google Gemini API
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Get the response text
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      return res.status(response.status).json({
        error: {
          message: `Failed to parse Gemini API response: ${responseText.substring(0, 200)}`,
        },
      });
    }

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
