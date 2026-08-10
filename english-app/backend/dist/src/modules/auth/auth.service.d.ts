import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            subscriptionTier: string;
            streakCount: number;
            totalXp: number;
            battleWins: number;
            battleTrophies: number;
            unlockedUnitIndex: number;
            createdAt: Date;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
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
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    private generateToken;
}
