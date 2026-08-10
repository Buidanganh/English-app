import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscriptions - Gói Thành Viên')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách các gói thành viên (Free, Plus, Pro)' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  // Tạo mã QR + PaymentRequest (PENDING)
  @Post('create-qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mã VietQR & lưu yêu cầu thanh toán PENDING' })
  async createQr(@Request() req, @Body() dto: { tier: 'PLUS' | 'PRO'; durationMonths: number }) {
    return this.subscriptionsService.generateVietQrPayment(req.user.id, dto.tier, dto.durationMonths);
  }

  // User xác nhận đã chuyển khoản → vẫn giữ PENDING, chờ admin duyệt
  @Post('confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User xác nhận đã chuyển khoản - ghi nhận chờ admin duyệt' })
  async confirmPayment(@Request() req, @Body() dto: { paymentRequestId: string }) {
    return this.subscriptionsService.confirmPayment(req.user.id, dto.paymentRequestId);
  }

  // User poll status để kiểm tra admin đã duyệt chưa
  @Get('payment-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán mới nhất của user' })
  async checkPaymentStatus(@Request() req) {
    return this.subscriptionsService.checkPaymentStatus(req.user.id);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Get('admin/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Danh sách tất cả yêu cầu thanh toán' })
  async getAdminPayments(@Query('status') status: string) {
    return this.subscriptionsService.getAdminPayments(status);
  }

  @Post('admin/approve/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Duyệt thanh toán → kích hoạt gói cho user' })
  async approvePayment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { adminNote?: string },
  ) {
    return this.subscriptionsService.approvePayment(req.user.id, id, dto?.adminNote);
  }

  @Post('admin/reject/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Từ chối thanh toán' })
  async rejectPayment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { adminNote: string },
  ) {
    return this.subscriptionsService.rejectPayment(req.user.id, id, dto?.adminNote);
  }

  // Legacy direct upgrade (admin only)
  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Nâng cấp gói thành viên trực tiếp (không qua xác minh)' })
  async upgrade(@Request() req, @Body() dto: { tier: 'PLUS' | 'PRO'; durationMonths: number }) {
    return this.subscriptionsService.upgrade(req.user.id, dto.tier, dto.durationMonths);
  }
}
