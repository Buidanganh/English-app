import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
  TextInput, Modal,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  plusUsers: number;
  proUsers: number;
  estimatedRevenue: number;
  estimatedRevenueFormatted: string;
  momoAccount: string;
}

interface RecentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  subscriptionTier: 'FREE' | 'PLUS' | 'PRO';
  totalXp: number;
  streakCount: number;
  createdAt: string;
}

interface PaymentRequest {
  id: string;
  userId: string;
  tier: 'PLUS' | 'PRO';
  durationMonths: number;
  amount: number;
  memo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  user?: { email: string; fullName: string; subscriptionTier: string };
}

type AdminTab = 'PAYMENTS' | 'STATS';

interface Props {
  onBack: () => void;
}

export const AdminDashboardScreen: React.FC<Props> = ({ onBack }) => {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('PAYMENTS');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Payment management
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    fetchPayments();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setUsers(res.data.recentUsers);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await api.get('/subscriptions/admin/payments');
      setPayments(res.data || []);
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleApprovePayment = (payment: PaymentRequest) => {
    const amountStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount);
    Alert.alert(
      '✅ Duyệt Thanh Toán',
      `Xác nhận DUYỆT?\n\nUser: ${payment.user?.email || payment.userId}\nGói: ${payment.tier}\nSố tiền: ${amountStr}\nNội dung CK: ${payment.memo}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '✅ Duyệt & Kích Hoạt',
          style: 'default',
          onPress: async () => {
            setProcessingPaymentId(payment.id);
            try {
              const res = await api.post(`/subscriptions/admin/approve/${payment.id}`, {
                adminNote: 'Đã xác minh chuyển khoản',
              });
              Alert.alert('🎉 Thành Công!', res.data.message);
              fetchPayments();
              fetchDashboard();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể duyệt thanh toán');
            } finally {
              setProcessingPaymentId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async (paymentId: string) => {
    setProcessingPaymentId(paymentId);
    try {
      await api.post(`/subscriptions/admin/reject/${paymentId}`, {
        adminNote: rejectNote || 'Không xác nhận được giao dịch chuyển khoản.',
      });
      Alert.alert('❌ Đã Từ Chối', 'Đã từ chối thanh toán thành công.');
      setRejectModalId(null);
      setRejectNote('');
      fetchPayments();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể từ chối thanh toán');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleUpdateTier = async (userId: string, tier: 'FREE' | 'PLUS' | 'PRO') => {
    setUpdatingUserId(userId);
    try {
      const res = await api.post(`/admin/users/${userId}/tier`, { tier });
      Alert.alert('Thành Công', res.data.message);
      fetchDashboard();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật hạng tài khoản');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  const pendingPayments = payments.filter(p => p.status === 'PENDING');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin 🛡️</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PAYMENTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PAYMENTS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'PAYMENTS' && styles.tabBtnTextActive]}>
            💳 Thanh Toán
          </Text>
          {pendingPayments.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingPayments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'STATS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('STATS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'STATS' && styles.tabBtnTextActive]}>
            📊 Thống Kê
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ========== TAB PAYMENTS ========== */}
        {activeTab === 'PAYMENTS' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yêu Cầu Thanh Toán ({payments.length})</Text>
              <TouchableOpacity style={styles.reloadBtn} onPress={fetchPayments}>
                <Text style={styles.reloadBtnText}>🔄 Tải lại</Text>
              </TouchableOpacity>
            </View>

            {isLoadingPayments ? (
              <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 30 }} />
            ) : payments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Chưa có yêu cầu thanh toán nào</Text>
              </View>
            ) : (
              payments.map((payment) => (
                <View
                  key={payment.id}
                  style={[
                    styles.paymentCard,
                    payment.status === 'PENDING' && styles.cardPending,
                    payment.status === 'APPROVED' && styles.cardApproved,
                    payment.status === 'REJECTED' && styles.cardRejected,
                  ]}
                >
                  {/* Top Row: Status + Tier */}
                  <View style={styles.cardTopRow}>
                    <View style={[
                      styles.statusTag,
                      payment.status === 'PENDING' && styles.tagPending,
                      payment.status === 'APPROVED' && styles.tagApproved,
                      payment.status === 'REJECTED' && styles.tagRejected,
                    ]}>
                      <Text style={styles.statusTagText}>
                        {payment.status === 'PENDING' ? '⏳ Chờ Duyệt'
                          : payment.status === 'APPROVED' ? '✅ Đã Duyệt'
                          : '❌ Từ Chối'}
                      </Text>
                    </View>
                    <Text style={[styles.tierLabel, payment.tier === 'PRO' ? styles.tierPro : styles.tierPlus]}>
                      {payment.tier === 'PRO' ? '👑 PRO' : '⚡ PLUS'}
                    </Text>
                  </View>

                  {/* User */}
                  <Text style={styles.paymentUser}>
                    👤 {payment.user?.fullName || 'User'} — {payment.user?.email || payment.userId.substring(0, 14)}
                  </Text>

                  {/* Details */}
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Số tiền:</Text>
                      <Text style={styles.detailAmount}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nội dung CK:</Text>
                      <Text style={styles.detailMemo}>{payment.memo}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Thời gian:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(payment.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                    {payment.adminNote ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ghi chú:</Text>
                        <Text style={styles.detailValue}>{payment.adminNote}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons — only PENDING */}
                  {payment.status === 'PENDING' && (
                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprovePayment(payment)}
                        disabled={processingPaymentId === payment.id}
                        activeOpacity={0.8}
                      >
                        {processingPaymentId === payment.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.approveBtnText}>✅ Duyệt & Kích Hoạt</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setRejectModalId(payment.id)}
                        disabled={processingPaymentId === payment.id}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rejectBtnText}>❌ Từ Chối</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ========== TAB STATS ========== */}
        {activeTab === 'STATS' && (
          <View>
            {stats ? (
              <>
                {/* Revenue Banner */}
                <View style={styles.revenueBanner}>
                  <Text style={styles.revenueBadge}>DOANH THU MOMO TÍCH LŨY 💸</Text>
                  <Text style={styles.revenueAmount}>{stats.estimatedRevenueFormatted}</Text>
                  <Text style={styles.revenueMomo}>Ví nhận tiền: {stats.momoAccount}</Text>
                </View>

                {/* KPI */}
                <Text style={styles.sectionTitle}>Thống Kê Học Viên</Text>
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
                    <Text style={styles.kpiLabel}>Tổng</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: '#0284C7' }]}>{stats.plusUsers}</Text>
                    <Text style={styles.kpiLabel}>PLUS ⚡</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.proUsers}</Text>
                    <Text style={styles.kpiLabel}>PRO 👑</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: '#64748B' }]}>{stats.freeUsers}</Text>
                    <Text style={styles.kpiLabel}>FREE</Text>
                  </View>
                </View>

                {/* Users List */}
                <Text style={styles.sectionTitle}>Học Viên Mới ({users.length})</Text>
                <View style={styles.usersList}>
                  {users.map((u) => (
                    <View key={u.id} style={styles.userCard}>
                      <View style={styles.userInfoRow}>
                        <View style={styles.userMain}>
                          <Text style={styles.userName}>{u.fullName || 'Học viên'}</Text>
                          <Text style={styles.userEmail}>{u.email}</Text>
                        </View>
                        {u.subscriptionTier === 'PRO' ? (
                          <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO 👑</Text></View>
                        ) : u.subscriptionTier === 'PLUS' ? (
                          <View style={styles.plusBadge}><Text style={styles.plusBadgeText}>PLUS ⚡</Text></View>
                        ) : (
                          <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                        )}
                      </View>

                      <View style={styles.userStatsRow}>
                        <Text style={styles.userStat}>🔥 {u.streakCount} ngày</Text>
                        <Text style={styles.userStat}>⭐ {u.totalXp} XP</Text>
                        <Text style={styles.userStat}>📅 {new Date(u.createdAt).toLocaleDateString('vi-VN')}</Text>
                      </View>

                      {updatingUserId === u.id ? (
                        <ActivityIndicator size="small" color="#F59E0B" style={{ marginTop: 8 }} />
                      ) : (
                        <View style={styles.tierBtnRow}>
                          <TouchableOpacity
                            style={[styles.tierBtn, styles.btnFree]}
                            onPress={() => handleUpdateTier(u.id, 'FREE')}
                          >
                            <Text style={styles.btnFreeText}>FREE</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.tierBtn, styles.btnPlus]}
                            onPress={() => handleUpdateTier(u.id, 'PLUS')}
                          >
                            <Text style={styles.btnPlusText}>PLUS ⚡</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.tierBtn, styles.btnPro]}
                            onPress={() => handleUpdateTier(u.id, 'PRO')}
                          >
                            <Text style={styles.btnProText}>PRO 👑</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>Đang tải thống kê...</Text>
                <TouchableOpacity onPress={fetchDashboard} style={styles.reloadBtn}>
                  <Text style={styles.reloadBtnText}>🔄 Tải lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ===== Modal Từ Chối ===== */}
      <Modal visible={rejectModalId !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModal}>
            <Text style={styles.rejectModalTitle}>❌ Từ Chối Thanh Toán</Text>
            <Text style={styles.rejectModalDesc}>Nhập lý do từ chối để thông báo cho user:</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Lý do từ chối..."
              placeholderTextColor="#64748B"
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.rejectModalBtns}>
              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => { setRejectModalId(null); setRejectNote(''); }}
              >
                <Text style={styles.rejectCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={() => rejectModalId && handleRejectPayment(rejectModalId)}
                disabled={processingPaymentId !== null}
              >
                {processingPaymentId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rejectConfirmText}>❌ Xác Nhận Từ Chối</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
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
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  logoutText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: { backgroundColor: '#334155' },
  tabBtnText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  tabBtnTextActive: { color: '#FFFFFF' },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 12 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  reloadBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reloadBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Payment Card
  paymentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 10,
  },
  cardPending: { borderColor: '#F59E0B', backgroundColor: '#1C1A0E' },
  cardApproved: { borderColor: '#10B981', backgroundColor: '#0A1F16' },
  cardRejected: { borderColor: '#EF4444', backgroundColor: '#1F0A0A', opacity: 0.75 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagPending: { backgroundColor: '#D97706' },
  tagApproved: { backgroundColor: '#059669' },
  tagRejected: { backgroundColor: '#DC2626' },
  statusTagText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  tierLabel: { fontWeight: '900', fontSize: 15 },
  tierPro: { color: '#F59E0B' },
  tierPlus: { color: '#38BDF8' },
  paymentUser: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  detailsBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#64748B', fontSize: 12 },
  detailValue: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 6 },
  detailAmount: { color: '#F59E0B', fontSize: 14, fontWeight: '900' },
  detailMemo: { color: '#38BDF8', fontWeight: '800', fontSize: 12 },
  actionBtns: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  rejectBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  rejectBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13 },

  // Stats
  revenueBanner: {
    backgroundColor: '#1E1B4B',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 16,
  },
  revenueBadge: { color: '#F59E0B', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  revenueAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  revenueMomo: { color: '#A5B4FC', fontSize: 12 },
  kpiGrid: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 },
  kpiBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  kpiLabel: { color: '#64748B', fontSize: 11, marginTop: 4, fontWeight: '600' },

  // Users
  usersList: { gap: 10 },
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userMain: { flex: 1 },
  userName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  userEmail: { color: '#64748B', fontSize: 12 },
  proBadge: { backgroundColor: '#D97706', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  proBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  plusBadge: { backgroundColor: '#0284C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  plusBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  freeBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeBadgeText: { color: '#94A3B8', fontWeight: '700', fontSize: 11 },
  userStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  userStat: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  tierBtnRow: { flexDirection: 'row', gap: 8 },
  tierBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnFree: { backgroundColor: '#334155' },
  btnFreeText: { color: '#CBD5E1', fontWeight: '700', fontSize: 12 },
  btnPlus: { backgroundColor: '#0284C7' },
  btnPlusText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  btnPro: { backgroundColor: '#D97706' },
  btnProText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },

  // Reject Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rejectModal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  rejectModalTitle: { color: '#EF4444', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  rejectModalDesc: { color: '#94A3B8', fontSize: 13, marginBottom: 12 },
  rejectInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rejectModalBtns: { flexDirection: 'row', gap: 10 },
  rejectCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rejectCancelText: { color: '#94A3B8', fontWeight: '700' },
  rejectConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  rejectConfirmText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
});
