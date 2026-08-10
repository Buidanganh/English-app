import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Props {
  onNavigateCourse: () => void;
  onNavigateRoleplay: () => void;
  onNavigateSubscription: () => void;
  onNavigateVoiceBattle: () => void;
  onNavigateAdmin: () => void;
}

export const HomeScreen: React.FC<Props> = ({
  onNavigateCourse,
  onNavigateRoleplay,
  onNavigateSubscription,
  onNavigateVoiceBattle,
  onNavigateAdmin,
}) => {
  const { user, logout, fetchProfile } = useAuthStore();
  const tier = user?.subscriptionTier || 'FREE';
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    checkDailyRewardStatus();
  }, []);

  const checkDailyRewardStatus = async () => {
    try {
      const res = await api.get('/daily-rewards/status');
      setCanClaimDaily(res.data.canClaim);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimDailyReward = async () => {
    setIsClaiming(true);
    try {
      const res = await api.post('/daily-rewards/claim');
      Alert.alert('🎉 Điểm Danh Thành Công', res.data.message);
      setCanClaimDaily(false);
      await fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Thông báo', err.response?.data?.message || 'Bạn đã điểm danh hôm nay rồi!');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.fullName || 'Học viên Tiếng Anh'}</Text>
            {tier === 'PRO' ? (
              <View style={styles.badgePro}><Text style={styles.badgeProText}>PRO 👑</Text></View>
            ) : tier === 'PLUS' ? (
              <View style={styles.badgePlus}><Text style={styles.badgePlusText}>PLUS ⚡</Text></View>
            ) : (
              <View style={styles.badgeFree}><Text style={styles.badgeFreeText}>FREE</Text></View>
            )}
          </View>
          <Text style={styles.greeting}>Hành trình chinh phục Tiếng Anh 👋</Text>
        </View>

        <View style={styles.headerRightGroup}>
          {user?.role === 'ADMIN' ? (
            <TouchableOpacity style={styles.adminBtn} onPress={onNavigateAdmin}>
              <Text style={styles.adminBtnText}>🛡️ Admin</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Smart Evening Reminder Toast */}
        <View style={styles.reminderBox}>
          <Text style={styles.reminderIcon}>🔔</Text>
          <Text style={styles.reminderText}>
            Nhắc nhở: Hãy duy trì học 1 bài hôm nay lúc 20:00 tối để bảo vệ chuỗi Streak 🔥 {user?.streakCount || 0} ngày của bạn!
          </Text>
        </View>

        {/* Daily Reward Claim Card */}
        {canClaimDaily ? (
          <TouchableOpacity style={styles.dailyRewardCard} onPress={handleClaimDailyReward} disabled={isClaiming} activeOpacity={0.9}>
            <View style={styles.dailyRewardInfo}>
              <Text style={styles.dailyRewardBadge}>ĐIỂM DANH HÀNG NGÀY 🎁</Text>
              <Text style={styles.dailyRewardTitle}>Nhận Ngay +20 XP Thưởng!</Text>
            </View>

            <View style={styles.dailyRewardBtn}>
              {isClaiming ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.dailyRewardBtnText}>Nhận Quà ➔</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* VIP Upgrade Banner */}
        <TouchableOpacity style={styles.vipBanner} onPress={onNavigateSubscription} activeOpacity={0.9}>
          <View style={styles.vipInfo}>
            <Text style={styles.vipTitle}>Nâng Cấp Gói VIP 👑</Text>
            <Text style={styles.vipDesc}>Mở khóa không giới hạn lượt học, AI Roleplay & x2 XP Thưởng!</Text>
          </View>
          <View style={styles.vipBtn}>
            <Text style={styles.vipBtnText}>Xem Gói ➔</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Card */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{user?.streakCount || 0}</Text>
            <Text style={styles.statLabel}>Streak Ngày</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{user?.totalXp || 0}</Text>
            <Text style={styles.statLabel}>Điểm XP</Text>
          </View>
        </View>

        {/* AI Voice Battle 1v1 Card */}
        <Text style={styles.sectionTitle}>Đấu Trường Đột Phá ⚔️</Text>
        <TouchableOpacity style={styles.battleCard} onPress={onNavigateVoiceBattle} activeOpacity={0.9}>
          <View style={styles.battleHeader}>
            <Text style={styles.battleBadge}>PvP REAL-TIME • ĐẤU TRƯỜNG 1v1</Text>
            <Text style={styles.battleIcon}>⚔️</Text>
          </View>
          <Text style={styles.battleTitle}>Đấu Trường Phát Âm 1v1</Text>
          <Text style={styles.battleDesc}>Ghép cặp thách đấu phát âm 10s rút máu đối thủ real-time, leo tháp Bảng xếp hạng nhận Cúp 🏆!</Text>

          <View style={styles.battleButton}>
            <Text style={styles.battleButtonText}>Tìm Đối Thủ 1v1 Ngay ⚔️ ➔</Text>
          </View>
        </TouchableOpacity>

        {/* AI Roleplay Featured Card */}
        <Text style={styles.sectionTitle}>Nhập Vai Giao Tiếp ✨</Text>
        <TouchableOpacity style={styles.roleplayCard} onPress={onNavigateRoleplay} activeOpacity={0.9}>
          <View style={styles.roleplayHeader}>
            <Text style={styles.roleplayBadge}>HOT • AI ROLEPLAY</Text>
            <Text style={styles.roleplayIcon}>🤖</Text>
          </View>
          <Text style={styles.roleplayTitle}>Nhập Vai Giao Tiếp Thực Tế</Text>
          <Text style={styles.roleplayDesc}>Thực hành nói Tiếng Anh bối cảnh quán cà phê, khách sạn và phỏng vấn cùng AI.</Text>

          <View style={styles.roleplayButton}>
            <Text style={styles.roleplayButtonText}>Bắt Đầu Nhập Vai 💬 ➔</Text>
          </View>
        </TouchableOpacity>

        {/* Current Course Card */}
        <Text style={styles.sectionTitle}>Khóa Học Hiện Tại</Text>
        <View style={styles.courseCard}>
          <Text style={styles.courseBadge}>Sơ Cấp (Beginner)</Text>
          <Text style={styles.courseTitle}>Tiếng Anh Giao Tiếp Theo Chủ Đề</Text>
          <Text style={styles.courseDesc}>Học 100 từ vựng và bài test 5 câu đảo trộn phân chia đều 5 chủ đề thực tế.</Text>

          <TouchableOpacity style={styles.continueButton} onPress={onNavigateCourse} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>Tiếp Tục Bài Học 🚀</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badgeFree: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeFreeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  badgePlus: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePlusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  badgePro: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeProText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  adminBtnText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
    gap: 16,
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  reminderIcon: {
    fontSize: 20,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  dailyRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 18,
  },
  dailyRewardInfo: {
    flex: 1,
  },
  dailyRewardBadge: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  dailyRewardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dailyRewardBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dailyRewardBtnText: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize: 13,
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipInfo: {
    flex: 1,
    marginRight: 10,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 4,
  },
  vipDesc: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  vipBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  vipBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statBox: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 4,
  },
  battleCard: {
    backgroundColor: '#831843',
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  battleBadge: {
    color: '#F472B6',
    fontSize: 12,
    fontWeight: '800',
  },
  battleIcon: {
    fontSize: 28,
  },
  battleTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  battleDesc: {
    color: '#FBCFE8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  battleButton: {
    backgroundColor: '#F472B6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  battleButtonText: {
    color: '#831843',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roleplayCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  roleplayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleplayBadge: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  roleplayIcon: {
    fontSize: 28,
  },
  roleplayTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleplayDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  roleplayButton: {
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  roleplayButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  courseBadge: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  courseDesc: {
    color: '#C7D2FE',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
