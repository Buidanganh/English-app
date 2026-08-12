import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { RoleplayModule } from './modules/roleplay/roleplay.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { VoiceBattleModule } from './modules/voice-battle/voice-battle.module';
import { AdminModule } from './modules/admin/admin.module';
import { DailyRewardsModule } from './modules/daily-rewards/daily-rewards.module';
import { AdaptiveModule } from './modules/adaptive/adaptive.module';
import { MissionsModule } from './modules/missions/missions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    RoleplayModule,
    SubscriptionsModule,
    VoiceBattleModule,
    AdminModule,
    DailyRewardsModule,
    AdaptiveModule,
    MissionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
