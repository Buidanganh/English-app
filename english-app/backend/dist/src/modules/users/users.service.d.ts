import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        fullName: string | null;
        avatarUrl: string | null;
        role: string;
        subscriptionTier: string;
        subscriptionExpiresAt: Date | null;
        streakCount: number;
        totalXp: number;
        battleWins: number;
        battleTrophies: number;
        unlockedUnitIndex: number;
        lastClaimedRewardDate: Date | null;
        lastActiveDate: Date | null;
    }>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
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
    }>;
    createUser(data: {
        email: string;
        passwordHash: string;
        fullName: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        fullName: string;
        role: string;
        subscriptionTier: string;
        streakCount: number;
        totalXp: number;
        battleWins: number;
        battleTrophies: number;
        unlockedUnitIndex: number;
    }>;
    getAnalytics(userId: string): Promise<{
        user: {
            id: string;
            createdAt: Date;
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
    toggleFavorite(userId: string, vocabularyId: string): Promise<{
        isFavorite: boolean;
        message: string;
    }>;
    getFavorites(userId: string): Promise<{
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
    resetWeeklyLeaderboard(): Promise<{
        message: string;
        topWinners: string[];
    }>;
    grantAdReward(userId: string, rewardType: string, amount: number): Promise<{
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
