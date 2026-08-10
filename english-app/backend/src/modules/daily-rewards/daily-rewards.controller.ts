import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyRewardsService } from './daily-rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Daily Rewards - Điểm Danh & Nhắc Nhở Hàng Ngày')
@Controller('daily-rewards')
export class DailyRewardsController {
  constructor(private dailyRewardsService: DailyRewardsService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra trạng thái điểm danh nhận quà hôm nay' })
  async getStatus(@Request() req) {
    return this.dailyRewardsService.getStatus(req.user.id);
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bấm điểm danh nhận +20 XP phần thưởng hàng ngày' })
  async claim(@Request() req) {
    return this.dailyRewardsService.claim(req.user.id);
  }
}
