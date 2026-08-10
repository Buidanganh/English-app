import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VoiceBattleService {
  constructor(private prisma: PrismaService) {}

  private challengeSentences = [
    { text: 'I would like an iced coffee please.', ipa: '/aɪ wʊd laɪk ən aɪst ˈkɔːfi pliːz/', translation: 'Cho tôi xin một ly cà phê đá.' },
    { text: 'Could you show me your passport?', ipa: '/kʊd juː ʃoʊ miː jʊr ˈpæspɔːrt/', translation: 'Bạn có thể cho tôi xem hộ chiếu không?' },
    { text: 'The project deadline is next Monday.', ipa: '/ðə ˈprɑːdʒekt ˈdedlaɪn ɪz nekst ˈmʌndeɪ/', translation: 'Hạn chót dự án là Thứ Hai tuần sau.' },
    { text: 'Is there any discount on this shirt?', ipa: '/ɪz ðer ˈeni ˈdɪskaʊnt ɑːn ðɪs ʃɜːrt/', translation: 'Chiếc áo này có được giảm giá không?' },
    { text: 'You should see a doctor as soon as possible.', ipa: '/juː ʃʊd siː ə ˈdɑːktər æz suːn æz ˈpɑːsəbl/', translation: 'Bạn nên đi gặp bác sĩ càng sớm càng tốt.' },
    { text: 'Artificial intelligence is changing the world.', ipa: '/ˌɑːrtɪˈfɪʃl ɪnˈtelɪdʒəns ɪz ˈtʃeɪndʒɪŋ ðə wɜːrld/', translation: 'Trí tuệ nhân tạo đang thay đổi thế giới.' },
    { text: 'Please fasten your seatbelts during takeoff.', ipa: '/pliːz ˈfæsn jʊr ˈsiːtbelts ˈdʊrɪŋ ˈteɪkɔːf/', translation: 'Vui lòng thắt dây an toàn khi máy bay cất cánh.' },
  ];

  public getLeagueTier(trophies: number) {
    if (trophies >= 500) return { name: 'Kim Cương', icon: '💎', color: '#06B6D4' };
    if (trophies >= 250) return { name: 'Vàng', icon: '🥇', color: '#F59E0B' };
    if (trophies >= 100) return { name: 'Bạc', icon: '🥈', color: '#94A3B8' };
    return { name: 'Đồng', icon: '🥉', color: '#B45309' };
  }

  async createMatch(userId: string, mode: string = 'SPEED_RUN') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const trophies = user?.battleTrophies || 0;
    const tierInfo = this.getLeagueTier(trophies);

    const randomChallenge = this.challengeSentences[Math.floor(Math.random() * this.challengeSentences.length)];

    let botName = 'AI Bot Alex 🤖';
    let botHp = 100;
    if (mode === 'BOSS_BATTLE') {
      botName = '🔥 Supreme AI Boss Mega';
      botHp = 150;
    }

    const room = await this.prisma.voiceBattleRoom.create({
      data: {
        player1Id: userId,
        player2Id: 'AI_BOT_ALEX',
        status: 'PLAYING',
        targetSentence: randomChallenge.text,
      },
    });

    return {
      roomId: room.id,
      mode,
      userTier: tierInfo,
      opponent: {
        name: botName,
        avatar: '🤖',
        tier: 'PRO 👑',
        maxHp: botHp,
      },
      challenge: randomChallenge,
    };
  }

  async submitSpeech(userId: string, roomId: string, textSpoken: string, mode: string = 'SPEED_RUN') {
    const room = await this.prisma.voiceBattleRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Phòng đấu không tồn tại');
    }

    const targetWords = room.targetSentence.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
    const spokenWords = textSpoken.toLowerCase().replace(/[^a-z ]/g, '').split(' ');

    let matchCount = 0;
    targetWords.forEach((tw) => {
      if (spokenWords.includes(tw)) {
        matchCount++;
      }
    });

    // Score from 65 to 100 based on word accuracy
    const rawScore = Math.min(100, Math.max(65, Math.round((matchCount / targetWords.length) * 100)));
    
    // Combo Critical Strike if score >= 90%
    const isCombo = rawScore >= 90;
    const damageDealt = isCombo ? 45 : 25;

    // Simulating AI Bot Score (70 - 90)
    const opponentScore = Math.floor(Math.random() * (90 - 70 + 1)) + 70;
    const opponentDamage = Math.floor(Math.random() * 15) + 15;

    const isPlayer1Winner = rawScore >= opponentScore;
    const winnerId = isPlayer1Winner ? userId : 'AI_BOT_ALEX';

    await this.prisma.voiceBattleRoom.update({
      where: { id: roomId },
      data: {
        status: 'FINISHED',
        player1Score: rawScore,
        player2Score: opponentScore,
        winnerId,
      },
    });

    let updatedUser = null;
    let chestRewards = null;

    if (isPlayer1Winner) {
      updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: 50 },
          battleWins: { increment: 1 },
          battleTrophies: { increment: 20 },
          streakCount: { increment: 1 },
        },
      });

      chestRewards = {
        bonusXp: 50,
        bonusTrophies: 20,
        medal: 'Huy Chương Vô Địch Đấu Trường 🏆',
        chestType: isCombo ? '🎁 RƯƠNG THƯỜNG KIM CƯƠNG (COMBO CRITICAL!)' : '🎁 RƯƠNG CHIẾN THẮNG BẮC ĐẨU',
      };
    }

    const currentTrophies = updatedUser ? updatedUser.battleTrophies : 0;
    const newTier = this.getLeagueTier(currentTrophies);

    return {
      roomId,
      isWinner: isPlayer1Winner,
      yourScore: rawScore,
      opponentScore,
      isCombo,
      damageDealt,
      opponentDamage,
      xpEarned: isPlayer1Winner ? 50 : 15,
      trophiesEarned: isPlayer1Winner ? 20 : 0,
      userTier: newTier,
      chestRewards,
      feedback: isPlayer1Winner
        ? (isCombo ? '💥 BỘT PHÁ COMBO x2! Bạn tung đòn nổ chí mạng hạ gục đối thủ!' : '🎉 Tuyệt vời! Bạn phát âm chính xác hơn AI Bot và giành chiến thắng!')
        : '💪 Rất tiếc! AI Bot Alex phát âm nhỉnh hơn một chút. Hãy cố gắng lượt sau!',
    };
  }
}
