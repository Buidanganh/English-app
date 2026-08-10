"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./modules/users/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
const courses_module_1 = require("./modules/courses/courses.module");
const lessons_module_1 = require("./modules/lessons/lessons.module");
const roleplay_module_1 = require("./modules/roleplay/roleplay.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const voice_battle_module_1 = require("./modules/voice-battle/voice-battle.module");
const admin_module_1 = require("./modules/admin/admin.module");
const daily_rewards_module_1 = require("./modules/daily-rewards/daily-rewards.module");
const adaptive_module_1 = require("./modules/adaptive/adaptive.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            courses_module_1.CoursesModule,
            lessons_module_1.LessonsModule,
            roleplay_module_1.RoleplayModule,
            subscriptions_module_1.SubscriptionsModule,
            voice_battle_module_1.VoiceBattleModule,
            admin_module_1.AdminModule,
            daily_rewards_module_1.DailyRewardsModule,
            adaptive_module_1.AdaptiveModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map