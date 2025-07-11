const logger = require('../utils/logger');

// Exemple de donnees de recommandations
const recommendations = [
  {
    id: '1',
    type: 'video',
    title: 'Meditation for Beginners',
    description: 'Short daily meditation routine to relax.',
    url: 'https://example.com/videos/meditation',
    imageUrl: 'https://placehold.co/600x400?text=Meditation'
  },
  {
    id: '2',
    type: 'music',
    title: 'Chill Beats',
    description: 'Relaxing lo-fi playlist',
    url: 'https://example.com/music/chill',
    imageUrl: 'https://placehold.co/600x400?text=Chill+Beats'
  },
  {
    id: '3',
    type: 'article',
    title: '5 Tips for Better Sleep',
    description: 'Improve your sleep with these simple tips.',
    url: 'https://example.com/articles/sleep',
    imageUrl: 'https://placehold.co/600x400?text=Sleep'
  }
];

exports.getRecommendations = async (req, res, next) => {
  try {
    res.status(200).json({ recommendations });
  } catch (error) {
    logger.error('Erreur lors de la récupération des recommandations:', error);
    next(error);
  }
};
