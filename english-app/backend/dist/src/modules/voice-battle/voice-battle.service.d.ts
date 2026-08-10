import { PrismaService } from '../../prisma/prisma.service';
export declare class VoiceBattleService {
    private prisma;
    constructor(prisma: PrismaService);
    private challengeSentences;
    getLeagueTier(trophies: number): {
        name: string;
        icon: string;
        color: string;
    };
    createMatch(userId: string, mode?: string): Promise<{
        roomId: string;
        mode: string;
        userTier: {
            name: string;
            icon: string;
            color: string;
        };
        opponent: {
            name: string;
            avatar: string;
            tier: string;
            maxHp: number;
        };
        challenge: {
            text: string;
            ipa: string;
            translation: string;
        };
    }>;
    submitSpeech(userId: string, roomId: string, textSpoken: string, mode?: string): Promise<{
        roomId: string;
        isWinner: boolean;
        yourScore: number;
        opponentScore: number;
        isCombo: boolean;
        damageDealt: number;
        opponentDamage: number;
        xpEarned: number;
        trophiesEarned: number;
        userTier: {
            name: string;
            icon: string;
            color: string;
        };
        chestRewards: any;
        feedback: string;
    }>;
}
