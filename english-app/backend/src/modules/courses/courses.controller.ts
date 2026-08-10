import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Courses - Khóa học')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('reseed')
  @ApiOperation({ summary: 'Ép buộc Nạp lại 10 Chủ đề x 3 Cấp Mức (Easy, Medium, Hard = 300 từ vựng) & Đề Test 20 Câu' })
  async reseed() {
    await this.coursesService.autoSeedAllTopics();
    return { message: '🎉 Đã nạp thành công 10 Chủ đề x 3 Cấp Mức (300 từ vựng) & Bài Test 20 Câu!' };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khóa học (public - không cần đăng nhập)' })
  @ApiResponse({ status: 200, description: 'Danh sách các khóa học' })
  async findAll(@Request() req) {
    // userId optional: nếu user đăng nhập thì truyền vào, nếu không thì truyền undefined
    return this.coursesService.findAll(req.user?.id);
  }

  @Get('units/:unitId/test')
  @ApiOperation({ summary: 'Tự động tạo bài Test 20 câu hỏi xáo trộn ngẫu nhiên cho Chủ đề' })
  async getUnitTest(@Param('unitId') unitId: string) {
    return this.coursesService.getUnitTest(unitId);
  }

  @Post('units/:unitId/submit-test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nộp bài thi chủ đề, nếu đạt 80% (>= 16/20 câu đúng) thưởng +100 XP + Huy Hiệu Quán Quân' })
  async submitUnitTest(
    @Param('unitId') unitId: string,
    @Body('score') score: number,
    @Request() req,
  ) {
    return this.coursesService.submitUnitTest(req.user.id, unitId, score);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khóa học theo ID' })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }
}
