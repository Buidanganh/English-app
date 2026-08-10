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
exports.DailyRewardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DailyRewardsService = class DailyRewardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatus(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        const todayStr = new Date().toISOString().split('T')[0];
        const lastClaimedStr = user.lastClaimedRewardDate
            ? new Date(user.lastClaimedRewardDate).toISOString().split('T')[0]
            : null;
        const canClaim = lastClaimedStr !== todayStr;
        return {
            canClaim,
            rewardXp: 20,
            streakBonusDays: user.streakCount,
            lastClaimedDate: lastClaimedStr,
            reminderMessage: '🔔 Đừng quên học 1 bài học lúc 20:00 tối nay để giữ chuỗi Streak 🔥 nhé!',
        };
    }
    async claim(userId) {
        const status = await this.getStatus(userId);
        if (!status.canClaim) {
            throw new common_1.BadRequestException('Bạn đã nhận phần thưởng điểm danh hôm nay rồi!');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                totalXp: { increment: 20 },
                lastClaimedRewardDate: new Date(),
            },
            select: {
                id: true,
                fullName: true,
                totalXp: true,
                streakCount: true,
            },
        });
        return {
            message: '🎁 Chúc mừng bạn đã điểm danh nhận thành công +20 XP thưởng hôm nay!',
            user: updatedUser,
        };
    }
};
exports.DailyRewardsService = DailyRewardsService;
exports.DailyRewardsService = DailyRewardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DailyRewardsService);
//# sourceMappingURL=daily-rewards.service.js.map