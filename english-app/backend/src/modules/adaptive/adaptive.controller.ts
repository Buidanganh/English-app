import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdaptiveService } from './adaptive.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Adaptive Learning - Lộ Trình Cá Nhân Hóa')
@Controller('adaptive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Lấy đề xuất bài học cá nhân hóa theo AI Adaptive Learning' })
  async getRecommendations(@Request() req) {
    return this.adaptiveService.getRecommendations(req.user.id);
  }

  @Get('review-words')
  @ApiOperation({ summary: 'Lấy danh sách từ cần ôn lại hôm nay (Spaced Repetition)' })
  async getTodayReviewWords(@Request() req) {
    return this.adaptiveService.getTodayReviewWords(req.user.id);
  }

  @Post('update-mastery')
  @ApiOperation({ summary: 'Cập nhật mức độ thuần thục từ vựng sau quiz' })
  async updateVocabMastery(
    @Request() req,
    @Body() dto: {
      lessonId: string;
      correctVocabIds: string[];
      incorrectVocabIds: string[];
    },
  ) {
    return this.adaptiveService.updateVocabMastery(
      req.user.id,
      dto.lessonId,
      dto.correctVocabIds || [],
      dto.incorrectVocabIds || [],
    );
  }
}
