import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DailyRewardsService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

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

  async claim(userId: string) {
    const status = await this.getStatus(userId);
    if (!status.canClaim) {
      throw new BadRequestException('Bạn đã nhận phần thưởng điểm danh hôm nay rồi!');
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
}
