/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback across the app
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback types
 */
export enum HapticType {
  // Selection feedback
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',

  // Notification feedback
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',

  // Impact feedback
  SOFT = 'soft',
  RIGID = 'rigid',

  // Selection
  SELECTION = 'selection'
}

/**
 * Check if haptics are available on the device
 */
export const isHapticsAvailable = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Trigger haptic feedback
 * @param type - Type of haptic feedback
 */
export const triggerHaptic = async (type: HapticType = HapticType.LIGHT): Promise<void> => {
  if (!isHapticsAvailable()) {
    return;
  }

  try {
    switch (type) {
      case HapticType.LIGHT:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case HapticType.MEDIUM:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case HapticType.HEAVY:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case HapticType.SUCCESS:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case HapticType.WARNING:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;

      case HapticType.ERROR:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      case HapticType.SOFT:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        break;

      case HapticType.RIGID:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        break;

      case HapticType.SELECTION:
        await Haptics.selectionAsync();
        break;

      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

/**
 * Haptic feedback for button press
 */
export const buttonPress = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for button long press
 */
export const buttonLongPress = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for switch toggle
 */
export const switchToggle = () => triggerHaptic(HapticType.SELECTION);

/**
 * Haptic feedback for success action
 */
export const success = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Haptic feedback for error action
 */
export const error = () => triggerHaptic(HapticType.ERROR);

/**
 * Haptic feedback for warning action
 */
export const warning = () => triggerHaptic(HapticType.WARNING);

/**
 * Haptic feedback for navigation
 */
export const navigate = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for scroll to boundary
 */
export const scrollBoundary = () => triggerHaptic(HapticType.SOFT);

/**
 * Haptic feedback for item selection in list
 */
export const selectItem = () => triggerHaptic(HapticType.SELECTION);

/**
 * Haptic feedback for gesture completion
 */
export const gestureComplete = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for modal open
 */
export const modalOpen = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for modal close
 */
export const modalClose = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for gift sent
 */
export const giftSent = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Haptic feedback for message sent
 */
export const messageSent = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for message received
 */
export const messageReceived = () => triggerHaptic(HapticType.SOFT);

/**
 * Haptic feedback for level up
 */
export const levelUp = async () => {
  await triggerHaptic(HapticType.HEAVY);
  setTimeout(() => triggerHaptic(HapticType.SUCCESS), 100);
};

/**
 * Haptic feedback for achievement unlocked
 */
export const achievementUnlocked = async () => {
  await triggerHaptic(HapticType.MEDIUM);
  setTimeout(() => triggerHaptic(HapticType.SUCCESS), 100);
};

/**
 * Haptic feedback for payment completed
 */
export const paymentCompleted = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Haptic feedback for delete action
 */
export const deleteAction = () => triggerHaptic(HapticType.HEAVY);

/**
 * Create a custom haptic pattern
 * @param pattern - Array of haptic types with delays
 */
export const customPattern = async (
  pattern: Array<{ type: HapticType; delay: number }>
): Promise<void> => {
  for (const step of pattern) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    await triggerHaptic(step.type);
  }
};

/**
 * Higher-order component to add haptic feedback to touchable components
 */
export const withHapticFeedback = <P extends object>(
  Component: React.ComponentType<P>,
  hapticType: HapticType = HapticType.LIGHT
) => {
  return (props: P & { onPress?: () => void }) => {
    const handlePress = () => {
      triggerHaptic(hapticType);
      props.onPress?.();
    };

    return <Component {...props} onPress={handlePress} />;
  };
};

/**
 * Hook for using haptic feedback
 */
export const useHaptics = () => {
  return {
    trigger: triggerHaptic,
    buttonPress,
    buttonLongPress,
    switchToggle,
    success,
    error,
    warning,
    navigate,
    selectItem,
    gestureComplete,
    modalOpen,
    modalClose,
    giftSent,
    messageSent,
    messageReceived,
    levelUp,
    achievementUnlocked,
    paymentCompleted,
    deleteAction,
    customPattern
  };
};

export default {
  triggerHaptic,
  buttonPress,
  buttonLongPress,
  switchToggle,
  success,
  error,
  warning,
  navigate,
  selectItem,
  gestureComplete,
  modalOpen,
  modalClose,
  giftSent,
  messageSent,
  messageReceived,
  levelUp,
  achievementUnlocked,
  paymentCompleted,
  deleteAction,
  customPattern,
  withHapticFeedback,
  useHaptics
};
