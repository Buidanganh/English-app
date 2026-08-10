import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleplayService } from './roleplay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartSessionDto, SendMessageDto } from './dto/roleplay.dto';

@ApiTags('AI Roleplay - Nhập vai Giao tiếp')
@Controller('roleplay')
export class RoleplayController {
  constructor(private roleplayService: RoleplayService) {}

  @Get('scenarios')
  @ApiOperation({ summary: 'Lấy danh sách các kịch bản tình huống nhập vai giao tiếp' })
  async getScenarios() {
    return this.roleplayService.getScenarios();
  }

  @Post('sessions/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bắt đầu một phiên hội thoại nhập vai mới' })
  async startSession(@Request() req, @Body() dto: StartSessionDto) {
    return this.roleplayService.startSession(req.user.id, dto.scenarioId);
  }

  @Post('sessions/:id/chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi tin nhắn phản hồi của người dùng và nhận câu trả lời từ AI' })
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
    @Request() req,
  ) {
    return this.roleplayService.sendMessage(req.user.id, sessionId, dto.message);
  }

  @Post('sessions/:id/evaluate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kết thúc cuộc hội thoại, nhận xét và chấm điểm phản xạ AI' })
  async evaluateSession(@Param('id') sessionId: string, @Request() req) {
    return this.roleplayService.evaluateSession(req.user.id, sessionId);
  }
}
