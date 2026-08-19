import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAnalytics(req: any): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            streakCount: number;
            totalXp: number;
            battleWins: number;
            battleTrophies: number;
            unlockedUnitIndex: number;
            lastActiveDate: Date;
            createdAt: Date;
        };
        stats: {
            totalXp: number;
            streakCount: number;
            battleWins: number;
            battleTrophies: number;
            totalVocabsMastered: number;
            favoritesCount: number;
            completedLessons: number;
        };
    }>;
    toggleFavorite(vocabId: string, req: any): Promise<{
        isFavorite: boolean;
        message: string;
    }>;
    getFavorites(req: any): Promise<{
        id: string;
        createdAt: Date;
        word: string;
        ipa: string | null;
        meaning: string;
        audioUrl: string | null;
        imageUrl: string | null;
        exampleSentence: string | null;
        exampleTranslation: string | null;
    }[]>;
    getLeaderboard(): Promise<{
        seasonInfo: {
            title: string;
            resetNotice: string;
            rewardsNotice: string;
        };
        leaderboard: {
            id: string;
            fullName: string;
            subscriptionTier: string;
            streakCount: number;
            totalXp: number;
            battleWins: number;
            battleTrophies: number;
            rank: number;
            league: string;
        }[];
    }>;
    resetLeaderboard(): Promise<{
        message: string;
        topWinners: string[];
    }>;
    grantAdReward(req: any, dto: {
        rewardType: string;
        amount: number;
    }): Promise<{
        success: boolean;
        rewardType: string;
        amount: number;
        message: string;
        user: {
            id: string;
            subscriptionTier: string;
            streakCount: number;
            totalXp: number;
        };
    }>;
}
