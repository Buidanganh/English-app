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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                streakCount: true,
                totalXp: true,
                battleWins: true,
                battleTrophies: true,
                unlockedUnitIndex: true,
                lastActiveDate: true,
                createdAt: true,
            },
        });
    }
    async createUser(data) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                fullName: data.fullName,
                unlockedUnitIndex: 1,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                subscriptionTier: true,
                streakCount: true,
                totalXp: true,
                battleWins: true,
                battleTrophies: true,
                unlockedUnitIndex: true,
                createdAt: true,
            },
        });
    }
    async getAnalytics(userId) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        const totalVocabs = await this.prisma.vocabulary.count();
        const favoritesCount = await this.prisma.userFavoriteVocabulary.count({ where: { userId } });
        const completedLessons = await this.prisma.userProgress.count({ where: { userId, isCompleted: true } });
        return {
            user,
            stats: {
                totalXp: user.totalXp,
                streakCount: user.streakCount,
                battleWins: user.battleWins,
                battleTrophies: user.battleTrophies,
                totalVocabsMastered: Math.min(totalVocabs, completedLessons * 5),
                favoritesCount,
                completedLessons,
            },
        };
    }
    async toggleFavorite(userId, vocabularyId) {
        const existing = await this.prisma.userFavoriteVocabulary.findUnique({
            where: { userId_vocabularyId: { userId, vocabularyId } },
        });
        if (existing) {
            await this.prisma.userFavoriteVocabulary.delete({
                where: { id: existing.id },
            });
            return { isFavorite: false, message: 'Đã bỏ lưu từ vựng' };
        }
        else {
            await this.prisma.userFavoriteVocabulary.create({
                data: { userId, vocabularyId },
            });
            return { isFavorite: true, message: 'Đã lưu vào Sổ tay Yêu thích ❤️' };
        }
    }
    async getFavorites(userId) {
        const favorites = await this.prisma.userFavoriteVocabulary.findMany({
            where: { userId },
            include: { vocabulary: true },
            orderBy: { createdAt: 'desc' },
        });
        return favorites.map((f) => f.vocabulary);
    }
    async getLeaderboard() {
        const topUsers = await this.prisma.user.findMany({
            take: 10,
            orderBy: [{ totalXp: 'desc' }, { battleTrophies: 'desc' }],
            select: {
                id: true,
                fullName: true,
                subscriptionTier: true,
                totalXp: true,
                battleTrophies: true,
                battleWins: true,
                streakCount: true,
            },
        });
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);
        const diffMs = endOfWeek.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const daysRemaining = Math.floor(diffHours / 24);
        const hoursRemaining = diffHours % 24;
        const currentWeekNumber = Math.ceil((now.getDate() + 6 - dayOfWeek) / 7);
        const leaderboard = topUsers.map((u, idx) => {
            let league = 'Giải Đồng 🥉';
            if (idx === 0)
                league = 'Hạng Nhất Hoàng Gia 🏆';
            else if (idx === 1)
                league = 'Giải Kim Cương 💎';
            else if (idx === 2)
                league = 'Giải Vàng 🥇';
            else if (idx < 5)
                league = 'Giải Bạc 🥈';
            return {
                rank: idx + 1,
                league,
                ...u,
            };
        });
        return {
            seasonInfo: {
                title: `GIẢI ĐẤU HÀNG TUẦN (TUẦN #${currentWeekNumber})`,
                resetNotice: `⏱️ Còn ${daysRemaining} ngày ${hoursRemaining} giờ là Reset Mùa Giải Tuần`,
                rewardsNotice: '👑 TOP 1: +500 XP | 💎 TOP 2: +300 XP | 🥇 TOP 3: +200 XP',
            },
            leaderboard,
        };
    }
    async resetWeeklyLeaderboard() {
        const topUsers = await this.prisma.user.findMany({
            take: 3,
            orderBy: [{ totalXp: 'desc' }, { battleTrophies: 'desc' }],
        });
        if (topUsers[0]) {
            await this.prisma.user.update({
                where: { id: topUsers[0].id },
                data: { totalXp: { increment: 500 } },
            });
        }
        if (topUsers[1]) {
            await this.prisma.user.update({
                where: { id: topUsers[1].id },
                data: { totalXp: { increment: 300 } },
            });
        }
        if (topUsers[2]) {
            await this.prisma.user.update({
                where: { id: topUsers[2].id },
                data: { totalXp: { increment: 200 } },
            });
        }
        return {
            message: '🎉 Đã tổng kết và reset Giải đấu Tuần thành công! Đã trao thưởng +500 XP cho Top 1, +300 XP cho Top 2, +200 XP cho Top 3.',
            topWinners: topUsers.map((u) => u.fullName),
        };
    }
    async grantAdReward(userId, rewardType, amount) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        let updateData = {};
        switch (rewardType) {
            case 'XP':
                updateData = { totalXp: { increment: amount } };
                break;
            case 'HEART':
                updateData = { totalXp: { increment: amount * 5 } };
                break;
            case 'STREAK_FREEZE':
                updateData = { totalXp: { increment: 20 } };
                break;
            case 'REPLAY':
                updateData = {};
                break;
            default:
                updateData = { totalXp: { increment: amount } };
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                totalXp: true,
                streakCount: true,
                subscriptionTier: true,
            },
        });
        return {
            success: true,
            rewardType,
            amount,
            message: `🎉 Đã nhận ${amount} ${rewardType} từ quảng cáo!`,
            user: updatedUser,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map