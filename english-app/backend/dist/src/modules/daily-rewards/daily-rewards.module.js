"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyRewardsModule = void 0;
const common_1 = require("@nestjs/common");
const daily_rewards_service_1 = require("./daily-rewards.service");
const daily_rewards_controller_1 = require("./daily-rewards.controller");
let DailyRewardsModule = class DailyRewardsModule {
};
exports.DailyRewardsModule = DailyRewardsModule;
exports.DailyRewardsModule = DailyRewardsModule = __decorate([
    (0, common_1.Module)({
        providers: [daily_rewards_service_1.DailyRewardsService],
        controllers: [daily_rewards_controller_1.DailyRewardsController],
        exports: [daily_rewards_service_1.DailyRewardsService],
    })
], DailyRewardsModule);
//# sourceMappingURL=daily-rewards.module.js.map