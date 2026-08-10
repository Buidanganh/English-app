import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Platform } from 'react-native';

interface Props {
  resultData: any;
  onFinish: () => void;
}

export const RoleplayResultScreen: React.FC<Props> = ({ resultData, onFinish }) => {
  const score = resultData?.score || 85;
  const xpEarned = resultData?.xpEarned || 25;
  const feedback = resultData?.feedback || {
    fluency: 'Phản xạ khá tốt',
    accuracy: 'Độ chính xác 88%',
    tip: 'Hãy sử dụng mẫu câu "Could I have..." thay vì "I want..." để lịch sự hơn.',
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.title}>Hoàn Thành Nhập Vai!</Text>
      <Text style={styles.subtitle}>Bạn vừa hoàn thành xuất sắc bài luyện phản xạ giao tiếp.</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreValue}>{score}/100</Text>
        <Text style={styles.scoreLabel}>Điểm Phản Xạ Giao Tiếp</Text>
      </View>

      <View style={styles.xpCard}>
        <Text style={styles.xpValue}>+{xpEarned} XP Thưởng 🔥</Text>
      </View>

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>💡 Nhận Xét Từ AI:</Text>

        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackBullet}>• Lưu khoát:</Text>
          <Text style={styles.feedbackText}>{feedback.fluency}</Text>
        </View>

        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackBullet}>• Chính xác:</Text>
          <Text style={styles.feedbackText}>{feedback.accuracy}</Text>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>📌 Lời khuyên tự nhiên hơn:</Text>
          <Text style={styles.tipText}>"{feedback.tip}"</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onFinish} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Về Trang Chủ 🏠</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#F8FAFC',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  xpCard: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  xpValue: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedbackCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackBullet: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    width: 90,
  },
  feedbackText: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
  },
  tipBox: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3730A3',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#4338CA',
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
