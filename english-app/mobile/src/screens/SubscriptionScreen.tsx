import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Modal,
  Image, Platform, Animated,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

/* ===========================
   TYPES
=========================== */
interface Plan {
  id: 'FREE' | 'PLUS' | 'PRO';
  name: string;
  priceMonthly: string;
  priceYearly: string;
  badge: string;
  features: string[];
  isPopular: boolean;
}

interface QrData {
  paymentRequestId: string;
  tier: 'PLUS' | 'PRO';
  durationMonths: number;
  amount: number;
  amountFormatted: string;
  bankId: string;
  bankName: string;
  bankAccountNo: string;
  accountName: string;
  memo: string;
  qrCodeUrl: string;
}

type PaymentStatus = 'IDLE' | 'QR' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface Props {
  onBack: () => void;
  onSuccessUpgrade: () => void;
}

/* ===========================
   PLAN CONFIG
=========================== */
const PLAN_COLORS = {
  FREE:  { border: '#334155', accent: '#64748B', bg: '#1E293B' },
  PLUS:  { border: '#38BDF8', accent: '#38BDF8', bg: '#0C2A3D' },
  PRO:   { border: '#F59E0B', accent: '#F59E0B', bg: '#1E1B4B' },
};

/* ===========================
   MAIN COMPONENT
=========================== */
export const SubscriptionScreen: React.FC<Props> = ({ onBack, onSuccessUpgrade }) => {
  const { user, fetchProfile } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Payment flow state machine
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTier, setPendingTier] = useState<'PLUS' | 'PRO' | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [xpRedeemData, setXpRedeemData] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Animation
  const successScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Poll interval ref
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchPlans();
    checkExistingPaymentStatus();
    fetchXpRedeemOptions();
  }, []);

  // Pulse animation for pending state
  useEffect(() => {
    if (paymentStatus === 'PENDING') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [paymentStatus]);

  // Success scale in animation
  useEffect(() => {
    if (paymentStatus === 'APPROVED') {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
      stopPolling();
    }
  }, [paymentStatus]);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchXpRedeemOptions = async () => {
    try {
      const res = await api.get('/subscriptions/xp-redeem/options');
      setXpRedeemData(res.data);
    } catch (err) {
      // Bỏ qua nếu chưa đăng nhập
    }
  };

  const handleXpRedeem = (tier: 'PLUS' | 'PRO') => {
    const option = xpRedeemData?.options?.find((o: any) => o.tier === tier);
    if (!option) return;

    if (!option.canRedeem) {
      Alert.alert(
        '⚠️ Chưa đủ XP',
        `Bạn cần thêm ${option.xpShortfall.toLocaleString()} XP nữa để đổi gói này.\n\nHãy tiếp tục học bài, làm nhiệm vụ và giữ chuỗi Streak để kiếm XP!`,
      );
      return;
    }

    Alert.alert(
      `Đổi ${option.xpRequired.toLocaleString()} XP`,
      `Xác nhận dùng ${option.xpRequired.toLocaleString()} XP để kích hoạt gói ${option.badge} 1 tháng?\n\nXP còn lại: ${(xpRedeemData.currentXp - option.xpRequired).toLocaleString()} XP`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: `✅ Xác Nhận Đổi`,
          style: 'default',
          onPress: async () => {
            setIsRedeeming(true);
            try {
              const res = await api.post('/subscriptions/xp-redeem/confirm', { tier });
              Alert.alert('🎉 Thành Công!', res.data.message);
              await fetchProfile();
              fetchXpRedeemOptions();
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đổi XP. Thử lại sau.');
            } finally {
              setIsRedeeming(false);
            }
          },
        },
      ],
    );
  };

  const checkExistingPaymentStatus = async () => {
    try {
      const res = await api.get('/subscriptions/payment-status');
      if (res.data.status === 'PENDING') {
        setPaymentStatus('PENDING');
        setPendingTier(res.data.tier);
        startPolling();
      } else if (res.data.status === 'APPROVED') {
        // Đã được duyệt từ session trước → refresh profile
        await fetchProfile();
      }
    } catch (err) {
      // Chưa đăng nhập hoặc không có payment
    }
  };

  /* ===========================
     POLLING LOGIC
  =========================== */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    setPollCount(0);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get('/subscriptions/payment-status');
        setPollCount(c => c + 1);

        if (res.data.status === 'APPROVED') {
          setPaymentStatus('APPROVED');
          setPendingTier(res.data.tier || pendingTier);
          await fetchProfile();
          stopPolling();
        } else if (res.data.status === 'REJECTED') {
          setPaymentStatus('REJECTED');
          stopPolling();
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 8000); // Poll mỗi 8 giây
  }, [pendingTier]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling(); // Cleanup khi unmount
  }, []);

  /* ===========================
     PAYMENT ACTIONS
  =========================== */
  const handleSelectUpgrade = async (tier: 'PLUS' | 'PRO') => {
    if (user?.subscriptionTier === tier) {
      Alert.alert('Thông báo', `Bạn đang sử dụng Gói ${tier} rồi!`);
      return;
    }
    setIsProcessing(true);
    try {
      const durationMonths = billingCycle === 'yearly' ? 12 : 1;
      const res = await api.post('/subscriptions/create-qr', { tier, durationMonths });
      setQrData(res.data);
      setPendingTier(tier);
      setIsQrModalVisible(true);
      setPaymentStatus('QR');
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tạo mã VietQR. Vui lòng đăng nhập và thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!qrData) return;
    setIsProcessing(true);
    try {
      await api.post('/subscriptions/confirm-payment', {
        paymentRequestId: qrData.paymentRequestId,
      });

      setIsQrModalVisible(false);
      setPaymentStatus('PENDING');
      startPolling();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể ghi nhận thanh toán. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDoneSuccess = () => {
    setPaymentStatus('IDLE');
    onSuccessUpgrade();
  };

  const handleCancelPending = () => {
    stopPolling();
    setPaymentStatus('IDLE');
  };

  /* ===========================
     LOADING STATE
  =========================== */
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  const currentTier = user?.subscriptionTier || 'FREE';

  /* ===========================
     PENDING STATE (Chờ Xác Minh)
  =========================== */
  if (paymentStatus === 'PENDING') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelPending}>
            <Text style={styles.backText}>← Quay Lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác Minh Thanh Toán</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.pendingContainer}>
          <Animated.View style={[styles.pendingIconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.pendingIcon}>🔍</Text>
          </Animated.View>

          <Text style={styles.pendingTitle}>Đang Xác Minh Chuyển Khoản</Text>
          <Text style={styles.pendingSubtitle}>
            Chúng tôi đang kiểm tra giao dịch của bạn.{'\n'}
            Vui lòng đợi trong vài phút.
          </Text>

          {/* Gói đang chờ */}
          <View style={[styles.pendingPlanBadge, pendingTier === 'PRO' && styles.pendingPlanBadgePro]}>
            <Text style={styles.pendingPlanBadgeText}>
              {pendingTier === 'PRO' ? '👑 Gói PRO' : '⚡ Gói PLUS'} đang chờ kích hoạt
            </Text>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[styles.dot, pollCount % 3 === i && styles.dotActive]}
              />
            ))}
          </View>

          <Text style={styles.pendingNote}>
            ⚡ Tự động cập nhật • Kiểm tra lần {pollCount + 1}
          </Text>

          {/* Thông tin chuyển khoản */}
          <View style={styles.pendingInfoBox}>
            <Text style={styles.pendingInfoTitle}>📋 Nội Dung Chuyển Khoản Của Bạn</Text>
            <View style={styles.pendingInfoRow}>
              <Text style={styles.pendingInfoLabel}>Tài khoản nhận:</Text>
              <Text style={styles.pendingInfoValue}>0924904527 (MoMo)</Text>
            </View>
            <View style={styles.pendingInfoRow}>
              <Text style={styles.pendingInfoLabel}>Chủ tài khoản:</Text>
              <Text style={styles.pendingInfoValue}>BUI DANG ANH</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cancelPendingBtn} onPress={handleCancelPending}>
            <Text style={styles.cancelPendingText}>Xem lại các Gói</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ===========================
     APPROVED STATE (Thành Công!)
  =========================== */
  if (paymentStatus === 'APPROVED') {
    const isPro = pendingTier === 'PRO';
    return (
      <SafeAreaView style={[styles.container, styles.successBg]}>
        <View style={styles.successContent}>
          <Animated.View style={[styles.successIconWrap, { transform: [{ scale: successScale }] }]}>
            <Text style={styles.successIcon}>{isPro ? '👑' : '⚡'}</Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: successScale }] }}>
            <Text style={styles.successTitle}>Thanh Toán Thành Công!</Text>
            <View style={[styles.successBadge, isPro ? styles.successBadgePro : styles.successBadgePlus]}>
              <Text style={styles.successBadgeText}>
                {isPro ? '👑 Gói PRO đã Kích Hoạt!' : '⚡ Gói PLUS đã Kích Hoạt!'}
              </Text>
            </View>
            <Text style={styles.successDesc}>
              Cảm ơn bạn! Tài khoản đã được nâng cấp.{'\n'}
              Hãy tận hưởng đầy đủ đặc quyền {isPro ? 'PRO 👑' : 'PLUS ⚡'}!
            </Text>
          </Animated.View>

          {/* Benefits list */}
          <Animated.View style={[styles.benefitsList, { transform: [{ scale: successScale }] }]}>
            {isPro ? (
              <>
                <BenefitItem icon="♾️" text="Vô hạn AI Roleplay nhập vai" />
                <BenefitItem icon="🔥" text="x2 XP & Nhân đôi Streak" />
                <BenefitItem icon="💎" text="Toàn bộ đặc quyền cao cấp" />
              </>
            ) : (
              <>
                <BenefitItem icon="♾️" text="Vô hạn Trái tim mạng học" />
                <BenefitItem icon="💬" text="20 lượt AI Roleplay / ngày" />
                <BenefitItem icon="⚡" text="x1.5 XP thưởng kinh nghiệm" />
              </>
            )}
          </Animated.View>

          <TouchableOpacity
            style={[styles.doneBtn, isPro ? styles.doneBtnPro : styles.doneBtnPlus]}
            onPress={handleDoneSuccess}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>🚀 Bắt Đầu Học Ngay!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ===========================
     REJECTED STATE
  =========================== */
  if (paymentStatus === 'REJECTED') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPaymentStatus('IDLE')}>
            <Text style={styles.backText}>← Quay Lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh Toán</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.pendingContainer}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>❌</Text>
          <Text style={styles.pendingTitle}>Thanh Toán Không Hợp Lệ</Text>
          <Text style={styles.pendingSubtitle}>
            Giao dịch của bạn không được xác nhận.{'\n'}
            Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.
          </Text>
          <TouchableOpacity
            style={[styles.cancelPendingBtn, { backgroundColor: '#EF4444', marginTop: 20 }]}
            onPress={() => setPaymentStatus('IDLE')}
          >
            <Text style={[styles.cancelPendingText, { color: '#FFFFFF' }]}>Thử Lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ===========================
     MAIN PLANS VIEW (IDLE / QR)
  =========================== */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gói Thành Viên VIP 👑</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerBadge}>MỞ KHÓA TOÀN BỘ ĐẶC QUYỀN ✨</Text>
          <Text style={styles.bannerTitle}>Học Tiếng Anh Không Giới Hạn</Text>
          <Text style={styles.bannerDesc}>
            Vô hạn bài học, vô hạn nhập vai AI Roleplay & nhân đôi điểm XP thưởng.
          </Text>

          {/* Billing Cycle Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
                Theo Tháng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
              onPress={() => setBillingCycle('yearly')}
            >
              <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
                Theo Năm 🔥 -50%
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansList}>
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const colors = PLAN_COLORS[plan.id];
            return (
              <View
                key={plan.id}
                style={[styles.planCard, { borderColor: colors.border, backgroundColor: colors.bg }]}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>⭐ PHỔ BIẾN NHẤT</Text>
                  </View>
                )}
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>✓ ĐANG DÙNG</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.accent }]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, { color: colors.accent }]}>
                    {billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.featuresList}>
                  {plan.features.map((feat, fi) => (
                    <View key={fi} style={styles.featureRow}>
                      <Text style={[styles.checkIcon, { color: colors.accent }]}>✓</Text>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {isCurrent ? (
                  <View style={[styles.planActionBtn, { backgroundColor: '#334155' }]}>
                    <Text style={styles.planActionBtnTextDisabled}>Đang sử dụng gói này ✓</Text>
                  </View>
                ) : plan.id === 'FREE' ? (
                  <View style={[styles.planActionBtn, { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' }]}>
                    <Text style={styles.planActionBtnTextDisabled}>Gói Mặc Định</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.planActionBtn,
                      { backgroundColor: plan.id === 'PRO' ? '#D97706' : '#0284C7' }
                    ]}
                    onPress={() => handleSelectUpgrade(plan.id as 'PLUS' | 'PRO')}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.planActionBtnText}>
                        💳 Chuyển khoản {plan.id === 'PRO' ? 'PRO 👑' : 'PLUS ⚡'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Payment Note */}
        <View style={styles.paymentNote}>
          <Text style={styles.paymentNoteIcon}>🔒</Text>
          <Text style={styles.paymentNoteText}>
            Thanh toán an toàn qua VietQR • Chuyển khoản MoMo / Ngân hàng{'\n'}
            Gói được kích hoạt ngay sau khi admin xác minh (thường trong 5 phút)
          </Text>
        </View>

        {/* ===== XP REDEEM SECTION ===== */}
        {xpRedeemData && (
          <View style={styles.xpRedeemSection}>
            {/* Header */}
            <View style={styles.xpRedeemHeader}>
              <Text style={styles.xpRedeemTitle}>⚡ Đổi XP Lấy Gói VIP</Text>
              <View style={styles.xpCurrentBadge}>
                <Text style={styles.xpCurrentText}>⭐ {xpRedeemData.currentXp?.toLocaleString()} XP</Text>
              </View>
            </View>
            <Text style={styles.xpRedeemDesc}>
              Tích lũy XP từ học bài, nhiệm vụ và streak để đổi gói VIP hoàn toàn miễn phí!
            </Text>

            {/* Redeem Cards */}
            {xpRedeemData.options?.map((opt: any) => (
              <View
                key={opt.tier}
                style={[
                  styles.xpRedeemCard,
                  { borderColor: opt.canRedeem ? opt.color : '#334155' },
                  opt.canRedeem && styles.xpRedeemCardActive,
                ]}
              >
                {/* Left */}
                <View style={styles.xpRedeemCardLeft}>
                  <View style={[styles.xpRedeemTierBadge, { backgroundColor: opt.color + '22', borderColor: opt.color }]}>
                    <Text style={[styles.xpRedeemTierText, { color: opt.color }]}>{opt.badge}</Text>
                  </View>
                  <Text style={styles.xpRedeemLabel}>{opt.label}</Text>
                  <Text style={styles.xpRedeemCardDesc} numberOfLines={2}>{opt.description}</Text>

                  {/* XP Progress */}
                  <View style={styles.xpProgressRow}>
                    <View style={styles.xpProgressTrack}>
                      <View style={[styles.xpProgressFill, {
                        width: `${Math.min(100, ((xpRedeemData.currentXp || 0) / opt.xpRequired) * 100)}%` as any,
                        backgroundColor: opt.canRedeem ? opt.color : '#64748B',
                      }]} />
                    </View>
                    <Text style={[styles.xpProgressLabel, { color: opt.canRedeem ? opt.color : '#64748B' }]}>
                      {(xpRedeemData.currentXp || 0).toLocaleString()}/{opt.xpRequired.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Right: CTA */}
                <TouchableOpacity
                  style={[
                    styles.xpRedeemBtn,
                    opt.canRedeem
                      ? { backgroundColor: opt.color }
                      : styles.xpRedeemBtnLocked,
                  ]}
                  onPress={() => handleXpRedeem(opt.tier)}
                  disabled={isRedeeming}
                  activeOpacity={0.85}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : opt.canRedeem ? (
                    <>
                      <Text style={styles.xpRedeemBtnText}>Đổi Ngay</Text>
                      <Text style={styles.xpRedeemBtnXp}>-{opt.xpRequired.toLocaleString()}</Text>
                      <Text style={styles.xpRedeemBtnXp}>XP</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.xpRedeemBtnTextLocked}>🔒</Text>
                      <Text style={styles.xpRedeemBtnShortfall}>Cần thêm</Text>
                      <Text style={styles.xpRedeemBtnShortfall}>+{opt.xpShortfall?.toLocaleString()}</Text>
                      <Text style={styles.xpRedeemBtnShortfall}>XP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {/* How to earn XP */}
            <View style={styles.xpEarnTips}>
              <Text style={styles.xpEarnTipsTitle}>💡 Cách kiếm XP nhanh:</Text>
              <Text style={styles.xpEarnTip}>📚 Hoàn thành bài học • 🎯 Nhiệm vụ hàng ngày • 🔥 Duy trì Streak • ⚔️ Voice Battle</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ===== Modal QR VietQR ===== */}
      <Modal visible={isQrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {qrData?.tier === 'PRO' ? '👑 Nâng Cấp PRO' : '⚡ Nâng Cấp PLUS'}
                </Text>
                <Text style={styles.modalSubtitle}>Quét mã QR để thanh toán qua ứng dụng ngân hàng / MoMo</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => { setIsQrModalVisible(false); setPaymentStatus('IDLE'); }}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {qrData && (
              <ScrollView contentContainerStyle={styles.qrScrollContent} showsVerticalScrollIndicator={false}>
                {/* QR Code */}
                <View style={styles.qrImageWrap}>
                  <Image source={{ uri: qrData.qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                </View>

                {/* Gói đang mua */}
                <View style={[styles.qrPlanTag, qrData.tier === 'PRO' ? styles.qrPlanTagPro : styles.qrPlanTagPlus]}>
                  <Text style={styles.qrPlanTagText}>
                    {qrData.tier === 'PRO' ? '👑 Gói PRO' : '⚡ Gói PLUS'} • {qrData.amountFormatted}
                  </Text>
                </View>

                {/* Transfer Details */}
                <View style={styles.transferInfoBox}>
                  <TransferRow label="Ví / Ngân hàng" value={qrData.bankName} />
                  <TransferRow label="Số tài khoản" value={qrData.bankAccountNo} highlight />
                  <TransferRow label="Chủ tài khoản" value={qrData.accountName} />
                  <TransferRow label="Số tiền" value={qrData.amountFormatted} amount />
                  <TransferRow label="Nội dung CK" value={qrData.memo} memo />
                </View>

                {/* Warning */}
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Nhập ĐÚNG nội dung chuyển khoản <Text style={styles.warningHighlight}>"{qrData.memo}"</Text> để hệ thống xác nhận tự động.
                  </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirmPaid}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.confirmBtnIcon}>✅</Text>
                      <Text style={styles.confirmBtnText}>Tôi Đã Chuyển Khoản Thành Công</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.confirmNote}>
                  Sau khi nhấn, hệ thống sẽ tự xác minh và kích hoạt gói cho bạn.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ===========================
   HELPER COMPONENTS
=========================== */
const BenefitItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitIcon}>{icon}</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const TransferRow = ({
  label, value, highlight, amount, memo,
}: {
  label: string; value: string; highlight?: boolean; amount?: boolean; memo?: boolean;
}) => (
  <View style={styles.transferRow}>
    <Text style={styles.transferLabel}>{label}:</Text>
    <Text style={[
      styles.transferValue,
      highlight && styles.transferHighlight,
      amount && styles.transferAmount,
      memo && styles.transferMemo,
    ]}>
      {value}
    </Text>
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
  center: { justifyContent: 'center', alignItems: 'center' },

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
  backText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 14 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  // Banner
  banner: { alignItems: 'center', marginBottom: 24 },
  bannerBadge: { color: '#F59E0B', fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  bannerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  bannerDesc: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#38BDF8' },
  toggleText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: '#0F172A' },

  // Plans
  plansList: { gap: 18 },
  planCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularBadgeText: { color: '#0F172A', fontSize: 10, fontWeight: '900' },
  currentBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  currentBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  planName: { fontSize: 20, fontWeight: '900' },
  planPrice: { fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 14 },
  featuresList: { gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { fontWeight: 'bold', fontSize: 16 },
  featureText: { color: '#E2E8F0', fontSize: 14, flex: 1, lineHeight: 20 },
  planActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  planActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  planActionBtnTextDisabled: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },

  // Payment Note
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 20,
    gap: 10,
  },
  paymentNoteIcon: { fontSize: 18 },
  paymentNoteText: { color: '#64748B', fontSize: 12, lineHeight: 18, flex: 1 },

  // ===== PENDING STATE =====
  pendingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pendingIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  pendingIcon: { fontSize: 44 },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  pendingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  pendingPlanBadge: {
    backgroundColor: '#0C2A3D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginBottom: 20,
  },
  pendingPlanBadgePro: {
    backgroundColor: '#1E1B4B',
    borderColor: '#F59E0B',
  },
  pendingPlanBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  progressDots: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  dotActive: { backgroundColor: '#F59E0B', width: 20 },
  pendingNote: { color: '#475569', fontSize: 12, marginBottom: 24 },
  pendingInfoBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    gap: 8,
  },
  pendingInfoTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  pendingInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pendingInfoLabel: { color: '#64748B', fontSize: 13 },
  pendingInfoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelPendingBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelPendingText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },

  // ===== APPROVED STATE =====
  successBg: { backgroundColor: '#0A1628' },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: { fontSize: 60 },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  successBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },
  successBadgePlus: { backgroundColor: '#0284C7' },
  successBadgePro: { backgroundColor: '#D97706' },
  successBadgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  successDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 28,
  },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: 22 },
  benefitText: { color: '#E2E8F0', fontSize: 15, fontWeight: '600', flex: 1 },
  doneBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnPlus: { backgroundColor: '#0284C7' },
  doneBtnPro: { backgroundColor: '#D97706' },
  doneBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },

  // ===== MODAL QR =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: { color: '#EF4444', fontWeight: '900', fontSize: 16 },
  qrScrollContent: { alignItems: 'center', paddingBottom: 30 },
  qrImageWrap: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: { width: 230, height: 230 },
  qrPlanTag: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  qrPlanTagPlus: { backgroundColor: '#EFF6FF' },
  qrPlanTagPro: { backgroundColor: '#FEF3C7' },
  qrPlanTagText: { fontWeight: '800', fontSize: 15, color: '#0F172A' },
  transferInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 14,
  },
  transferRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transferLabel: { fontSize: 13, color: '#64748B' },
  transferValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', textAlign: 'right', flex: 1, marginLeft: 8 },
  transferHighlight: { color: '#4F46E5', fontSize: 15, fontWeight: '900' },
  transferAmount: { color: '#D97706', fontSize: 16, fontWeight: '900' },
  transferMemo: { color: '#0284C7', fontWeight: '800' },
  warningBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    marginBottom: 16,
  },
  warningText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  warningHighlight: { fontWeight: '900', color: '#D97706' },
  confirmBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnIcon: { fontSize: 20 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  confirmNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: 10,
  },

  // ===== XP REDEEM SECTION =====
  xpRedeemSection: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1E3A5F',
    gap: 14,
    marginTop: 4,
  },
  xpRedeemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpRedeemTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  xpCurrentBadge: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  xpCurrentText: { color: '#38BDF8', fontWeight: '900', fontSize: 13 },
  xpRedeemDesc: { color: '#64748B', fontSize: 12, lineHeight: 18 },

  // Card
  xpRedeemCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    borderWidth: 1.5,
  },
  xpRedeemCardActive: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xpRedeemCardLeft: { flex: 1, gap: 6 },
  xpRedeemTierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  xpRedeemTierText: { fontWeight: '900', fontSize: 13 },
  xpRedeemLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  xpRedeemCardDesc: { color: '#64748B', fontSize: 11, lineHeight: 16 },

  // Progress
  xpProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: { height: '100%', borderRadius: 3 },
  xpProgressLabel: { fontSize: 10, fontWeight: '800', minWidth: 70, textAlign: 'right' },

  // CTA Button
  xpRedeemBtn: {
    width: 72,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  xpRedeemBtnLocked: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  xpRedeemBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 12 },
  xpRedeemBtnXp: { color: '#0F172A', fontWeight: '800', fontSize: 10 },
  xpRedeemBtnTextLocked: { fontSize: 18 },
  xpRedeemBtnShortfall: { color: '#64748B', fontSize: 9, fontWeight: '700', textAlign: 'center' },

  // Tips
  xpEarnTips: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  xpEarnTipsTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, marginBottom: 2 },
  xpEarnTip: { color: '#64748B', fontSize: 11, lineHeight: 18 },
});
