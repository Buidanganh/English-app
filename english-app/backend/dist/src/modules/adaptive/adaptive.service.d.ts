import { PrismaService } from '../../prisma/prisma.service';
export declare class AdaptiveService {
    private prisma;
    constructor(prisma: PrismaService);
    getRecommendations(userId: string): Promise<{
        summary: {
            totalLessons: number;
            completedLessons: number;
            masteredCount: number;
            masteryPercent: number;
            needsReviewCount: number;
            notStartedCount: number;
            weakVocabCount: any;
        };
        recommendations: any[];
        needsReview: any[];
        unitProgress: {
            completedLevels: number;
            totalLevels: number;
            progressPercent: number;
            avgScore: number;
            status: string;
            unitId: string;
            unitTitle: string;
            unitOrder: number;
            easy: any;
            medium: any;
            hard: any;
        }[];
        weakVocabs: any;
    }>;
    updateVocabMastery(userId: string, lessonId: string, correctVocabIds: string[], incorrectVocabIds: string[]): Promise<{
        updated: number;
    }>;
    getTodayReviewWords(userId: string): Promise<any>;
}
