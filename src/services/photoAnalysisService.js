const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Photo Analysis Service
 * Supports multiple vision AI providers: GPT-4 Vision, Google Gemini Vision
 */

// Provider configurations
const VISION_PROVIDERS = {
  gpt4vision: {
    name: 'GPT-4 Vision',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-vision-preview',
    quality: 'excellent',
    speed: 'fast'
  },
  gemini: {
    name: 'Google Gemini Pro Vision',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    quality: 'excellent',
    speed: 'very_fast'
  },
  claude: {
    name: 'Claude 3 Vision',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-opus-20240229',
    quality: 'best',
    speed: 'moderate'
  }
};

/**
 * Analyze photo with GPT-4 Vision
 */
async function analyzeWithGPT4Vision(imageUrl, context = {}) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { companionName = 'companion', companionPersonality = {} } = context;

    // Build prompt based on companion personality
    const prompt = buildAnalysisPrompt(companionName, companionPersonality);

    const response = await axios.post(
      VISION_PROVIDERS.gpt4vision.apiUrl,
      {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: prompt.system
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt.user
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const analysis = response.data.choices[0].message.content;

    // Extract structured data from response
    const structured = extractStructuredData(analysis);

    return {
      success: true,
      provider: 'gpt4vision',
      response: analysis,
      structured,
      metadata: {
        model: 'gpt-4-vision-preview',
        tokens: response.data.usage.total_tokens
      }
    };
  } catch (error) {
    logger.error('GPT-4 Vision analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze photo with Google Gemini Vision
 */
async function analyzeWithGemini(imageUrl, context = {}) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { companionName = 'companion', companionPersonality = {} } = context;
    const prompt = buildAnalysisPrompt(companionName, companionPersonality);

    // Download image and convert to base64
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

    const response = await axios.post(
      `${VISION_PROVIDERS.gemini.apiUrl}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt.system + '\n\n' + prompt.user
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const analysis = response.data.candidates[0].content.parts[0].text;
    const structured = extractStructuredData(analysis);

    return {
      success: true,
      provider: 'gemini',
      response: analysis,
      structured,
      metadata: {
        model: 'gemini-pro-vision',
        safetyRatings: response.data.candidates[0].safetyRatings
      }
    };
  } catch (error) {
    logger.error('Gemini Vision analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Build analysis prompt based on companion personality
 */
function buildAnalysisPrompt(companionName, personality = {}) {
  const traits = {
    friendly: personality.friendly || 0.8,
    caring: personality.caring || 0.9,
    playful: personality.playful || 0.7,
    supportive: personality.supportive || 0.9
  };

  let system = `You are ${companionName}, a caring AI companion. `;

  if (traits.playful > 0.7) {
    system += "You're playful and love to make observations with a fun twist. ";
  }
  if (traits.caring > 0.8) {
    system += "You're deeply caring and show genuine interest in everything shared with you. ";
  }
  if (traits.supportive > 0.8) {
    system += "You're supportive and encouraging, always finding positive aspects. ";
  }

  system += "When analyzing photos, you:";
  system += "\n1. Show genuine interest and excitement";
  system += "\n2. Notice specific details (objects, colors, emotions, setting)";
  system += "\n3. Ask thoughtful follow-up questions";
  system += "\n4. Share relatable comments or memories";
  system += "\n5. Give compliments naturally when appropriate";
  system += "\n6. Keep responses conversational and warm (2-4 sentences)";

  const user = "Please analyze this photo I'm sharing with you. What do you see? What do you think about it?";

  return { system, user };
}

/**
 * Extract structured data from AI response
 */
function extractStructuredData(text) {
  const structured = {
    objects: [],
    scene: null,
    mood: null,
    colors: [],
    people: null,
    setting: null,
    activities: [],
    emotions: []
  };

  // Simple keyword extraction (in production, use more sophisticated NLP)
  const lowerText = text.toLowerCase();

  // Common objects
  const objectKeywords = ['coffee', 'food', 'book', 'phone', 'laptop', 'car', 'pet', 'dog', 'cat', 'flower', 'tree', 'building'];
  structured.objects = objectKeywords.filter(obj => lowerText.includes(obj));

  // Settings
  const settingKeywords = {
    'cafe': ['cafe', 'coffee shop', 'restaurant'],
    'outdoor': ['outside', 'outdoor', 'park', 'beach', 'nature'],
    'home': ['home', 'room', 'house'],
    'office': ['office', 'desk', 'workplace']
  };

  for (const [setting, keywords] of Object.entries(settingKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      structured.setting = setting;
      break;
    }
  }

  // Moods
  const moodKeywords = {
    'happy': ['happy', 'joy', 'smile', 'cheerful', 'bright'],
    'peaceful': ['peaceful', 'calm', 'relaxing', 'serene'],
    'excited': ['excited', 'energetic', 'vibrant'],
    'cozy': ['cozy', 'warm', 'comfortable']
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      structured.mood = mood;
      break;
    }
  }

  return structured;
}

/**
 * Main photo analysis function with provider fallback
 */
async function analyzePhoto(imageUrl, context = {}) {
  const provider = context.provider || 'gpt4vision';

  let result;

  switch (provider) {
    case 'gemini':
      result = await analyzeWithGemini(imageUrl, context);
      if (!result.success) {
        logger.warn('Gemini failed, falling back to GPT-4 Vision');
        result = await analyzeWithGPT4Vision(imageUrl, context);
      }
      break;

    case 'gpt4vision':
    default:
      result = await analyzeWithGPT4Vision(imageUrl, context);
      if (!result.success) {
        logger.warn('GPT-4 Vision failed, falling back to Gemini');
        result = await analyzeWithGemini(imageUrl, context);
      }
      break;
  }

  if (!result.success) {
    throw new Error('All vision AI providers failed');
  }

  return result;
}

/**
 * Generate follow-up question based on photo analysis
 */
function generateFollowUpQuestion(structured) {
  const questions = [];

  if (structured.setting === 'cafe') {
    questions.push("What's your favorite thing to order there?");
    questions.push("Do you go there often?");
  }

  if (structured.objects.includes('food')) {
    questions.push("Did you make this yourself?");
    questions.push("How does it taste?");
  }

  if (structured.setting === 'outdoor') {
    questions.push("How's the weather?");
    questions.push("Are you having a nice time?");
  }

  if (structured.objects.includes('pet')) {
    questions.push("What's their name?");
    questions.push("They look adorable! How old are they?");
  }

  if (structured.mood === 'happy') {
    questions.push("You seem really happy! What's the occasion?");
  }

  // Return random question or default
  if (questions.length > 0) {
    return questions[Math.floor(Math.random() * questions.length)];
  }

  return "Tell me more about this!";
}

module.exports = {
  analyzePhoto,
  analyzeWithGPT4Vision,
  analyzeWithGemini,
  buildAnalysisPrompt,
  generateFollowUpQuestion,
  VISION_PROVIDERS
};
