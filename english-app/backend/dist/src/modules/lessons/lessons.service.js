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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const courses_service_1 = require("../courses/courses.service");
let LessonsService = class LessonsService {
    constructor(prisma, coursesService) {
        this.prisma = prisma;
        this.coursesService = coursesService;
    }
    async getLessonDetail(lessonId) {
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
        if (!lesson || !lesson.lessonVocabularies || lesson.lessonVocabularies.length === 0) {
            console.log(`⚠️ Lesson ${lessonId} missing vocabularies. Auto-re-seeding 300 real vocabularies...`);
            await this.coursesService.autoSeedAllTopics();
            lesson = await this.prisma.lesson.findUnique({
                where: { id: lessonId },
                include: {
                    questions: { orderBy: { orderIndex: 'asc' } },
                    lessonVocabularies: { include: { vocabulary: true } },
                },
            });
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
            throw new common_1.NotFoundException('Bài học không tồn tại');
        }
        const processedQuestions = lesson.questions.map((q) => {
            let options = q.options;
            try {
                options = JSON.parse(q.options);
            }
            catch {
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
    async completeLesson(userId, lessonId, score) {
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
            throw new common_1.NotFoundException('Bài học không tồn tại');
        }
        const normalizedScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
        const isPassed = normalizedScore >= 80;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const currentUnlockedIndex = user?.unlockedUnitIndex || 1;
        let xpToAdd = isPassed ? 100 : lesson.xpReward;
        let nextUnlockedIndex = currentUnlockedIndex;
        if (isPassed && lesson.unit) {
            nextUnlockedIndex = Math.max(currentUnlockedIndex, lesson.unit.orderIndex + 1);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                totalXp: { increment: xpToAdd },
                unlockedUnitIndex: nextUnlockedIndex,
                streakCount: { increment: 1 },
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
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        courses_service_1.CoursesService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map