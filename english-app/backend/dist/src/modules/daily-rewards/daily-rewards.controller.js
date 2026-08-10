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
exports.DailyRewardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_rewards_service_1 = require("./daily-rewards.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DailyRewardsController = class DailyRewardsController {
    constructor(dailyRewardsService) {
        this.dailyRewardsService = dailyRewardsService;
    }
    async getStatus(req) {
        return this.dailyRewardsService.getStatus(req.user.id);
    }
    async claim(req) {
        return this.dailyRewardsService.claim(req.user.id);
    }
};
exports.DailyRewardsController = DailyRewardsController;
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kiểm tra trạng thái điểm danh nhận quà hôm nay' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DailyRewardsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('claim'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bấm điểm danh nhận +20 XP phần thưởng hàng ngày' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DailyRewardsController.prototype, "claim", null);
exports.DailyRewardsController = DailyRewardsController = __decorate([
    (0, swagger_1.ApiTags)('Daily Rewards - Điểm Danh & Nhắc Nhở Hàng Ngày'),
    (0, common_1.Controller)('daily-rewards'),
    __metadata("design:paramtypes", [daily_rewards_service_1.DailyRewardsService])
], DailyRewardsController);
//# sourceMappingURL=daily-rewards.controller.js.map