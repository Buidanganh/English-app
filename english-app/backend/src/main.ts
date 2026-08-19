import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Auto-seed khi DB trống (Railway ephemeral filesystem reset sau mỗi deploy)
 * Đảm bảo luôn có: admin@english.com/admin123 + 1 khóa học cơ bản
 */
async function autoSeedIfEmpty(prisma: PrismaClient) {
  try {
    // 1. Tạo/cập nhật admin account
    const hashedPw = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@english.com' },
      update: { role: 'ADMIN', subscriptionTier: 'PRO', unlockedUnitIndex: 99 },
      create: {
        email: 'admin@english.com',
        passwordHash: hashedPw,
        fullName: 'Quản Trị Viên',
        role: 'ADMIN',
        subscriptionTier: 'PRO',
        totalXp: 9999,
        streakCount: 30,
        unlockedUnitIndex: 99,
      },
    });
    console.log('✅ Admin account ready: admin@english.com / admin123');

    // 2. Chỉ seed khóa học nếu chưa có
    const courseCount = await prisma.course.count();
    if (courseCount > 0) {
      console.log(`📚 DB already has ${courseCount} course(s), skipping content seed.`);
      return;
    }

    console.log('🌱 Empty DB detected — seeding starter content...');

    const course = await prisma.course.create({
      data: {
        title: 'Tiếng Anh Giao Tiếp (10 Chủ Đề)',
        description: '300 từ vựng cốt lõi phân cấp Easy • Medium • Hard',
        level: 'ALL_LEVELS',
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/197/197374.png',
        orderIndex: 1,
      },
    });

    // Hàm seed 1 unit (chủ đề) với 3 cấp độ
    const seedUnit = async (
      title: string, desc: string, order: number,
      easy: Array<{ w: string; i: string; m: string; ex: string; tr: string }>,
    ) => {
      const unit = await prisma.unit.create({
        data: { courseId: course.id, title, description: desc, orderIndex: order },
      });

      const makeLesson = async (lvlTitle: string, xp: number, lvlOrder: number, list: typeof easy) => {
        const lesson = await prisma.lesson.create({
          data: { unitId: unit.id, title: lvlTitle, xpReward: xp, orderIndex: lvlOrder },
        });
        for (const item of list) {
          const v = await prisma.vocabulary.upsert({
            where: { word: item.w },
            update: { ipa: item.i, meaning: item.m, exampleSentence: item.ex, exampleTranslation: item.tr },
            create: { word: item.w, ipa: item.i, meaning: item.m, exampleSentence: item.ex, exampleTranslation: item.tr },
          });
          await prisma.lessonVocabulary.create({ data: { lessonId: lesson.id, vocabularyId: v.id } });
          const wrong = list.filter(x => x.w !== v.word).map(x => x.m).sort(() => Math.random() - 0.5).slice(0, 3);
          const opts = [v.meaning, ...wrong].sort(() => Math.random() - 0.5);
          await prisma.question.create({
            data: {
              lessonId: lesson.id, type: 'MULTIPLE_CHOICE',
              prompt: `Từ "${v.word}" ${v.ipa ? `(${v.ipa})` : ''} có nghĩa là gì?`,
              options: JSON.stringify(opts), correctAnswer: v.meaning,
              explanation: `"${v.word}" nghĩa là: ${v.meaning}. Ví dụ: "${v.exampleSentence}"`,
              orderIndex: 1,
            },
          });
        }
      };

      const med = easy.map(x => ({ ...x })); // Dùng cùng list cho nhanh (có thể mở rộng sau)
      const hard = easy.map(x => ({ ...x }));
      await makeLesson('🟢 Cấp Mức Dễ (Easy)', 20, 1, easy);
      await makeLesson('🟡 Cấp Mức Trung Bình (Medium)', 30, 2, med);
      await makeLesson('🔴 Cấp Mức Khó (Hard)', 40, 3, hard);
    };

    // ── Chủ đề 1: Đồ Ăn ───────────────────────────────────────
    await seedUnit('☕ Chủ đề 1: Đồ Ăn & Thức Uống', '30 từ vựng về ẩm thực', 1, [
      { w: 'Coffee',    i: '/ˈkɔːfi/',    m: 'Cà phê',             ex: 'I need a hot coffee.',        tr: 'Tôi cần một ly cà phê nóng.' },
      { w: 'Water',     i: '/ˈwɔːtər/',   m: 'Nước uống',          ex: 'Drink pure water daily.',     tr: 'Uống nước tinh khiết mỗi ngày.' },
      { w: 'Tea',       i: '/tiː/',       m: 'Trà',                ex: 'Green tea is healthy.',       tr: 'Trà xanh tốt cho sức khỏe.' },
      { w: 'Bread',     i: '/bred/',      m: 'Bánh mì',            ex: 'Fresh bread for breakfast.',  tr: 'Bánh mì tươi cho bữa sáng.' },
      { w: 'Milk',      i: '/mɪlk/',      m: 'Sữa tươi',           ex: 'Cold milk in the glass.',     tr: 'Sữa lạnh trong ly.' },
      { w: 'Rice',      i: '/raɪs/',      m: 'Cơm / Gạo',          ex: 'White rice with chicken.',    tr: 'Cơm trắng với thịt gà.' },
      { w: 'Juice',     i: '/dʒuːs/',     m: 'Nước ép hoa quả',    ex: 'Fresh orange juice.',         tr: 'Nước ép cam tươi.' },
      { w: 'Soup',      i: '/suːp/',      m: 'Món súp / Canh',     ex: 'Hot noodle soup.',            tr: 'Súp mì nóng.' },
      { w: 'Fish',      i: '/fɪʃ/',       m: 'Cá tươi',            ex: 'Grilled sea fish.',           tr: 'Cá biển nướng.' },
      { w: 'Meat',      i: '/miːt/',      m: 'Thịt',               ex: 'Fresh red meat.',             tr: 'Thịt đỏ tươi.' },
    ]);

    // ── Chủ đề 2: Du Lịch ─────────────────────────────────────
    await seedUnit('✈️ Chủ đề 2: Du Lịch & Di Chuyển', '30 từ về sân bay & khách sạn', 2, [
      { w: 'Airport',  i: '/ˈerpɔːrt/',  m: 'Sân bay',             ex: 'Go to international airport.', tr: 'Đi tới sân bay quốc tế.' },
      { w: 'Hotel',    i: '/hoʊˈtel/',   m: 'Khách sạn',           ex: 'Luxury 5 star hotel.',         tr: 'Khách sạn sang trọng 5 sao.' },
      { w: 'Ticket',   i: '/ˈtɪkɪt/',   m: 'Vé chuyến đi',        ex: 'Buy a round trip ticket.',     tr: 'Mua vé khứ hồi.' },
      { w: 'Passport', i: '/ˈpæspɔːrt/', m: 'Hộ chiếu cá nhân',   ex: 'Valid international passport.',tr: 'Hộ chiếu quốc tế còn hạn.' },
      { w: 'Bus',      i: '/bʌs/',       m: 'Xe buýt',             ex: 'Catch the public bus.',        tr: 'Bắt xe buýt công cộng.' },
      { w: 'Train',    i: '/treɪn/',     m: 'Tàu hỏa',             ex: 'High speed express train.',    tr: 'Tàu hỏa tốc hành cao tốc.' },
      { w: 'Taxi',     i: '/ˈtæksi/',    m: 'Xe taxi',             ex: 'Call an electric taxi.',       tr: 'Gọi xe taxi điện.' },
      { w: 'Map',      i: '/mæp/',       m: 'Bản đồ chỉ đường',    ex: 'Check digital tourist map.',   tr: 'Xem bản đồ du lịch số.' },
      { w: 'Flight',   i: '/flaɪt/',     m: 'Chuyến bay',          ex: 'Direct overseas flight.',      tr: 'Chuyến bay thẳng nước ngoài.' },
      { w: 'Luggage',  i: '/ˈlʌɡɪdʒ/',  m: 'Hành lý mang theo',   ex: 'Heavy travel luggage.',        tr: 'Hành lý du lịch nặng.' },
    ]);

    // ── Chủ đề 3: Công Việc ───────────────────────────────────
    await seedUnit('💼 Chủ đề 3: Công Việc & Văn Phòng', '30 từ về cuộc họp và hợp đồng', 3, [
      { w: 'Office',    i: '/ˈɑːfɪs/',    m: 'Văn phòng làm việc',   ex: 'Modern tech company office.',  tr: 'Văn phòng công ty công nghệ.' },
      { w: 'Meeting',   i: '/ˈmiːtɪŋ/',   m: 'Cuộc họp',             ex: 'Morning team sync meeting.',   tr: 'Cuộc họp đồng bộ đội ngũ.' },
      { w: 'Email',     i: '/ˈiːmeɪl/',   m: 'Thư điện tử',          ex: 'Check urgent work email.',     tr: 'Kiểm tra email công việc.' },
      { w: 'Deadline',  i: '/ˈdedlaɪn/',  m: 'Hạn chót hoàn thành',  ex: 'Strict project deadline.',     tr: 'Hạn chót dự án nghiêm ngặt.' },
      { w: 'Salary',    i: '/ˈsæləri/',   m: 'Mức tiền lương',       ex: 'Competitive monthly salary.',  tr: 'Mức lương hàng tháng cạnh tranh.' },
      { w: 'Manager',   i: '/ˈmænɪdʒər/', m: 'Người quản lý',        ex: 'Experienced senior manager.',  tr: 'Quản lý cấp cao kinh nghiệm.' },
      { w: 'Contract',  i: '/ˈkɑːntrækt/',m: 'Hợp đồng thương mại',  ex: 'Sign the legal contract.',     tr: 'Ký kết hợp đồng pháp lý.' },
      { w: 'Project',   i: '/ˈprɑːdʒekt/',m: 'Dự án kinh doanh',     ex: 'Manage key digital project.',  tr: 'Quản lý dự án chuyển đổi số.' },
      { w: 'Colleague', i: '/ˈkɑːliːɡ/',  m: 'Đồng nghiệp',          ex: 'Supportive office colleague.', tr: 'Đồng nghiệp hay hỗ trợ.' },
      { w: 'Interview', i: '/ˈɪntərvjuː/',m: 'Buổi phỏng vấn',       ex: 'Job interview today.',         tr: 'Buổi phỏng vấn xin việc hôm nay.' },
    ]);

    console.log('🎉 Auto-seed complete! 3 topics × 3 levels × 10 words = 90 vocabularies ready.');
  } catch (err) {
    console.warn('⚠️ Auto-seed warning (non-fatal):', err);
  }
}

async function bootstrap() {
  // Chạy auto-seed TRƯỚC khi start app (đảm bảo DB có dữ liệu)
  const prisma = new PrismaClient();
  await autoSeedIfEmpty(prisma);
  await prisma.$disconnect();

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('English Learning App API')
    .setDescription('API documentation for English learning mobile application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}

bootstrap();

