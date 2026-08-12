import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Missions - Nhiệm Vụ Hàng Ngày & Tuần')
@Controller('missions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MissionsController {
  constructor(private missionsService: MissionsService) {}

  @Get('today')
  @ApiOperation({ summary: 'Lấy danh sách nhiệm vụ hôm nay & tuần này' })
  async getTodayMissions(@Request() req) {
    return this.missionsService.getTodayMissions(req.user.id);
  }

  @Post('claim/:id')
  @ApiOperation({ summary: 'Nhận thưởng XP từ một nhiệm vụ đã hoàn thành' })
  async claimMission(@Request() req, @Param('id') id: string) {
    return this.missionsService.claimMission(req.user.id, id);
  }

  @Post('claim-all')
  @ApiOperation({ summary: 'Nhận tất cả XP từ các nhiệm vụ đã hoàn thành' })
  async claimAll(@Request() req) {
    return this.missionsService.claimAllMissions(req.user.id);
  }
}
