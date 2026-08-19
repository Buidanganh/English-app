import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private coursesService: CoursesService,
  ) {}

  async getLessonDetail(lessonId: string) {
    let lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        lessonVocabularies: {
          include: {
            vocabulary: true,
          },
        },
      },
    });

    // Nếu bài học chưa được nạp từ vựng hoặc bài học không tồn tại trong CSDL cũ
    if (!lesson || !lesson.lessonVocabularies || lesson.lessonVocabularies.length === 0) {
      console.log(`⚠️ Lesson ${lessonId} missing vocabularies. Auto-re-seeding 300 real vocabularies...`);
      await this.coursesService.autoSeedAllTopics();

      // Thử tìm lại theo ID bài học mới
      lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
          lessonVocabularies: { include: { vocabulary: true } },
        },
      });

      // Nếu ID bài học cũ bị đổi khi reseed, lấy bài học tương ứng theo orderIndex hoặc bài đầu tiên
      if (!lesson || !lesson.lessonVocabularies || lesson.lessonVocabularies.length === 0) {
        lesson = await this.prisma.lesson.findFirst({
          where: { lessonVocabularies: { some: {} } },
          include: {
            questions: { orderBy: { orderIndex: 'asc' } },
            lessonVocabularies: { include: { vocabulary: true } },
          },
        });
      }
    }

    if (!lesson) {
      throw new NotFoundException('Bài học không tồn tại');
    }

    // Process questions options JSON field
    const processedQuestions = lesson.questions.map((q) => {
      let options: unknown = q.options;

      try {
        options = JSON.parse(q.options);
      } catch {
        options = [];
      }

      return {
        ...q,
        options: Array.isArray(options) ? options : [],
      };
    });

    return {
      ...lesson,
      questions: processedQuestions,
      vocabularies: lesson.lessonVocabularies.map((lv) => lv.vocabulary),
    };
  }

  async completeLesson(userId: string, lessonId: string, score: number) {
    let lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: true },
    });

    if (!lesson) {
      lesson = await this.prisma.lesson.findFirst({
        include: { unit: true },
      });
    }

    if (!lesson) {
      throw new NotFoundException('Bài học không tồn tại');
    }

    const normalizedScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
    const isPassed = normalizedScore >= 80;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUnlockedIndex = user?.unlockedUnitIndex || 1;

    let xpToAdd = isPassed ? Math.max(lesson.xpReward, 100) : lesson.xpReward;
    let nextUnlockedIndex = currentUnlockedIndex;

    if (isPassed && lesson.unit) {
      nextUnlockedIndex = Math.max(currentUnlockedIndex, lesson.unit.orderIndex + 1);
    }

    // Fix streak: chỉ tăng nếu hôm nay chưa học (so sánh ngày lastActiveDate)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user?.lastActiveDate ? new Date(user.lastActiveDate) : null;
    lastActive?.setHours(0, 0, 0, 0);
    const isFirstActivityToday = !lastActive || lastActive.getTime() < today.getTime();

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xpToAdd },
        unlockedUnitIndex: nextUnlockedIndex,
        lastActiveDate: new Date(),
        // Chỉ tăng streak nếu là lần hoạt động đầu tiên trong ngày
        ...(isFirstActivityToday ? { streakCount: { increment: 1 } } : {}),
      },
    });

    const progress = await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      update: {
        isCompleted: true,
        score: normalizedScore,
        completedAt: new Date(),
      },
      create: { userId, lessonId: lesson.id, isCompleted: true, score: normalizedScore },
    });

    return {
      message: isPassed
        ? `🎉 Tuyệt vời! Bạn đạt ${normalizedScore}% (>= 80%). Nhận +${xpToAdd} XP và mở khóa Chủ đề tiếp theo!`
        : `Chúc mừng bạn đã hoàn thành bài học!`,
      xpEarned: xpToAdd,
      totalXp: updatedUser.totalXp,
      streakCount: updatedUser.streakCount,
      passed: isPassed,
      score: normalizedScore,
      nextUnitUnlocked: isPassed,
      progress,
    };
  }
}
