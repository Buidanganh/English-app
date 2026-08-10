import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { api } from '../services/api';

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
}

interface Props {
  onSelectScenario: (scenarioId: string) => void;
  onBack: () => void;
}

export const RoleplayListScreen: React.FC<Props> = ({ onSelectScenario, onBack }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/roleplay/scenarios');
      setScenarios(res.data || []);
    } catch (err) {
      console.error('Fetch scenarios error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Roleplay 🤖</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerBadge}>Tính năng mới ✨</Text>
          <Text style={styles.bannerTitle}>Nhập Vai Giao Tiếp AI</Text>
          <Text style={styles.bannerDesc}>Luyện phản xạ Tiếng Anh trong các tình huống đời sống thực tế cùng nhân vật AI.</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Chọn Tình Huống Giao Tiếp ({scenarios.length})</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchScenarios}>
            <Text style={styles.refreshBtnText}>Nạp Lại 🔄</Text>
          </TouchableOpacity>
        </View>

        {scenarios.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyTitle}>Chưa Tải Được Kịch Bản</Text>
            <Text style={styles.emptyDesc}>Bấm nút bên dưới để hệ thống tự động nạp lại 7 bối cảnh nhập vai mới nhất.</Text>

            <TouchableOpacity style={styles.reloadBtn} onPress={fetchScenarios} activeOpacity={0.8}>
              <Text style={styles.reloadBtnText}>Tải Lại Kịch Bản 🔄</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {scenarios.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => onSelectScenario(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardIcon}>{item.icon}</Text>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>

                <Text style={styles.arrowText}>➔</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  },
  banner: {
    backgroundColor: '#4F46E5',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    color: '#EEF2FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bannerDesc: {
    color: '#C7D2FE',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  refreshBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  reloadBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  arrowText: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
