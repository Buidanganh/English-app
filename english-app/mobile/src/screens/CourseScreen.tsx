import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../services/api';

interface Vocabulary {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  orderIndex: number;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isUnlocked: boolean;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  units: Unit[];
}

interface Props {
  refreshKey?: number;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  onSelectTopicTest: (unitId: string) => void;
}

const LEVEL_CONFIG = {
  easy: {
    emoji: '🟢',
    label: 'Dễ',
    xp: '+20 XP',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#6EE7B7',
    gradient: '#D1FAE5',
    tag: 'EASY',
  },
  medium: {
    emoji: '🟡',
    label: 'Vừa',
    xp: '+30 XP',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FCD34D',
    gradient: '#FEF3C7',
    tag: 'MEDIUM',
  },
  hard: {
    emoji: '🔴',
    label: 'Khó',
    xp: '+40 XP',
    color: '#BE123C',
    bg: '#FFF1F2',
    border: '#FDA4AF',
    gradient: '#FFE4E6',
    tag: 'HARD',
  },
};

const getLevelConfig = (lessonTitle: string) => {
  const t = lessonTitle || '';
  if (t.includes('Medium') || t.includes('Trung Bình') || t.includes('Vừa')) return LEVEL_CONFIG.medium;
  if (t.includes('Hard') || t.includes('Khó')) return LEVEL_CONFIG.hard;
  return LEVEL_CONFIG.easy;
};

const TOPIC_EMOJIS = ['☕', '✈️', '💼', '🏥', '🎓', '🛒', '🏠', '💻', '🤝', '🌿'];

export const CourseScreen: React.FC<Props> = ({
  refreshKey = 0,
  onBack,
  onSelectLesson,
  onSelectTopicTest,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReseeding, setIsReseeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Sổ Từ Vựng
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topicVocabs, setTopicVocabs] = useState<Vocabulary[]>([]);
  const [vocabFilter, setVocabFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [isVocabModalVisible, setIsVocabModalVisible] = useState(false);
  const [isLoadingVocabs, setIsLoadingVocabs] = useState(false);
  const [vocabSearch, setVocabSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [refreshKey]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/courses');
      const data = res.data || [];
      const firstUnitLessonCount = data[0]?.units[0]?.lessons?.length || 0;
      if (data.length === 0 || !data[0]?.units || data[0].units.length < 10 || firstUnitLessonCount < 3) {
        await api.get('/courses/reseed');
        const reseedRes = await api.get('/courses');
        setCourses(reseedRes.data || []);
      } else {
        setCourses(data);
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReseed = async () => {
    setIsReseeding(true);
    try {
      await api.get('/courses/reseed');
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Reseed error:', err);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleOpenVocabGallery = async (unit: Unit) => {
    if (unit.lessons.length === 0) return;
    setSelectedUnit(unit);
    setVocabFilter('ALL');
    setVocabSearch('');
    setTopicVocabs([]);
    setIsVocabModalVisible(true);
    setIsLoadingVocabs(true);
    try {
      let allVocabs: Vocabulary[] = [];
      for (const lesson of unit.lessons) {
        const res = await api.get(`/lessons/${lesson.id}`);
        if (res.data.vocabularies) {
          allVocabs = [...allVocabs, ...res.data.vocabularies];
        }
      }
      setTopicVocabs(allVocabs);
    } catch (err) {
      console.error(err);
      setTopicVocabs([]);
    } finally {
      setIsLoadingVocabs(false);
    }
  };

  const speakWord = (word: string) => {
    Speech.stop();
    Speech.speak(word, { language: 'en-US', rate: 0.85 });
  };

  const filteredVocabs = topicVocabs.filter((v, idx) => {
    let matchesFilter = true;
    if (vocabFilter === 'EASY') matchesFilter = idx < 10;
    else if (vocabFilter === 'MEDIUM') matchesFilter = idx >= 10 && idx < 20;
    else if (vocabFilter === 'HARD') matchesFilter = idx >= 20;

    const matchesSearch = !vocabSearch ||
      v.word.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      v.meaning.toLowerCase().includes(vocabSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredUnits = useCallback(() => {
    if (!courses[0]?.units) return [];
    if (!searchQuery.trim()) return courses[0].units;
    const q = searchQuery.toLowerCase();
    return courses[0].units.filter(u =>
      u.title.toLowerCase().includes(q) ||
      u.description.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Đang tải 10 chủ đề...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Trang Chủ</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📚 Bài Học</Text>
        </View>

        <TouchableOpacity
          style={[styles.reseedBtn, isReseeding && styles.reseedBtnLoading]}
          onPress={handleForceReseed}
          activeOpacity={0.75}
          disabled={isReseeding}
        >
          {isReseeding
            ? <ActivityIndicator size="small" color="#6366F1" />
            : <Text style={styles.reseedBtnText}>🔄</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {courses.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10</Text>
            <Text style={styles.statLabel}>Chủ Đề</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>300</Text>
            <Text style={styles.statLabel}>Từ Vựng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Cấp Mức</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>900</Text>
            <Text style={styles.statLabel}>XP Tổng</Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm chủ đề..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {courses.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptyDesc}>Nhấn nút bên dưới để nạp 300 từ vựng thực tế theo 10 chủ đề.</Text>
            <TouchableOpacity style={styles.loadBtn} onPress={handleForceReseed} activeOpacity={0.85}>
              <Text style={styles.loadBtnText}>🚀 Nạp Dữ Liệu Ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Course Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerBadge}>🏆 LỘ TRÌNH CHUẨN</Text>
                <Text style={styles.bannerTitle}>Tiếng Anh Giao Tiếp</Text>
                <Text style={styles.bannerSub}>10 chủ đề · 3 cấp mức · 300 từ thực tế</Text>
              </View>
              <View style={styles.bannerRight}>
                <Text style={styles.bannerEmoji}>🎯</Text>
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>Mở Khóa</Text>
                  <Text style={styles.openBadgeText}>100% 🔓</Text>
                </View>
              </View>
            </View>

            {/* Units Grid */}
            {filteredUnits().map((unit, unitIndex) => {
              const topicEmoji = TOPIC_EMOJIS[unitIndex] || '📖';
              return (
                <View key={unit.id} style={styles.unitCard}>
                  {/* Unit Header */}
                  <View style={styles.unitHeader}>
                    <View style={styles.unitEmojiWrap}>
                      <Text style={styles.unitEmoji}>{topicEmoji}</Text>
                    </View>
                    <View style={styles.unitInfo}>
                      <Text style={styles.unitTitle} numberOfLines={1}>{unit.title}</Text>
                      <Text style={styles.unitDesc} numberOfLines={1}>{unit.description}</Text>
                    </View>
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.vocabBtn}
                      onPress={() => handleOpenVocabGallery(unit)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.vocabBtnIcon}>📖</Text>
                      <Text style={styles.vocabBtnText}>Sổ Từ (30)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.testBtn}
                      onPress={() => onSelectTopicTest(unit.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.testBtnIcon}>📝</Text>
                      <Text style={styles.testBtnText}>Kiểm Tra (+100 XP)</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Level Pills */}
                  <View style={styles.levelsRow}>
                    {unit.lessons.length === 0 ? (
                      <View style={styles.noLessonPill}>
                        <Text style={styles.noLessonText}>⏳ Đang tải bài học...</Text>
                      </View>
                    ) : (
                      unit.lessons.map((lesson) => {
                        const cfg = getLevelConfig(lesson.title);
                        return (
                          <TouchableOpacity
                            key={lesson.id}
                            style={[styles.levelPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                            onPress={() => onSelectLesson(lesson.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.levelPillEmoji}>{cfg.emoji}</Text>
                            <View style={styles.levelPillInfo}>
                              <Text style={[styles.levelPillLabel, { color: cfg.color }]}>{cfg.label}</Text>
                              <Text style={[styles.levelPillXp, { color: cfg.color }]}>{cfg.xp}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              );
            })}

            {filteredUnits().length === 0 && searchQuery.length > 0 && (
              <View style={styles.noResultBox}>
                <Text style={styles.noResultEmoji}>🔍</Text>
                <Text style={styles.noResultText}>Không tìm thấy chủ đề "{searchQuery}"</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.noResultClear}>Xóa tìm kiếm</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Sổ Từ Vựng */}
      <Modal visible={isVocabModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedUnit?.title || 'Sổ Từ Vựng'}
                </Text>
                <Text style={styles.modalSubtitle}>30 từ vựng · 3 cấp mức</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsVocabModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Vocab Search */}
            <View style={styles.vocabSearchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.vocabSearchInput}
                placeholder="Tìm từ vựng..."
                placeholderTextColor="#94A3B8"
                value={vocabSearch}
                onChangeText={setVocabSearch}
              />
              {vocabSearch.length > 0 && (
                <TouchableOpacity onPress={() => setVocabSearch('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
              {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((tab) => {
                const tabLabels = { ALL: 'Tất Cả (30)', EASY: '🟢 Dễ (10)', MEDIUM: '🟡 Vừa (10)', HARD: '🔴 Khó (10)' };
                const isActive = vocabFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setVocabFilter(tab)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {tabLabels[tab]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vocab List */}
            {isLoadingVocabs ? (
              <View style={styles.vocabLoading}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.vocabLoadingText}>Đang tải từ vựng...</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.vocabList}
                showsVerticalScrollIndicator={false}
              >
                {filteredVocabs.length === 0 ? (
                  <View style={styles.vocabEmpty}>
                    <Text style={styles.vocabEmptyEmoji}>📭</Text>
                    <Text style={styles.vocabEmptyText}>Không có từ vựng nào</Text>
                  </View>
                ) : (
                  filteredVocabs.map((vocab, idx) => {
                    const level = idx < 10 ? LEVEL_CONFIG.easy : idx < 20 ? LEVEL_CONFIG.medium : LEVEL_CONFIG.hard;
                    const absoluteIdx = topicVocabs.findIndex(v => v.id === vocab.id);
                    const lvl = absoluteIdx < 10 ? LEVEL_CONFIG.easy : absoluteIdx < 20 ? LEVEL_CONFIG.medium : LEVEL_CONFIG.hard;
                    return (
                      <View key={vocab.id} style={[styles.vocabCard, { borderLeftColor: lvl.color }]}>
                        <View style={styles.vocabTopRow}>
                          <View style={styles.wordBlock}>
                            <Text style={[styles.vocabWord, { color: lvl.color }]}>{vocab.word}</Text>
                            {vocab.ipa ? <Text style={styles.vocabIpa}>{vocab.ipa}</Text> : null}
                          </View>
                          <TouchableOpacity
                            style={[styles.speakBtn, { backgroundColor: lvl.gradient }]}
                            onPress={() => speakWord(vocab.word)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.speakIcon}>🔊</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={[styles.meaningBadge, { backgroundColor: lvl.gradient }]}>
                          <Text style={styles.meaningFlag}>🇻🇳</Text>
                          <Text style={[styles.vocabMeaning, { color: lvl.color }]}>{vocab.meaning}</Text>
                        </View>

                        {vocab.exampleSentence ? (
                          <View style={styles.exampleBox}>
                            <Text style={styles.exampleEn}>"{vocab.exampleSentence}"</Text>
                            <Text style={styles.exampleVi}>→ {vocab.exampleTranslation}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  backText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 13,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  reseedBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reseedBtnLoading: {
    backgroundColor: '#F1F5F9',
  },
  reseedBtnText: {
    fontSize: 18,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  clearSearch: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },

  // Empty
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  loadBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  loadBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  // Banner
  banner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bannerLeft: { flex: 1 },
  bannerBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSub: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerRight: {
    alignItems: 'center',
    gap: 6,
  },
  bannerEmoji: { fontSize: 32 },
  openBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338CA',
    alignItems: 'center',
  },
  openBadgeText: { color: '#C7D2FE', fontSize: 9, fontWeight: '700' },

  // Unit Card
  unitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  unitEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitEmoji: { fontSize: 22 },
  unitInfo: { flex: 1 },
  unitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  unitDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  vocabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  vocabBtnIcon: { fontSize: 14 },
  vocabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  testBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  testBtnIcon: { fontSize: 14 },
  testBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Level Pills
  levelsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  levelPillEmoji: { fontSize: 14 },
  levelPillInfo: { alignItems: 'center' },
  levelPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  levelPillXp: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  noLessonPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noLessonText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // No Result
  noResultBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultEmoji: { fontSize: 40, marginBottom: 10 },
  noResultText: { fontSize: 14, color: '#64748B', marginBottom: 10 },
  noResultClear: { fontSize: 13, color: '#6366F1', fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleWrap: { flex: 1, marginRight: 12 },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 14,
  },

  // Vocab Search
  vocabSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 8,
  },
  vocabSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Vocab List
  vocabLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  vocabLoadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  vocabList: {
    gap: 10,
    paddingBottom: 30,
  },
  vocabEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  vocabEmptyEmoji: { fontSize: 40, marginBottom: 10 },
  vocabEmptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },

  // Vocab Card
  vocabCard: {
    backgroundColor: '#FAFBFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EEFF',
    borderLeftWidth: 4,
  },
  vocabTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordBlock: {
    flex: 1,
  },
  vocabWord: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  vocabIpa: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  speakBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakIcon: { fontSize: 18 },

  meaningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  meaningFlag: { fontSize: 14 },
  vocabMeaning: {
    fontSize: 14,
    fontWeight: '800',
  },

  exampleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8EEFF',
  },
  exampleEn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  exampleVi: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
