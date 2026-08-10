"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const courses_service_1 = require("./courses.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CoursesController = class CoursesController {
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    async reseed() {
        await this.coursesService.autoSeedAllTopics();
        return { message: '🎉 Đã nạp thành công 10 Chủ đề x 3 Cấp Mức (300 từ vựng) & Bài Test 20 Câu!' };
    }
    async findAll(req) {
        return this.coursesService.findAll(req.user?.id);
    }
    async getUnitTest(unitId) {
        return this.coursesService.getUnitTest(unitId);
    }
    async submitUnitTest(unitId, score, req) {
        return this.coursesService.submitUnitTest(req.user.id, unitId, score);
    }
    async findOne(id) {
        return this.coursesService.findOne(id);
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Get)('reseed'),
    (0, swagger_1.ApiOperation)({ summary: 'Ép buộc Nạp lại 10 Chủ đề x 3 Cấp Mức (Easy, Medium, Hard = 300 từ vựng) & Đề Test 20 Câu' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "reseed", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách khóa học (public - không cần đăng nhập)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Danh sách các khóa học' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('units/:unitId/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Tự động tạo bài Test 20 câu hỏi xáo trộn ngẫu nhiên cho Chủ đề' }),
    __param(0, (0, common_1.Param)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getUnitTest", null);
__decorate([
    (0, common_1.Post)('units/:unitId/submit-test'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Nộp bài thi chủ đề, nếu đạt 80% (>= 16/20 câu đúng) thưởng +100 XP + Huy Hiệu Quán Quân' }),
    __param(0, (0, common_1.Param)('unitId')),
    __param(1, (0, common_1.Body)('score')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "submitUnitTest", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết khóa học theo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findOne", null);
exports.CoursesController = CoursesController = __decorate([
    (0, swagger_1.ApiTags)('Courses - Khóa học'),
    (0, common_1.Controller)('courses'),
    __metadata("design:paramtypes", [courses_service_1.CoursesService])
], CoursesController);
//# sourceMappingURL=courses.controller.js.map