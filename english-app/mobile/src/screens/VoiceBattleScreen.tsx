import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface MatchData {
  roomId: string;
  mode: string;
  userTier?: {
    name: string;
    icon: string;
    color: string;
  };
  opponent: {
    name: string;
    avatar: string;
    tier: string;
    maxHp: number;
  };
  challenge: {
    text: string;
    ipa: string;
    translation: string;
  };
}

interface Props {
  onBack: () => void;
  onFinishBattle: () => void;
}

export const VoiceBattleScreen: React.FC<Props> = ({ onBack, onFinishBattle }) => {
  const { user } = useAuthStore();
  const [selectedMode, setSelectedMode] = useState<'SPEED_RUN' | 'IPA_PRECISION' | 'QUICK_REFLEX' | 'BOSS_BATTLE'>('SPEED_RUN');
  const [match, setMatch] = useState<MatchData | null>(null);
  const [stage, setStage] = useState<'MATCHING' | 'ARENA' | 'RESULT'>('MATCHING');
  const [battleResult, setBattleResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChestModalVisible, setIsChestModalVisible] = useState(false);

  useEffect(() => {
    initMatchmaking(selectedMode);
  }, [selectedMode]);

  const initMatchmaking = async (modeKey: string) => {
    setStage('MATCHING');
    setTimeout(async () => {
      try {
        const res = await api.post('/voice-battle/match', { mode: modeKey });
        setMatch(res.data);
        setStage('ARENA');
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể khởi tạo trận đấu');
        onBack();
      }
    }, 1200);
  };

  const speakChallengeText = () => {
    if (!match) return;
    Speech.stop();
    Speech.speak(match.challenge.text, {
      language: 'en-US',
      rate: 0.85,
    });
  };

  const handleSimulateVoiceSubmit = async () => {
    if (!match) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/voice-battle/${match.roomId}/submit`, {
        textSpoken: match.challenge.text,
        mode: selectedMode,
      });

      setBattleResult(res.data);
      setStage('RESULT');
      if (res.data.isWinner) {
        setIsChestModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể hoàn tất kết quả bài thi');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTier = match?.userTier || { name: 'Đồng', icon: '🥉', color: '#B45309' };

  // 1. STAGE: MATCHING RADAR
  if (stage === 'MATCHING') {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.radarContainer}>
          <Text style={styles.radarIcon}>⚔️</Text>
          <ActivityIndicator size="large" color="#F59E0B" style={styles.radarSpinner} />
        </View>
        <Text style={styles.matchingTitle}>Đang Ghép Trận Đấu Kháng 1v1...</Text>
        <Text style={styles.matchingSubtitle}>Chế độ: {selectedMode === 'BOSS_BATTLE' ? '🤖 Săn Boss AI Khủng' : selectedMode === 'IPA_PRECISION' ? '🎤 IPA Chuẩn Xác' : selectedMode === 'QUICK_REFLEX' ? '🧠 Phản Xạ 5s' : '⚡ Đấu Tốc Độ'}</Text>
      </SafeAreaView>
    );
  }

  // 2. STAGE: BATTLE ARENA
  if (stage === 'ARENA' && match) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Thoát</Text>
          </TouchableOpacity>
          
          <View style={styles.rankBadgeHeader}>
            <Text style={styles.rankBadgeIcon}>{currentTier.icon}</Text>
            <Text style={[styles.rankBadgeName, { color: currentTier.color }]}>Hạng {currentTier.name}</Text>
          </View>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, selectedMode === 'SPEED_RUN' && styles.modeTabActive]}
            onPress={() => setSelectedMode('SPEED_RUN')}
          >
            <Text style={styles.modeTabText}>⚡ Tốc Độ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, selectedMode === 'IPA_PRECISION' && styles.modeTabActive]}
            onPress={() => setSelectedMode('IPA_PRECISION')}
          >
            <Text style={styles.modeTabText}>🎤 IPA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, selectedMode === 'QUICK_REFLEX' && styles.modeTabActive]}
            onPress={() => setSelectedMode('QUICK_REFLEX')}
          >
            <Text style={styles.modeTabText}>🧠 Phản Xạ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, selectedMode === 'BOSS_BATTLE' && styles.modeTabActive]}
            onPress={() => setSelectedMode('BOSS_BATTLE')}
          >
            <Text style={styles.modeTabText}>🤖 Boss AI</Text>
          </TouchableOpacity>
        </View>

        {/* Players Health Bars Row */}
        <View style={styles.playersRow}>
          {/* Player 1 (You) */}
          <View style={styles.playerCard}>
            <Text style={styles.playerAvatar}>👤</Text>
            <Text style={styles.playerName}>{user?.fullName || 'Bạn'}</Text>
            <View style={styles.hpTrack}><View style={[styles.hpFill, { width: '100%' }]} /></View>
            <Text style={styles.hpText}>HP 100/100</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* Player 2 (Opponent) */}
          <View style={styles.playerCard}>
            <Text style={styles.playerAvatar}>{match.opponent.avatar}</Text>
            <Text style={styles.playerName}>{match.opponent.name}</Text>
            <View style={styles.hpTrack}><View style={[styles.hpFill, { width: '100%', backgroundColor: '#EF4444' }]} /></View>
            <Text style={styles.hpText}>HP {match.opponent.maxHp}/{match.opponent.maxHp}</Text>
          </View>
        </View>

        {/* Challenge Box */}
        <View style={styles.challengeBox}>
          <Text style={styles.challengeLabel}>🎯 Đọc Phát Âm Đúng Chuẩn Để Tung Đòn:</Text>
          
          <View style={styles.sentenceRow}>
            <Text style={styles.challengeText}>"{match.challenge.text}"</Text>
            <TouchableOpacity style={styles.listenBtn} onPress={speakChallengeText}>
              <Text style={styles.listenIcon}>🔊</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.challengeIpa}>{match.challenge.ipa}</Text>
          <Text style={styles.challengeTranslation}>🇻🇳 {match.challenge.translation}</Text>
        </View>

        {/* Action Micro Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.micBtn}
            onPress={handleSimulateVoiceSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <>
                <Text style={styles.micIcon}>🎙️</Text>
                <Text style={styles.micText}>Bấm để Phát Âm Ngay</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.micTip}>Phát âm chuẩn >=90% kích hoạt Combo x2 Sát Thương ⚡!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 3. STAGE: RESULT VICTORY/DEFEAT SCREEN
  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      {battleResult?.isWinner ? (
        <>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.victoryTitle}>CHIẾN THẮNG RỰC RỠ!</Text>
          <Text style={styles.resultSubtitle}>{battleResult?.feedback}</Text>

          {battleResult?.isCombo ? (
            <View style={styles.comboBadgeContainer}>
              <Text style={styles.comboBadgeText}>💥 COMBO CRITICAL x2 SÁT THƯƠNG!</Text>
            </View>
          ) : null}

          <View style={styles.statsCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>Điểm bạn: <Text style={styles.scoreHighlight}>{battleResult?.yourScore}</Text></Text>
              <Text style={styles.scoreText}>AI Bot: <Text style={styles.scoreHighlight}>{battleResult?.opponentScore}</Text></Text>
            </View>

            <View style={styles.rewardBadges}>
              <View style={styles.badgeXp}><Text style={styles.badgeText}>+{battleResult?.xpEarned} XP 🔥</Text></View>
              <View style={styles.badgeTrophy}><Text style={styles.badgeText}>+{battleResult?.trophiesEarned} Cúp 🏆</Text></View>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.resultEmoji}>💔</Text>
          <Text style={styles.defeatTitle}>RẤT TIẾC - THUA CUỘC</Text>
          <Text style={styles.resultSubtitle}>{battleResult?.feedback}</Text>

          <View style={styles.statsCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>Điểm bạn: {battleResult?.yourScore}</Text>
              <Text style={styles.scoreText}>AI Bot: {battleResult?.opponentScore}</Text>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.finishBtn} onPress={onFinishBattle} activeOpacity={0.8}>
        <Text style={styles.finishBtnText}>Trở về Trang chủ 🏠</Text>
      </TouchableOpacity>

      {/* Modal Mở Rương Quà Chiến Thắng 🎁 */}
      <Modal visible={isChestModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.chestCard}>
            <Text style={styles.chestEmoji}>🎁</Text>
            <Text style={styles.chestTitle}>MỞ RƯƠNG CHIẾN THẮNG!</Text>
            <Text style={styles.chestDesc}>{battleResult?.chestRewards?.chestType || '🎁 RƯƠNG CHIẾN THẮNG'}</Text>

            <View style={styles.chestRewardsGrid}>
              <View style={styles.chestItem}>
                <Text style={styles.chestItemIcon}>🔥</Text>
                <Text style={styles.chestItemValue}>+{battleResult?.chestRewards?.bonusXp || 50} XP</Text>
              </View>
              <View style={styles.chestItem}>
                <Text style={styles.chestItemIcon}>🏆</Text>
                <Text style={styles.chestItemValue}>+{battleResult?.chestRewards?.bonusTrophies || 20} Cúp</Text>
              </View>
            </View>

            <Text style={styles.medalText}>{battleResult?.chestRewards?.medal}</Text>

            <TouchableOpacity style={styles.claimChestBtn} onPress={() => setIsChestModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.claimChestBtnText}>Nhận Quà Thắng Trận 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 24,
  },
  radarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  radarIcon: {
    fontSize: 40,
    position: 'absolute',
  },
  radarSpinner: {
    position: 'absolute',
  },
  matchingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchingSubtitle: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {},
  backText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rankBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rankBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rankBadgeName: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  modeTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
  },
  modeTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  modeTabActive: {
    backgroundColor: '#4F46E5',
  },
  modeTabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1E293B',
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerCard: {
    flex: 0.42,
    alignItems: 'center',
  },
  playerAvatar: {
    fontSize: 36,
    marginBottom: 4,
  },
  playerName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  hpTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  hpText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#EF4444',
    fontStyle: 'italic',
  },
  challengeBox: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  challengeLabel: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
  },
  listenBtn: {
    backgroundColor: '#334155',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  listenIcon: {
    fontSize: 20,
  },
  challengeIpa: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  challengeTranslation: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '600',
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'web' ? 85 : 95,
  },
  micBtn: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  micIcon: {
    fontSize: 44,
    marginBottom: 4,
  },
  micText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  micTip: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  victoryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 8,
  },
  defeatTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  comboBadgeContainer: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  comboBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreHighlight: {
    color: '#38BDF8',
    fontWeight: 'bold',
  },
  rewardBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeXp: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTrophy: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  finishBtn: {
    width: '100%',
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Chest Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  chestCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  chestEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  chestTitle: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chestDesc: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 20,
  },
  chestRewardsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  chestItem: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chestItemIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  chestItemValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  medalText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 20,
  },
  claimChestBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  claimChestBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
