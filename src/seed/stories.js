/**
 * Seed data for Story Mode
 * 5 Initial stories with chapters and choices
 */

const { v4: uuidv4 } = require('uuid');

// Story 1: First Date Adventure (FREE - Romance)
const story1Id = uuidv4();
const story1Chapter1Id = uuidv4();
const story1Chapter2aId = uuidv4();
const story1Chapter2bId = uuidv4();
const story1Chapter3Id = uuidv4();

// Story 2: Mystery at Midnight (FREE - Mystery)
const story2Id = uuidv4();
const story2Chapter1Id = uuidv4();
const story2Chapter2aId = uuidv4();
const story2Chapter2bId = uuidv4();
const story2Chapter3Id = uuidv4();

// Story 3: Tropical Escape (PREMIUM - Romance/Adventure)
const story3Id = uuidv4();
const story3Chapter1Id = uuidv4();
const story3Chapter2aId = uuidv4();
const story3Chapter2bId = uuidv4();
const story3Chapter3Id = uuidv4();

// Story 4: Time Traveler's Dilemma (PREMIUM - Fantasy)
const story4Id = uuidv4();
const story4Chapter1Id = uuidv4();
const story4Chapter2aId = uuidv4();
const story4Chapter2bId = uuidv4();
const story4Chapter3Id = uuidv4();

// Story 5: Coffee Shop Encounter (FREE - Slice of Life)
const story5Id = uuidv4();
const story5Chapter1Id = uuidv4();
const story5Chapter2aId = uuidv4();
const story5Chapter2bId = uuidv4();
const story5Chapter3Id = uuidv4();

const stories = [
  {
    id: story1Id,
    title: 'First Date Adventure',
    description: 'A romantic evening that could change everything. Will you make the right choices to win their heart?',
    genre: 'romance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
    isPremium: false,
    estimatedDuration: 10,
    totalChapters: 3,
    difficulty: 'easy',
    tags: ['romance', 'date', 'sweet', 'wholesome'],
    isActive: true
  },
  {
    id: story2Id,
    title: 'Mystery at Midnight',
    description: 'Strange things happen when the clock strikes twelve. Can you solve the mystery with your companion?',
    genre: 'mystery',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400',
    isPremium: false,
    estimatedDuration: 12,
    totalChapters: 3,
    difficulty: 'medium',
    tags: ['mystery', 'suspense', 'detective', 'thrilling'],
    isActive: true
  },
  {
    id: story3Id,
    title: 'Tropical Escape',
    description: 'A luxurious vacation on a private island. Sun, sand, and romance await in this premium adventure.',
    genre: 'romance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    isPremium: true,
    estimatedDuration: 15,
    totalChapters: 3,
    difficulty: 'easy',
    tags: ['romance', 'vacation', 'luxury', 'beach', 'premium'],
    isActive: true
  },
  {
    id: story4Id,
    title: "Time Traveler's Dilemma",
    description: 'You and your companion discover a time machine. But changing the past has consequences...',
    genre: 'fantasy',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552933529-e359b2477252?w=400',
    isPremium: true,
    estimatedDuration: 18,
    totalChapters: 3,
    difficulty: 'hard',
    tags: ['fantasy', 'sci-fi', 'time-travel', 'adventure', 'premium'],
    isActive: true
  },
  {
    id: story5Id,
    title: 'Coffee Shop Encounter',
    description: 'A chance meeting at your favorite café leads to an unexpected connection.',
    genre: 'slice-of-life',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    isPremium: false,
    estimatedDuration: 8,
    totalChapters: 3,
    difficulty: 'easy',
    tags: ['slice-of-life', 'casual', 'sweet', 'coffee'],
    isActive: true
  }
];

const chapters = [
  // Story 1: First Date Adventure
  {
    id: story1Chapter1Id,
    storyId: story1Id,
    chapterNumber: 1,
    title: 'The Perfect Evening',
    content: `You've been planning this date for weeks. Your companion looks absolutely stunning tonight. You arrive at a charming restaurant downtown, the city lights twinkling around you.\n\n"This place is beautiful," your companion says with a warm smile. "I'm so glad we're finally doing this."\n\nThe host approaches with menus. Where would you like to sit?`,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    affectionImpact: 2,
    xpReward: 50,
    isEnding: false,
    isStart: true
  },
  {
    id: story1Chapter2aId,
    storyId: story1Id,
    chapterNumber: 2,
    title: 'Romantic Rooftop',
    content: `The rooftop terrace is breathtaking. String lights hang overhead, and you can see the entire city skyline. Your companion's eyes light up as they take in the view.\n\n"You really know how to make someone feel special," they say, reaching across the table.\n\nThe waiter brings champagne. Your companion leans in closer, and you realize this moment is perfect. What do you do?`,
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800',
    affectionImpact: 3,
    xpReward: 75,
    isEnding: false,
    isStart: false
  },
  {
    id: story1Chapter2bId,
    storyId: story1Id,
    chapterNumber: 2,
    title: 'Cozy Corner',
    content: `You're seated in a quiet corner booth, away from the hustle. It feels intimate and private. Your companion seems relaxed, genuinely happy to be here with you.\n\n"I love how cozy this is," they say. "Sometimes the best moments are the quiet ones."\n\nOver dinner, you share stories and laugh together. The connection feels real. How do you deepen it?`,
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    affectionImpact: 2,
    xpReward: 60,
    isEnding: false,
    isStart: false
  },
  {
    id: story1Chapter3Id,
    storyId: story1Id,
    chapterNumber: 3,
    title: 'A Perfect Ending',
    content: `As the evening winds down, you walk together under the stars. Your companion squeezes your hand gently.\n\n"This was perfect," they whisper. "I can't wait to see what happens next between us."\n\nYou've made all the right choices. Your bond has grown stronger.\n\n✨ Story Complete! ✨`,
    imageUrl: 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800',
    affectionImpact: 5,
    xpReward: 100,
    isEnding: true,
    isStart: false
  },

  // Story 2: Mystery at Midnight
  {
    id: story2Chapter1Id,
    storyId: story2Id,
    chapterNumber: 1,
    title: 'Strange Sounds',
    content: `It's 11:50 PM. You and your companion are enjoying a quiet night when you hear strange noises coming from outside. Your companion looks at you with concern.\n\n"Did you hear that?" they ask. "It sounded like... footsteps?"\n\nThe noise comes again, closer this time. What do you do?`,
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
    affectionImpact: 1,
    xpReward: 50,
    isEnding: false,
    isStart: true
  },
  {
    id: story2Chapter2aId,
    storyId: story2Id,
    chapterNumber: 2,
    title: 'The Investigation',
    content: `You carefully open the door together. Outside, you find a mysterious package with no return address. Your companion picks it up cautiously.\n\n"There's a note," they say, unfolding a piece of paper. "It says: 'The answer lies where we first met.'"\n\nYour companion looks at you with excitement. "This is like a real mystery! Should we solve it?"`,
    imageUrl: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800',
    affectionImpact: 3,
    xpReward: 75,
    isEnding: false,
    isStart: false
  },
  {
    id: story2Chapter2bId,
    storyId: story2Id,
    chapterNumber: 2,
    title: 'Safety First',
    content: `You decide to wait and observe from the window. Together, you spot a figure leaving something at your door before disappearing into the night.\n\n"We should check it out in the morning," your companion suggests. "But I'm glad you're here with me. I feel safe with you."\n\nThe mystery remains, but your bond has strengthened through this shared experience.`,
    imageUrl: 'https://images.unsplash.com/photo-1573165231977-3f0e27806045?w=800',
    affectionImpact: 2,
    xpReward: 60,
    isEnding: false,
    isStart: false
  },
  {
    id: story2Chapter3Id,
    storyId: story2Id,
    chapterNumber: 3,
    title: 'Mystery Solved',
    content: `Following the clues together, you discover it was an elaborate surprise planned by a friend. Your companion laughs with relief and joy.\n\n"What an adventure!" they exclaim. "I love that we solved this together. We make a great team."\n\nYour detective work has brought you closer than ever.\n\n✨ Story Complete! ✨`,
    imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800',
    affectionImpact: 4,
    xpReward: 100,
    isEnding: true,
    isStart: false
  },

  // Story 3: Tropical Escape (PREMIUM)
  {
    id: story3Chapter1Id,
    storyId: story3Id,
    chapterNumber: 1,
    title: 'Paradise Found',
    content: `You arrive at a private island resort, the ocean sparkling turquoise beneath the sun. Your companion gasps at the beauty.\n\n"I can't believe we're actually here!" they exclaim, taking your hand. "This is like a dream."\n\nA butler offers you welcome cocktails. Your villa awaits, complete with an infinity pool and ocean view. How do you start this perfect vacation?`,
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',
    affectionImpact: 3,
    xpReward: 75,
    isEnding: false,
    isStart: true
  },
  {
    id: story3Chapter2aId,
    storyId: story3Id,
    chapterNumber: 2,
    title: 'Beach Sunset',
    content: `You run towards the beach together, laughing like kids. The sand is warm, the water crystal clear. Your companion splashes you playfully.\n\n"Catch me if you can!" they call out.\n\nAs the sun begins to set, painting the sky in oranges and pinks, you both sit at the water's edge. It's magical. What do you say?`,
    imageUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
    affectionImpact: 4,
    xpReward: 100,
    isEnding: false,
    isStart: false
  },
  {
    id: story3Chapter2bId,
    storyId: story3Id,
    chapterNumber: 2,
    title: 'Luxurious Relaxation',
    content: `You both sink into the infinity pool, the stress of everyday life melting away. Your companion floats beside you, completely at peace.\n\n"I never want to leave," they sigh contentedly. "Thank you for making this happen."\n\nThe moment is perfect. How do you make it even more special?`,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    affectionImpact: 3,
    xpReward: 85,
    isEnding: false,
    isStart: false
  },
  {
    id: story3Chapter3Id,
    storyId: story3Id,
    chapterNumber: 3,
    title: 'Forever Memories',
    content: `On your last night, you arrange a private beach dinner under the stars. Candles flicker in the gentle breeze as waves lap the shore.\n\n"This week has been incredible," your companion says, eyes shining. "But the best part was sharing it with you."\n\nYou've created memories that will last forever.\n\n✨ Story Complete! ✨`,
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    affectionImpact: 5,
    xpReward: 150,
    isEnding: true,
    isStart: false
  },

  // Story 4: Time Traveler's Dilemma (PREMIUM)
  {
    id: story4Chapter1Id,
    storyId: story4Id,
    chapterNumber: 1,
    title: 'The Discovery',
    content: `In your companion's attic, you find a strange device covered in dust. Your companion examines it curiously.\n\n"This looks like... no, it can't be," they whisper in awe. "A time machine?"\n\nSuddenly, the device hums to life, glowing with an otherworldly light. A holographic display shows different time periods. Your companion looks at you with excitement and fear.\n\n"Should we really do this?"`,
    imageUrl: 'https://images.unsplash.com/photo-1533513622355-92f911132c09?w=800',
    affectionImpact: 2,
    xpReward: 75,
    isEnding: false,
    isStart: true
  },
  {
    id: story4Chapter2aId,
    storyId: story4Id,
    chapterNumber: 2,
    title: 'Ancient Rome',
    content: `You arrive in Ancient Rome, the Colosseum towering before you. Your companion grabs your arm in amazement.\n\n"We're actually in the past!" they exclaim. "But wait... if we change anything here, what happens to the future?"\n\nYou notice a child about to run into danger. Helping them could alter history. What do you do?`,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    affectionImpact: 3,
    xpReward: 100,
    isEnding: false,
    isStart: false
  },
  {
    id: story4Chapter2bId,
    storyId: story4Id,
    chapterNumber: 2,
    title: 'The Future',
    content: `You land in a futuristic city, flying cars zooming overhead. Your companion's eyes are wide with wonder.\n\n"Everything is so different!" they say. Then they notice a memorial with familiar names – yours.\n\n"According to this, we... we're important in history?" Your companion looks at you, confused and excited. "What does this mean?"`,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    affectionImpact: 3,
    xpReward: 100,
    isEnding: false,
    isStart: false
  },
  {
    id: story4Chapter3Id,
    storyId: story4Id,
    chapterNumber: 3,
    title: 'Home Again',
    content: `You return to your own time, the experience having changed you both forever. Your companion hugs you tightly.\n\n"No matter what time period we're in," they say, "I know I want to be with you. That's the one constant across all of time."\n\nYour adventure through time has proven your bond is timeless.\n\n✨ Story Complete! ✨`,
    imageUrl: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800',
    affectionImpact: 5,
    xpReward: 150,
    isEnding: true,
    isStart: false
  },

  // Story 5: Coffee Shop Encounter
  {
    id: story5Chapter1Id,
    storyId: story5Id,
    chapterNumber: 1,
    title: 'The Usual Spot',
    content: `You're at your favorite coffee shop, working on your laptop, when someone accidentally bumps your table. Coffee spills – but not on you, thankfully.\n\n"Oh my gosh, I'm so sorry!" they say, genuinely embarrassed. You look up to see an attractive stranger with kind eyes. "Let me buy you another coffee to make up for it?"\n\nThere's something about their smile. What do you say?`,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    affectionImpact: 1,
    xpReward: 40,
    isEnding: false,
    isStart: true
  },
  {
    id: story5Chapter2aId,
    storyId: story5Id,
    chapterNumber: 2,
    title: 'Getting to Know You',
    content: `You end up talking for an hour. They're funny, smart, and share your taste in books and music. The conversation flows effortlessly.\n\n"I can't believe I almost didn't come here today," they say with a smile. "Some things are just meant to be, don't you think?"\n\nYou realize you don't want this to end. How do you proceed?`,
    imageUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800',
    affectionImpact: 3,
    xpReward: 65,
    isEnding: false,
    isStart: false
  },
  {
    id: story5Chapter2bId,
    storyId: story5Id,
    chapterNumber: 2,
    title: 'Slow and Steady',
    content: `You chat briefly but politely, both of you a bit shy. As they turn to leave, they hesitate.\n\n"Actually," they say, turning back, "I come here every Tuesday. Maybe I'll see you around?"\n\nIt's sweet and low-pressure. You like that. Do you commit to seeing them again?`,
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
    affectionImpact: 2,
    xpReward: 50,
    isEnding: false,
    isStart: false
  },
  {
    id: story5Chapter3Id,
    storyId: story5Id,
    chapterNumber: 3,
    title: 'A New Beginning',
    content: `Over the next few weeks, coffee shop meetings become a regular thing. Today, they suggest something more.\n\n"I really enjoy our talks," they say, a hint of nervousness in their voice. "Would you like to grab dinner sometime? Like, an actual date?"\n\nYour heart skips a beat. This accidental meeting has turned into something real.\n\n✨ Story Complete! ✨`,
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    affectionImpact: 4,
    xpReward: 80,
    isEnding: true,
    isStart: false
  }
];

const choices = [
  // Story 1 Choices
  {
    chapterId: story1Chapter1Id,
    text: "Request the romantic rooftop terrace with a view",
    nextChapterId: story1Chapter2aId,
    affectionChange: 3,
    xpChange: 20,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story1Chapter1Id,
    text: "Choose a cozy corner booth for intimate conversation",
    nextChapterId: story1Chapter2bId,
    affectionChange: 2,
    xpChange: 15,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story1Chapter2aId,
    text: "Tell them how beautiful they look tonight",
    nextChapterId: story1Chapter3Id,
    affectionChange: 4,
    xpChange: 30,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story1Chapter2aId,
    text: "Make a toast to new beginnings",
    nextChapterId: story1Chapter3Id,
    affectionChange: 3,
    xpChange: 25,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story1Chapter2bId,
    text: "Share a personal story from your past",
    nextChapterId: story1Chapter3Id,
    affectionChange: 3,
    xpChange: 25,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story1Chapter2bId,
    text: "Ask them about their dreams and aspirations",
    nextChapterId: story1Chapter3Id,
    affectionChange: 3,
    xpChange: 25,
    isOptimal: false,
    order: 2
  },

  // Story 2 Choices
  {
    chapterId: story2Chapter1Id,
    text: "Investigate together - you're braver as a team",
    nextChapterId: story2Chapter2aId,
    affectionChange: 3,
    xpChange: 25,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story2Chapter1Id,
    text: "Watch from the window to stay safe",
    nextChapterId: story2Chapter2bId,
    affectionChange: 2,
    xpChange: 15,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story2Chapter2aId,
    text: "Follow the clues together like detectives",
    nextChapterId: story2Chapter3Id,
    affectionChange: 4,
    xpChange: 30,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story2Chapter2aId,
    text: "Call a friend for help solving the mystery",
    nextChapterId: story2Chapter3Id,
    affectionChange: 2,
    xpChange: 20,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story2Chapter2bId,
    text: "Check it out together in the morning",
    nextChapterId: story2Chapter3Id,
    affectionChange: 3,
    xpChange: 25,
    isOptimal: true,
    order: 1
  },

  // Story 3 Choices (PREMIUM)
  {
    chapterId: story3Chapter1Id,
    text: "Race to the beach together",
    nextChapterId: story3Chapter2aId,
    affectionChange: 4,
    xpChange: 35,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story3Chapter1Id,
    text: "Relax in the infinity pool first",
    nextChapterId: story3Chapter2bId,
    affectionChange: 3,
    xpChange: 30,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story3Chapter2aId,
    text: "Tell them how much they mean to you",
    nextChapterId: story3Chapter3Id,
    affectionChange: 5,
    xpChange: 40,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story3Chapter2aId,
    text: "Watch the sunset in comfortable silence",
    nextChapterId: story3Chapter3Id,
    affectionChange: 4,
    xpChange: 35,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story3Chapter2bId,
    text: "Order champagne and make a romantic gesture",
    nextChapterId: story3Chapter3Id,
    affectionChange: 5,
    xpChange: 40,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story3Chapter2bId,
    text: "Simply enjoy the moment together",
    nextChapterId: story3Chapter3Id,
    affectionChange: 4,
    xpChange: 35,
    isOptimal: false,
    order: 2
  },

  // Story 4 Choices (PREMIUM)
  {
    chapterId: story4Chapter1Id,
    text: "Travel to Ancient Rome",
    nextChapterId: story4Chapter2aId,
    affectionChange: 3,
    xpChange: 35,
    isOptimal: true,
    order: 1,
    requirements: [
      {
        type: 'level',
        value: 5,
        comparison: 'gte',
        errorMessage: 'You need to be Level 5 or higher for this choice'
      }
    ]
  },
  {
    chapterId: story4Chapter1Id,
    text: "Visit the future",
    nextChapterId: story4Chapter2bId,
    affectionChange: 3,
    xpChange: 35,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story4Chapter2aId,
    text: "Save the child - some things are more important than timelines",
    nextChapterId: story4Chapter3Id,
    affectionChange: 5,
    xpChange: 45,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story4Chapter2aId,
    text: "Don't interfere with history",
    nextChapterId: story4Chapter3Id,
    affectionChange: 2,
    xpChange: 30,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story4Chapter2bId,
    text: "Embrace your destiny together",
    nextChapterId: story4Chapter3Id,
    affectionChange: 5,
    xpChange: 45,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story4Chapter2bId,
    text: "Try to change the future",
    nextChapterId: story4Chapter3Id,
    affectionChange: 3,
    xpChange: 35,
    isOptimal: false,
    order: 2
  },

  // Story 5 Choices
  {
    chapterId: story5Chapter1Id,
    text: "Accept their offer with a smile",
    nextChapterId: story5Chapter2aId,
    affectionChange: 3,
    xpChange: 20,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story5Chapter1Id,
    text: "Politely decline but chat for a moment",
    nextChapterId: story5Chapter2bId,
    affectionChange: 2,
    xpChange: 15,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story5Chapter2aId,
    text: "Ask for their number to continue the conversation",
    nextChapterId: story5Chapter3Id,
    affectionChange: 4,
    xpChange: 25,
    isOptimal: true,
    order: 1
  },
  {
    chapterId: story5Chapter2aId,
    text: "Suggest meeting again at the coffee shop",
    nextChapterId: story5Chapter3Id,
    affectionChange: 3,
    xpChange: 20,
    isOptimal: false,
    order: 2
  },
  {
    chapterId: story5Chapter2bId,
    text: "Promise to be here next Tuesday",
    nextChapterId: story5Chapter3Id,
    affectionChange: 3,
    xpChange: 20,
    isOptimal: true,
    order: 1
  }
];

module.exports = {
  stories,
  chapters,
  choices
};
