import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return [
      {
        id: 'FREE',
        name: 'Gói Miễn Phí',
        priceMonthly: '0 VNĐ',
        priceYearly: '0 VNĐ',
        badge: 'FREE',
        features: [
          'Học bài & Quiz cơ bản',
          '5 Trái tim mạng học / ngày',
          '2 lượt AI Roleplay / ngày',
        ],
        isPopular: false,
      },
      {
        id: 'PLUS',
        name: 'Gói PLUS ⚡',
        priceMonthly: '99.000 VNĐ / tháng',
        priceYearly: '599.000 VNĐ / năm',
        badge: 'PLUS ⚡',
        features: [
          'Vô hạn Trái tim mạng học ♾️',
          'Mở khóa toàn bộ 10 chủ đề từ vựng',
          '20 lượt AI Roleplay / ngày 💬',
          'x1.5 XP Thưởng kinh nghiệm',
        ],
        isPopular: true,
      },
      {
        id: 'PRO',
        name: 'Gói PRO 👑',
        priceMonthly: '199.000 VNĐ / tháng',
        priceYearly: '990.000 VNĐ / năm',
        badge: 'PRO 👑',
        features: [
          'Vô hạn Trái tim mạng học ♾️',
          'Vô hạn AI Roleplay nhập vai 💬',
          'Mở khóa toàn bộ đặc quyền cao cấp',
          'x2 XP Thưởng & Nhân đôi Streak 🔥',
          'Huy hiệu PRO Hoàng gia nổi bật',
        ],
        isPopular: false,
      },
    ];
  }

  // Tạo mã VietQR + lưu PaymentRequest vào DB với trạng thái PENDING
  async generateVietQrPayment(userId: string, tier: 'PLUS' | 'PRO', durationMonths: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isYearly = durationMonths === 12;
    let amount = 99000;
    if (tier === 'PLUS') {
      amount = isYearly ? 599000 : 99000;
    } else {
      amount = isYearly ? 990000 : 199000;
    }

    const bankId = 'MOMO';
    const bankAccountNo = '0924904527';
    const accountName = 'BUI DANG ANH';
    const memo = `VIP_${tier}_${user.id.substring(0, 8).toUpperCase()}`;

    // Xóa pending cũ chưa được duyệt của user này (tránh trùng lặp)
    await (this.prisma as any).paymentRequest.deleteMany({
      where: { userId, status: 'PENDING' },
    });

    // Tạo PaymentRequest mới với trạng thái PENDING
    const paymentRequest = await (this.prisma as any).paymentRequest.create({
      data: {
        userId,
        tier,
        durationMonths,
        amount,
        memo,
        status: 'PENDING',
      },
    });

    const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    return {
      paymentRequestId: paymentRequest.id,
      tier,
      durationMonths,
      amount,
      amountFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount),
      bankId,
      bankName: 'Ví điện tử MoMo / Ngân hàng MoMo',
      bankAccountNo,
      accountName,
      memo,
      qrCodeUrl,
    };
  }

  // User xác nhận đã chuyển khoản → status = PENDING (chờ admin duyệt)
  async confirmPayment(userId: string, paymentRequestId: string) {
    const payment = await (this.prisma as any).paymentRequest.findFirst({
      where: { id: paymentRequestId, userId },
    });

    if (!payment) throw new NotFoundException('Không tìm thấy yêu cầu thanh toán');
    if (payment.status === 'APPROVED') {
      return { message: 'Thanh toán đã được duyệt trước đó!', status: 'APPROVED' };
    }

    // Giữ nguyên PENDING — chờ admin xác minh chuyển khoản thực tế
    return {
      paymentRequestId: payment.id,
      status: 'PENDING',
      message: '✅ Đã ghi nhận yêu cầu! Chúng tôi đang xác minh chuyển khoản của bạn. Vui lòng đợi trong vài phút.',
      tier: payment.tier,
      amount: payment.amount,
      memo: payment.memo,
    };
  }

  // Poll status — user kiểm tra thanh toán đã được duyệt chưa
  async checkPaymentStatus(userId: string) {
    const payment = await (this.prisma as any).paymentRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) return { status: 'NONE', message: 'Không có yêu cầu thanh toán nào.' };

    if (payment.status === 'APPROVED') {
      // Fetch thông tin user mới nhất để trả về subscriptionTier đã cập nhật
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true, totalXp: true },
      });
      return {
        status: 'APPROVED',
        tier: payment.tier,
        message: `🎉 Thanh toán đã được xác minh! Gói ${payment.tier} đã được kích hoạt!`,
        user,
      };
    }

    if (payment.status === 'REJECTED') {
      return {
        status: 'REJECTED',
        message: payment.adminNote || 'Thanh toán không hợp lệ. Vui lòng liên hệ hỗ trợ.',
      };
    }

    return {
      status: 'PENDING',
      message: '⏳ Đang xác minh chuyển khoản... Vui lòng đợi.',
      paymentRequestId: payment.id,
      tier: payment.tier,
      amount: payment.amount,
      memo: payment.memo,
      createdAt: payment.createdAt,
    };
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  // Lấy danh sách tất cả PaymentRequest để admin quản lý
  async getAdminPayments(status?: string) {
    const where = status ? { status } : {};
    const payments = await (this.prisma as any).paymentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Attach thông tin user
    const enriched = await Promise.all(
      payments.map(async (p: any) => {
        const user = await this.prisma.user.findUnique({
          where: { id: p.userId },
          select: { email: true, fullName: true, subscriptionTier: true },
        });
        return { ...p, user };
      })
    );

    return enriched;
  }

  // Admin duyệt thanh toán → kích hoạt gói
  async approvePayment(adminId: string, paymentRequestId: string, adminNote?: string) {
    const payment = await (this.prisma as any).paymentRequest.findUnique({
      where: { id: paymentRequestId },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy yêu cầu thanh toán');
    if (payment.status === 'APPROVED') {
      return { message: 'Đã duyệt trước đó!' };
    }

    // Kích hoạt gói cho user
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (payment.durationMonths || 1));

    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionTier: payment.tier,
        subscriptionExpiresAt: expiresAt,
        totalXp: { increment: payment.tier === 'PRO' ? 100 : 50 },
      },
    });

    // Cập nhật trạng thái payment → APPROVED
    await (this.prisma as any).paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: 'APPROVED',
        adminNote: adminNote || `Đã duyệt bởi Admin`,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    return {
      message: `✅ Đã kích hoạt Gói ${payment.tier} cho user ${payment.userId}`,
      paymentRequestId,
      tier: payment.tier,
    };
  }

  // Admin từ chối thanh toán
  async rejectPayment(adminId: string, paymentRequestId: string, adminNote: string) {
    const payment = await (this.prisma as any).paymentRequest.findUnique({
      where: { id: paymentRequestId },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy yêu cầu thanh toán');

    await (this.prisma as any).paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: 'REJECTED',
        adminNote: adminNote || 'Không xác nhận được chuyển khoản.',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    return { message: '❌ Đã từ chối thanh toán', paymentRequestId };
  }

  // ============================================================
  // LEGACY: Direct upgrade (vẫn giữ cho admin có thể dùng trực tiếp)
  // ============================================================
  async upgrade(userId: string, tier: 'PLUS' | 'PRO', durationMonths: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (durationMonths || 1));

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
        totalXp: { increment: tier === 'PRO' ? 100 : 50 },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        streakCount: true,
        totalXp: true,
      },
    });

    return {
      message: `Cảm ơn bạn! Thanh toán thành công và đã nâng cấp tài khoản lên Gói ${tier}!`,
      user: updatedUser,
    };
  }
}
