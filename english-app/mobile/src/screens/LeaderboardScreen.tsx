import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface LeaderboardUser {
  rank: number;
  league: string;
  id: string;
  fullName: string;
  subscriptionTier: string;
  totalXp: number;
  battleTrophies: number;
  battleWins: number;
  streakCount: number;
}

interface SeasonInfo {
  title: string;
  resetNotice: string;
  rewardsNotice: string;
}

interface Props {
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/users/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
      setSeasonInfo(res.data.seasonInfo || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảng Xếp Hạng Giải Đấu 🏆</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner Season & Countdown */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🏆</Text>
          <Text style={styles.bannerTitle}>{seasonInfo?.title || 'GIẢI ĐẤU HÀNG TUẦN'}</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerBadgeText}>{seasonInfo?.resetNotice || '⏱️ Đang diễn ra giải đấu tuần'}</Text>
          </View>
          <Text style={styles.rewardsNotice}>{seasonInfo?.rewardsNotice || '👑 TOP 1: +500 XP | 💎 TOP 2: +300 XP | 🥇 TOP 3: +200 XP'}</Text>
        </View>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 ? (
          <View style={styles.podiumContainer}>
            {/* Rank 2 */}
            <View style={styles.podiumCol}>
              <Text style={styles.podiumAvatar}>🥈</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].fullName}</Text>
              <Text style={styles.podiumXp}>{leaderboard[1].totalXp} XP</Text>
              <View style={[styles.podiumStep, styles.podiumRank2]}>
                <Text style={styles.podiumRankText}>2</Text>
              </View>
            </View>

            {/* Rank 1 */}
            <View style={styles.podiumCol}>
              <Text style={styles.podiumAvatar}>👑</Text>
              <Text style={[styles.podiumName, styles.podiumFirstName]} numberOfLines={1}>{leaderboard[0].fullName}</Text>
              <Text style={styles.podiumXp}>{leaderboard[0].totalXp} XP</Text>
              <View style={[styles.podiumStep, styles.podiumRank1]}>
                <Text style={styles.podiumRankText}>1</Text>
              </View>
            </View>

            {/* Rank 3 */}
            <View style={styles.podiumCol}>
              <Text style={styles.podiumAvatar}>🥉</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].fullName}</Text>
              <Text style={styles.podiumXp}>{leaderboard[2].totalXp} XP</Text>
              <View style={[styles.podiumStep, styles.podiumRank3]}>
                <Text style={styles.podiumRankText}>3</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Leaderboard List */}
        <View style={styles.lbList}>
          {leaderboard.map((item) => {
            const isMe = item.id === user?.id;

            return (
              <View key={item.id} style={[styles.userRow, isMe && styles.userRowMe]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>#{item.rank}</Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameLine}>
                    <Text style={[styles.userNameText, isMe && styles.userNameMe]}>
                      {item.fullName} {isMe ? '(Bạn)' : ''}
                    </Text>
                    {item.subscriptionTier === 'PRO' ? (
                      <View style={styles.badgePro}><Text style={styles.badgeProText}>PRO 👑</Text></View>
                    ) : item.subscriptionTier === 'PLUS' ? (
                      <View style={styles.badgePlus}><Text style={styles.badgePlusText}>PLUS ⚡</Text></View>
                    ) : null}
                  </View>

                  <Text style={styles.leagueText}>{item.league}</Text>
                </View>

                <View style={styles.scoreCol}>
                  <Text style={styles.xpText}>{item.totalXp} XP</Text>
                  <Text style={styles.trophyText}>🏆 {item.battleTrophies}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#0F172A',
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
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  banner: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  bannerEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 6,
  },
  timerBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  timerBadgeText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  rewardsNotice: {
    fontSize: 12,
    color: '#FCD34D',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 12,
  },
  podiumCol: {
    flex: 0.3,
    alignItems: 'center',
  },
  podiumAvatar: {
    fontSize: 32,
    marginBottom: 4,
  },
  podiumName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  podiumFirstName: {
    color: '#F59E0B',
  },
  podiumXp: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  podiumStep: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  podiumRank1: {
    height: 90,
    backgroundColor: '#F59E0B',
  },
  podiumRank2: {
    height: 70,
    backgroundColor: '#94A3B8',
  },
  podiumRank3: {
    height: 50,
    backgroundColor: '#D97706',
  },
  podiumRankText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  lbList: {
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userRowMe: {
    borderColor: '#F59E0B',
    backgroundColor: '#312E81',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNum: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  userNameMe: {
    color: '#F59E0B',
  },
  badgePro: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeProText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D97706',
  },
  badgePlus: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePlusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  leagueText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  xpText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 15,
  },
  trophyText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 2,
  },
});
