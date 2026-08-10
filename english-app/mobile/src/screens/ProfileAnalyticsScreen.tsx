import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface FavoriteVocab {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

interface AnalyticsData {
  user: any;
  stats: {
    totalXp: number;
    streakCount: number;
    battleWins: number;
    battleTrophies: number;
    totalVocabsMastered: number;
    favoritesCount: number;
    completedLessons: number;
  };
}

interface Props {
  onBack: () => void;
  onNavigateSubscription: () => void;
  onNavigateLeaderboard: () => void;
}

export const ProfileAnalyticsScreen: React.FC<Props> = ({ onBack, onNavigateSubscription, onNavigateLeaderboard }) => {
  const { user, logout, fetchProfile } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteVocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsAndFavorites();
  }, []);

  const fetchAnalyticsAndFavorites = async () => {
    try {
      const [analyticsRes, favRes] = await Promise.all([
        api.get('/users/analytics'),
        api.get('/users/favorites'),
      ]);
      setData(analyticsRes.data);
      setFavorites(favRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (word: string) => {
    Speech.stop();
    Speech.speak(word, { language: 'en-US', rate: 0.85 });
  };

  const handleRemoveFavorite = async (vocabId: string) => {
    try {
      await api.post(`/users/favorites/${vocabId}`);
      setFavorites((prev) => prev.filter((v) => v.id !== vocabId));
      fetchAnalyticsAndFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  const tier = user?.subscriptionTier || 'FREE';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ & Thống Kê Học Tập 📊</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🎓</Text>
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Học viên Tiếng Anh'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.tierBadgeRow}>
            {tier === 'PRO' ? (
              <View style={styles.badgePro}><Text style={styles.badgeProText}>GÓI PRO 👑</Text></View>
            ) : tier === 'PLUS' ? (
              <View style={styles.badgePlus}><Text style={styles.badgePlusText}>GÓI PLUS ⚡</Text></View>
            ) : (
              <View style={styles.badgeFree}><Text style={styles.badgeFreeText}>GÓI MIỄN PHÍ</Text></View>
            )}
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={onNavigateSubscription} activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Nâng Cấp Gói VIP 👑</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Grid */}
        <Text style={styles.sectionTitle}>Thống Kê Tổng Quan 📈</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>⚡</Text>
            <Text style={styles.gridValue}>{data.stats.totalXp}</Text>
            <Text style={styles.gridLabel}>Tổng XP</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>🔥</Text>
            <Text style={styles.gridValue}>{data.stats.streakCount}</Text>
            <Text style={styles.gridLabel}>Streak Ngày</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>⚔️</Text>
            <Text style={styles.gridValue}>{data.stats.battleWins}</Text>
            <Text style={styles.gridLabel}>Trận Thắng 1v1</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>🏆</Text>
            <Text style={styles.gridValue}>{data.stats.battleTrophies}</Text>
            <Text style={styles.gridLabel}>Cúp Thăng Hạng</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>📖</Text>
            <Text style={styles.gridValue}>{data.stats.totalVocabsMastered}</Text>
            <Text style={styles.gridLabel}>Từ Vựng Đã Học</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridEmoji}>❤️</Text>
            <Text style={styles.gridValue}>{data.stats.favoritesCount}</Text>
            <Text style={styles.gridLabel}>Từ Đã Lưu</Text>
          </View>
        </View>

        {/* Leaderboard Shortcut Banner */}
        <TouchableOpacity style={styles.leaderboardBanner} onPress={onNavigateLeaderboard} activeOpacity={0.9}>
          <View style={styles.lbInfo}>
            <Text style={styles.lbTitle}>Bảng Xếp Hạng Giải Đấu 🏆</Text>
            <Text style={styles.lbDesc}>Xem vị trí thứ hạng của bạn trong Top 10 tuần này!</Text>
          </View>
          <View style={styles.lbBtn}>
            <Text style={styles.lbBtnText}>Xem BXH ➔</Text>
          </View>
        </TouchableOpacity>

        {/* Favorite Vocabularies Notebook */}
        <Text style={styles.sectionTitle}>Sổ Tay Từ Vựng Yêu Thích ❤️ ({favorites.length})</Text>

        {favorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>Chưa có từ vựng nào được thả tim lưu vào sổ tay.</Text>
          </View>
        ) : (
          <View style={styles.favList}>
            {favorites.map((fav) => (
              <View key={fav.id} style={styles.favCard}>
                <View style={styles.favHeader}>
                  <View style={styles.favWordRow}>
                    <Text style={styles.favWord}>{fav.word}</Text>
                    <TouchableOpacity style={styles.audioBtn} onPress={() => playAudio(fav.word)}>
                      <Text style={styles.audioIcon}>🔊</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveFavorite(fav.id)}>
                    <Text style={styles.heartIcon}>❤️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.favIpa}>{fav.ipa}</Text>
                <Text style={styles.favMeaning}>🇻🇳 {fav.meaning}</Text>
                {fav.exampleSentence ? (
                  <Text style={styles.favExample}>"{fav.exampleSentence}"</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Đăng Xuất Tài Khoản 🚪</Text>
        </TouchableOpacity>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  tierBadgeRow: {
    marginBottom: 16,
  },
  badgeFree: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeFreeText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  badgePlus: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePlusText: {
    color: '#0284C7',
    fontWeight: 'bold',
    fontSize: 12,
  },
  badgePro: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeProText: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  leaderboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 18,
  },
  lbInfo: {
    flex: 1,
    marginRight: 10,
  },
  lbTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lbDesc: {
    color: '#C7D2FE',
    fontSize: 12,
  },
  lbBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  lbBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  favList: {
    gap: 12,
  },
  favCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  favHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  audioBtn: {
    padding: 4,
  },
  audioIcon: {
    fontSize: 16,
  },
  heartIcon: {
    fontSize: 18,
  },
  favIpa: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  favMeaning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  favExample: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
