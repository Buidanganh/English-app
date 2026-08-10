import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
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

interface Question {
  id: string;
  type: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Props {
  lessonId: string;
  onFinish: () => void;
}

export const QuizScreen: React.FC<Props> = ({ lessonId, onFinish }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<'VOCAB' | 'QUIZ' | 'RESULT'>('VOCAB');

  // Vocab State
  const [vocabIndex, setVocabIndex] = useState(0);

  // Quiz State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  // Result State
  const [xpEarned, setXpEarned] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);

  const isUnitTest = lessonId.startsWith('unit_test:');
  const unitId = isUnitTest ? lessonId.replace('unit_test:', '') : null;
  const optionLetters = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      if (isUnitTest && unitId) {
        const res = await api.get(`/courses/units/${unitId}/test`);
        setLesson(res.data);
        setStage('QUIZ');
      } else {
        const res = await api.get(`/lessons/${lessonId}`);
        setLesson(res.data);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải bài học');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !lesson) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  const vocabularies: Vocabulary[] = lesson.vocabularies || [];
  const questions: Question[] = lesson.questions || [];

  const handleNextVocab = () => {
    if (vocabIndex < vocabularies.length - 1) {
      setVocabIndex(vocabIndex + 1);
    } else {
      setStage('QUIZ');
    }
  };

  const speakWord = (word: string) => {
    Speech.stop();
    Speech.speak(word, {
      language: 'en-US',
      rate: 0.85,
      pitch: 1,
    });
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    const currentQ = questions[questionIndex];
    const correct = selectedOption.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    
    setIsCorrect(correct);
    setIsAnswerChecked(true);
    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      submitCompletion();
    }
  };

  const submitCompletion = async () => {
    try {
      const finalScore = Math.round(((score + (isCorrect ? 1 : 0)) / questions.length) * 100);
      let res;
      if (isUnitTest) {
        const targetUnitId = lesson.unitId || unitId || 'default';
        res = await api.post(`/courses/units/${targetUnitId}/submit-test`, { score: finalScore });
      } else {
        const realLessonId = lesson.id || lessonId;
        res = await api.post(`/lessons/${realLessonId}/complete`, { score: finalScore });
      }
      setTestResult(res.data);
      setXpEarned(res.data?.xpEarned || (finalScore >= 80 ? 100 : 25));
      setStage('RESULT');
    } catch (err) {
      console.error(err);
      setXpEarned(100);
      setStage('RESULT');
    }
  };

  // 1. STAGE: VOCABULARY FLASHCARD PREVIEW
  if (stage === 'VOCAB' && vocabularies.length > 0) {
    const currentVocab = vocabularies[vocabIndex];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progressText}>Học Từ Vựng ({vocabIndex + 1}/{vocabularies.length})</Text>
        </View>

        <View style={styles.vocabCardContainer}>
          <View style={styles.vocabCard}>
            <View style={styles.wordRow}>
              <Text style={styles.vocabWord}>{currentVocab.word}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Nghe phát âm từ ${currentVocab.word}`}
                onPress={() => speakWord(currentVocab.word)}
                style={styles.speakerButton}
                activeOpacity={0.7}
              >
                <Text style={styles.speakerIcon}>🔊</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.vocabIpa}>{currentVocab.ipa}</Text>
            <Text style={styles.vocabMeaning}>{currentVocab.meaning}</Text>

            <View style={styles.divider} />

            <Text style={styles.exampleTitle}>Ví dụ:</Text>
            <Text style={styles.exampleText}>"{currentVocab.exampleSentence}"</Text>
            <Text style={styles.exampleTranslation}>({currentVocab.exampleTranslation})</Text>
          </View>
        </View>

        <View style={styles.bottomBarContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleNextVocab} activeOpacity={0.8}>
            <Text style={styles.bottomButtonText}>
              {vocabIndex < vocabularies.length - 1 ? 'Từ tiếp theo ➔' : 'Bắt đầu làm Quiz 📝'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. STAGE: QUIZ INTERACTIVE QUESTIONS
  if (stage === 'QUIZ' && questions.length > 0) {
    const currentQ = questions[questionIndex];
    const progressPercent = ((questionIndex + 1) / questions.length) * 100;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header Progress Bar */}
        <View style={styles.header}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{questionIndex + 1}/{questions.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.quizContent}>
          <Text style={styles.prompt}>{currentQ.prompt}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => !isAnswerChecked && setSelectedOption(opt)}
                  disabled={isAnswerChecked}
                  activeOpacity={0.85}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeftGroup}>
                      <View style={[styles.optionLetterBadge, isSelected && styles.optionLetterSelected]}>
                        <Text style={[styles.optionLetterText, isSelected && styles.optionLetterTextSelected]}>
                          {optionLetters[idx] || (idx + 1)}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Nghe phát âm ${opt}`}
                      onPress={() => speakWord(opt)}
                      style={styles.audioBtn}
                      hitSlop={8}
                    >
                      <Text style={styles.audioIcon}>🔊</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Action Bar (Sitting above Bottom Navbar) */}
        <View style={styles.bottomBarContainer}>
          {isAnswerChecked ? (
            <View style={[styles.feedbackSheet, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>
                {isCorrect ? '🎉 Chính xác!' : '❌ Chưa chính xác'}
              </Text>
              {currentQ.explanation ? (
                <Text style={styles.feedbackText}>{currentQ.explanation}</Text>
              ) : null}

              <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion} activeOpacity={0.85}>
                <Text style={styles.nextButtonText}>Tiếp tục ➔</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.bottomButton, !selectedOption && styles.buttonDisabled]}
              onPress={handleCheckAnswer}
              disabled={!selectedOption}
              activeOpacity={0.85}
            >
              <Text style={styles.bottomButtonText}>Kiểm tra đáp án</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // 3. STAGE: RESULT CONGRATULATION SCREEN
  return (
    <SafeAreaView style={styles.resultContainer}>
      {testResult ? (
        testResult.passed ? (
          <>
            <Text style={styles.resultEmoji}>🎖️</Text>
            <Text style={styles.resultTitle}>THI ĐẠT TRÊN 80%!</Text>
            <Text style={styles.resultSubtitle}>{testResult.message}</Text>

            {testResult.badge ? (
              <View style={styles.badgeCard}>
                <Text style={styles.badgeCardText}>{testResult.badge}</Text>
              </View>
            ) : null}

            <View style={styles.xpCard}>
              <Text style={styles.xpCardValue}>+{xpEarned} XP</Text>
              <Text style={styles.xpCardLabel}>Thưởng nóng hoàn thành xuất sắc bài thi 80% 🏆</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.resultEmoji}>💔</Text>
            <Text style={styles.resultTitleFail}>CHƯA ĐẠT 80% ĐIỂM THƯỞNG</Text>
            <Text style={styles.resultSubtitle}>{testResult.message}</Text>

            <View style={styles.failScoreCard}>
              <Text style={styles.failScoreValue}>{testResult.score}%</Text>
              <Text style={styles.failScoreLabel}>Cần ít nhất 80% (16/20 câu đúng) để nhận +100 XP</Text>
            </View>
          </>
        )
      ) : (
        <>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>Bài Test Hoàn Thành!</Text>
          <Text style={styles.resultSubtitle}>Chúc mừng bạn đã xuất sắc làm xong các câu hỏi của bài học.</Text>

          <View style={styles.xpCard}>
            <Text style={styles.xpCardValue}>+{xpEarned} XP</Text>
            <Text style={styles.xpCardLabel}>Điểm thưởng hoàn thành bài Quiz</Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.finishButton} onPress={onFinish} activeOpacity={0.85}>
        <Text style={styles.finishButtonText}>Trở về Danh Sách Bài Học 📚</Text>
      </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  pillBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  vocabCardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  vocabCard: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  vocabWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerIcon: {
    fontSize: 22,
  },
  vocabIpa: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  vocabMeaning: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 15,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 2,
  },
  exampleTranslation: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  quizContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140, // Đảm bảo scroll không bị che bởi bottom action bar
  },
  prompt: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  optionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  optionLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterSelected: {
    backgroundColor: '#4F46E5',
  },
  optionLetterText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionLetterTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  audioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioIcon: {
    fontSize: 16,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 70 : 85, // Đảm bảo luôn nằm cao hơn Bottom Navbar
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  bottomButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackSheet: {
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  feedbackCorrect: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0F172A',
  },
  feedbackText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 12,
  },
  nextButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  resultTitleFail: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  badgeCard: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeCardText: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 15,
  },
  xpCard: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  xpCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#15803D',
  },
  xpCardLabel: {
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  failScoreCard: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  failScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  failScoreLabel: {
    fontSize: 13,
    color: '#991B1B',
    marginTop: 2,
  },
  finishButton: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
