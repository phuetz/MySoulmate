/**
 * Deep Linking Utilities
 * Handles universal links and deep links for the app
 */
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// URL scheme for the app
export const APP_SCHEME = 'mysoulmate';
export const WEB_URL = 'https://mysoulmate.app';

/**
 * Supported deep link routes
 */
export const DEEP_LINK_ROUTES = {
  // Authentication
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // Main features
  HOME: '/',
  CHAT: '/(tabs)/chat',
  PROFILE: '/(tabs)/customize',
  GIFTS: '/(tabs)/gifts',
  SETTINGS: '/(tabs)/settings',

  // Notifications
  NOTIFICATIONS: '/(tabs)/notifications',

  // Premium
  SUBSCRIBE: '/subscribe',
  CHECKOUT: '/checkout',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Special
  GIFT_DETAIL: '/gift/:id',
  GAME: '/game/:gameId'
};

/**
 * Initialize deep linking
 * Call this on app startup
 */
export const initializeDeepLinking = () => {
  // Handle initial URL if app was opened from link
  Linking.getInitialURL().then(url => {
    if (url) {
      handleDeepLink(url);
    }
  });

  // Listen for deep links while app is open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => {
    subscription.remove();
  };
};

/**
 * Handle deep link
 * @param url - Deep link URL
 */
export const handleDeepLink = (url: string) => {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log('Deep link received:', { hostname, path, queryParams });

    // Handle different routes
    if (path) {
      // Remove leading slash if present
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      // Check for special routes
      if (normalizedPath.includes('/reset-password')) {
        const token = queryParams?.token as string;
        if (token) {
          router.push(`/auth/reset-password?token=${token}`);
          return;
        }
      }

      if (normalizedPath.includes('/verify-email')) {
        const token = queryParams?.token as string;
        if (token) {
          router.push(`/auth/verify-email?token=${token}`);
          return;
        }
      }

      if (normalizedPath.includes('/gift/')) {
        const giftId = normalizedPath.split('/gift/')[1];
        router.push(`/(tabs)/gifts?giftId=${giftId}`);
        return;
      }

      if (normalizedPath.includes('/game/')) {
        const gameId = normalizedPath.split('/game/')[1];
        router.push(`/(tabs)/games?gameId=${gameId}`);
        return;
      }

      // For all other routes, try to navigate directly
      router.push(normalizedPath as any);
    } else {
      // Default to home
      router.push('/');
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
    // Fallback to home
    router.push('/');
  }
};

/**
 * Create deep link URL
 * @param path - App path
 * @param params - Query parameters
 * @returns Deep link URL
 */
export const createDeepLink = (path: string, params?: Record<string, string>): string => {
  let url = `${APP_SCHEME}:/${path}`;

  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }

  return url;
};

/**
 * Create universal link (HTTPS)
 * @param path - App path
 * @param params - Query parameters
 * @returns Universal link URL
 */
export const createUniversalLink = (path: string, params?: Record<string, string>): string => {
  let url = `${WEB_URL}${path}`;

  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }

  return url;
};

/**
 * Open deep link
 * @param url - Deep link or universal link
 */
export const openDeepLink = async (url: string) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.warn('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening deep link:', error);
  }
};

/**
 * Share deep link
 * @param path - App path
 * @param message - Share message
 */
export const shareDeepLink = async (path: string, message?: string) => {
  try {
    const { Share } = await import('react-native');
    const universalLink = createUniversalLink(path);

    await Share.share({
      message: message || `Check this out on MySoulmate: ${universalLink}`,
      url: universalLink
    });
  } catch (error) {
    console.error('Error sharing deep link:', error);
  }
};

/**
 * Common deep link actions
 */
export const deepLinkActions = {
  /**
   * Navigate to reset password with token
   */
  resetPassword: (token: string) => {
    const link = createUniversalLink('/reset-password', { token });
    return link;
  },

  /**
   * Navigate to email verification
   */
  verifyEmail: (token: string) => {
    const link = createUniversalLink('/verify-email', { token });
    return link;
  },

  /**
   * Navigate to specific gift
   */
  viewGift: (giftId: string) => {
    const link = createUniversalLink(`/gift/${giftId}`);
    return link;
  },

  /**
   * Navigate to game
   */
  playGame: (gameId: string) => {
    const link = createUniversalLink(`/game/${gameId}`);
    return link;
  },

  /**
   * Navigate to subscription page
   */
  subscribe: (plan?: string) => {
    const params = plan ? { plan } : undefined;
    const link = createUniversalLink('/subscribe', params);
    return link;
  },

  /**
   * Navigate to chat
   */
  openChat: () => {
    const link = createDeepLink('(tabs)/chat');
    return link;
  }
};

/**
 * Test deep linking
 * Useful for development
 */
export const testDeepLinks = () => {
  console.log('=== Deep Link Examples ===');
  console.log('Reset Password:', deepLinkActions.resetPassword('test-token-123'));
  console.log('Verify Email:', deepLinkActions.verifyEmail('email-token-456'));
  console.log('View Gift:', deepLinkActions.viewGift('gift-123'));
  console.log('Play Game:', deepLinkActions.playGame('quiz'));
  console.log('Subscribe:', deepLinkActions.subscribe('premium'));
  console.log('Open Chat:', deepLinkActions.openChat());
  console.log('========================');
};

export default {
  initializeDeepLinking,
  handleDeepLink,
  createDeepLink,
  createUniversalLink,
  openDeepLink,
  shareDeepLink,
  deepLinkActions,
  testDeepLinks,
  APP_SCHEME,
  WEB_URL,
  DEEP_LINK_ROUTES
};
