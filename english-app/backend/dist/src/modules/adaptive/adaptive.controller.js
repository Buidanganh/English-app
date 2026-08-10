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
exports.AdaptiveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const adaptive_service_1 = require("./adaptive.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AdaptiveController = class AdaptiveController {
    constructor(adaptiveService) {
        this.adaptiveService = adaptiveService;
    }
    async getRecommendations(req) {
        return this.adaptiveService.getRecommendations(req.user.id);
    }
    async getTodayReviewWords(req) {
        return this.adaptiveService.getTodayReviewWords(req.user.id);
    }
    async updateVocabMastery(req, dto) {
        return this.adaptiveService.updateVocabMastery(req.user.id, dto.lessonId, dto.correctVocabIds || [], dto.incorrectVocabIds || []);
    }
};
exports.AdaptiveController = AdaptiveController;
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy đề xuất bài học cá nhân hóa theo AI Adaptive Learning' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdaptiveController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('review-words'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách từ cần ôn lại hôm nay (Spaced Repetition)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdaptiveController.prototype, "getTodayReviewWords", null);
__decorate([
    (0, common_1.Post)('update-mastery'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật mức độ thuần thục từ vựng sau quiz' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdaptiveController.prototype, "updateVocabMastery", null);
exports.AdaptiveController = AdaptiveController = __decorate([
    (0, swagger_1.ApiTags)('Adaptive Learning - Lộ Trình Cá Nhân Hóa'),
    (0, common_1.Controller)('adaptive'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [adaptive_service_1.AdaptiveService])
], AdaptiveController);
//# sourceMappingURL=adaptive.controller.js.map