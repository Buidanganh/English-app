import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceBattleService } from './voice-battle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitSpeechDto } from './dto/submit-speech.dto';

@ApiTags('Voice Battle - Đấu Trường 1v1')
@Controller('voice-battle')
export class VoiceBattleController {
  constructor(private voiceBattleService: VoiceBattleService) {}

  @Post('match')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo phòng ghép cặp thách đấu phát âm 1v1' })
  async createMatch(@Request() req) {
    return this.voiceBattleService.createMatch(req.user.id);
  }

  @Post(':roomId/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi kết quả phát âm 10s để AI chấm điểm so kè 1v1' })
  async submitSpeech(@Param('roomId') roomId: string, @Body() dto: SubmitSpeechDto, @Request() req) {
    return this.voiceBattleService.submitSpeech(req.user.id, roomId, dto.textSpoken);
  }
}
