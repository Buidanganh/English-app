import { VoiceBattleService } from './voice-battle.service';
import { SubmitSpeechDto } from './dto/submit-speech.dto';
export declare class VoiceBattleController {
    private voiceBattleService;
    constructor(voiceBattleService: VoiceBattleService);
    createMatch(req: any): Promise<{
        roomId: string;
        mode: string;
        userTier: {
            name: string;
            icon: string;
            color: string;
        };
        opponent: {
            name: string;
            avatar: string;
            tier: string;
            maxHp: number;
        };
        challenge: {
            text: string;
            ipa: string;
            translation: string;
        };
    }>;
    submitSpeech(roomId: string, dto: SubmitSpeechDto, req: any): Promise<{
        roomId: string;
        isWinner: boolean;
        yourScore: number;
        opponentScore: number;
        isCombo: boolean;
        damageDealt: number;
        opponentDamage: number;
        xpEarned: number;
        trophiesEarned: number;
        userTier: {
            name: string;
            icon: string;
            color: string;
        };
        chestRewards: any;
        feedback: string;
    }>;
}
