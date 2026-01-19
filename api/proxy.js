export default async function handler(req, res) {
  // CORS headers for Vercel deployment
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Validate model parameter against allowed models
    const ALLOWED_MODELS = [
      'gemini-2.5-flash-image',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ];

    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ 
        error: { 
          message: 'Invalid model parameter. Must be one of: ' + ALLOWED_MODELS.join(', ')
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

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        const text = await response.text();
        console.error('Response text (first 500 chars):', text.substring(0, 500));
        return res.status(response.status).json({ 
          error: { 
            message: 'Invalid JSON response from Gemini API'
          } 
        });
      }
    } else {
      // Non-JSON response (e.g., plain text error)
      const text = await response.text();
      console.error('Non-JSON response from Gemini API (first 500 chars):', text.substring(0, 500));
      return res.status(response.status).json({ 
        error: { 
          message: 'Unexpected response format from Gemini API'
        } 
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
