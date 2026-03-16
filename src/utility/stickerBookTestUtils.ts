import { setStickerBookNotification } from './stickerBookNotification';
import { ServiceConfig } from '../services/ServiceConfig';

/**
 * Testing utility for sticker book notifications
 * This file contains functions to bypass normal sticker book assignment
 * for testing purposes. Only available in development mode.
 */

export class StickerBookTestUtils {
  /**
   * Manually trigger the sticker book notification for testing
   * This bypasses the normal sticker book completion flow
   */
  static async triggerStickerBookNotification(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        'StickerBookTestUtils is only available in development mode',
      );
      return;
    }

    try {
      console.log('🔧 [TEST] Manually triggering sticker book notification');
      setStickerBookNotification();
      console.log('✅ [TEST] Sticker book notification triggered successfully');
    } catch (error) {
      console.error(
        '❌ [TEST] Failed to trigger sticker book notification:',
        error,
      );
    }
  }

  /**
   * Get current user information for testing
   */
  static async getCurrentUserInfo(): Promise<any> {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        'StickerBookTestUtils is only available in development mode',
      );
      return null;
    }

    try {
      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      console.log('🔍 [TEST] Current user:', user);
      return user;
    } catch (error) {
      console.error('❌ [TEST] Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if sticker book notification is currently active
   */
  static checkNotificationStatus(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(
        'StickerBookTestUtils is only available in development mode',
      );
      return;
    }

    // Import the utility function dynamically to avoid circular imports
    import('./stickerBookNotification').then(
      ({ hasStickerBookNotification }) => {
        const hasNotification = hasStickerBookNotification();
        console.log(
          '🔍 [TEST] Sticker book notification status:',
          hasNotification ? 'ACTIVE' : 'INACTIVE',
        );
      },
    );
  }
}

// Make it available globally in development mode for console access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).StickerBookTestUtils = StickerBookTestUtils;
  console.log(
    '🛠️ [TEST] StickerBookTestUtils available at window.StickerBookTestUtils',
  );
  console.log('📋 [TEST] Available methods:');
  console.log(
    '   - triggerStickerBookNotification() - Manually trigger notification',
  );
  console.log('   - getCurrentUserInfo() - Get current user details');
  console.log(
    '   - checkNotificationStatus() - Check if notification is active',
  );
}
