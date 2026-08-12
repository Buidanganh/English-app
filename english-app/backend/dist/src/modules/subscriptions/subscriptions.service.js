"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async generateVietQrPayment(userId, tier, durationMonths) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        const isYearly = durationMonths === 12;
        let amount = 99000;
        if (tier === 'PLUS') {
            amount = isYearly ? 599000 : 99000;
        }
        else {
            amount = isYearly ? 990000 : 199000;
        }
        const bankId = 'MOMO';
        const bankAccountNo = '0924904527';
        const accountName = 'BUI DANG ANH';
        const memo = `VIP_${tier}_${user.id.substring(0, 8).toUpperCase()}`;
        await this.prisma.paymentRequest.deleteMany({
            where: { userId, status: 'PENDING' },
        });
        const paymentRequest = await this.prisma.paymentRequest.create({
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
    async confirmPayment(userId, paymentRequestId) {
        const payment = await this.prisma.paymentRequest.findFirst({
            where: { id: paymentRequestId, userId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu thanh toán');
        if (payment.status === 'APPROVED') {
            return { message: 'Thanh toán đã được duyệt trước đó!', status: 'APPROVED' };
        }
        return {
            paymentRequestId: payment.id,
            status: 'PENDING',
            message: '✅ Đã ghi nhận yêu cầu! Chúng tôi đang xác minh chuyển khoản của bạn. Vui lòng đợi trong vài phút.',
            tier: payment.tier,
            amount: payment.amount,
            memo: payment.memo,
        };
    }
    async checkPaymentStatus(userId) {
        const payment = await this.prisma.paymentRequest.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!payment)
            return { status: 'NONE', message: 'Không có yêu cầu thanh toán nào.' };
        if (payment.status === 'APPROVED') {
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
    async getAdminPayments(status) {
        const where = status ? { status } : {};
        const payments = await this.prisma.paymentRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const enriched = await Promise.all(payments.map(async (p) => {
            const user = await this.prisma.user.findUnique({
                where: { id: p.userId },
                select: { email: true, fullName: true, subscriptionTier: true },
            });
            return { ...p, user };
        }));
        return enriched;
    }
    async approvePayment(adminId, paymentRequestId, adminNote) {
        const payment = await this.prisma.paymentRequest.findUnique({
            where: { id: paymentRequestId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu thanh toán');
        if (payment.status === 'APPROVED') {
            return { message: 'Đã duyệt trước đó!' };
        }
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
        await this.prisma.paymentRequest.update({
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
    async rejectPayment(adminId, paymentRequestId, adminNote) {
        const payment = await this.prisma.paymentRequest.findUnique({
            where: { id: paymentRequestId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu thanh toán');
        await this.prisma.paymentRequest.update({
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
    async getXpRedeemOptions(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { totalXp: true, subscriptionTier: true, subscriptionExpiresAt: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        return {
            currentXp: user.totalXp,
            currentTier: user.subscriptionTier,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            options: SubscriptionsService_1.XP_REDEEM_OPTIONS.map(opt => ({
                ...opt,
                canRedeem: user.totalXp >= opt.xpRequired,
                xpShortfall: Math.max(0, opt.xpRequired - user.totalXp),
            })),
        };
    }
    async redeemXpForSubscription(userId, tier) {
        const option = SubscriptionsService_1.XP_REDEEM_OPTIONS.find(o => o.tier === tier);
        if (!option)
            throw new common_1.NotFoundException('Gói không hợp lệ');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { totalXp: true, subscriptionTier: true, subscriptionExpiresAt: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        if (user.totalXp < option.xpRequired) {
            throw new common_1.ForbiddenException(`Bạn cần ${option.xpRequired.toLocaleString()} XP để đổi gói này. Hiện tại bạn có ${user.totalXp.toLocaleString()} XP.`);
        }
        const now = new Date();
        let expiresAt;
        if (user.subscriptionTier === tier &&
            user.subscriptionExpiresAt &&
            new Date(user.subscriptionExpiresAt) > now) {
            expiresAt = new Date(user.subscriptionExpiresAt);
            expiresAt.setMonth(expiresAt.getMonth() + option.durationMonths);
        }
        else {
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + option.durationMonths);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                totalXp: { decrement: option.xpRequired },
                subscriptionTier: tier,
                subscriptionExpiresAt: expiresAt,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                totalXp: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
            },
        });
        return {
            success: true,
            message: `🎉 Đổi XP thành công! Gói ${option.badge} đã được kích hoạt đến ${expiresAt.toLocaleDateString('vi-VN')}!`,
            tier,
            xpUsed: option.xpRequired,
            remainingXp: updatedUser.totalXp,
            expiresAt,
            user: updatedUser,
        };
    }
    async upgrade(userId, tier, durationMonths) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại');
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
};
exports.SubscriptionsService = SubscriptionsService;
SubscriptionsService.XP_REDEEM_OPTIONS = [
    {
        tier: 'PLUS',
        durationMonths: 1,
        xpRequired: 5000,
        label: 'PLUS ⚡ 1 Tháng',
        description: 'Vô hạn trái tim, mở khóa toàn bộ chủ đề, x1.5 XP',
        color: '#38BDF8',
        badge: '⚡ PLUS',
    },
    {
        tier: 'PRO',
        durationMonths: 1,
        xpRequired: 10000,
        label: 'PRO 👑 1 Tháng',
        description: 'Vô hạn mọi tính năng, x2 XP & Streak, huy hiệu hoàng gia',
        color: '#F59E0B',
        badge: '👑 PRO',
    },
];
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map