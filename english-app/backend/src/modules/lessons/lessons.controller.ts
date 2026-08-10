import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Lessons - Bài học & Quiz')
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin bài học, danh sách từ vựng & câu hỏi quiz' })
  async getLessonDetail(@Param('id') id: string) {
    return this.lessonsService.getLessonDetail(id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nộp bài hoàn thành bài học, tính điểm & nhận XP' })
  async completeLesson(
    @Param('id') id: string,
    @Body('score') score: number,
    @Request() req,
  ) {
    return this.lessonsService.completeLesson(req.user.id, id, score ?? 100);
  }
}
