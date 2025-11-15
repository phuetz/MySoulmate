/**
 * GraphQL Server Configuration
 * Modern GraphQL API with Apollo Server
 */

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

// Type Definitions
const typeDefs = `
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    username: String
    role: Role!
    subscription: Subscription
    companions: [Companion!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum Role {
    USER
    PREMIUM
    ELITE
    ADMIN
  }

  type Companion {
    id: ID!
    name: String!
    userId: ID!
    personality: JSON
    appearance: JSON
    voiceSettings: JSON
    conversations: [Conversation!]!
    stats: CompanionStats!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CompanionStats {
    totalMessages: Int!
    totalInteractions: Int!
    averageResponseTime: Float
    lastInteraction: DateTime
    sentiment: SentimentData
  }

  type SentimentData {
    overall: Float!
    trend: String!
    breakdown: JSON
  }

  type Conversation {
    id: ID!
    companionId: ID!
    messages(limit: Int = 50, offset: Int = 0): MessageConnection!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MessageEdge {
    node: Message!
    cursor: String!
  }

  type Message {
    id: ID!
    conversationId: ID!
    role: MessageRole!
    content: String!
    metadata: JSON
    sentiment: Float
    timestamp: DateTime!
  }

  enum MessageRole {
    USER
    ASSISTANT
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Subscription {
    id: ID!
    userId: ID!
    tier: SubscriptionTier!
    status: SubscriptionStatus!
    startDate: DateTime!
    endDate: DateTime
    autoRenew: Boolean!
    features: [String!]!
  }

  enum SubscriptionTier {
    FREE
    PREMIUM
    ELITE
  }

  enum SubscriptionStatus {
    ACTIVE
    CANCELLED
    EXPIRED
    TRIAL
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    currency: String!
    category: ProductCategory!
    imageUrl: String
    available: Boolean!
  }

  type ProductCategory {
    id: ID!
    name: String!
    products: [Product!]!
  }

  type AnalyticsData {
    timeRange: TimeRange!
    metrics: Metrics!
    events: [AnalyticsEvent!]!
  }

  type TimeRange {
    start: DateTime!
    end: DateTime!
  }

  type Metrics {
    totalUsers: Int!
    activeUsers: Int!
    totalInteractions: Int!
    averageSessionDuration: Float!
    retentionRate: Float!
    churnRate: Float!
  }

  type AnalyticsEvent {
    name: String!
    count: Int!
    timestamp: DateTime!
  }

  # Queries
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int = 20, offset: Int = 0, role: Role): [User!]!

    # Companion queries
    companion(id: ID!): Companion
    myCompanions: [Companion!]!
    companionStats(id: ID!): CompanionStats

    # Conversation queries
    conversation(id: ID!): Conversation
    myConversations(limit: Int = 20): [Conversation!]!

    # Product queries
    product(id: ID!): Product
    products(category: String, limit: Int = 20): [Product!]!
    categories: [ProductCategory!]!

    # Analytics queries (admin)
    analytics(startDate: DateTime!, endDate: DateTime!): AnalyticsData!
    userAnalytics(userId: ID!, startDate: DateTime!, endDate: DateTime!): AnalyticsData!

    # Feature flags
    featureFlags: JSON!
    isFeatureEnabled(key: String!): Boolean!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, username: String): AuthPayload!
    logout: Boolean!

    # User mutations
    updateProfile(input: UpdateProfileInput!): User!
    deleteAccount: Boolean!

    # Companion mutations
    createCompanion(input: CreateCompanionInput!): Companion!
    updateCompanion(id: ID!, input: UpdateCompanionInput!): Companion!
    deleteCompanion(id: ID!): Boolean!

    # Message mutations
    sendMessage(companionId: ID!, content: String!): Message!
    deleteMessage(id: ID!): Boolean!

    # Subscription mutations
    subscribe(tier: SubscriptionTier!): Subscription!
    cancelSubscription: Subscription!

    # Product mutations
    purchaseProduct(productId: ID!): Purchase!

    # Feature flag mutations (admin)
    enableFeature(key: String!): Boolean!
    disableFeature(key: String!): Boolean!
  }

  # Subscriptions (WebSocket)
  type Subscription {
    # Real-time message updates
    messageReceived(conversationId: ID!): Message!

    # Typing indicators
    typingStarted(conversationId: ID!): TypingIndicator!
    typingStopped(conversationId: ID!): TypingIndicator!

    # Companion status
    companionStatusChanged(companionId: ID!): CompanionStatus!

    # User presence
    userPresenceChanged(userId: ID!): UserPresence!
  }

  type TypingIndicator {
    conversationId: ID!
    userId: ID!
    isTyping: Boolean!
  }

  type CompanionStatus {
    companionId: ID!
    status: String!
    lastActive: DateTime
  }

  type UserPresence {
    userId: ID!
    status: PresenceStatus!
    lastSeen: DateTime
  }

  enum PresenceStatus {
    ONLINE
    AWAY
    OFFLINE
  }

  # Input types
  input UpdateProfileInput {
    username: String
    preferences: JSON
  }

  input CreateCompanionInput {
    name: String!
    personality: JSON
    appearance: JSON
    voiceSettings: JSON
  }

  input UpdateCompanionInput {
    name: String
    personality: JSON
    appearance: JSON
    voiceSettings: JSON
  }

  # Auth payload
  type AuthPayload {
    token: String!
    user: User!
    expiresIn: String!
  }

  type Purchase {
    id: ID!
    productId: ID!
    userId: ID!
    amount: Float!
    status: String!
    createdAt: DateTime!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { User } = require('../models');
      return await User.findByPk(user.id);
    },

    user: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Unauthorized');
      const { User } = require('../models');
      return await User.findByPk(id);
    },

    users: async (_, { limit, offset, role }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Unauthorized');
      const { User } = require('../models');
      const where = role ? { role } : {};
      return await User.findAll({ where, limit, offset });
    },

    companion: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { Companion } = require('../models');
      const companion = await Companion.findByPk(id);
      if (companion.userId !== user.id && user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return companion;
    },

    myCompanions: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { Companion } = require('../models');
      return await Companion.findAll({ where: { userId: user.id } });
    },

    products: async (_, { category, limit }) => {
      const { Product } = require('../models');
      const where = category ? { category } : {};
      return await Product.findAll({ where, limit });
    },

    featureFlags: async (_, __, { user }) => {
      const featureFlagsService = require('../services/featureFlags');
      return featureFlagsService.getUserFlags(user?.id, user?.role);
    },

    isFeatureEnabled: async (_, { key }, { user }) => {
      const featureFlagsService = require('../services/featureFlags');
      return featureFlagsService.isEnabled(key, user?.id, user?.role);
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const { User } = require('../models');
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');

      const user = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user,
        expiresIn: '24h'
      };
    },

    sendMessage: async (_, { companionId, content }, { user, pubsub }) => {
      if (!user) throw new Error('Not authenticated');

      const { Message, Conversation } = require('../models');

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: { companionId, userId: user.id }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          companionId,
          userId: user.id
        });
      }

      // Create message
      const message = await Message.create({
        conversationId: conversation.id,
        role: 'USER',
        content,
        timestamp: new Date()
      });

      // Publish to subscribers
      pubsub.publish('MESSAGE_RECEIVED', {
        messageReceived: message,
        conversationId: conversation.id
      });

      // TODO: Get AI response
      // const aiResponse = await getAIResponse(content);
      // Create AI message and publish

      return message;
    },

    createCompanion: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { Companion } = require('../models');
      return await Companion.create({
        ...input,
        userId: user.id
      });
    },

    updateCompanion: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { Companion } = require('../models');
      const companion = await Companion.findByPk(id);

      if (companion.userId !== user.id && user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      await companion.update(input);
      return companion;
    }
  },

  Subscription: {
    messageReceived: {
      subscribe: (_, { conversationId }, { pubsub }) => {
        return pubsub.asyncIterator([`MESSAGE_RECEIVED_${conversationId}`]);
      }
    },

    typingStarted: {
      subscribe: (_, { conversationId }, { pubsub }) => {
        return pubsub.asyncIterator([`TYPING_STARTED_${conversationId}`]);
      }
    }
  },

  // Field resolvers
  User: {
    companions: async (user) => {
      const { Companion } = require('../models');
      return await Companion.findAll({ where: { userId: user.id } });
    },

    subscription: async (user) => {
      const { Subscription } = require('../models');
      return await Subscription.findOne({
        where: { userId: user.id, status: 'ACTIVE' }
      });
    }
  },

  Companion: {
    stats: async (companion) => {
      const { Message } = require('../models');
      const totalMessages = await Message.count({
        where: { companionId: companion.id }
      });

      return {
        totalMessages,
        totalInteractions: totalMessages,
        averageResponseTime: null,
        lastInteraction: null,
        sentiment: null
      };
    }
  }
};

/**
 * Create Apollo Server
 */
async function createGraphQLServer(httpServer) {
  const { PubSub } = require('graphql-subscriptions');
  const pubsub = new PubSub();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ],
    context: ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let user = null;

      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
          // Invalid token, user remains null
        }
      }

      return { user, pubsub };
    }
  });

  await server.start();

  return server;
}

module.exports = {
  createGraphQLServer,
  typeDefs,
  resolvers
};
