/**
 * RewardedAdButton — Nút "Xem quảng cáo để nhận thưởng"
 *
 * Dùng tại:
 * - Hết trái tim → "Xem quảng cáo hồi 5 tim"
 * - Sau bài học → "Xem quảng cáo nhận +50 XP"
 * - Thua Battle → "Xem quảng cáo để chơi lại"
 * - Nhiệm vụ → "Xem quảng cáo nhận Streak Freeze"
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity, Text, View, StyleSheet,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { adMobService, RewardType, REWARD_CONFIGS } from '../services/adMobService';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Props {
  rewardType: RewardType;
  onRewarded?: () => void;       // Callback sau khi nhận thưởng thành công
  variant?: 'full' | 'compact';  // Layout đầy đủ hoặc nhỏ gọn
  disabled?: boolean;
}

export const RewardedAdButton: React.FC<Props> = ({
  rewardType,
  onRewarded,
  variant = 'full',
  disabled = false,
}) => {
  const { fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const rewardConfig = REWARD_CONFIGS[rewardType];

  // Shimmer animation trên nút
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  // Cooldown timer (tránh spam)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(s => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handlePress = async () => {
    if (isLoading || disabled || cooldownSeconds > 0 || isRewarded) return;

    // Scale down animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setIsLoading(true);

    try {
      await adMobService.showRewardedAd(
        rewardType,
        async (reward) => {
          // ✅ User xem xong toàn bộ quảng cáo
          setIsLoading(false);
          setIsRewarded(true);
          setCooldownSeconds(300); // Cooldown 5 phút

          // Cập nhật trên server
          try {
            await api.post('/users/ad-reward', {
              rewardType: reward.type,
              amount: reward.amount,
            });
            await fetchProfile(); // Cập nhật XP/tim mới nhất
          } catch (e) {
            // Backend chưa có endpoint này — vẫn OK
          }

          // Success animation
          Animated.spring(successAnim, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }).start(() => {
            // Reset sau 3 giây
            setTimeout(() => {
              Animated.timing(successAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setIsRewarded(false));
            }, 2500);
          });

          onRewarded?.();
        },
        () => {
          // ❌ Không load được quảng cáo
          setIsLoading(false);
          Alert.alert(
            'Không Tải Được Quảng Cáo',
            'Vui lòng kiểm tra kết nối mạng và thử lại.',
            [{ text: 'OK' }]
          );
        }
      );
    } catch (e) {
      setIsLoading(false);
    }
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  // ====== COMPACT VARIANT ======
  if (variant === 'compact') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.compactBtn,
            (isLoading || disabled || cooldownSeconds > 0) && styles.compactBtnDisabled,
            isRewarded && styles.compactBtnRewarded,
          ]}
          onPress={handlePress}
          activeOpacity={0.85}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : isRewarded ? (
            <Text style={styles.compactBtnTextRewarded}>✓ {rewardConfig.emoji} Đã Nhận!</Text>
          ) : cooldownSeconds > 0 ? (
            <Text style={styles.compactBtnTextCooldown}>⏱ {Math.floor(cooldownSeconds / 60)}:{String(cooldownSeconds % 60).padStart(2, '0')}</Text>
          ) : (
            <Animated.Text style={[styles.compactBtnText, { opacity: shimmerOpacity }]}>
              📺 +{rewardConfig.amount} {rewardConfig.emoji}
            </Animated.Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ====== FULL VARIANT ======
  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Success Overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: successAnim,
            transform: [{ scale: successAnim }],
          }
        ]}
        pointerEvents="none"
      >
        <Text style={styles.successEmoji}>{rewardConfig.emoji}</Text>
        <Text style={styles.successText}>+{rewardConfig.amount} {rewardConfig.label}!</Text>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.fullBtn,
          (isLoading || disabled || cooldownSeconds > 0) && styles.fullBtnDisabled,
          isRewarded && styles.fullBtnRewarded,
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={isLoading || disabled || cooldownSeconds > 0}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.loadingText}>Đang tải quảng cáo...</Text>
          </View>
        ) : isRewarded ? (
          <View style={styles.rewardedRow}>
            <Text style={styles.rewardedIcon}>✅</Text>
            <Text style={styles.rewardedText}>Đã nhận {rewardConfig.emoji} {rewardConfig.label}!</Text>
          </View>
        ) : cooldownSeconds > 0 ? (
          <View style={styles.cooldownRow}>
            <Text style={styles.cooldownIcon}>⏱</Text>
            <Text style={styles.cooldownText}>
              Xem lại sau {Math.floor(cooldownSeconds / 60)}:{String(cooldownSeconds % 60).padStart(2, '0')}
            </Text>
          </View>
        ) : (
          <View style={styles.normalRow}>
            <View style={styles.adIconWrap}>
              <Text style={styles.adIcon}>📺</Text>
            </View>
            <View style={styles.adInfo}>
              <Animated.Text style={[styles.adLabel, { opacity: shimmerOpacity }]}>
                Xem quảng cáo · 30 giây
              </Animated.Text>
              <Text style={styles.adReward}>
                Nhận ngay {rewardConfig.emoji} +{rewardConfig.amount} {rewardConfig.label}
              </Text>
            </View>
            <Text style={styles.adArrow}>▶</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Chú thích */}
      {!isLoading && !isRewarded && cooldownSeconds === 0 && (
        <Text style={styles.note}>Hoàn toàn miễn phí • Xem 1 quảng cáo ngắn</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 6 },

  // === FULL BUTTON ===
  fullBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fullBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  fullBtnRewarded: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },

  // Normal state
  normalRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  adIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  adIcon: { fontSize: 20 },
  adInfo: { flex: 1, gap: 2 },
  adLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: '600' },
  adReward: { color: '#0F172A', fontSize: 14, fontWeight: '900' },
  adArrow: { color: '#0F172A', fontSize: 16, fontWeight: '900' },

  // Loading state
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  loadingText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  // Rewarded state
  rewardedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  rewardedIcon: { fontSize: 20 },
  rewardedText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

  // Cooldown state
  cooldownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  cooldownIcon: { fontSize: 18 },
  cooldownText: { color: '#64748B', fontSize: 13, fontWeight: '700' },

  // Note
  note: { color: '#475569', fontSize: 10, textAlign: 'center', fontWeight: '500' },

  // Success overlay
  successOverlay: {
    position: 'absolute',
    zIndex: 10,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  successEmoji: { fontSize: 28 },
  successText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },

  // === COMPACT BUTTON ===
  compactBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  compactBtnDisabled: { backgroundColor: '#334155' },
  compactBtnRewarded: { backgroundColor: '#10B981' },
  compactBtnText: { color: '#0F172A', fontSize: 12, fontWeight: '900' },
  compactBtnTextRewarded: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  compactBtnTextCooldown: { color: '#64748B', fontSize: 11, fontWeight: '700' },
});
