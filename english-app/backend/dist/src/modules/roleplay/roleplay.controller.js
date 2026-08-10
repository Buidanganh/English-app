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
exports.RoleplayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roleplay_service_1 = require("./roleplay.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roleplay_dto_1 = require("./dto/roleplay.dto");
let RoleplayController = class RoleplayController {
    constructor(roleplayService) {
        this.roleplayService = roleplayService;
    }
    async getScenarios() {
        return this.roleplayService.getScenarios();
    }
    async startSession(req, dto) {
        return this.roleplayService.startSession(req.user.id, dto.scenarioId);
    }
    async sendMessage(sessionId, dto, req) {
        return this.roleplayService.sendMessage(req.user.id, sessionId, dto.message);
    }
    async evaluateSession(sessionId, req) {
        return this.roleplayService.evaluateSession(req.user.id, sessionId);
    }
};
exports.RoleplayController = RoleplayController;
__decorate([
    (0, common_1.Get)('scenarios'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách các kịch bản tình huống nhập vai giao tiếp' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleplayController.prototype, "getScenarios", null);
__decorate([
    (0, common_1.Post)('sessions/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bắt đầu một phiên hội thoại nhập vai mới' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, roleplay_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], RoleplayController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Gửi tin nhắn phản hồi của người dùng và nhận câu trả lời từ AI' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, roleplay_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], RoleplayController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('sessions/:id/evaluate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kết thúc cuộc hội thoại, nhận xét và chấm điểm phản xạ AI' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoleplayController.prototype, "evaluateSession", null);
exports.RoleplayController = RoleplayController = __decorate([
    (0, swagger_1.ApiTags)('AI Roleplay - Nhập vai Giao tiếp'),
    (0, common_1.Controller)('roleplay'),
    __metadata("design:paramtypes", [roleplay_service_1.RoleplayService])
], RoleplayController);
//# sourceMappingURL=roleplay.controller.js.map