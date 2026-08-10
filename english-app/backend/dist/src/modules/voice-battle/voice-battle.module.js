"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceBattleModule = void 0;
const common_1 = require("@nestjs/common");
const voice_battle_service_1 = require("./voice-battle.service");
const voice_battle_controller_1 = require("./voice-battle.controller");
let VoiceBattleModule = class VoiceBattleModule {
};
exports.VoiceBattleModule = VoiceBattleModule;
exports.VoiceBattleModule = VoiceBattleModule = __decorate([
    (0, common_1.Module)({
        providers: [voice_battle_service_1.VoiceBattleService],
        controllers: [voice_battle_controller_1.VoiceBattleController],
        exports: [voice_battle_service_1.VoiceBattleService],
    })
], VoiceBattleModule);
//# sourceMappingURL=voice-battle.module.js.map