import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        accessToken: string;
        user: {
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
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
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
    getProfile(req: any): Promise<any>;
}
