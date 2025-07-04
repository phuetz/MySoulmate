import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Gamepad2, Trophy, Star, Heart, Zap, Target, Shuffle } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: any;
  premium: boolean;
  category: 'puzzle' | 'word' | 'memory' | 'creative';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  target: number;
}

export default function GamesScreen() {
  const { companion, isPremium, updateInteractions } = useAppState();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 12,
    achievements: 8,
    winStreak: 3,
    totalScore: 1250
  });

  // Quiz game state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [questions] = useState([
    {
      question: `What is ${companion.name}'s favorite trait about you?`,
      options: ['Your kindness', 'Your humor', 'Your intelligence', 'Your creativity'],
      correct: 0
    },
    {
      question: "What makes a great conversation?",
      options: ['Listening actively', 'Talking about yourself', 'Avoiding emotions', 'Being distracted'],
      correct: 0
    },
    {
      question: "How can you strengthen your relationship?",
      options: ['Daily check-ins', 'Sharing feelings', 'Being understanding', 'All of the above'],
      correct: 3
    }
  ]);

  // Memory game state
  const [cards, setCards] = useState<Array<{ id: number; value: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryScore, setMemoryScore] = useState(0);

  const games: Game[] = [
    {
      id: 'companion-quiz',
      name: 'Companion Quiz',
      description: 'Test how well you know your companion and relationship tips',
      icon: Target,
      premium: false,
      category: 'puzzle',
      difficulty: 'easy'
    },
    {
      id: 'memory-match',
      name: 'Memory Match',
      description: 'Match pairs of cards to improve your memory',
      icon: Zap,
      premium: false,
      category: 'memory',
      difficulty: 'medium'
    },
    {
      id: 'word-association',
      name: 'Word Association',
      description: 'Play word games with your companion',
      icon: Shuffle,
      premium: true,
      category: 'word',
      difficulty: 'medium'
    },
    {
      id: 'story-builder',
      name: 'Story Builder',
      description: 'Create stories together with your companion',
      icon: Heart,
      premium: true,
      category: 'creative',
      difficulty: 'easy'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'first-game',
      name: 'First Steps',
      description: 'Play your first game',
      icon: Star,
      unlocked: true,
      progress: 1,
      target: 1
    },
    {
      id: 'quiz-master',
      name: 'Quiz Master',
      description: 'Score perfect on a companion quiz',
      icon: Trophy,
      unlocked: false,
      progress: 2,
      target: 3
    },
    {
      id: 'memory-champion',
      name: 'Memory Champion',
      description: 'Complete memory game under 30 seconds',
      icon: Zap,
      unlocked: false,
      progress: 0,
      target: 1
    }
  ];

  useEffect(() => {
    if (selectedGame === 'memory-match') {
      initializeMemoryGame();
    }
  }, [selectedGame]);

  const initializeMemoryGame = () => {
    const symbols = ['❤️', '🌟', '🎵', '🌙', '🦋', '🌺', '🎨', '🔮'];
    const gameCards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        value: symbol,
        flipped: false,
        matched: false
      }));
    setCards(gameCards);
    setMemoryScore(0);
    setFlippedCards([]);
  };

  const handleGameSelect = (game: Game) => {
    if (game.premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedGame(game.id);
    updateInteractions(1);
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setGameActive(true);
  };

  const handleQuizAnswer = (selectedAnswer: number) => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Game finished
      setGameActive(false);
      const finalScore = isCorrect ? score + 1 : score;
      Alert.alert(
        'Quiz Complete!',
        `You scored ${finalScore}/${questions.length}! ${companion.name} is proud of you!`,
        [{ text: 'Play Again', onPress: startQuiz }, { text: 'Back to Games', onPress: () => setSelectedGame(null) }]
      );
      updateInteractions(2);
    }
  };

  const handleCardFlip = (cardId: number) => {
    if (flippedCards.length === 2 || cards[cardId].flipped || cards[cardId].matched) {
      return;
    }

    const newCards = [...cards];
    newCards[cardId].flipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      if (cards[first].value === cards[second].value) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMemoryScore(memoryScore + 1);

          // Check if game is complete
          if (matchedCards.every(card => card.matched)) {
            Alert.alert(
              'Congratulations!',
              `You completed the memory game! ${companion.name} is impressed by your memory skills!`,
              [
                { text: 'Play Again', onPress: initializeMemoryGame },
                { text: 'Back to Games', onPress: () => setSelectedGame(null) }
              ]
            );
            updateInteractions(3);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const renderGameCard = (game: Game) => {
    const IconComponent = game.icon;
    
    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCard}
        onPress={() => handleGameSelect(game)}
      >
        <View style={styles.gameIconContainer}>
          <IconComponent size={32} color="#FFFFFF" />
          {game.premium && !isPremium && (
            <View style={styles.premiumBadge}>
              <Star size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDescription}>{game.description}</Text>
        <View style={styles.gameMetadata}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{game.difficulty}</Text>
          </View>
          <Text style={styles.categoryText}>{game.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuizGame = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={() => setSelectedGame(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Companion Quiz</Text>
        <Text style={styles.scoreText}>Score: {score}/{questions.length}</Text>
      </View>

      {!gameActive ? (
        <View style={styles.gameIntro}>
          <Target size={64} color="#FF6B8A" />
          <Text style={styles.introTitle}>Test Your Knowledge!</Text>
          <Text style={styles.introDescription}>
            See how well you understand relationships and your companion {companion.name}
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.quizContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} 
            />
          </View>
          
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
          
          <Text style={styles.questionText}>
            {questions[currentQuestion].question}
          </Text>
          
          <View style={styles.optionsContainer}>
            {questions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleQuizAnswer(index)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderMemoryGame = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={() => setSelectedGame(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>Memory Match</Text>
        <Text style={styles.scoreText}>Matches: {memoryScore}/8</Text>
      </View>

      <View style={styles.memoryGrid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.memoryCard}
            onPress={() => handleCardFlip(card.id)}
          >
            <Text style={styles.cardContent}>
              {card.flipped || card.matched ? card.value : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={initializeMemoryGame}>
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGamesList = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Games</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Gamepad2 size={24} color="#FF6B8A" />
          <Text style={styles.statValue}>{gameStats.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statCard}>
          <Trophy size={24} color="#9C6ADE" />
          <Text style={styles.statValue}>{gameStats.achievements}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{gameStats.winStreak}</Text>
          <Text style={styles.statLabel}>Win Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Games</Text>
        <View style={styles.gamesGrid}>
          {games.map(renderGameCard)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          {achievements.map((achievement) => {
            const IconComponent = achievement.icon;
            return (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={[styles.achievementIcon, achievement.unlocked && styles.unlockedIcon]}>
                  <IconComponent size={20} color={achievement.unlocked ? "#FFD700" : "#CCCCCC"} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${(achievement.progress / achievement.target) * 100}%` }]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress}/{achievement.target}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  if (selectedGame === 'companion-quiz') {
    return renderQuizGame();
  }

  if (selectedGame === 'memory-match') {
    return renderMemoryGame();
  }

  return (
    <View style={styles.container}>
      {renderGamesList()}
      
      <PremiumFeatureModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="Premium Games"
        description="Unlock exclusive games and challenges with your AI companion."
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardSize = (width - 80) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9C6ADE',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 16,
  },
  gameMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'capitalize',
  },
  categoryText: {
    fontSize: 10,
    color: '#9C6ADE',
    textTransform: 'capitalize',
  },
  achievementsList: {
    marginTop: 8,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unlockedIcon: {
    backgroundColor: '#FFF3CD',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E1E1E1',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B8A',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666666',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    fontSize: 16,
    color: '#FF6B8A',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  scoreText: {
    fontSize: 14,
    color: '#666666',
  },
  gameIntro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#FF6B8A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quizContainer: {
    flex: 1,
    padding: 16,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 32,
    lineHeight: 28,
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
  },
  memoryCard: {
    width: cardSize,
    height: cardSize,
    backgroundColor: '#FF6B8A',
    borderRadius: 12,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#9C6ADE',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});