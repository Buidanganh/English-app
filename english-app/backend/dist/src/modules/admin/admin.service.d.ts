import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        stats: {
            totalUsers: number;
            freeUsers: number;
            plusUsers: number;
            proUsers: number;
            estimatedRevenue: number;
            estimatedRevenueFormatted: string;
            momoAccount: string;
        };
        recentUsers: {
            id: string;
            createdAt: Date;
            email: string;
            fullName: string;
            role: string;
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            streakCount: number;
            totalXp: number;
        }[];
    }>;
    updateUserTier(userId: string, tier: 'FREE' | 'PLUS' | 'PRO'): Promise<{
        message: string;
        user: {
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
        };
    }>;
}
