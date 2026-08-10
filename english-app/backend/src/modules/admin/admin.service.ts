import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const freeUsers = await this.prisma.user.count({ where: { subscriptionTier: 'FREE' } });
    const plusUsers = await this.prisma.user.count({ where: { subscriptionTier: 'PLUS' } });
    const proUsers = await this.prisma.user.count({ where: { subscriptionTier: 'PRO' } });

    // Ước tính doanh thu MoMo 0924904527 (Plus 99k, Pro 199k)
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

  async updateUserTier(userId: string, tier: 'FREE' | 'PLUS' | 'PRO') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
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
}
