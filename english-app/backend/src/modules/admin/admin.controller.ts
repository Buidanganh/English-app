import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Quản Lý Doanh Thu & Học Viên')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy dữ liệu bảng điều khiển Admin Dashboard & Doanh Thu MoMo' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Post('users/:userId/tier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duyệt thủ công nâng/hạ cấp gói VIP cho học viên' })
  async updateUserTier(@Param('userId') userId: string, @Body('tier') tier: 'FREE' | 'PLUS' | 'PRO') {
    return this.adminService.updateUserTier(userId, tier);
  }
}
