import { PrismaService } from '../../prisma/prisma.service';
export declare class SubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    getPlans(): Promise<{
        id: string;
        name: string;
        priceMonthly: string;
        priceYearly: string;
        badge: string;
        features: string[];
        isPopular: boolean;
    }[]>;
    generateVietQrPayment(userId: string, tier: 'PLUS' | 'PRO', durationMonths: number): Promise<{
        paymentRequestId: any;
        tier: "PRO" | "PLUS";
        durationMonths: number;
        amount: number;
        amountFormatted: string;
        bankId: string;
        bankName: string;
        bankAccountNo: string;
        accountName: string;
        memo: string;
        qrCodeUrl: string;
    }>;
    confirmPayment(userId: string, paymentRequestId: string): Promise<{
        message: string;
        status: string;
        paymentRequestId?: undefined;
        tier?: undefined;
        amount?: undefined;
        memo?: undefined;
    } | {
        paymentRequestId: any;
        status: string;
        message: string;
        tier: any;
        amount: any;
        memo: any;
    }>;
    checkPaymentStatus(userId: string): Promise<{
        status: string;
        tier: any;
        message: string;
        user: {
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            totalXp: number;
        };
        paymentRequestId?: undefined;
        amount?: undefined;
        memo?: undefined;
        createdAt?: undefined;
    } | {
        status: string;
        message: any;
        tier?: undefined;
        user?: undefined;
        paymentRequestId?: undefined;
        amount?: undefined;
        memo?: undefined;
        createdAt?: undefined;
    } | {
        status: string;
        message: string;
        paymentRequestId: any;
        tier: any;
        amount: any;
        memo: any;
        createdAt: any;
        user?: undefined;
    }>;
    getAdminPayments(status?: string): Promise<any[]>;
    approvePayment(adminId: string, paymentRequestId: string, adminNote?: string): Promise<{
        message: string;
        paymentRequestId?: undefined;
        tier?: undefined;
    } | {
        message: string;
        paymentRequestId: string;
        tier: any;
    }>;
    rejectPayment(adminId: string, paymentRequestId: string, adminNote: string): Promise<{
        message: string;
        paymentRequestId: string;
    }>;
    upgrade(userId: string, tier: 'PLUS' | 'PRO', durationMonths: number): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            streakCount: number;
            totalXp: number;
        };
    }>;
}
