import { Module } from '@nestjs/common';
import { VoiceBattleService } from './voice-battle.service';
import { VoiceBattleController } from './voice-battle.controller';

@Module({
  providers: [VoiceBattleService],
  controllers: [VoiceBattleController],
  exports: [VoiceBattleService],
})
export class VoiceBattleModule {}
