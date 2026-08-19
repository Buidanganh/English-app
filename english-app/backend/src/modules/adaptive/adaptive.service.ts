import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}

  /**
   * Thuật toán Adaptive Learning:
   * 1. Lấy toàn bộ lessons + user progress
   * 2. Phân loại: Chưa học / Cần Ôn (score < 70) / Đã Thành Thạo (score >= 80)
   * 3. Đề xuất theo thứ tự ưu tiên: Cần Ôn → Chưa Học (theo thứ tự chủ đề)
   * 4. Kèm danh sách từ yếu (UserVocabulary status=LEARNING hoặc nextReviewAt quá hạn)
   */
  async getRecommendations(userId: string) {
    // 1. Lấy tất cả lessons kèm unit info
    const allLessons = await this.prisma.lesson.findMany({
      include: {
        unit: { select: { id: true, title: true, orderIndex: true } },
        lessonVocabularies: { select: { vocabularyId: true } },
      },
      orderBy: [{ unit: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
    });

    // 2. Lấy progress của user
    const userProgresses = await this.prisma.userProgress.findMany({
      where: { userId },
    });
    const progressMap = new Map(userProgresses.map(p => [p.lessonId, p]));

    // 3. Lấy từ vựng user đang học yếu
    const weakVocabs = await this.prisma.userVocabulary
      .findMany({
        where: {
          userId,
          OR: [
            { status: 'LEARNING' },
            { nextReviewAt: { lte: new Date() } },
          ],
        },
        include: { vocabulary: true },
        orderBy: { nextReviewAt: 'asc' },
        take: 20,
      })
      .catch(() => []); // Fallback nếu model chưa có data

    // 4. Phân loại lessons
    const needsReview: any[] = [];   // score < 70 và đã học
    const notStarted: any[] = [];    // chưa học
    const mastered: any[] = [];      // score >= 80

    for (const lesson of allLessons) {
      const progress = progressMap.get(lesson.id);
      const levelTag = lesson.title.includes('Medium') || lesson.title.includes('Trung Bình') ? 'MEDIUM'
        : lesson.title.includes('Hard') || lesson.title.includes('Khó') ? 'HARD' : 'EASY';
      const levelEmoji = levelTag === 'HARD' ? '🔴' : levelTag === 'MEDIUM' ? '🟡' : '🟢';

      const item = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        unitId: lesson.unit.id,
        unitTitle: lesson.unit.title,
        unitOrder: lesson.unit.orderIndex,
        xpReward: lesson.xpReward,
        levelTag,
        levelEmoji,
        score: progress?.score ?? null,
        isCompleted: progress?.isCompleted ?? false,
        completedAt: progress?.completedAt ?? null,
        vocabCount: lesson.lessonVocabularies.length,
      };

      if (!progress || !progress.isCompleted) {
        notStarted.push(item);
      } else if ((progress.score ?? 0) < 70) {
        needsReview.push({ ...item, priority: 'HIGH' });
      } else {
        mastered.push(item);
      }
    }

    // 5. Recommendations: ưu tiên ôn yếu trước, rồi bài mới
    const recommendations = [
      ...needsReview.slice(0, 3),
      ...notStarted.slice(0, 5),
    ].slice(0, 6);

    // 6. Tính tổng thống kê
    const totalLessons = allLessons.length;
    const completedLessons = mastered.length + needsReview.filter(l => l.isCompleted).length;
    const masteredCount = mastered.length;
    const masteryPercent = totalLessons > 0 ? Math.round((masteredCount / totalLessons) * 100) : 0;

    // 7. Progress theo từng Unit (chủ đề)
    const unitMap = new Map<string, {
      unitId: string; unitTitle: string; unitOrder: number;
      easy: any; medium: any; hard: any;
    }>();

    for (const lesson of allLessons) {
      const uid = lesson.unit.id;
      if (!unitMap.has(uid)) {
        unitMap.set(uid, {
          unitId: uid,
          unitTitle: lesson.unit.title,
          unitOrder: lesson.unit.orderIndex,
          easy: null, medium: null, hard: null,
        });
      }
      const entry = unitMap.get(uid)!;
      const progress = progressMap.get(lesson.id);
      const score = progress?.score ?? null;
      const isCompleted = progress?.isCompleted ?? false;

      const levelTag = lesson.title.includes('Medium') || lesson.title.includes('Trung Bình') ? 'MEDIUM'
        : lesson.title.includes('Hard') || lesson.title.includes('Khó') ? 'HARD' : 'EASY';

      const levelData = { lessonId: lesson.id, score, isCompleted };
      if (levelTag === 'EASY') entry.easy = levelData;
      else if (levelTag === 'MEDIUM') entry.medium = levelData;
      else entry.hard = levelData;
    }

    const unitProgress = Array.from(unitMap.values())
      .sort((a, b) => a.unitOrder - b.unitOrder)
      .map(unit => {
        const levels = [unit.easy, unit.medium, unit.hard];
        const completedLevels = levels.filter(l => l?.isCompleted).length;
        const avgScore = levels
          .filter(l => l?.score !== null && l?.score !== undefined)
          .map(l => l.score)
          .reduce((sum, s) => sum + s, 0) / (levels.filter(l => l?.score != null).length || 1);

        return {
          ...unit,
          completedLevels,
          totalLevels: 3,
          progressPercent: Math.round((completedLevels / 3) * 100),
          avgScore: Math.round(avgScore),
          status: completedLevels === 3 ? 'MASTERED' : completedLevels > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        };
      });

    return {
      summary: {
        totalLessons,
        completedLessons,
        masteredCount,
        masteryPercent,
        needsReviewCount: needsReview.length,
        notStartedCount: notStarted.length,
        weakVocabCount: weakVocabs.length,
      },
      recommendations,
      needsReview: needsReview.slice(0, 5),
      unitProgress,
      weakVocabs: weakVocabs.map((uv: any) => ({
        id: uv.vocabulary.id,
        word: uv.vocabulary.word,
        ipa: uv.vocabulary.ipa,
        meaning: uv.vocabulary.meaning,
        status: uv.status,
        reviewCount: uv.reviewCount,
        nextReviewAt: uv.nextReviewAt,
      })),
    };
  }

  /**
   * Cập nhật UserVocabulary sau khi user làm quiz
   * Gọi sau khi complete lesson — nhận danh sách từ đúng/sai
   */
  async updateVocabMastery(
    userId: string,
    lessonId: string,
    correctVocabIds: string[],
    incorrectVocabIds: string[],
  ) {
    const now = new Date();

    // Xử lý từ đúng → tiến lên LEARNING hoặc MASTERED
    for (const vocabId of correctVocabIds) {
      try {
        const existing = await this.prisma.userVocabulary.findUnique({
          where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
        }).catch(() => null);

        const reviewCount = (existing?.reviewCount ?? 0) + 1;
        // Spaced Repetition: 1 ngày → 3 ngày → 7 ngày → 14 ngày → MASTERED
        const daysUntilReview = reviewCount >= 4 ? 99999 : [1, 3, 7, 14][reviewCount - 1] || 1;
        const nextReviewAt = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
        const newStatus = reviewCount >= 4 ? 'MASTERED' : 'LEARNING';

        await this.prisma.userVocabulary.upsert({
          where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
          create: { userId, vocabularyId: vocabId, status: 'LEARNING', reviewCount: 1, nextReviewAt },
          update: { status: newStatus, reviewCount, nextReviewAt },
        });
      } catch (e) { /* bỏ qua lỗi từng từ */ }
    }

    // Xử lý từ sai → quay về LEARNING, review sớm hơn
    for (const vocabId of incorrectVocabIds) {
      try {
        const nextReviewAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 tiếng sau
        await this.prisma.userVocabulary.upsert({
          where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
          create: { userId, vocabularyId: vocabId, status: 'LEARNING', reviewCount: 0, nextReviewAt },
          update: { status: 'LEARNING', nextReviewAt },
        });
      } catch (e) { /* bỏ qua */ }
    }

    return { updated: correctVocabIds.length + incorrectVocabIds.length };
  }

  /**
   * Lấy danh sách từ cần ôn lại hôm nay (Spaced Repetition)
   */
  async getTodayReviewWords(userId: string) {
    try {
      const words = await this.prisma.userVocabulary.findMany({
        where: {
          userId,
          nextReviewAt: { lte: new Date() },
          status: { not: 'MASTERED' },
        },
        include: { vocabulary: true },
        orderBy: { nextReviewAt: 'asc' },
        take: 20,
      });

      return words.map((uv) => ({
        id: uv.vocabulary.id,
        word: uv.vocabulary.word,
        ipa: uv.vocabulary.ipa,
        meaning: uv.vocabulary.meaning,
        exampleSentence: uv.vocabulary.exampleSentence,
        exampleTranslation: uv.vocabulary.exampleTranslation,
        status: uv.status,
        reviewCount: uv.reviewCount,
        daysSinceLastReview: Math.floor((Date.now() - new Date(uv.nextReviewAt).getTime()) / 86400000),
      }));
    } catch {
      return [];
    }
  }
}
