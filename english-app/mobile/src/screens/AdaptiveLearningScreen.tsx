import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Animated,
} from 'react-native';
import { api } from '../services/api';

/* ===========================
   TYPES
=========================== */
interface LessonRec {
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  unitTitle: string;
  levelTag: 'EASY' | 'MEDIUM' | 'HARD';
  levelEmoji: string;
  xpReward: number;
  score: number | null;
  isCompleted: boolean;
  priority?: 'HIGH';
}

interface UnitProgress {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  easy: { lessonId: string; score: number | null; isCompleted: boolean } | null;
  medium: { lessonId: string; score: number | null; isCompleted: boolean } | null;
  hard: { lessonId: string; score: number | null; isCompleted: boolean } | null;
  completedLevels: number;
  totalLevels: number;
  progressPercent: number;
  avgScore: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
}

interface WeakVocab {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  status: string;
  reviewCount: number;
}

interface AdaptiveData {
  summary: {
    totalLessons: number;
    completedLessons: number;
    masteredCount: number;
    masteryPercent: number;
    needsReviewCount: number;
    notStartedCount: number;
    weakVocabCount: number;
  };
  recommendations: LessonRec[];
  needsReview: LessonRec[];
  unitProgress: UnitProgress[];
  weakVocabs: WeakVocab[];
}

type Tab = 'OVERVIEW' | 'TOPICS' | 'VOCAB';

interface Props {
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
}

/* ===========================
   TOPIC EMOJIS
=========================== */
const TOPIC_EMOJIS = ['☕', '✈️', '💼', '🏥', '🎓', '🛒', '🏠', '💻', '🤝', '🌿'];

/* ===========================
   LEVEL CONFIG
=========================== */
const LEVEL_CFG = {
  EASY:   { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', emoji: '🟢' },
  MEDIUM: { color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', emoji: '🟡' },
  HARD:   { color: '#BE123C', bg: '#FFF1F2', border: '#FDA4AF', emoji: '🔴' },
};

/* ===========================
   MAIN SCREEN
=========================== */
export const AdaptiveLearningScreen: React.FC<Props> = ({ onBack, onSelectLesson }) => {
  const [data, setData] = useState<AdaptiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      Animated.timing(progressAnim, {
        toValue: data.summary.masteryPercent / 100,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [data]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/adaptive/recommendations');
      setData(res.data);
    } catch (err) {
      console.error('Adaptive fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Đang phân tích lộ trình của bạn...</Text>
      </SafeAreaView>
    );
  }

  const { summary, recommendations, needsReview, unitProgress, weakVocabs } = data;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Trang Chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Lộ Trình Của Bạn</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Mastery Progress Bar */}
      <View style={styles.masteryBar}>
        <View style={styles.masteryBarLabels}>
          <Text style={styles.masteryLabel}>Mức Độ Thành Thạo</Text>
          <Text style={styles.masteryPercent}>{summary.masteryPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <View style={styles.masteryStats}>
          <Text style={styles.masteryStatItem}>✅ {summary.masteredCount} Thành Thạo</Text>
          <Text style={styles.masteryStatItem}>⚠️ {summary.needsReviewCount} Cần Ôn</Text>
          <Text style={styles.masteryStatItem}>📖 {summary.notStartedCount} Chưa Học</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'OVERVIEW', label: '🎯 Đề Xuất' },
          { key: 'TOPICS',   label: '📚 Chủ Đề' },
          { key: 'VOCAB',    label: '📝 Từ Yếu' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'VOCAB' && weakVocabs.length > 0 && (
              <View style={styles.vocabBadge}>
                <Text style={styles.vocabBadgeText}>{weakVocabs.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ========= TAB: OVERVIEW ========= */}
        {activeTab === 'OVERVIEW' && (
          <View>
            {/* Cần Ôn Lại */}
            {needsReview.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>⚠️</Text>
                  <View>
                    <Text style={styles.sectionTitle}>Cần Ôn Lại Ngay</Text>
                    <Text style={styles.sectionSub}>Điểm dưới 70% — cần củng cố</Text>
                  </View>
                </View>
                {needsReview.map(lesson => (
                  <LessonCard
                    key={lesson.lessonId}
                    lesson={lesson}
                    onPress={() => onSelectLesson(lesson.lessonId)}
                    priority="review"
                  />
                ))}
              </View>
            )}

            {/* Tiếp Theo Cho Bạn */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🚀</Text>
                <View>
                  <Text style={styles.sectionTitle}>Tiếp Theo Cho Bạn</Text>
                  <Text style={styles.sectionSub}>AI gợi ý theo tiến độ của bạn</Text>
                </View>
              </View>

              {recommendations.length === 0 ? (
                <View style={styles.allDoneBox}>
                  <Text style={styles.allDoneEmoji}>🏆</Text>
                  <Text style={styles.allDoneTitle}>Xuất Sắc!</Text>
                  <Text style={styles.allDoneSub}>Bạn đã hoàn thành toàn bộ lộ trình. Hãy ôn lại từ yếu!</Text>
                </View>
              ) : (
                recommendations.map(lesson => (
                  <LessonCard
                    key={lesson.lessonId}
                    lesson={lesson}
                    onPress={() => onSelectLesson(lesson.lessonId)}
                    priority="next"
                  />
                ))
              )}
            </View>

            {/* Weekly Goal */}
            <View style={styles.weeklyGoalBox}>
              <Text style={styles.weeklyGoalTitle}>🎯 Mục Tiêu Tuần Này</Text>
              <View style={styles.weeklyGoalItems}>
                <GoalItem
                  icon="📚"
                  text={`Hoàn thành ${Math.max(1, summary.notStartedCount)} bài học mới`}
                  done={summary.notStartedCount === 0}
                />
                <GoalItem
                  icon="🔁"
                  text={`Ôn lại ${summary.needsReviewCount} bài điểm thấp`}
                  done={summary.needsReviewCount === 0}
                />
                <GoalItem
                  icon="🧠"
                  text={`Ôn ${weakVocabs.length} từ vựng yếu`}
                  done={weakVocabs.length === 0}
                />
              </View>
            </View>
          </View>
        )}

        {/* ========= TAB: TOPICS ========= */}
        {activeTab === 'TOPICS' && (
          <View>
            <Text style={styles.topicsIntro}>
              Tiến độ chi tiết từng chủ đề — 3 cấp Dễ / Vừa / Khó
            </Text>
            {unitProgress.map((unit, idx) => (
              <UnitProgressCard
                key={unit.unitId}
                unit={unit}
                emoji={TOPIC_EMOJIS[idx] || '📖'}
                onSelectLesson={onSelectLesson}
              />
            ))}
          </View>
        )}

        {/* ========= TAB: VOCAB ========= */}
        {activeTab === 'VOCAB' && (
          <View>
            {weakVocabs.length === 0 ? (
              <View style={styles.allDoneBox}>
                <Text style={styles.allDoneEmoji}>🧠</Text>
                <Text style={styles.allDoneTitle}>Tuyệt Vời!</Text>
                <Text style={styles.allDoneSub}>
                  Không có từ vựng nào cần ôn lại hôm nay.{'\n'}
                  Hãy tiếp tục học bài mới!
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.vocabIntro}>
                  {weakVocabs.length} từ cần ôn lại theo hệ thống Spaced Repetition
                </Text>
                {weakVocabs.map(vocab => (
                  <View key={vocab.id} style={styles.weakVocabCard}>
                    <View style={styles.weakVocabLeft}>
                      <Text style={styles.weakVocabWord}>{vocab.word}</Text>
                      {vocab.ipa ? <Text style={styles.weakVocabIpa}>{vocab.ipa}</Text> : null}
                      <Text style={styles.weakVocabMeaning}>🇻🇳 {vocab.meaning}</Text>
                    </View>
                    <View style={styles.weakVocabRight}>
                      <View style={[
                        styles.statusTag,
                        vocab.status === 'LEARNING' ? styles.statusLearning : styles.statusNew,
                      ]}>
                        <Text style={styles.statusTagText}>
                          {vocab.status === 'LEARNING' ? '🔄 Đang học' : '🆕 Mới'}
                        </Text>
                      </View>
                      <Text style={styles.reviewCountText}>
                        Ôn {vocab.reviewCount}x
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

/* ===========================
   SUB-COMPONENTS
=========================== */
const LessonCard = ({
  lesson, onPress, priority,
}: {
  lesson: LessonRec;
  onPress: () => void;
  priority: 'review' | 'next';
}) => {
  const cfg = LEVEL_CFG[lesson.levelTag] || LEVEL_CFG.EASY;
  const isReview = priority === 'review';

  return (
    <TouchableOpacity
      style={[styles.lessonCard, isReview && styles.lessonCardReview]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.lessonCardLeft}>
        <View style={[styles.levelDot, { backgroundColor: cfg.color }]} />
        <View style={styles.lessonCardInfo}>
          <Text style={styles.lessonUnitTitle} numberOfLines={1}>{lesson.unitTitle}</Text>
          <Text style={styles.lessonLevelLabel}>
            {cfg.emoji} Cấp {lesson.levelTag === 'EASY' ? 'Dễ' : lesson.levelTag === 'MEDIUM' ? 'Vừa' : 'Khó'}
            {lesson.score !== null && ` • Điểm: ${lesson.score}%`}
          </Text>
        </View>
      </View>
      <View style={styles.lessonCardRight}>
        {isReview ? (
          <View style={styles.reviewTag}>
            <Text style={styles.reviewTagText}>Ôn Lại</Text>
          </View>
        ) : (
          <Text style={styles.xpLabel}>+{lesson.xpReward} XP</Text>
        )}
        <Text style={styles.lessonArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const UnitProgressCard = ({
  unit, emoji, onSelectLesson,
}: {
  unit: UnitProgress;
  emoji: string;
  onSelectLesson: (id: string) => void;
}) => {
  const statusColor = unit.status === 'MASTERED' ? '#059669' : unit.status === 'IN_PROGRESS' ? '#D97706' : '#64748B';
  const statusLabel = unit.status === 'MASTERED' ? '✅ Thành Thạo' : unit.status === 'IN_PROGRESS' ? '🔄 Đang Học' : '📖 Chưa Bắt Đầu';

  return (
    <View style={styles.unitCard}>
      <View style={styles.unitCardHeader}>
        <View style={styles.unitEmojiWrap}>
          <Text style={styles.unitEmoji}>{emoji}</Text>
        </View>
        <View style={styles.unitCardTitle}>
          <Text style={styles.unitTitle} numberOfLines={1}>{unit.unitTitle}</Text>
          <Text style={[styles.unitStatus, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.unitProgressPercent}>{unit.progressPercent}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.unitProgressTrack}>
        <View style={[styles.unitProgressFill, {
          width: `${unit.progressPercent}%` as any,
          backgroundColor: statusColor,
        }]} />
      </View>

      {/* 3 Level Columns */}
      <View style={styles.levelColumns}>
        {(['easy', 'medium', 'hard'] as const).map((lvl) => {
          const levelData = unit[lvl];
          const cfg = LEVEL_CFG[lvl.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD'];
          const label = lvl === 'easy' ? 'Dễ' : lvl === 'medium' ? 'Vừa' : 'Khó';

          return (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelCol,
                { borderColor: levelData?.isCompleted ? cfg.color : '#334155' },
                { backgroundColor: levelData?.isCompleted ? cfg.bg : 'transparent' },
              ]}
              onPress={() => levelData && onSelectLesson(levelData.lessonId)}
              activeOpacity={0.8}
              disabled={!levelData}
            >
              <Text style={styles.levelColEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.levelColLabel, { color: levelData?.isCompleted ? cfg.color : '#64748B' }]}>
                {label}
              </Text>
              <Text style={[styles.levelColScore, { color: levelData?.isCompleted ? cfg.color : '#475569' }]}>
                {levelData?.score !== null && levelData?.score !== undefined
                  ? `${levelData.score}%`
                  : levelData ? '—' : 'N/A'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const GoalItem = ({ icon, text, done }: { icon: string; text: string; done: boolean }) => (
  <View style={styles.goalItem}>
    <Text style={styles.goalIcon}>{done ? '✅' : icon}</Text>
    <Text style={[styles.goalText, done && styles.goalTextDone]}>{text}</Text>
  </View>
);

/* ===========================
   STYLES
=========================== */
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
    gap: 16,
  },
  loadingText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },

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
  backIcon: { fontSize: 18, color: '#8B5CF6', fontWeight: 'bold' },
  backText: { color: '#8B5CF6', fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  refreshIcon: { fontSize: 16 },

  // Mastery Bar
  masteryBar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  masteryBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  masteryLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  masteryPercent: { color: '#8B5CF6', fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  masteryStats: { flexDirection: 'row', gap: 16 },
  masteryStatItem: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabBtnActive: { borderBottomColor: '#8B5CF6' },
  tabText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#8B5CF6' },
  vocabBadge: { backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  vocabBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 16 },

  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  sectionIcon: { fontSize: 24 },
  sectionTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  sectionSub: { color: '#64748B', fontSize: 11, marginTop: 1 },

  // Lesson Card
  lessonCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  lessonCardReview: { borderColor: '#D97706', backgroundColor: '#1C1A0E' },
  lessonCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  lessonCardInfo: { flex: 1 },
  lessonUnitTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  lessonLevelLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  lessonCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewTag: { backgroundColor: '#D97706', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reviewTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  xpLabel: { color: '#8B5CF6', fontSize: 12, fontWeight: '800' },
  lessonArrow: { color: '#475569', fontSize: 20, fontWeight: 'bold' },

  // All Done
  allDoneBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  allDoneEmoji: { fontSize: 52 },
  allDoneTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  allDoneSub: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Weekly Goal
  weeklyGoalBox: {
    backgroundColor: '#1E1B4B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4338CA',
    gap: 12,
  },
  weeklyGoalTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  weeklyGoalItems: { gap: 10 },
  goalItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalIcon: { fontSize: 18 },
  goalText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', flex: 1 },
  goalTextDone: { color: '#64748B', textDecorationLine: 'line-through' },

  // Topics
  topicsIntro: { color: '#64748B', fontSize: 12, marginBottom: 8, lineHeight: 18 },
  unitCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  unitEmojiWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  unitEmoji: { fontSize: 20 },
  unitCardTitle: { flex: 1 },
  unitTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginBottom: 2 },
  unitStatus: { fontSize: 11, fontWeight: '700' },
  unitProgressPercent: { color: '#8B5CF6', fontWeight: '900', fontSize: 16 },
  unitProgressTrack: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  unitProgressFill: { height: '100%', borderRadius: 3 },
  levelColumns: { flexDirection: 'row', gap: 8 },
  levelCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 2,
  },
  levelColEmoji: { fontSize: 16 },
  levelColLabel: { fontSize: 11, fontWeight: '800' },
  levelColScore: { fontSize: 10, fontWeight: '700' },

  // Vocab
  vocabIntro: { color: '#64748B', fontSize: 12, marginBottom: 8 },
  weakVocabCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  weakVocabLeft: { flex: 1 },
  weakVocabWord: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  weakVocabIpa: { color: '#64748B', fontSize: 11, fontStyle: 'italic', marginBottom: 4 },
  weakVocabMeaning: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  weakVocabRight: { alignItems: 'flex-end', gap: 6 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusLearning: { backgroundColor: '#D97706' },
  statusNew: { backgroundColor: '#334155' },
  statusTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  reviewCountText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
});
