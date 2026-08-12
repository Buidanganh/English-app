import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Animated, Platform, Alert,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

/* =====================
   TYPES
===================== */
interface Mission {
  id: string;
  missionKey: string;
  missionType: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: string;
}

interface MissionsData {
  daily: Mission[];
  weekly: Mission[];
  claimableXp: number;
  completedToday: number;
  completedWeekly: number;
  dailyExpiresAt: string;
  weeklyExpiresAt: string;
}

interface Props {
  onBack: () => void;
}

/* =====================
   MAIN SCREEN
===================== */
export const MissionsScreen: React.FC<Props> = ({ onBack }) => {
  const { fetchProfile } = useAuthStore();
  const [data, setData] = useState<MissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const claimBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMissions();
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchMissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/missions/today');
      setData(res.data);
    } catch (err) {
      console.error('Missions fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimAll = async () => {
    if (!data || data.claimableXp === 0) return;

    // Scale animation
    Animated.sequence([
      Animated.timing(claimBtnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(claimBtnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setIsClaiming(true);
    try {
      const res = await api.post('/missions/claim-all');
      Alert.alert(
        '🎉 Nhận Thưởng Thành Công!',
        res.data.message,
        [{ text: 'Tuyệt Vời!', style: 'default' }]
      );
      await fetchProfile();
      fetchMissions();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể nhận thưởng. Vui lòng thử lại.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimSingle = async (missionId: string) => {
    setIsClaiming(true);
    try {
      const res = await api.post(`/missions/claim/${missionId}`);
      if (res.data.success) {
        Alert.alert('🎉 Thành Công!', res.data.message);
        await fetchProfile();
        fetchMissions();
      } else {
        Alert.alert('Thông báo', res.data.message);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể nhận thưởng.');
    } finally {
      setIsClaiming(false);
    }
  };

  /* =====================
     LOADING
  ===================== */
  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Đang tải nhiệm vụ...</Text>
      </SafeAreaView>
    );
  }

  const missions = activeTab === 'DAILY' ? data.daily : data.weekly;
  const completedCount = missions.filter(m => m.isCompleted).length;
  const claimedCount = missions.filter(m => m.isClaimed).length;
  const hasUnclaimed = missions.some(m => m.isCompleted && !m.isClaimed);

  // Countdown đến hết hạn
  const expiryDate = new Date(activeTab === 'DAILY' ? data.dailyExpiresAt : data.weeklyExpiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 3600000));
  const minutesLeft = Math.max(0, Math.floor(((expiryDate.getTime() - now.getTime()) % 3600000) / 60000));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Trang Chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Nhiệm Vụ</Text>
        <TouchableOpacity onPress={fetchMissions} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* XP Claimable Banner */}
      {data.claimableXp > 0 && (
        <Animated.View style={[styles.claimBanner, { transform: [{ scale: claimBtnScale }] }]}>
          <View style={styles.claimBannerInfo}>
            <Text style={styles.claimBannerEmoji}>💰</Text>
            <View>
              <Text style={styles.claimBannerTitle}>Có Thưởng Chờ Nhận!</Text>
              <Text style={styles.claimBannerXp}>+{data.claimableXp} XP đang chờ bạn</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.claimAllBtn}
            onPress={handleClaimAll}
            disabled={isClaiming}
            activeOpacity={0.85}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.claimAllBtnText}>Nhận Tất Cả ➔</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'DAILY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('DAILY')}
        >
          <Text style={[styles.tabText, activeTab === 'DAILY' && styles.tabTextActive]}>
            🌅 Hàng Ngày
          </Text>
          <Text style={[styles.tabCount, activeTab === 'DAILY' && styles.tabCountActive]}>
            {data.completedToday}/{data.daily.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'WEEKLY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('WEEKLY')}
        >
          <Text style={[styles.tabText, activeTab === 'WEEKLY' && styles.tabTextActive]}>
            🏆 Hàng Tuần
          </Text>
          <Text style={[styles.tabCount, activeTab === 'WEEKLY' && styles.tabCountActive]}>
            {data.completedWeekly}/{data.weekly.length}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Hoàn Thành</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {missions.filter(m => m.isCompleted && !m.isClaimed).reduce((s, m) => s + m.xpReward, 0)}
            </Text>
            <Text style={styles.statLabel}>XP Chờ Nhận</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#64748B' }]}>
              {hoursLeft}h{minutesLeft}m
            </Text>
            <Text style={styles.statLabel}>Còn Lại</Text>
          </View>
        </View>

        {/* Progress Bar Overall */}
        <View style={styles.overallProgress}>
          <View style={styles.overallProgressLabels}>
            <Text style={styles.overallLabel}>Tiến Độ {activeTab === 'DAILY' ? 'Hôm Nay' : 'Tuần Này'}</Text>
            <Text style={styles.overallPercent}>
              {missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.overallTrack}>
            <View style={[
              styles.overallFill,
              {
                width: `${missions.length > 0 ? (completedCount / missions.length) * 100 : 0}%` as any,
                backgroundColor: activeTab === 'DAILY' ? '#F59E0B' : '#8B5CF6',
              }
            ]} />
          </View>
        </View>

        {/* Mission Cards */}
        <View style={styles.missionList}>
          {missions.map((mission, idx) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              index={idx}
              onClaim={() => handleClaimSingle(mission.id)}
              isClaiming={isClaiming}
              accentColor={activeTab === 'DAILY' ? '#F59E0B' : '#8B5CF6'}
            />
          ))}
        </View>

        {/* Completion Celebration */}
        {completedCount === missions.length && missions.length > 0 && (
          <View style={[styles.celebBox, { borderColor: activeTab === 'DAILY' ? '#F59E0B' : '#8B5CF6' }]}>
            <Text style={styles.celebEmoji}>🏆</Text>
            <Text style={styles.celebTitle}>
              {activeTab === 'DAILY' ? 'Hoàn Thành Tất Cả Nhiệm Vụ Hôm Nay!' : 'Tuần Hùng! Tất Cả Hoàn Thành!'}
            </Text>
            <Text style={styles.celebSub}>Bạn thật sự xuất sắc! Tiếp tục duy trì phong độ nhé 💪</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/* =====================
   MISSION CARD
===================== */
const MissionCard = ({
  mission, index, onClaim, isClaiming, accentColor,
}: {
  mission: Mission;
  index: number;
  onClaim: () => void;
  isClaiming: boolean;
  accentColor: string;
}) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();

    const progressTarget = mission.targetCount > 0 ? mission.currentCount / mission.targetCount : 0;
    Animated.timing(progressAnim, {
      toValue: progressTarget,
      duration: 800,
      delay: delay + 200,
      useNativeDriver: false,
    }).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isCompleted = mission.isCompleted;
  const isClaimed = mission.isClaimed;

  return (
    <Animated.View style={[
      styles.missionCard,
      isCompleted && !isClaimed && styles.missionCardCompleted,
      isClaimed && styles.missionCardClaimed,
      { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
    ]}>
      {/* Left: Icon */}
      <View style={[styles.missionIconWrap, {
        backgroundColor: isCompleted ? accentColor : '#1E293B',
        borderColor: isCompleted ? accentColor : '#334155',
      }]}>
        <Text style={styles.missionIcon}>{mission.icon}</Text>
        {isClaimed && (
          <View style={styles.claimedCheckWrap}>
            <Text style={styles.claimedCheck}>✓</Text>
          </View>
        )}
      </View>

      {/* Middle: Info */}
      <View style={styles.missionInfo}>
        <View style={styles.missionTitleRow}>
          <Text style={[styles.missionTitle, isClaimed && styles.missionTitleClaimed]}>
            {mission.title}
          </Text>
          <Text style={[styles.missionXp, { color: accentColor }]}>+{mission.xpReward} XP</Text>
        </View>
        <Text style={styles.missionDesc} numberOfLines={1}>{mission.description}</Text>

        {/* Progress Bar */}
        <View style={styles.missionProgressTrack}>
          <Animated.View style={[styles.missionProgressFill, {
            width: progressWidth,
            backgroundColor: isClaimed ? '#334155' : accentColor,
          }]} />
        </View>
        <Text style={styles.missionProgressText}>
          {mission.currentCount}/{mission.targetCount}
          {isCompleted ? ' ✅' : ''}
        </Text>
      </View>

      {/* Right: CTA */}
      {isCompleted && !isClaimed ? (
        <TouchableOpacity
          style={[styles.claimBtn, { backgroundColor: accentColor }]}
          onPress={onClaim}
          disabled={isClaiming}
          activeOpacity={0.8}
        >
          {isClaiming ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Text style={styles.claimBtnText}>Nhận{'\n'}Thưởng</Text>
          )}
        </TouchableOpacity>
      ) : isClaimed ? (
        <View style={styles.claimedBadge}>
          <Text style={styles.claimedBadgeText}>Đã{'\n'}Nhận ✓</Text>
        </View>
      ) : (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedBadgeText}>{mission.targetCount > 1 ? `${mission.currentCount}/${mission.targetCount}` : '🔒'}</Text>
        </View>
      )}
    </Animated.View>
  );
};

/* =====================
   STYLES
===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#94A3B8', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backIcon: { fontSize: 18, color: '#F59E0B', fontWeight: 'bold' },
  backText: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 15 },

  // Claim Banner
  claimBanner: {
    backgroundColor: '#1C1A0E',
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  claimBannerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  claimBannerEmoji: { fontSize: 28 },
  claimBannerTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  claimBannerXp: { color: '#F59E0B', fontWeight: '900', fontSize: 16 },
  claimAllBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  claimAllBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 13 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#F59E0B' },
  tabText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  tabCountActive: { backgroundColor: '#F59E0B', color: '#0F172A' },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 14 },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#64748B', fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Overall Progress
  overallProgress: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overallProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  overallLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  overallPercent: { color: '#F59E0B', fontWeight: '900', fontSize: 14 },
  overallTrack: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  overallFill: { height: '100%', borderRadius: 4 },

  // Mission List
  missionList: { gap: 10 },
  missionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  missionCardCompleted: {
    borderColor: '#F59E0B',
    backgroundColor: '#1C1A0E',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  missionCardClaimed: {
    borderColor: '#334155',
    backgroundColor: '#141A24',
    opacity: 0.65,
  },

  // Icon
  missionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  missionIcon: { fontSize: 22 },
  claimedCheckWrap: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedCheck: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  // Info
  missionInfo: { flex: 1 },
  missionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  missionTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, flex: 1 },
  missionTitleClaimed: { color: '#64748B' },
  missionXp: { fontWeight: '900', fontSize: 12 },
  missionDesc: { color: '#64748B', fontSize: 11, marginBottom: 8 },
  missionProgressTrack: { height: 5, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  missionProgressFill: { height: '100%', borderRadius: 3 },
  missionProgressText: { color: '#475569', fontSize: 10, fontWeight: '600' },

  // CTA Buttons
  claimBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  claimBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 11, textAlign: 'center' },
  claimedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 60,
    backgroundColor: '#0F2818',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  claimedBadgeText: { color: '#10B981', fontWeight: '800', fontSize: 10, textAlign: 'center' },
  lockedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 44,
    backgroundColor: '#1E293B',
  },
  lockedBadgeText: { color: '#475569', fontWeight: '700', fontSize: 11, textAlign: 'center' },

  // Celebration
  celebBox: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
  },
  celebEmoji: { fontSize: 48 },
  celebTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  celebSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
