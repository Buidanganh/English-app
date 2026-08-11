import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useAuthStore } from './src/stores/authStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CourseScreen } from './src/screens/CourseScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { RoleplayListScreen } from './src/screens/RoleplayListScreen';
import { RoleplayChatScreen } from './src/screens/RoleplayChatScreen';
import { RoleplayResultScreen } from './src/screens/RoleplayResultScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { VoiceBattleScreen } from './src/screens/VoiceBattleScreen';
import { ProfileAnalyticsScreen } from './src/screens/ProfileAnalyticsScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdaptiveLearningScreen } from './src/screens/AdaptiveLearningScreen';
import { BottomNavbar, TabType } from './src/components/BottomNavbar';

// Tự động tiêm CSS full height 100% cho html, body và #root trên trình duyệt Web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      background-color: #F8FAFC !important;
    }
  `;
  if (!document.getElementById('expo-web-style')) {
    style.id = 'expo-web-style';
    document.head.appendChild(style);
  }
}

export default function App() {
  const { user, token, isInitializing, fetchProfile } = useAuthStore();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  
  // App Screen Flow
  const [appScreen, setAppScreen] = useState<'home' | 'course' | 'quiz' | 'roleplay-list' | 'roleplay-chat' | 'roleplay-result' | 'subscription' | 'voice-battle' | 'profile' | 'leaderboard' | 'admin' | 'adaptive'>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [roleplayResult, setRoleplayResult] = useState<any>(null);

  const [courseRefreshKey, setCourseRefreshKey] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isInitializing) {
    return (
      <View style={[styles.rootContainer, styles.center]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Chuyển đổi tab từ BottomNavbar
  const getActiveTab = (): TabType => {
    if (appScreen === 'course' || appScreen === 'quiz') return 'course';
    if (appScreen === 'roleplay-list' || appScreen === 'roleplay-chat' || appScreen === 'roleplay-result') return 'roleplay';
    if (appScreen === 'voice-battle') return 'battle';
    if (appScreen === 'subscription' || appScreen === 'profile') return 'subscription';
    return 'home';
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'home') setAppScreen('home');
    if (tab === 'course') {
      setCourseRefreshKey((prev) => prev + 1);
      setAppScreen('course');
    }
    if (tab === 'roleplay') setAppScreen('roleplay-list');
    if (tab === 'battle') setAppScreen('voice-battle');
    if (tab === 'subscription') setAppScreen('profile');
  };

  const renderContent = () => {
    // 1. Chưa Đăng nhập -> Hiển thị Auth Screens
    if (!token || !user) {
      return authScreen === 'login' ? (
        <LoginScreen onNavigateRegister={() => setAuthScreen('register')} />
      ) : (
        <RegisterScreen onNavigateLogin={() => setAuthScreen('login')} />
      );
    }

    // 2. Màn hình Khóa học & Làm bài Quiz / Bài Test Chủ đề
    if (appScreen === 'course') {
      return (
        <CourseScreen
          refreshKey={courseRefreshKey}
          onBack={() => setAppScreen('home')}
          onSelectLesson={(lessonId) => {
            setSelectedLessonId(lessonId);
            setAppScreen('quiz');
          }}
          onSelectTopicTest={(unitId) => {
            setSelectedLessonId(`unit_test:${unitId}`);
            setAppScreen('quiz');
          }}
        />
      );
    }

    if (appScreen === 'quiz' && selectedLessonId) {
      return (
        <QuizScreen
          lessonId={selectedLessonId}
          onFinish={() => {
            setSelectedLessonId(null);
            fetchProfile(); // Cập nhật XP thưởng
            setCourseRefreshKey((prev) => prev + 1);
            setAppScreen('course');
          }}
        />
      );
    }

    // 3. Màn hình Tính năng Lớn: AI Roleplay
    if (appScreen === 'roleplay-list') {
      return (
        <RoleplayListScreen
          onBack={() => setAppScreen('home')}
          onSelectScenario={(scenarioId) => {
            setSelectedScenarioId(scenarioId);
            setAppScreen('roleplay-chat');
          }}
        />
      );
    }

    if (appScreen === 'roleplay-chat' && selectedScenarioId) {
      return (
        <RoleplayChatScreen
          scenarioId={selectedScenarioId}
          onBack={() => setAppScreen('roleplay-list')}
          onFinishSession={(result) => {
            setRoleplayResult(result);
            setAppScreen('roleplay-result');
          }}
        />
      );
    }

    if (appScreen === 'roleplay-result' && roleplayResult) {
      return (
        <RoleplayResultScreen
          resultData={roleplayResult}
          onFinish={() => {
            setRoleplayResult(null);
            setSelectedScenarioId(null);
            fetchProfile(); // Cập nhật lại XP & Streak mới trên Trang chủ
            setAppScreen('home');
          }}
        />
      );
    }

    // 4. Màn hình Nâng Cấp Gói Thành Viên VIP (Thanh toán MoMo BÙI ĐĂNG ANH 0924904527)
    if (appScreen === 'subscription') {
      return (
        <SubscriptionScreen
          onBack={() => setAppScreen('profile')}
          onSuccessUpgrade={() => {
            fetchProfile();
            setAppScreen('profile');
          }}
        />
      );
    }

    // 5. Màn hình Tính Năng Đột Phá: AI Voice Battle 1v1
    if (appScreen === 'voice-battle') {
      return (
        <VoiceBattleScreen
          onBack={() => setAppScreen('home')}
          onFinishBattle={() => {
            fetchProfile(); // Cập nhật Cúp & XP mới
            setAppScreen('home');
          }}
        />
      );
    }

    // 6. Màn hình Hồ Sơ & Thống Kê Học Tập Analytics
    if (appScreen === 'profile') {
      return (
        <ProfileAnalyticsScreen
          onBack={() => setAppScreen('home')}
          onNavigateSubscription={() => setAppScreen('subscription')}
          onNavigateLeaderboard={() => setAppScreen('leaderboard')}
        />
      );
    }

    // 7. Màn hình Bảng Xếp Hạng Giải Đấu Hàng Tuần (Leaderboard Top 10)
    if (appScreen === 'leaderboard') {
      return (
        <LeaderboardScreen
          onBack={() => setAppScreen('profile')}
        />
      );
    }

    // 8. Màn hình Admin Dashboard Quản Lý Doanh Thu & Học Viên (Chủ App)
    if (appScreen === 'admin') {
      return (
        <AdminDashboardScreen
          onBack={() => setAppScreen('home')}
        />
      );
    }

    // 9. Màn hình Lộ Trình Học Cá Nhân Hóa AI (Adaptive Learning)
    if (appScreen === 'adaptive') {
      return (
        <AdaptiveLearningScreen
          onBack={() => setAppScreen('home')}
          onSelectLesson={(lessonId) => {
            setSelectedLessonId(lessonId);
            setAppScreen('quiz');
          }}
        />
      );
    }

    return (
      <HomeScreen
        onNavigateCourse={() => setAppScreen('course')}
        onNavigateRoleplay={() => setAppScreen('roleplay-list')}
        onNavigateSubscription={() => setAppScreen('subscription')}
        onNavigateVoiceBattle={() => setAppScreen('voice-battle')}
        onNavigateAdmin={() => setAppScreen('admin')}
        onNavigateAdaptive={() => setAppScreen('adaptive')}
      />
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="dark" />
      <View style={styles.mainView}>{renderContent()}</View>

      {token && user ? (
        <BottomNavbar activeTab={getActiveTab()} onSelectTab={handleSelectTab} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  mainView: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
