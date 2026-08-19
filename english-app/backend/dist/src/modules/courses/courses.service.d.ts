import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CoursesService implements OnModuleInit {
    private prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    findAll(userId?: string): Promise<{
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
            title: string;
            description: string | null;
            orderIndex: number;
            createdAt: Date;
            courseId: string;
        }[];
        id: string;
        title: string;
        description: string | null;
        level: string;
        iconUrl: string | null;
        orderIndex: number;
        isPublished: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        units: ({
            lessons: {
                id: string;
                title: string;
                description: string | null;
                orderIndex: number;
                createdAt: Date;
                xpReward: number;
                unitId: string;
            }[];
        } & {
            id: string;
            title: string;
            description: string | null;
            orderIndex: number;
            createdAt: Date;
            courseId: string;
        })[];
    } & {
        id: string;
        title: string;
        description: string | null;
        level: string;
        iconUrl: string | null;
        orderIndex: number;
        isPublished: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    autoSeedAllTopics(): Promise<void>;
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
    submitUnitTest(userId: string, unitId: string, score: number): Promise<{
        message: string;
        passed: boolean;
        score: number;
        xpEarned: number;
        totalXp: number;
        streakCount: number;
        badge: string;
        nextUnitUnlocked: boolean;
    }>;
}
