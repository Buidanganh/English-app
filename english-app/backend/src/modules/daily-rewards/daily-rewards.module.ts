import { Module } from '@nestjs/common';
import { DailyRewardsService } from './daily-rewards.service';
import { DailyRewardsController } from './daily-rewards.controller';

@Module({
  providers: [DailyRewardsService],
  controllers: [DailyRewardsController],
  exports: [DailyRewardsService],
})
export class DailyRewardsModule {}
