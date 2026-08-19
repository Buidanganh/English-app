import { LessonsService } from './lessons.service';
export declare class LessonsController {
    private lessonsService;
    constructor(lessonsService: LessonsService);
    getLessonDetail(id: string): Promise<{
        questions: {
            options: any[];
            id: string;
            orderIndex: number;
            lessonId: string;
            type: string;
            prompt: string;
            mediaUrl: string | null;
            correctAnswer: string;
            explanation: string | null;
        }[];
        vocabularies: {
            id: string;
            createdAt: Date;
            word: string;
            ipa: string | null;
            meaning: string;
            audioUrl: string | null;
            imageUrl: string | null;
            exampleSentence: string | null;
            exampleTranslation: string | null;
        }[];
        lessonVocabularies: ({
            vocabulary: {
                id: string;
                createdAt: Date;
                word: string;
                ipa: string | null;
                meaning: string;
                audioUrl: string | null;
                imageUrl: string | null;
                exampleSentence: string | null;
                exampleTranslation: string | null;
            };
        } & {
            lessonId: string;
            vocabularyId: string;
        })[];
        id: string;
        unitId: string;
        title: string;
        description: string | null;
        xpReward: number;
        orderIndex: number;
        createdAt: Date;
    }>;
    completeLesson(id: string, score: number, req: any): Promise<{
        message: string;
        xpEarned: number;
        totalXp: number;
        streakCount: number;
        passed: boolean;
        score: number;
        nextUnitUnlocked: boolean;
        progress: {
            id: string;
            lessonId: string;
            userId: string;
            isCompleted: boolean;
            score: number;
            completedAt: Date;
        };
    }>;
}
