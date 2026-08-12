/**
 * AdMob Service — Quản lý quảng cáo Rewarded & Interstitial
 *
 * ⚠️  QUAN TRỌNG: File này dùng TEST AD IDs của Google.
 *     Trước khi publish lên Store, thay bằng Ad Unit IDs thật
 *     từ Google AdMob Console (admob.google.com)
 *
 * Cách sử dụng:
 *   import { adMobService } from '../services/adMobService';
 *   await adMobService.showRewardedAd(onRewarded);
 */

import { Platform } from 'react-native';

// ============================================================
// AD UNIT IDs — Thay bằng IDs thật khi publish lên Store
// ============================================================
const AD_UNIT_IDS = {
  // Google Test IDs (hoạt động 100% trong development)
  rewarded: Platform.select({
    android: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded
    ios:     'ca-app-pub-3940256099942544/1712485313', // Test Rewarded iOS
    default: 'ca-app-pub-3940256099942544/5224354917',
  }),
  interstitial: Platform.select({
    android: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial
    ios:     'ca-app-pub-3940256099942544/4411468910',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }),
};

// ============================================================
// TYPE DEFINITIONS
// ============================================================
export type RewardType = 'XP' | 'HEART' | 'STREAK_FREEZE' | 'REPLAY';

export interface RewardConfig {
  type: RewardType;
  amount: number;
  label: string;
  emoji: string;
}

export const REWARD_CONFIGS: Record<RewardType, RewardConfig> = {
  XP:           { type: 'XP',           amount: 50,  label: 'XP thưởng',        emoji: '⭐' },
  HEART:        { type: 'HEART',        amount: 5,   label: 'Trái tim hồi phục', emoji: '❤️' },
  STREAK_FREEZE:{ type: 'STREAK_FREEZE',amount: 1,   label: 'Streak được bảo vệ',emoji: '🛡️' },
  REPLAY:       { type: 'REPLAY',       amount: 1,   label: 'Chơi lại miễn phí', emoji: '🔄' },
};

// ============================================================
// MOCK SERVICE — Hoạt động trong Expo Go / Web
// Khi build APK/IPA với EAS, tự động dùng AdMob SDK thật
// ============================================================
class AdMobService {
  private isInitialized = false;
  private rewardedAdModule: any = null;
  private interstitialAdModule: any = null;
  private isNativeAvailable = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Thử load native AdMob SDK
      const mobileAds = await import('react-native-google-mobile-ads');
      await mobileAds.default().initialize();
      this.rewardedAdModule = mobileAds.RewardedAd;
      this.interstitialAdModule = mobileAds.InterstitialAd;
      this.isNativeAvailable = true;
      console.log('✅ AdMob SDK initialized (Native)');
    } catch (e) {
      // Expo Go hoặc Web — dùng mock
      this.isNativeAvailable = false;
      console.log('📱 AdMob running in MOCK mode (Expo Go / Web)');
    }

    this.isInitialized = true;
  }

  /**
   * Hiển thị Rewarded Ad
   * @param rewardType - Loại phần thưởng user nhận được sau khi xem xong
   * @param onRewarded - Callback khi user xem xong toàn bộ quảng cáo
   * @param onFailed - Callback khi không load được quảng cáo
   */
  async showRewardedAd(
    rewardType: RewardType,
    onRewarded: (reward: RewardConfig) => void,
    onFailed?: () => void,
  ): Promise<void> {
    await this.initialize();

    const rewardConfig = REWARD_CONFIGS[rewardType];

    if (!this.isNativeAvailable) {
      // MOCK MODE — Simulate ad in Expo Go
      console.log(`[AdMob Mock] Showing Rewarded Ad for: ${rewardType}`);
      await this.simulateMockAd();
      onRewarded(rewardConfig);
      return;
    }

    // NATIVE MODE — Dùng AdMob SDK thật
    try {
      const { TestIds, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');

      const adUnitId = __DEV__
        ? TestIds.REWARDED          // Test ID khi dev
        : AD_UNIT_IDS.rewarded!;   // Real ID khi production

      const rewarded = this.rewardedAdModule.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['education', 'english', 'learning'],
      });

      let isRewarded = false;

      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show();
      });

      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        isRewarded = true;
        onRewarded(rewardConfig);
      });

      rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('AdMob Rewarded Error:', error);
        onFailed?.();
      });

      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        if (!isRewarded) {
          // User đóng quảng cáo trước khi xong — không thưởng
          console.log('[AdMob] User closed ad before completion');
        }
      });

      await rewarded.load();
    } catch (err) {
      console.error('[AdMob] Failed to show rewarded ad:', err);
      onFailed?.();
    }
  }

  /**
   * Hiển thị Interstitial Ad (toàn màn hình, không có reward)
   * Dùng giữa các màn hình chuyển tiếp
   */
  async showInterstitialAd(onClosed?: () => void): Promise<void> {
    await this.initialize();

    if (!this.isNativeAvailable) {
      console.log('[AdMob Mock] Interstitial Ad shown (mock)');
      onClosed?.();
      return;
    }

    try {
      const { TestIds, AdEventType } = await import('react-native-google-mobile-ads');

      const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : AD_UNIT_IDS.interstitial!;

      const interstitial = this.interstitialAdModule.createForAdRequest(adUnitId);

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        onClosed?.();
      });

      interstitial.addAdEventListener(AdEventType.ERROR, () => {
        onClosed?.(); // Vẫn cho phép tiếp tục nếu ad fail
      });

      await interstitial.load();
    } catch (err) {
      onClosed?.();
    }
  }

  /**
   * Kiểm tra xem AdMob native có available không
   * (false trong Expo Go, true trong EAS build)
   */
  isNativeMode(): boolean {
    return this.isNativeAvailable;
  }

  // Simulate delay cho mock mode (giống thật hơn)
  private simulateMockAd(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1500));
  }
}

export const adMobService = new AdMobService();
