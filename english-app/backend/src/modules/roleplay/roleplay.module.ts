import { Module } from '@nestjs/common';
import { RoleplayService } from './roleplay.service';
import { RoleplayController } from './roleplay.controller';

@Module({
  providers: [RoleplayService],
  controllers: [RoleplayController],
  exports: [RoleplayService],
})
export class RoleplayModule {}
