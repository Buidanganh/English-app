import { PrismaService } from '../../prisma/prisma.service';
export declare class DailyRewardsService {
    private prisma;
    constructor(prisma: PrismaService);
    getStatus(userId: string): Promise<{
        canClaim: boolean;
        rewardXp: number;
        streakBonusDays: number;
        lastClaimedDate: string;
        reminderMessage: string;
    }>;
    claim(userId: string): Promise<{
        message: string;
        user: {
            id: string;
            fullName: string;
            streakCount: number;
            totalXp: number;
        };
    }>;
}
