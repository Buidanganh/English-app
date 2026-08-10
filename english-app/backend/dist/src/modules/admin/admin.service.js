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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const totalUsers = await this.prisma.user.count();
        const freeUsers = await this.prisma.user.count({ where: { subscriptionTier: 'FREE' } });
        const plusUsers = await this.prisma.user.count({ where: { subscriptionTier: 'PLUS' } });
        const proUsers = await this.prisma.user.count({ where: { subscriptionTier: 'PRO' } });
        const estimatedRevenue = plusUsers * 99000 + proUsers * 199000;
        const recentUsers = await this.prisma.user.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                totalXp: true,
                streakCount: true,
                createdAt: true,
            },
        });
        return {
            stats: {
                totalUsers,
                freeUsers,
                plusUsers,
                proUsers,
                estimatedRevenue,
                estimatedRevenueFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedRevenue),
                momoAccount: '0924904527 - BUI DANG ANH',
            },
            recentUsers,
        };
    }
    async updateUserTier(userId, tier) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionTier: tier,
                subscriptionExpiresAt: tier === 'FREE' ? null : expiresAt,
            },
        });
        return {
            message: `Đã duyệt nâng cấp tài khoản ${updated.email} sang hạng ${tier}!`,
            user: updated,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map