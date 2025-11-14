/**
 * AI Streaming Service
 * Provides streaming responses from AI models for better UX
 */
const logger = require('../utils/logger');
const featureFlags = require('../utils/featureFlags');

/**
 * Stream AI response using Server-Sent Events (SSE)
 * @param {Object} params - Streaming parameters
 * @param {Object} params.res - Express response object
 * @param {string} params.prompt - User prompt
 * @param {Object} params.options - AI options
 * @param {Function} params.onComplete - Callback when streaming completes
 * @returns {Promise<void>}
 */
exports.streamAIResponse = async ({ res, prompt, options = {}, onComplete }) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Check if streaming is enabled
    if (!featureFlags.isEnabled('ai_streaming', { userId: options.userId })) {
      res.write(`data: ${JSON.stringify({
        error: 'Streaming not available',
        fallback: true
      })}\n\n`);
      res.end();
      return;
    }

    let fullResponse = '';
    let tokenCount = 0;

    // Try to use OpenAI streaming if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const model = options.model || 'gpt-3.5-turbo';
        const temperature = options.temperature || 0.7;
        const maxTokens = options.maxTokens || 500;

        const stream = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI companion.' },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true
        });

        // Send start event
        res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

        // Stream tokens
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';

          if (content) {
            fullResponse += content;
            tokenCount++;

            // Send token to client
            res.write(`data: ${JSON.stringify({
              type: 'token',
              content,
              tokenCount
            })}\n\n`);

            // Keep connection alive
            if (tokenCount % 10 === 0) {
              res.write(': keep-alive\n\n');
            }
          }

          // Check if finished
          if (chunk.choices[0]?.finish_reason) {
            break;
          }
        }

        // Send completion event
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          fullResponse,
          tokenCount,
          finishReason: 'stop'
        })}\n\n`);

        // Call completion callback
        if (onComplete) {
          await onComplete({
            fullResponse,
            tokenCount,
            model,
            success: true
          });
        }

      } catch (error) {
        logger.error('OpenAI streaming error:', error);

        // Send error event
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          fallback: true
        })}\n\n`);

        // Fallback to non-streaming
        await sendFallbackResponse(res, prompt, options, onComplete);
      }
    } else {
      // No API key - send simulated streaming
      await sendSimulatedStream(res, prompt, options, onComplete);
    }

    res.end();

  } catch (error) {
    logger.error('AI streaming error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
};

/**
 * Send fallback non-streaming response
 */
const sendFallbackResponse = async (res, prompt, options, onComplete) => {
  try {
    // Generate response (non-streaming)
    const response = await generateAIResponse(prompt, options);

    // Simulate streaming by sending chunks
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + ' ';
      res.write(`data: ${JSON.stringify({
        type: 'token',
        content: word,
        tokenCount: i + 1
      })}\n\n`);

      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      fullResponse: response,
      tokenCount: words.length
    })}\n\n`);

    if (onComplete) {
      await onComplete({
        fullResponse: response,
        tokenCount: words.length,
        success: true
      });
    }

  } catch (error) {
    logger.error('Fallback response error:', error);
    throw error;
  }
};

/**
 * Send simulated streaming for testing/development
 */
const sendSimulatedStream = async (res, prompt, options, onComplete) => {
  const simulatedResponse = `Thank you for your message. As a simulated AI companion, I'm here to chat with you. This is a streaming response that demonstrates how the AI would respond in real-time. Each word appears as it's generated, creating a more natural conversation flow.`;

  res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

  const words = simulatedResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i] + ' ';
    res.write(`data: ${JSON.stringify({
      type: 'token',
      content: word,
      tokenCount: i + 1
    })}\n\n`);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  res.write(`data: ${JSON.stringify({
    type: 'complete',
    fullResponse: simulatedResponse,
    tokenCount: words.length,
    simulated: true
  })}\n\n`);

  if (onComplete) {
    await onComplete({
      fullResponse: simulatedResponse,
      tokenCount: words.length,
      simulated: true,
      success: true
    });
  }
};

/**
 * Generate AI response (non-streaming fallback)
 */
const generateAIResponse = async (prompt, options = {}) => {
  // This is a fallback when streaming is not available
  // In production, this would call your AI service

  const responses = [
    `I appreciate you sharing that with me. ${prompt.length > 50 ? 'It sounds like you have a lot on your mind.' : 'Tell me more about it.'}`,
    `That's interesting! I'd love to hear more about your thoughts on this.`,
    `I understand. Let's explore this topic together.`,
    `Thank you for opening up to me. How does that make you feel?`,
    `I'm here to listen and support you. What else would you like to discuss?`
  ];

  // Simple selection based on prompt length
  const index = prompt.length % responses.length;
  return responses[index];
};

/**
 * Middleware to enable SSE streaming
 */
exports.enableStreaming = (req, res, next) => {
  // Add streaming flag to request
  req.streaming = {
    enabled: true,
    stream: (data) => {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    end: () => {
      res.end();
    }
  };

  next();
};

/**
 * Check if streaming is available
 * @param {Object} context - User context
 * @returns {boolean}
 */
exports.isStreamingAvailable = (context = {}) => {
  return featureFlags.isEnabled('ai_streaming', context) &&
         (process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'development');
};

/**
 * Get streaming configuration
 * @returns {Object}
 */
exports.getStreamingConfig = () => {
  return {
    enabled: process.env.AI_STREAMING_ENABLED !== 'false',
    provider: process.env.OPENAI_API_KEY ? 'openai' : 'simulated',
    defaultModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '500'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7')
  };
};

module.exports = exports;
