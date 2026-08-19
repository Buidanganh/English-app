import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
export declare class LessonsService {
    private prisma;
    private coursesService;
    constructor(prisma: PrismaService, coursesService: CoursesService);
    getLessonDetail(lessonId: string): Promise<{
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
        title: string;
        description: string | null;
        orderIndex: number;
        createdAt: Date;
        xpReward: number;
        unitId: string;
    }>;
    completeLesson(userId: string, lessonId: string, score: number): Promise<{
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
            score: number;
            isCompleted: boolean;
            completedAt: Date;
        };
    }>;
}
