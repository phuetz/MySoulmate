const { logger } = require('../config/logger');

/**
 * Service de suggestions contextuelles pour améliorer l'engagement
 * Inspiré de Replika et Zeta
 */

/**
 * Suggère des sujets de conversation
 */
exports.suggestConversationTopics = async (companionState, userPreferences = {}) => {
  const suggestions = [];

  // Basé sur l'heure de la journée
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    suggestions.push({
      topic: 'morning',
      title: 'Comment as-tu dormi ?',
      category: 'wellbeing',
    });
  } else if (hour >= 12 && hour < 18) {
    suggestions.push({
      topic: 'afternoon',
      title: 'Comment se passe ta journée ?',
      category: 'daily',
    });
  } else if (hour >= 18 && hour < 22) {
    suggestions.push({
      topic: 'evening',
      title: 'Envie de parler de ta journée ?',
      category: 'reflection',
    });
  } else {
    suggestions.push({
      topic: 'night',
      title: 'Encore debout ? Comment te sens-tu ?',
      category: 'wellbeing',
    });
  }

  // Basé sur la relation
  if (companionState?.relationshipLevel) {
    if (companionState.relationshipLevel === 'stranger' || companionState.relationshipLevel === 'acquaintance') {
      suggestions.push(
        { topic: 'introduction', title: 'Parle-moi de toi', category: 'discovery' },
        { topic: 'interests', title: 'Quels sont tes hobbies ?', category: 'discovery' }
      );
    } else if (companionState.relationshipLevel === 'friend' || companionState.relationshipLevel === 'close_friend') {
      suggestions.push(
        { topic: 'deep', title: 'Un rêve que tu aimerais réaliser ?', category: 'personal' },
        { topic: 'memories', title: 'Un souvenir qui te fait sourire ?', category: 'personal' }
      );
    } else if (companionState.relationshipLevel === 'romantic' || companionState.relationshipLevel === 'soulmate') {
      suggestions.push(
        { topic: 'romantic', title: 'Qu\'est-ce qui te rend heureux(se) ?', category: 'intimate' },
        { topic: 'future', title: 'Comment imagines-tu notre avenir ?', category: 'intimate' }
      );
    }
  }

  // Suggestions basées sur les intérêts
  if (userPreferences.interests) {
    for (const interest of userPreferences.interests.slice(0, 2)) {
      suggestions.push({
        topic: 'interest',
        title: `Parlons de ${interest} !`,
        category: 'interests',
      });
    }
  }

  return suggestions.slice(0, 5); // Limiter à 5 suggestions
};

/**
 * Suggère des activités
 */
exports.suggestActivities = (companionState, context = {}) => {
  const { mood, energy } = companionState;
  const activities = [];

  if (energy && energy > 70) {
    activities.push(
      { id: 'game', title: 'Jouer à un jeu', icon: '🎮', type: 'interactive' },
      { id: 'challenge', title: 'Relever un défi', icon: '🏆', type: 'challenge' }
    );
  }

  if (mood === 'low' || mood === 'neutral') {
    activities.push(
      { id: 'meditation', title: 'Méditation guidée', icon: '🧘', type: 'wellbeing' },
      { id: 'music', title: 'Écouter de la musique ensemble', icon: '🎵', type: 'relaxation' }
    );
  }

  activities.push(
    { id: 'story', title: 'Raconter/écouter une histoire', icon: '📖', type: 'creative' },
    { id: 'photo', title: 'Partager des photos', icon: '📸', type: 'sharing' },
    { id: 'goals', title: 'Définir un objectif ensemble', icon: '🎯', type: 'productivity' }
  );

  return activities.slice(0, 6);
};

/**
 * Suggère des réponses rapides
 */
exports.suggestQuickReplies = (lastMessage, companionState) => {
  const replies = [];

  // Analyse rapide du dernier message
  const lowerMessage = (lastMessage || '').toLowerCase();

  // Questions ouvertes
  if (lowerMessage.includes('comment') || lowerMessage.includes('pourquoi') || lowerMessage.includes('quoi')) {
    replies.push('Parle-moi en plus', 'Intéressant !', 'Je t\'écoute');
  }

  // Salutations
  if (lowerMessage.match(/^(salut|bonjour|coucou|hey)/)) {
    replies.push('Salut ! 😊', 'Hey ! Comment ça va ?', 'Coucou ! ❤️');
  }

  // Questions sur l'état
  if (lowerMessage.includes('ça va') || lowerMessage.includes('comment tu vas')) {
    replies.push('Ça va bien, et toi ?', 'Super ! Et toi ?', 'Bien, merci ❤️');
  }

  // Par défaut
  if (replies.length === 0) {
    replies.push('Oui', 'Continue', 'Vraiment ?', 'Je comprends', 'Dis-m\'en plus');
  }

  return replies.slice(0, 3);
};

/**
 * Suggère des moments pour interagir
 */
exports.suggestEngagementMoments = (companionState) => {
  const moments = [];

  // Basé sur le streak
  if (companionState.interactionStreak > 0) {
    moments.push({
      type: 'streak',
      title: `Série de ${companionState.interactionStreak} jours ! 🔥`,
      action: 'Continue ta série',
    });
  }

  // Anniversaire de relation
  const createdAt = new Date(companionState.createdAt);
  const now = new Date();
  const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

  if (daysSinceCreation > 0 && daysSinceCreation % 30 === 0) {
    const months = daysSinceCreation / 30;
    moments.push({
      type: 'anniversary',
      title: `${months} mois ensemble ! 🎉`,
      action: 'Célébrer',
    });
  }

  // Niveau de relation
  if (companionState.relationshipPoints % 10 === 0 && companionState.relationshipPoints > 0) {
    moments.push({
      type: 'milestone',
      title: `${companionState.relationshipPoints} points de relation !`,
      action: 'Continuer à progresser',
    });
  }

  return moments;
};

/**
 * Suggère du contenu personnalisé
 */
exports.suggestPersonalizedContent = async (userId, companionId) => {
  // Placeholder - nécessiterait intégration avec service de recommandation
  const content = [
    {
      type: 'article',
      title: 'Comment améliorer ton bien-être quotidien',
      url: '#',
      reason: 'Basé sur tes intérêts',
    },
    {
      type: 'exercise',
      title: 'Méditation de 5 minutes',
      url: '#',
      reason: 'Pour ton humeur actuelle',
    },
    {
      type: 'quote',
      content: 'Le bonheur n\'est pas une destination, c\'est un voyage',
      author: 'Unknown',
      reason: 'Citation inspirante',
    },
  ];

  return content;
};

module.exports.exports = exports;
