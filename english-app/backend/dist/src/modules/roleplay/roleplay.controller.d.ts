import { RoleplayService } from './roleplay.service';
import { StartSessionDto, SendMessageDto } from './dto/roleplay.dto';
export declare class RoleplayController {
    private roleplayService;
    constructor(roleplayService: RoleplayService);
    getScenarios(): Promise<{
        id: string;
        title: string;
        description: string | null;
        orderIndex: number;
        createdAt: Date;
        category: string;
        icon: string;
        initialMessage: string;
        systemPrompt: string;
    }[]>;
    startSession(req: any, dto: StartSessionDto): Promise<{
        scenario: {
            id: string;
            title: string;
            description: string | null;
            orderIndex: number;
            createdAt: Date;
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
    sendMessage(sessionId: string, dto: SendMessageDto, req: any): Promise<{
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
    evaluateSession(sessionId: string, req: any): Promise<{
        score: number;
        xpEarned: number;
        feedback: {
            score: number;
            fluency: string;
            accuracy: string;
            tip: string;
        };
    }>;
}
