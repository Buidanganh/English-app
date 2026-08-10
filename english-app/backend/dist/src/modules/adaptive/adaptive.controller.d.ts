import { AdaptiveService } from './adaptive.service';
export declare class AdaptiveController {
    private adaptiveService;
    constructor(adaptiveService: AdaptiveService);
    getRecommendations(req: any): Promise<{
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
    getTodayReviewWords(req: any): Promise<any>;
    updateVocabMastery(req: any, dto: {
        lessonId: string;
        correctVocabIds: string[];
        incorrectVocabIds: string[];
    }): Promise<{
        updated: number;
    }>;
}
