import { CoursesService } from './courses.service';
export declare class CoursesController {
    private coursesService;
    constructor(coursesService: CoursesService);
    reseed(): Promise<{
        message: string;
    }>;
    findAll(req: any): Promise<{
        units: {
            isUnlocked: boolean;
            lessons: {
                id: string;
                title: string;
                description: string;
                orderIndex: number;
                xpReward: number;
            }[];
            id: string;
            createdAt: Date;
            title: string;
            description: string | null;
            orderIndex: number;
            courseId: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        level: string;
        iconUrl: string | null;
        orderIndex: number;
        isPublished: boolean;
    }[]>;
    getUnitTest(unitId: string): Promise<{
        unitId: string;
        unitTitle: string;
        totalQuestions: number;
        questions: {
            id: string;
            type: string;
            prompt: string;
            options: string[];
            correctAnswer: string;
            explanation: string;
        }[];
    }>;
    submitUnitTest(unitId: string, score: number, req: any): Promise<{
        message: string;
        passed: boolean;
        score: number;
        xpEarned: number;
        totalXp: number;
        streakCount: number;
        badge: string;
        nextUnitUnlocked: boolean;
    }>;
    findOne(id: string): Promise<{
        units: ({
            lessons: {
                id: string;
                createdAt: Date;
                title: string;
                description: string | null;
                orderIndex: number;
                xpReward: number;
                unitId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            title: string;
            description: string | null;
            orderIndex: number;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        level: string;
        iconUrl: string | null;
        orderIndex: number;
        isPublished: boolean;
    }>;
}
