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
exports.VoiceBattleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const voice_battle_service_1 = require("./voice-battle.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const submit_speech_dto_1 = require("./dto/submit-speech.dto");
let VoiceBattleController = class VoiceBattleController {
    constructor(voiceBattleService) {
        this.voiceBattleService = voiceBattleService;
    }
    async createMatch(req) {
        return this.voiceBattleService.createMatch(req.user.id);
    }
    async submitSpeech(roomId, dto, req) {
        return this.voiceBattleService.submitSpeech(req.user.id, roomId, dto.textSpoken);
    }
};
exports.VoiceBattleController = VoiceBattleController;
__decorate([
    (0, common_1.Post)('match'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo phòng ghép cặp thách đấu phát âm 1v1' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceBattleController.prototype, "createMatch", null);
__decorate([
    (0, common_1.Post)(':roomId/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Gửi kết quả phát âm 10s để AI chấm điểm so kè 1v1' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_speech_dto_1.SubmitSpeechDto, Object]),
    __metadata("design:returntype", Promise)
], VoiceBattleController.prototype, "submitSpeech", null);
exports.VoiceBattleController = VoiceBattleController = __decorate([
    (0, swagger_1.ApiTags)('Voice Battle - Đấu Trường 1v1'),
    (0, common_1.Controller)('voice-battle'),
    __metadata("design:paramtypes", [voice_battle_service_1.VoiceBattleService])
], VoiceBattleController);
//# sourceMappingURL=voice-battle.controller.js.map