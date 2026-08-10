import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';

export type TabType = 'home' | 'course' | 'roleplay' | 'battle' | 'subscription';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavbar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const tabs: Array<{ id: TabType; label: string; icon: string; badge?: string }> = [
    { id: 'home', label: 'Trang chủ', icon: '🏠' },
    { id: 'course', label: 'Bài học', icon: '📚' },
    { id: 'roleplay', label: 'AI Roleplay', icon: '💬', badge: 'HOT' },
    { id: 'battle', label: 'Đấu trường', icon: '⚔️', badge: '1v1' },
    { id: 'subscription', label: 'VIP & PRO', icon: '👑' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navbarContent}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              {tab.badge ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}

              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>

              {isActive ? <View style={styles.activeDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabButtonActive: {},
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
    marginTop: 3,
  },
});
