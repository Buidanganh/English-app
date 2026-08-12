import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getPlans(): Promise<{
        id: string;
        name: string;
        priceMonthly: string;
        priceYearly: string;
        badge: string;
        features: string[];
        isPopular: boolean;
    }[]>;
    createQr(req: any, dto: {
        tier: 'PLUS' | 'PRO';
        durationMonths: number;
    }): Promise<{
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
    confirmPayment(req: any, dto: {
        paymentRequestId: string;
    }): Promise<{
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
    checkPaymentStatus(req: any): Promise<{
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
    getAdminPayments(status: string): Promise<any[]>;
    approvePayment(req: any, id: string, dto: {
        adminNote?: string;
    }): Promise<{
        message: string;
        paymentRequestId?: undefined;
        tier?: undefined;
    } | {
        message: string;
        paymentRequestId: string;
        tier: any;
    }>;
    rejectPayment(req: any, id: string, dto: {
        adminNote: string;
    }): Promise<{
        message: string;
        paymentRequestId: string;
    }>;
    upgrade(req: any, dto: {
        tier: 'PLUS' | 'PRO';
        durationMonths: number;
    }): Promise<{
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
    getXpRedeemOptions(req: any): Promise<{
        currentXp: number;
        currentTier: string;
        subscriptionExpiresAt: Date;
        options: ({
            canRedeem: boolean;
            xpShortfall: number;
            tier: "PLUS";
            durationMonths: number;
            xpRequired: number;
            label: string;
            description: string;
            color: string;
            badge: string;
        } | {
            canRedeem: boolean;
            xpShortfall: number;
            tier: "PRO";
            durationMonths: number;
            xpRequired: number;
            label: string;
            description: string;
            color: string;
            badge: string;
        })[];
    }>;
    redeemXp(req: any, dto: {
        tier: 'PLUS' | 'PRO';
    }): Promise<{
        success: boolean;
        message: string;
        tier: "PRO" | "PLUS";
        xpUsed: number;
        remainingXp: number;
        expiresAt: Date;
        user: {
            id: string;
            email: string;
            fullName: string;
            subscriptionTier: string;
            subscriptionExpiresAt: Date;
            totalXp: number;
        };
    }>;
}
