import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(usersService: UsersService);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<{
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
    }>;
}
export {};
