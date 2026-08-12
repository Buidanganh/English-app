import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/* =====================================================
   MISSION DEFINITIONS — Template cho Daily & Weekly
===================================================== */
const DAILY_MISSIONS = [
  {
    key: 'daily_complete_1_lesson',
    title: 'Học Viên Chăm Chỉ',
    description: 'Hoàn thành 1 bài học hôm nay',
    icon: '📚',
    xpReward: 30,
    target: 1,
  },
  {
    key: 'daily_complete_3_lessons',
    title: 'Học Liên Tục',
    description: 'Hoàn thành 3 bài học trong ngày',
    icon: '🔥',
    xpReward: 80,
    target: 3,
  },
  {
    key: 'daily_score_80',
    title: 'Học Giỏi Xuất Sắc',
    description: 'Đạt điểm ≥ 80% trong 1 bài quiz',
    icon: '⭐',
    xpReward: 50,
    target: 1,
  },
  {
    key: 'daily_login',
    title: 'Điểm Danh Hàng Ngày',
    description: 'Đăng nhập vào app hôm nay',
    icon: '🌅',
    xpReward: 20,
    target: 1,
  },
  {
    key: 'daily_vocab_10',
    title: 'Chinh Phục Từ Vựng',
    description: 'Học qua 10 từ vựng mới (hoàn thành bài học)',
    icon: '📖',
    xpReward: 40,
    target: 1,
  },
];

const WEEKLY_MISSIONS = [
  {
    key: 'weekly_complete_10_lessons',
    title: 'Học Viên Tuần Này',
    description: 'Hoàn thành 10 bài học trong tuần',
    icon: '🏆',
    xpReward: 300,
    target: 10,
  },
  {
    key: 'weekly_xp_500',
    title: 'Tích Lũy XP Khổng Lồ',
    description: 'Kiếm 500 XP trong tuần này',
    icon: '⚡',
    xpReward: 200,
    target: 500,
  },
  {
    key: 'weekly_streak_5',
    title: 'Duy Trì Streak 5 Ngày',
    description: 'Học liên tục 5 ngày trong tuần',
    icon: '🔥',
    xpReward: 250,
    target: 5,
  },
  {
    key: 'weekly_perfect_quiz',
    title: 'Bậc Thầy Quiz',
    description: 'Đạt điểm 100% trong 3 bài quiz',
    icon: '🎯',
    xpReward: 350,
    target: 3,
  },
];

@Injectable()
export class MissionsService {
  constructor(private prisma: PrismaService) {}

  /* --------------------------------------------------
     Tính thời điểm hết hạn
  -------------------------------------------------- */
  private getDailyExpiry(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private getWeeklyExpiry(): Date {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /* --------------------------------------------------
     Lấy / tạo missions cho user hôm nay
  -------------------------------------------------- */
  async getTodayMissions(userId: string) {
    const dailyExpiry = this.getDailyExpiry();
    const weeklyExpiry = this.getWeeklyExpiry();
    const now = new Date();

    // ---- DAILY: chọn ngẫu nhiên 3 missions ----
    // Seed bằng ngày trong năm → missions giống nhau cả ngày cho mỗi user
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const dailyIndices = [
      dayOfYear % DAILY_MISSIONS.length,
      (dayOfYear + 1) % DAILY_MISSIONS.length,
      (dayOfYear + 2) % DAILY_MISSIONS.length,
    ];
    const selectedDaily = dailyIndices.map(i => DAILY_MISSIONS[i]);

    // Tạo daily missions nếu chưa có hôm nay
    const dailyMissions = await Promise.all(
      selectedDaily.map(async (m) => {
        try {
          return await (this.prisma as any).userMission.upsert({
            where: {
              userId_missionKey_expiresAt: {
                userId,
                missionKey: m.key,
                expiresAt: dailyExpiry,
              },
            },
            create: {
              userId,
              missionKey: m.key,
              missionType: 'DAILY',
              title: m.title,
              description: m.description,
              icon: m.icon,
              xpReward: m.xpReward,
              targetCount: m.target,
              currentCount: 0,
              isCompleted: false,
              isClaimed: false,
              expiresAt: dailyExpiry,
            },
            update: {}, // Không update nếu đã tồn tại
          });
        } catch {
          return (this.prisma as any).userMission.findFirst({
            where: { userId, missionKey: m.key, expiresAt: dailyExpiry },
          });
        }
      }),
    );

    // ---- WEEKLY ----
    const weeklyMissions = await Promise.all(
      WEEKLY_MISSIONS.map(async (m) => {
        try {
          return await (this.prisma as any).userMission.upsert({
            where: {
              userId_missionKey_expiresAt: {
                userId,
                missionKey: m.key,
                expiresAt: weeklyExpiry,
              },
            },
            create: {
              userId,
              missionKey: m.key,
              missionType: 'WEEKLY',
              title: m.title,
              description: m.description,
              icon: m.icon,
              xpReward: m.xpReward,
              targetCount: m.target,
              currentCount: 0,
              isCompleted: false,
              isClaimed: false,
              expiresAt: weeklyExpiry,
            },
            update: {},
          });
        } catch {
          return (this.prisma as any).userMission.findFirst({
            where: { userId, missionKey: m.key, expiresAt: weeklyExpiry },
          });
        }
      }),
    );

    // Tính tổng XP claimable
    const allMissions = [...dailyMissions, ...weeklyMissions].filter(Boolean);
    const claimableXp = allMissions
      .filter((m: any) => m?.isCompleted && !m?.isClaimed)
      .reduce((sum: number, m: any) => sum + m.xpReward, 0);

    const completedToday = allMissions.filter((m: any) => m?.isCompleted && m?.missionType === 'DAILY').length;
    const completedWeekly = allMissions.filter((m: any) => m?.isCompleted && m?.missionType === 'WEEKLY').length;

    return {
      daily: dailyMissions.filter(Boolean),
      weekly: weeklyMissions.filter(Boolean),
      claimableXp,
      completedToday,
      completedWeekly,
      dailyExpiresAt: dailyExpiry,
      weeklyExpiresAt: weeklyExpiry,
    };
  }

  /* --------------------------------------------------
     Claim XP thưởng cho mission đã hoàn thành
  -------------------------------------------------- */
  async claimMission(userId: string, missionId: string) {
    const mission = await (this.prisma as any).userMission.findFirst({
      where: { id: missionId, userId },
    });

    if (!mission) return { success: false, message: 'Nhiệm vụ không tồn tại' };
    if (!mission.isCompleted) return { success: false, message: 'Nhiệm vụ chưa hoàn thành!' };
    if (mission.isClaimed) return { success: false, message: 'Bạn đã nhận thưởng rồi!' };

    // Cập nhật mission → claimed
    await (this.prisma as any).userMission.update({
      where: { id: missionId },
      data: { isClaimed: true },
    });

    // Thưởng XP cho user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: mission.xpReward } },
      select: { totalXp: true },
    });

    return {
      success: true,
      message: `🎉 Nhận thành công +${mission.xpReward} XP từ nhiệm vụ "${mission.title}"!`,
      xpEarned: mission.xpReward,
      totalXp: updatedUser.totalXp,
    };
  }

  /* --------------------------------------------------
     Claim ALL — nhận tất cả XP từ các mission hoàn thành
  -------------------------------------------------- */
  async claimAllMissions(userId: string) {
    const completedUnclaimed = await (this.prisma as any).userMission.findMany({
      where: { userId, isCompleted: true, isClaimed: false },
    });

    if (completedUnclaimed.length === 0) {
      return { success: false, message: 'Không có nhiệm vụ nào cần nhận thưởng!', xpEarned: 0 };
    }

    const totalXp = completedUnclaimed.reduce((sum: number, m: any) => sum + m.xpReward, 0);

    await (this.prisma as any).userMission.updateMany({
      where: { userId, isCompleted: true, isClaimed: false },
      data: { isClaimed: true },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: totalXp } },
      select: { totalXp: true },
    });

    return {
      success: true,
      message: `🎉 Nhận thành công +${totalXp} XP từ ${completedUnclaimed.length} nhiệm vụ!`,
      xpEarned: totalXp,
      missionCount: completedUnclaimed.length,
      totalXp: updatedUser.totalXp,
    };
  }

  /* --------------------------------------------------
     Cập nhật tiến độ mission (gọi sau các event)
     eventType: 'LESSON_COMPLETE' | 'PERFECT_QUIZ' | 'LOGIN' | 'XP_GAINED'
  -------------------------------------------------- */
  async updateMissionProgress(
    userId: string,
    eventType: 'LESSON_COMPLETE' | 'PERFECT_QUIZ' | 'LOGIN' | 'XP_GAINED',
    value: number = 1,
  ) {
    const now = new Date();
    const dailyExpiry = this.getDailyExpiry();
    const weeklyExpiry = this.getWeeklyExpiry();

    // Map event → mission keys bị ảnh hưởng
    const eventMissionKeys: Record<string, string[]> = {
      LESSON_COMPLETE: [
        'daily_complete_1_lesson',
        'daily_complete_3_lessons',
        'daily_vocab_10',
        'weekly_complete_10_lessons',
      ],
      PERFECT_QUIZ: [
        'daily_score_80',
        'weekly_perfect_quiz',
      ],
      LOGIN: ['daily_login'],
      XP_GAINED: ['weekly_xp_500'],
    };

    const affectedKeys = eventMissionKeys[eventType] || [];

    for (const key of affectedKeys) {
      try {
        // Tìm missions active (chưa expired, chưa completed)
        const missions = await (this.prisma as any).userMission.findMany({
          where: {
            userId,
            missionKey: key,
            isCompleted: false,
            expiresAt: { gte: now },
          },
        });

        for (const mission of missions) {
          const newCount = Math.min(mission.currentCount + value, mission.targetCount);
          const isCompleted = newCount >= mission.targetCount;

          await (this.prisma as any).userMission.update({
            where: { id: mission.id },
            data: {
              currentCount: newCount,
              isCompleted,
              completedAt: isCompleted ? new Date() : null,
            },
          });
        }
      } catch (e) {
        // Bỏ qua lỗi từng key
      }
    }
  }
}
