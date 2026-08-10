import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoleplayService {
  constructor(private prisma: PrismaService) {}

  async getScenarios() {
    let scenarios = await this.prisma.roleplayScenario.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    // Tự động khôi phục 7 kịch bản nếu CSDL bị trống
    if (scenarios.length === 0) {
      await this.autoSeedScenarios();
      scenarios = await this.prisma.roleplayScenario.findMany({
        orderBy: { orderIndex: 'asc' },
      });
    }

    return scenarios;
  }

  private async autoSeedScenarios() {
    await this.prisma.roleplayScenario.createMany({
      data: [
        {
          title: 'Gọi món tại Quán Cà Phê',
          description: 'Luyện tập gọi đồ uống và thanh toán với nhân viên phục vụ quán cà phê',
          category: 'DAILY',
          icon: '☕',
          initialMessage: 'Hi there! Welcome to Coffee House. What can I get started for you today?',
          systemPrompt: 'You are a friendly barista at a coffee shop. Keep responses under 2 sentences.',
          orderIndex: 1,
        },
        {
          title: 'Check-in tại Khách Sạn',
          description: 'Thực hành thủ tục nhận phòng và hỏi dịch vụ tại lễ tân khách sạn',
          category: 'TRAVEL',
          icon: '🏨',
          initialMessage: 'Good afternoon! Welcome to Grand Hotel. How may I assist you with your reservation today?',
          systemPrompt: 'You are a polite hotel receptionist. Keep responses under 2 sentences.',
          orderIndex: 2,
        },
        {
          title: 'Phỏng Vấn Xin Việc Cơ Bản',
          description: 'Tập tự giới thiệu bản thân và trả lời câu hỏi phỏng vấn tuyển dụng',
          category: 'BUSINESS',
          icon: '💼',
          initialMessage: 'Hello! Thank you for joining the interview today. Could you please introduce yourself briefly?',
          systemPrompt: 'You are a professional HR interviewer. Keep responses under 2 sentences.',
          orderIndex: 3,
        },
        {
          title: 'Hải Quan & An Ninh Sân Bay',
          description: 'Thực hành trả lời các câu hỏi kiểm tra nhập cảnh của sĩ quan hải quan',
          category: 'TRAVEL',
          icon: '🛫',
          initialMessage: 'Good day! Passports and landing cards, please. What is the main purpose of your visit today?',
          systemPrompt: 'You are an airport customs officer. Keep responses under 2 sentences.',
          orderIndex: 4,
        },
        {
          title: 'Đón Taxi & Chỉ Đường Đi',
          description: 'Nói chuyện với tài xế taxi chỉ đường và hỏi thời gian di chuyển',
          category: 'TRAVEL',
          icon: '🚕',
          initialMessage: 'Hello there! Hop in. Where are we heading to today, sir?',
          systemPrompt: 'You are a friendly taxi driver. Keep responses under 2 sentences.',
          orderIndex: 5,
        },
        {
          title: 'Khám Bệnh Tại Bệnh Viện',
          description: 'Mô tả triệu chứng sức khỏe và nhận tư vấn của bác sĩ',
          category: 'HEALTH',
          icon: '🩺',
          initialMessage: 'Hello! Please come in and take a seat. What seems to be the problem today?',
          systemPrompt: 'You are a caring doctor. Keep responses under 2 sentences.',
          orderIndex: 6,
        },
        {
          title: 'Trả Hàng & Khiếu Nại Siêu Thị',
          description: 'Giải quyết tình huống khiếu nại sản phẩm lỗi với quản lý dịch vụ',
          category: 'SHOPPING',
          icon: '🛒',
          initialMessage: 'Hi! Welcome to Customer Service. How can I assist you with your receipt and item today?',
          systemPrompt: 'You are a customer service manager. Keep responses under 2 sentences.',
          orderIndex: 7,
        },
      ],
    });
  }

  async startSession(userId: string, scenarioId: string) {
    let scenario = await this.prisma.roleplayScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      // If scenario not found, pick first available
      const scenarios = await this.getScenarios();
      scenario = scenarios[0];
    }

    if (!scenario) {
      throw new NotFoundException('Tình huống nhập vai không tồn tại');
    }

    // Create session
    const session = await this.prisma.roleplaySession.create({
      data: {
        userId,
        scenarioId: scenario.id,
        messages: {
          create: {
            sender: 'AI',
            content: scenario.initialMessage,
            translation: this.getInitialTranslation(scenario.title),
          },
        },
      },
      include: {
        scenario: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return session;
  }

  async sendMessage(userId: string, sessionId: string, userContent: string) {
    const session = await this.prisma.roleplaySession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Phiên trò chuyện không tồn tại');
    }

    // Save User message
    await this.prisma.roleplayMessage.create({
      data: {
        sessionId,
        sender: 'USER',
        content: userContent,
      },
    });

    // Generate AI response based on scenario and conversation history
    const aiReply = this.generateAiReply(session.scenario.title, userContent, session.messages.length);

    // Save AI message
    const aiMsg = await this.prisma.roleplayMessage.create({
      data: {
        sessionId,
        sender: 'AI',
        content: aiReply.content,
        translation: aiReply.translation,
      },
    });

    return {
      userMessage: { sender: 'USER', content: userContent },
      aiMessage: aiMsg,
      suggestions: aiReply.suggestions,
    };
  }

  async evaluateSession(userId: string, sessionId: string) {
    const session = await this.prisma.roleplaySession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      throw new NotFoundException('Phiên trò chuyện không tồn tại');
    }

    const userMessageCount = session.messages.filter((m) => m.sender === 'USER').length;
    const score = Math.min(100, Math.max(70, 75 + userMessageCount * 5));

    const feedbackObj = {
      score,
      fluency: 'Khá tốt - Phản xạ nhanh',
      accuracy: 'Chính xác 88%',
      tip: 'Bạn nên dùng các mẫu câu lịch sự hơn như "Could I have..." thay vì "I want..."',
    };

    // Complete session
    await this.prisma.roleplaySession.update({
      where: { id: sessionId },
      data: {
        isFinished: true,
        score,
        feedback: JSON.stringify(feedbackObj),
      },
    });

    // Award XP
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: 25 },
        streakCount: { increment: 1 },
      },
    });

    return {
      score,
      xpEarned: 25,
      feedback: feedbackObj,
    };
  }

  private getInitialTranslation(scenarioTitle: string): string {
    if (scenarioTitle.includes('Cà Phê')) {
      return 'Xin chào! Chào mừng bạn đến với Coffee House. Bạn muốn dùng món gì hôm nay?';
    }
    if (scenarioTitle.includes('Khách Sạn')) {
      return 'Xin chào quý khách! Chào mừng tới Grand Hotel. Tôi có thể hỗ trợ gì cho đơn đặt phòng của quý khách?';
    }
    if (scenarioTitle.includes('Phỏng Vấn')) {
      return 'Xin chào! Cảm ơn bạn đã tới buổi phỏng vấn hôm nay. Bạn có thể tự giới thiệu ngắn gọn về bản thân được không?';
    }
    if (scenarioTitle.includes('Hải Quan')) {
      return 'Xin chào! Cho xin hộ chiếu và tờ khai nhập cảnh. Mục đích chuyến đi của bạn là gì?';
    }
    if (scenarioTitle.includes('Taxi')) {
      return 'Chào bạn! Lên xe nào. Hôm nay chúng ta đi đâu vậy bạn?';
    }
    if (scenarioTitle.includes('Khám Bệnh')) {
      return 'Xin chào! Mời bạn vào ngồi. Hôm nay bạn đang thấy khó chịu hay bị bệnh gì?';
    }
    return 'Xin chào! Chào mừng tới bộ phận Chăm Sóc Khách Hàng. Tôi có thể giúp gì cho hóa đơn và sản phẩm của bạn?';
  }

  private generateAiReply(title: string, userText: string, msgCount: number) {
    const textLower = userText.toLowerCase();

    if (title.includes('Cà Phê')) {
      if (textLower.includes('latte') || textLower.includes('coffee') || textLower.includes('tea')) {
        return {
          content: 'Great choice! What size would you like for that, medium or large?',
          translation: 'Lựa chọn tuyệt vời! Bạn muốn chọn size vừa hay size lớn?',
          suggestions: ['Medium, please.', 'A large one, thanks.', 'What is the price difference?'],
        };
      }
      return {
        content: 'Got it! Would you like any bakery or snacks to go with your drink?',
        translation: 'Tôi đã ghi nhận! Bạn có muốn dùng thêm bánh ngọt hay đồ ăn kèm không?',
        suggestions: ['No, thanks. Just the drink.', 'Do you have chocolate cookies?', 'Can I get a croissant?'],
      };
    }

    if (title.includes('Khách Sạn')) {
      return {
        content: 'Certainly! May I please have your full name and passport or ID for verification?',
        translation: 'Chắc chắn rồi! Cho tôi xin họ tên và hộ chiếu/CCCD để xác nhận thông tin được không?',
        suggestions: ['My name is John. Here is my passport.', 'Sure, here you go.', 'I booked via Agoda.'],
      };
    }

    if (title.includes('Hải Quan')) {
      return {
        content: 'Understood. How many days do you plan to stay in the country, and where will you reside?',
        translation: 'Đã rõ. Bạn dự định ở lại đất nước trong bao nhiêu ngày, và bạn sẽ lưu trú ở đâu?',
        suggestions: ['I am staying for 7 days at Grand Hotel.', 'Just 5 days for vacation.', 'At my friend house in New York.'],
      };
    }

    if (title.includes('Taxi')) {
      return {
        content: 'No problem! The traffic seems a bit heavy, but we should be there in about 20 minutes.',
        translation: 'Không vấn đề gì! Giao thông có vẻ hơi đông nhưng chúng ta sẽ đến nơi trong khoảng 20 phút.',
        suggestions: ['Sounds good, thank you.', 'Please take the fastest route.', 'Could you turn on the air conditioner?'],
      };
    }

    if (title.includes('Khám Bệnh')) {
      return {
        content: 'I see. Have you taken any fever or painkiller medication in the last 24 hours?',
        translation: 'Tôi đã hiểu. Bạn có dùng thuốc hạ sốt hay giảm đau nào trong 24 giờ qua chưa?',
        suggestions: ['No, I have not taken any medicine.', 'Yes, I took some aspirin earlier.', 'Just vitamin C.'],
      };
    }

    if (title.includes('Trả Hàng')) {
      return {
        content: 'I am sorry to hear that. Do you have the original store receipt and purchase tags?',
        translation: 'Tôi rất tiếc khi nghe điều đó. Bạn có mang theo hóa đơn mua hàng và tem mác ban đầu không?',
        suggestions: ['Yes, here is the receipt.', 'I lost the receipt, but I have my card statement.', 'Yes, everything is in the box.'],
      };
    }

    return {
      content: 'That sounds impressive! What do you consider your greatest strength in work?',
      translation: 'Nghe rất ấn tượng! Bạn cảm thấy điểm mạnh lớn nhất của mình trong công việc là gì?',
      suggestions: ['I am hard-working and a good team player.', 'I have strong problem-solving skills.', 'I am fast at learning new tools.'],
    };
  }
}
