import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
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
            email: string;
            fullName: string;
            role: string;
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            streakCount: number;
            totalXp: number;
            createdAt: Date;
        }[];
    }>;
    updateUserTier(userId: string, tier: 'FREE' | 'PLUS' | 'PRO'): Promise<{
        message: string;
        user: {
            id: string;
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
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
