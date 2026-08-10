import { DailyRewardsService } from './daily-rewards.service';
export declare class DailyRewardsController {
    private dailyRewardsService;
    constructor(dailyRewardsService: DailyRewardsService);
    getStatus(req: any): Promise<{
        canClaim: boolean;
        rewardXp: number;
        streakBonusDays: number;
        lastClaimedDate: string;
        reminderMessage: string;
    }>;
    claim(req: any): Promise<{
        message: string;
        user: {
            id: string;
            fullName: string;
            streakCount: number;
            totalXp: number;
        };
    }>;
}
