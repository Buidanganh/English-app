import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users - Quản lý Học Viên & Thống kê Analytics')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thống kê học tập Analytics và sổ tay từ vựng của học viên' })
  async getAnalytics(@Request() req) {
    return this.usersService.getAnalytics(req.user.id);
  }

  @Post('favorites/:vocabId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bật/tắt thả tim lưu từ vựng yêu thích vào Sổ tay ❤️' })
  async toggleFavorite(@Param('vocabId') vocabId: string, @Request() req) {
    return this.usersService.toggleFavorite(req.user.id, vocabId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách từ vựng đã thả tim lưu trong Sổ tay Yêu thích' })
  async getFavorites(@Request() req) {
    return this.usersService.getFavorites(req.user.id);
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy Bảng Xếp Hạng Giải Đấu Hàng Tuần (Top 10 & Đếm ngược Reset)' })
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  @Post('leaderboard/reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thực hiện Reset Giải Đấu Hàng Tuần & Trao Thưởng Top 3 (+500 XP)' })
  async resetLeaderboard() {
    return this.usersService.resetWeeklyLeaderboard();
  }
}
