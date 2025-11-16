/**
 * Haptic Feedback Utility
 *
 * Provides haptic feedback on supported devices.
 * Gracefully degrades if expo-haptics is not available.
 */

let Haptics: any = null;

// Try to import expo-haptics, but don't fail if not available
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.log('expo-haptics not available, haptic feedback disabled');
}

export enum ImpactStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationStyle {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

/**
 * Trigger impact haptic feedback
 */
export async function impact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
  if (!Haptics) return;

  try {
    switch (style) {
      case ImpactStyle.Light:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case ImpactStyle.Medium:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case ImpactStyle.Heavy:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch (e) {
    console.warn('Haptic feedback failed:', e);
  }
}

/**
 * Trigger notification haptic feedback
 */
export async function notification(style: NotificationStyle = NotificationStyle.Success): Promise<void> {
  if (!Haptics) return;

  try {
    switch (style) {
      case NotificationStyle.Success:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case NotificationStyle.Warning:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case NotificationStyle.Error:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    console.warn('Haptic feedback failed:', e);
  }
}

/**
 * Trigger selection haptic feedback (light tap)
 */
export async function selection(): Promise<void> {
  if (!Haptics) return;

  try {
    await Haptics.selectionAsync();
  } catch (e) {
    console.warn('Haptic feedback failed:', e);
  }
}

// Helper functions for common use cases
export const haptics = {
  /**
   * Light tap (for button presses, selections)
   */
  light: () => impact(ImpactStyle.Light),

  /**
   * Medium tap (for general interactions)
   */
  medium: () => impact(ImpactStyle.Medium),

  /**
   * Heavy tap (for important actions)
   */
  heavy: () => impact(ImpactStyle.Heavy),

  /**
   * Success notification (for successful operations)
   */
  success: () => notification(NotificationStyle.Success),

  /**
   * Warning notification (for warnings)
   */
  warning: () => notification(NotificationStyle.Warning),

  /**
   * Error notification (for errors)
   */
  error: () => notification(NotificationStyle.Error),

  /**
   * Selection (for scrolling through items)
   */
  selection: () => selection(),
};
