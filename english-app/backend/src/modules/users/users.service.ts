import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
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

  async createUser(data: { email: string; passwordHash: string; fullName: string }) {
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

  async getAnalytics(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

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

  async toggleFavorite(userId: string, vocabularyId: string) {
    const existing = await this.prisma.userFavoriteVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    if (existing) {
      await this.prisma.userFavoriteVocabulary.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false, message: 'Đã bỏ lưu từ vựng' };
    } else {
      await this.prisma.userFavoriteVocabulary.create({
        data: { userId, vocabularyId },
      });
      return { isFavorite: true, message: 'Đã lưu vào Sổ tay Yêu thích ❤️' };
    }
  }

  async getFavorites(userId: string) {
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

    // Calculate time remaining until Sunday 23:59:59 PM
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...
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
      if (idx === 0) league = 'Hạng Nhất Hoàng Gia 🏆';
      else if (idx === 1) league = 'Giải Kim Cương 💎';
      else if (idx === 2) league = 'Giải Vàng 🥇';
      else if (idx < 5) league = 'Giải Bạc 🥈';

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

    // Reward Top 3
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
}
