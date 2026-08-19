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
            weakVocabCount: number;
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
        weakVocabs: {
            id: any;
            word: any;
            ipa: any;
            meaning: any;
            status: any;
            reviewCount: any;
            nextReviewAt: any;
        }[];
    }>;
    getTodayReviewWords(req: any): Promise<{
        id: string;
        word: string;
        ipa: string;
        meaning: string;
        exampleSentence: string;
        exampleTranslation: string;
        status: string;
        reviewCount: number;
        daysSinceLastReview: number;
    }[]>;
    updateVocabMastery(req: any, dto: {
        lessonId: string;
        correctVocabIds: string[];
        incorrectVocabIds: string[];
    }): Promise<{
        updated: number;
    }>;
}
