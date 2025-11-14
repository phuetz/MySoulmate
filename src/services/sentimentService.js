/**
 * Service d'analyse de sentiment pour conversations
 * Détecte les émotions, intentions et tonalité des messages
 */

// Mots-clés par émotion (version simplifiée - à étendre)
const EMOTION_KEYWORDS = {
  joy: ['heureux', 'content', 'joyeux', 'génial', 'super', 'excellent', 'parfait', 'love', 'adore', '❤️', '😊', '😄', '🥰'],
  sadness: ['triste', 'malheureux', 'déprimé', 'mélancolique', 'down', 'mal', 'peine', '😢', '😭', '💔'],
  anger: ['énervé', 'furieux', 'colère', 'agacé', 'frustré', 'irrité', 'rage', '😠', '😡', '🤬'],
  fear: ['peur', 'angoisse', 'inquiet', 'anxieux', 'stressé', 'nerveux', 'effrayé', '😰', '😨'],
  surprise: ['surpris', 'étonné', 'wow', 'incroyable', 'choqué', '😮', '😲', '🤯'],
  disgust: ['dégoûtant', 'horrible', 'répugnant', 'beurk', '🤮'],
  love: ['amour', 'aime', 'adore', 'chéri', 'mon cœur', 'tendresse', 'affection', '❤️', '💕', '💖', '😍', '🥰'],
  excitement: ['excité', 'hâte', 'impatient', 'wow', 'trop bien', 'génial', '🤩', '🎉'],
  gratitude: ['merci', 'reconnaissance', 'grateful', 'thankful', 'apprécié', '🙏'],
};

const POSITIVE_WORDS = [
  'bon', 'bien', 'super', 'génial', 'excellent', 'parfait', 'merveilleux', 'fantastique',
  'magnifique', 'beau', 'top', 'cool', 'sympa', 'agréable', 'plaisant', 'joli', 'mignon',
  'oui', 'absolument', 'certainement', 'effectivement', 'exactement'
];

const NEGATIVE_WORDS = [
  'mauvais', 'mal', 'horrible', 'terrible', 'nul', 'pourri', 'moche', 'laid',
  'triste', 'dommage', 'malheureusement', 'hélas', 'non', 'jamais', 'rien',
  'personne', 'aucun', 'difficile', 'dur', 'pénible', 'compliqué', 'problème'
];

const INTENSIFIERS = ['très', 'vraiment', 'tellement', 'super', 'hyper', 'ultra', 'extrêmement', 'trop'];

/**
 * Analyse le sentiment d'un message
 * @returns {Object} { score: -1 à 1, emotion: string, confidence: 0-1, keywords: [] }
 */
exports.analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      emotion: 'neutral',
      confidence: 0,
      keywords: [],
    };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let score = 0;
  let emotionScores = {};
  let matchedKeywords = [];
  let hasIntensifier = false;

  // Détecter les intensificateurs
  for (const intensifier of INTENSIFIERS) {
    if (lowerText.includes(intensifier)) {
      hasIntensifier = true;
      break;
    }
  }

  // Analyser les émotions spécifiques
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let emotionScore = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        emotionScore++;
        matchedKeywords.push({ keyword, emotion });
      }
    }
    if (emotionScore > 0) {
      emotionScores[emotion] = emotionScore;
    }
  }

  // Analyser les mots positifs/négatifs
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) positiveCount++;
    if (NEGATIVE_WORDS.includes(word)) negativeCount++;
  }

  // Calculer le score global (-1 à 1)
  const totalWords = words.length;
  score = (positiveCount - negativeCount) / Math.max(totalWords, 1);

  // Ajuster avec les émotions détectées
  if (emotionScores.joy || emotionScores.excitement || emotionScores.love || emotionScores.gratitude) {
    score += 0.3;
  }
  if (emotionScores.sadness || emotionScores.anger || emotionScores.fear) {
    score -= 0.3;
  }

  // Amplifier si intensificateur
  if (hasIntensifier) {
    score *= 1.3;
  }

  // Normaliser entre -1 et 1
  score = Math.max(-1, Math.min(1, score));

  // Déterminer l'émotion dominante
  let dominantEmotion = 'neutral';
  let maxScore = 0;

  for (const [emotion, emotionScore] of Object.entries(emotionScores)) {
    if (emotionScore > maxScore) {
      maxScore = emotionScore;
      dominantEmotion = emotion;
    }
  }

  // Calculer la confiance (basée sur le nombre de mots correspondants)
  const confidence = Math.min(1, (matchedKeywords.length + positiveCount + negativeCount) / totalWords);

  return {
    score,
    emotion: dominantEmotion,
    confidence,
    keywords: matchedKeywords,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
  };
};

/**
 * Détecte l'intention du message
 */
exports.detectIntent = (text) => {
  const lowerText = text.toLowerCase().trim();

  // Détection de patterns
  const patterns = {
    greeting: /^(salut|bonjour|coucou|hey|hi|hello|bonsoir)/i,
    farewell: /^(au revoir|bye|salut|à\+|a\+|bonne nuit|bonne journée)/i,
    question: /\?$/,
    gratitude: /^(merci|thanks|thank you)/i,
    apology: /^(désolé|sorry|pardon|excuse)/i,
    agreement: /^(oui|yes|d'accord|ok|okay|bien sûr|absolument)/i,
    disagreement: /^(non|no|pas vraiment|je ne pense pas)/i,
    compliment: /(belle?|magnifique|superbe|génial|incroyable|parfait)/i,
  };

  for (const [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerText)) {
      return intent;
    }
  }

  return 'statement'; // Déclaration générale
};

/**
 * Analyse une conversation complète
 */
exports.analyzeConversation = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      averageSentiment: 0,
      dominantEmotion: 'neutral',
      emotionDistribution: {},
      totalMessages: 0,
    };
  }

  let totalScore = 0;
  const emotionCounts = {};
  const intentCounts = {};

  for (const message of messages) {
    const sentiment = exports.analyzeSentiment(message.content || message);
    const intent = exports.detectIntent(message.content || message);

    totalScore += sentiment.score;

    // Compter les émotions
    if (sentiment.emotion !== 'neutral') {
      emotionCounts[sentiment.emotion] = (emotionCounts[sentiment.emotion] || 0) + 1;
    }

    // Compter les intentions
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  // Émotion dominante
  let dominantEmotion = 'neutral';
  let maxCount = 0;

  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }

  return {
    averageSentiment: totalScore / messages.length,
    dominantEmotion,
    emotionDistribution: emotionCounts,
    intentDistribution: intentCounts,
    totalMessages: messages.length,
  };
};

/**
 * Suggère une réponse appropriée basée sur le sentiment
 */
exports.suggestResponseTone = (sentiment) => {
  const { score, emotion } = sentiment;

  if (emotion === 'sadness' || score < -0.5) {
    return {
      tone: 'supportive',
      suggestions: ['Empathie', 'Réconfort', 'Écoute active'],
    };
  }

  if (emotion === 'anger' || (score < -0.2 && score >= -0.5)) {
    return {
      tone: 'calm',
      suggestions: ['Validation', 'Apaisement', 'Compréhension'],
    };
  }

  if (emotion === 'joy' || emotion === 'excitement' || score > 0.5) {
    return {
      tone: 'enthusiastic',
      suggestions: ['Partage de joie', 'Encouragement', 'Célébration'],
    };
  }

  if (emotion === 'love' || emotion === 'gratitude') {
    return {
      tone: 'affectionate',
      suggestions: ['Tendresse', 'Réciprocité', 'Appréciation'],
    };
  }

  if (emotion === 'fear' || emotion === 'anxiety') {
    return {
      tone: 'reassuring',
      suggestions: ['Rassurance', 'Soutien', 'Encouragement'],
    };
  }

  return {
    tone: 'friendly',
    suggestions: ['Conversation naturelle', 'Intérêt', 'Engagement'],
  };
};

/**
 * Détecte si le message nécessite une attention particulière
 */
exports.detectConcern = (text) => {
  const concernKeywords = [
    'suicide', 'mourir', 'tuer', 'blesser', 'danger', 'help', 'aide urgent',
    'ne peux plus', 'en ai marre', 'tout arrêter', 'fini', 'terminé'
  ];

  const lowerText = text.toLowerCase();

  for (const keyword of concernKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        requiresAttention: true,
        severity: 'high',
        keywords: [keyword],
        suggestedAction: 'Orienter vers des ressources professionnelles',
      };
    }
  }

  return {
    requiresAttention: false,
    severity: 'none',
  };
};

module.exports.EMOTION_KEYWORDS = EMOTION_KEYWORDS;
