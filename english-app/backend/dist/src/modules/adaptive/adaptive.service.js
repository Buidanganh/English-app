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
exports.AdaptiveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdaptiveService = class AdaptiveService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRecommendations(userId) {
        const allLessons = await this.prisma.lesson.findMany({
            include: {
                unit: { select: { id: true, title: true, orderIndex: true } },
                lessonVocabularies: { select: { vocabularyId: true } },
            },
            orderBy: [{ unit: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
        });
        const userProgresses = await this.prisma.userProgress.findMany({
            where: { userId },
        });
        const progressMap = new Map(userProgresses.map(p => [p.lessonId, p]));
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
            .catch(() => []);
        const needsReview = [];
        const notStarted = [];
        const mastered = [];
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
            }
            else if ((progress.score ?? 0) < 70) {
                needsReview.push({ ...item, priority: 'HIGH' });
            }
            else {
                mastered.push(item);
            }
        }
        const recommendations = [
            ...needsReview.slice(0, 3),
            ...notStarted.slice(0, 5),
        ].slice(0, 6);
        const totalLessons = allLessons.length;
        const completedLessons = mastered.length + needsReview.filter(l => l.isCompleted).length;
        const masteredCount = mastered.length;
        const masteryPercent = totalLessons > 0 ? Math.round((masteredCount / totalLessons) * 100) : 0;
        const unitMap = new Map();
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
            const entry = unitMap.get(uid);
            const progress = progressMap.get(lesson.id);
            const score = progress?.score ?? null;
            const isCompleted = progress?.isCompleted ?? false;
            const levelTag = lesson.title.includes('Medium') || lesson.title.includes('Trung Bình') ? 'MEDIUM'
                : lesson.title.includes('Hard') || lesson.title.includes('Khó') ? 'HARD' : 'EASY';
            const levelData = { lessonId: lesson.id, score, isCompleted };
            if (levelTag === 'EASY')
                entry.easy = levelData;
            else if (levelTag === 'MEDIUM')
                entry.medium = levelData;
            else
                entry.hard = levelData;
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
            weakVocabs: weakVocabs.map((uv) => ({
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
    async updateVocabMastery(userId, lessonId, correctVocabIds, incorrectVocabIds) {
        const now = new Date();
        for (const vocabId of correctVocabIds) {
            try {
                const existing = await this.prisma.userVocabulary.findUnique({
                    where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
                }).catch(() => null);
                const reviewCount = (existing?.reviewCount ?? 0) + 1;
                const daysUntilReview = reviewCount >= 4 ? 99999 : [1, 3, 7, 14][reviewCount - 1] || 1;
                const nextReviewAt = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
                const newStatus = reviewCount >= 4 ? 'MASTERED' : 'LEARNING';
                await this.prisma.userVocabulary.upsert({
                    where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
                    create: { userId, vocabularyId: vocabId, status: 'LEARNING', reviewCount: 1, nextReviewAt },
                    update: { status: newStatus, reviewCount, nextReviewAt },
                });
            }
            catch (e) { }
        }
        for (const vocabId of incorrectVocabIds) {
            try {
                const nextReviewAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                await this.prisma.userVocabulary.upsert({
                    where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
                    create: { userId, vocabularyId: vocabId, status: 'LEARNING', reviewCount: 0, nextReviewAt },
                    update: { status: 'LEARNING', nextReviewAt },
                });
            }
            catch (e) { }
        }
        return { updated: correctVocabIds.length + incorrectVocabIds.length };
    }
    async getTodayReviewWords(userId) {
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
        }
        catch {
            return [];
        }
    }
};
exports.AdaptiveService = AdaptiveService;
exports.AdaptiveService = AdaptiveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdaptiveService);
//# sourceMappingURL=adaptive.service.js.map