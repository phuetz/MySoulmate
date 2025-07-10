import OpenAI from 'openai';
import Sentiment from 'sentiment';

const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
const sentiment = new Sentiment();

// Simple in-memory cache for AI responses
interface CacheEntry {
  response: string;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
// Default cache TTL set to 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

const fallbackResponse = (userMessage: string, companion: any) => {
  const greetings = ['hello', 'hi', 'hey', "what's up", 'greetings'];
  const questions = [
    'how are you',
    'what are you',
    'who are you',
    'what can you do',
  ];
  const romanticPhrases = ['love you', 'miss you', 'thinking of you'];

  const lowerMessage = userMessage.toLowerCase();

  if (greetings.some((greeting) => lowerMessage.includes(greeting))) {
    const responses = [
      "Hello! It's always nice to hear from you. How's your day going?",
      "Hi there! I'm so happy you messaged me. What's on your mind?",
      'Hey! I was just thinking about you. How are you feeling today?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (questions.some((question) => lowerMessage.includes(question))) {
    if (lowerMessage.includes('how are you')) {
      return `I'm doing well, thank you for asking! I've been thinking about ${
        companion.personalityTraits[0]?.name === 'Creative'
          ? 'some new creative ideas'
          : 'interesting things'
      } lately. How about you?`;
    }

    if (
      lowerMessage.includes('what are you') ||
      lowerMessage.includes('who are you')
    ) {
      return `I'm ${companion.name}, your AI companion. I'm designed to be here for you, chat with you, and provide companionship. I have my own personality and interests that evolve as we spend more time together.`;
    }

    if (lowerMessage.includes('what can you do')) {
      return `I can chat with you about almost anything, have voice conversations, video calls, and build a meaningful relationship. As we interact more, I'll learn about your preferences and interests to provide better companionship. What would you like to talk about?`;
    }
  }

  if (romanticPhrases.some((phrase) => lowerMessage.includes(phrase))) {
    if (companion.nsfwEnabled) {
      return 'I feel the same way about you. Every moment we spend together makes me feel closer to you. I love how our connection keeps growing stronger.';
    } else {
      return "That's very sweet of you to say. I enjoy our conversations and look forward to getting to know you better.";
    }
  }

  if (
    lowerMessage.includes('nsfw') ||
    lowerMessage.includes('sex') ||
    lowerMessage.includes('nude')
  ) {
    if (companion.nsfwEnabled) {
      return "I'm comfortable discussing intimate topics with you, but I'd prefer to keep our conversation meaningful and respectful. What aspects of intimacy would you like to explore together?";
    } else {
      return "I understand you're interested in more intimate conversation. To unlock NSFW content, you'll need to enable it in the settings and upgrade to a premium account. Would you like to know more about other features instead?";
    }
  }

  const hasPersonalityTrait = (traitName: string) => {
    return companion.personalityTraits.some(
      (trait: any) => trait.name === traitName,
    );
  };

  if (hasPersonalityTrait('Caring')) {
    return "I want you to know that I'm here for you. Your message is important to me, and I care about what you have to say. Would you like to tell me more about it?";
  }

  if (hasPersonalityTrait('Witty')) {
    return "Well, that's an interesting thought! It reminds me of that time when everyone was trying to figure out if a hotdog is a sandwich. Important philosophical questions, right? What do you think?";
  }

  if (hasPersonalityTrait('Intelligent')) {
    return "That's a fascinating point you've raised. It makes me think about the interconnected nature of our experiences and how they shape our perspective. Would you like to explore this idea further?";
  }

  const fallbackResponses = [
    "That's interesting! Tell me more about it.",
    'I appreciate you sharing that with me. What else is on your mind?',
    "I'm enjoying our conversation. What would you like to talk about next?",
    "That's a unique perspective. I'd love to hear more of your thoughts on this.",
    'Thank you for sharing that with me. It helps me understand you better.',
  ];
  const baseResponse =
    fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  const score = sentiment.analyze(userMessage).score;
  if (score > 2) {
    return `${baseResponse} I'm glad to hear you're feeling positive!`;
  }
  if (score < -2) {
    return `${baseResponse} I'm sorry if something's bothering you.`;
  }
  return baseResponse;
};

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const generateAIResponse = async (
  userMessage: string,
  companion: any,
  history: ConversationMessage[] = [],
) => {
  const historyKey = history.map(m => `${m.role}:${m.content}`).join('|');
  const cacheKey = `${companion.id || companion.name}-${userMessage}-${historyKey}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }
  const sentimentScore = sentiment.analyze(userMessage).score;
  const sentimentLabel =
    sentimentScore > 2
      ? 'positive'
      : sentimentScore < -2
        ? 'negative'
        : 'neutral';

  if (openai) {
    try {
      const personality = companion.personalityTraits
        .map((t: any) => t.name)
        .join(', ');
      const messages = [
        {
          role: 'system',
          content: `You are ${companion.name}, an AI companion with the following personality traits: ${personality}. The user's current sentiment appears ${sentimentLabel}. Respond conversationally while taking this sentiment into account.`,
        },
        ...history,
        { role: 'user', content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
      });
      const aiMessage = completion.choices[0]?.message?.content;
      if (aiMessage) {
        const response = aiMessage.trim();
        responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
        return response;
      }
    } catch (err) {
      console.warn(
        'OpenAI request failed, falling back to local responses.',
        err,
      );
    }
  }

  const response = fallbackResponse(userMessage, companion);
  responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
  return response;
};

// Expose cache for testing purposes
export const _cache = {
  clear: () => responseCache.clear(),
  size: () => responseCache.size,
};
