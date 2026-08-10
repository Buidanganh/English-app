import { PrismaService } from '../../prisma/prisma.service';
export declare class RoleplayService {
    private prisma;
    constructor(prisma: PrismaService);
    getScenarios(): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string | null;
        orderIndex: number;
        category: string;
        icon: string;
        initialMessage: string;
        systemPrompt: string;
    }[]>;
    private autoSeedScenarios;
    startSession(userId: string, scenarioId: string): Promise<{
        scenario: {
            id: string;
            createdAt: Date;
            title: string;
            description: string | null;
            orderIndex: number;
            category: string;
            icon: string;
            initialMessage: string;
            systemPrompt: string;
        };
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            sender: string;
            translation: string | null;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        score: number;
        feedback: string | null;
        isFinished: boolean;
        scenarioId: string;
    }>;
    sendMessage(userId: string, sessionId: string, userContent: string): Promise<{
        userMessage: {
            sender: string;
            content: string;
        };
        aiMessage: {
            id: string;
            createdAt: Date;
            content: string;
            sender: string;
            translation: string | null;
            sessionId: string;
        };
        suggestions: string[];
    }>;
    evaluateSession(userId: string, sessionId: string): Promise<{
        score: number;
        xpEarned: number;
        feedback: {
            score: number;
            fluency: string;
            accuracy: string;
            tip: string;
        };
    }>;
    private getInitialTranslation;
    private generateAiReply;
}
