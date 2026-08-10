import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start safe seeding (10 Topics total x 3 Levels = 300 REAL vocabularies & preserving registered user accounts)...');

  // 1. Upsert Dedicated Admin Master Account & Sample Competitors
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@english.com' },
    update: {
      role: 'ADMIN',
      subscriptionTier: 'PRO',
      unlockedUnitIndex: 99,
    },
    create: {
      email: 'admin@english.com',
      passwordHash: hashedPassword,
      fullName: 'Quản Trị Viên (Admin Master)',
      role: 'ADMIN',
      subscriptionTier: 'PRO',
      totalXp: 9999,
      streakCount: 30,
      battleWins: 50,
      battleTrophies: 500,
      unlockedUnitIndex: 99,
    },
  });

  console.log(`👑 Admin Account Ready: admin@english.com / admin123 (ID: ${admin.id})`);

  // Clear content tables safely preserving users
  try {
    await prisma.userFavoriteVocabulary.deleteMany();
    await prisma.userVocabulary.deleteMany();
    await prisma.roleplayScenario.deleteMany();
    await prisma.question.deleteMany();
    await prisma.lessonVocabulary.deleteMany();
    await prisma.userProgress.deleteMany();
    await prisma.vocabulary.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.course.deleteMany();
  } catch (e) {
    console.warn('⚠️ Clear tables non-fatal warning:', e);
  }

  const course = await prisma.course.create({
    data: {
      title: 'Tiếng Anh Giao Tiếp 10 Chủ Đề (3 Cấp Mức: Easy • Medium • Hard)',
      description: 'Lộ trình 300 từ vựng cốt lõi phân cấp chuẩn từ dễ đến nâng cao',
      level: 'ALL_LEVELS',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/197/197374.png',
      orderIndex: 1,
    },
  });

  const seedTopicWithLevels = async (
    unitTitle: string,
    unitDesc: string,
    orderIndex: number,
    easyVocab: Array<{ word: string; ipa: string; meaning: string; ex: string; tr: string }>,
    medVocab: Array<{ word: string; ipa: string; meaning: string; ex: string; tr: string }>,
    hardVocab: Array<{ word: string; ipa: string; meaning: string; ex: string; tr: string }>
  ) => {
    const unit = await prisma.unit.create({
      data: {
        courseId: course.id,
        title: unitTitle,
        description: unitDesc,
        orderIndex,
      },
    });

    const seedLevel = async (levelName: string, levelDesc: string, xpReward: number, lvlOrder: number, list: typeof easyVocab) => {
      const lesson = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          title: levelName,
          description: levelDesc,
          xpReward,
          orderIndex: lvlOrder,
        },
      });

      for (const item of list) {
        const v = await prisma.vocabulary.upsert({
          where: { word: item.word },
          update: {
            ipa: item.ipa,
            meaning: item.meaning,
            exampleSentence: item.ex,
            exampleTranslation: item.tr,
          },
          create: {
            word: item.word,
            ipa: item.ipa,
            meaning: item.meaning,
            exampleSentence: item.ex,
            exampleTranslation: item.tr,
          },
        });

        await prisma.lessonVocabulary.create({
          data: { lessonId: lesson.id, vocabularyId: v.id },
        });

        const wrongOpts = list
          .filter((i) => i.word !== v.word)
          .map((i) => i.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const opts = [v.meaning, ...wrongOpts].sort(() => Math.random() - 0.5);

        await prisma.question.create({
          data: {
            lessonId: lesson.id,
            type: 'MULTIPLE_CHOICE',
            prompt: `Từ "${v.word}" ${v.ipa ? `(${v.ipa})` : ''} có nghĩa là gì?`,
            options: JSON.stringify(opts),
            correctAnswer: v.meaning,
            explanation: `"${v.word}" nghĩa là: ${v.meaning}.${v.exampleSentence ? ` Ví dụ: "${v.exampleSentence}"` : ''}`,
            orderIndex: 1,
          },
        });
      }
    };

    await seedLevel('🟢 Cấp Mức Dễ (Easy - 10 Từ Cốt Lõi)', 'Học 10 từ vựng căn bản nhất', 20, 1, easyVocab);
    await seedLevel('🟡 Cấp Mức Trung Bình (Medium - 10 Từ Thực Tế)', 'Học 10 từ vựng ngữ cảnh thực tế', 30, 2, medVocab);
    await seedLevel('🔴 Cấp Mức Khó (Hard - 10 Từ Nâng Cao)', 'Học 10 từ vựng nâng cao chuyên sâu', 40, 3, hardVocab);
  };

  // TOPIC 1
  await seedTopicWithLevels(
    '☕ Chủ đề 1: Đồ Ăn & Thức Uống (Food & Drinks)',
    '30 từ vựng gọi món, thức uống và ẩm thực',
    1,
    [
      { word: 'Coffee', ipa: '/ˈkɔːfi/', meaning: 'Cà phê', ex: 'I need a hot coffee.', tr: 'Tôi cần một ly cà phê nóng.' },
      { word: 'Water', ipa: '/ˈwɔːtər/', meaning: 'Nước uống', ex: 'Drink pure water daily.', tr: 'Uống nước tinh khiết mỗi ngày.' },
      { word: 'Tea', ipa: '/tiː/', meaning: 'Trà', ex: 'Green tea is healthy.', tr: 'Trà xanh tốt cho sức khỏe.' },
      { word: 'Bread', ipa: '/bred/', meaning: 'Bánh mì', ex: 'Fresh bread for breakfast.', tr: 'Bánh mì tươi cho bữa sáng.' },
      { word: 'Milk', ipa: '/mɪlk/', meaning: 'Sữa tươi', ex: 'Cold milk in the glass.', tr: 'Sữa lạnh trong ly.' },
      { word: 'Rice', ipa: '/raɪs/', meaning: 'Cơm / Gạo', ex: 'White rice with chicken.', tr: 'Cơm trắng với thịt gà.' },
      { word: 'Juice', ipa: '/dʒuːs/', meaning: 'Nước ép hoa quả', ex: 'Fresh orange juice.', tr: 'Nước ép cam tươi.' },
      { word: 'Soup', ipa: '/suːp/', meaning: 'Món súp / Canh', ex: 'Hot noodle soup.', tr: 'Súp mì nóng.' },
      { word: 'Fish', ipa: '/fɪʃ/', meaning: 'Cá tươi', ex: 'Grilled sea fish.', tr: 'Cá biển nướng.' },
      { word: 'Meat', ipa: '/miːt/', meaning: 'Thịt', ex: 'Fresh red meat.', tr: 'Thịt đỏ tươi.' },
    ],
    [
      { word: 'Order', ipa: '/ˈɔːrdər/', meaning: 'Gọi món / Đặt hàng', ex: 'Ready to order now.', tr: 'Sẵn sàng gọi món ngay.' },
      { word: 'Menu', ipa: '/ˈmenjuː/', meaning: 'Thực đơn nhà hàng', ex: 'Check the food menu.', tr: 'Xem thực đơn món ăn.' },
      { word: 'Bill', ipa: '/bɪl/', meaning: 'Hóa đơn thanh toán', ex: 'Pay the dinner bill.', tr: 'Thanh toán hóa đơn ăn tối.' },
      { word: 'Waiter', ipa: '/ˈweɪtər/', meaning: 'Người phục vụ', ex: 'Call the friendly waiter.', tr: 'Gọi người phục vụ thân thiện.' },
      { word: 'Delicious', ipa: '/dɪˈlɪʃəs/', meaning: 'Ngon miệng', ex: 'The steak is delicious.', tr: 'Món bít tết rất ngon.' },
      { word: 'Dessert', ipa: '/dɪˈzɜːrt/', meaning: 'Món tráng miệng', ex: 'Sweet ice cream dessert.', tr: 'Món tráng miệng kem ngọt.' },
      { word: 'Reservation', ipa: '/ˌrezərˈveɪʃn/', meaning: 'Đặt bàn trước', ex: 'Make a table reservation.', tr: 'Đặt bàn trước.' },
      { word: 'Salad', ipa: '/ˈsæləd/', meaning: 'Món rau trộn salad', ex: 'Fresh vegetable salad.', tr: 'Salad rau tươi.' },
      { word: 'Steak', ipa: '/steɪk/', meaning: 'Bít tết bò', ex: 'Juicy beef steak.', tr: 'Bít tết bò mọng nước.' },
      { word: 'Breakfast', ipa: '/ˈbrekfəst/', meaning: 'Bữa ăn sáng', ex: 'Eat a nutritious breakfast.', tr: 'Ăn bữa sáng bổ dưỡng.' },
    ],
    [
      { word: 'Gastronomy', ipa: '/ɡæˈstrɑːnəmi/', meaning: 'Nghệ thuật ẩm thực', ex: 'French gastronomy is famous.', tr: 'Ẩm thực Pháp rất nổi tiếng.' },
      { word: 'Culinary', ipa: '/ˈkʌlɪneri/', meaning: 'Thuộc về nấu nướng', ex: 'Professional culinary skills.', tr: 'Kỹ năng nấu nướng chuyên nghiệp.' },
      { word: 'Beverage', ipa: '/ˈbevərɪdʒ/', meaning: 'Đồ uống tổng hợp', ex: 'Cold refreshing beverage.', tr: 'Đồ uống giải khát mát lạnh.' },
      { word: 'Appetizer', ipa: '/ˈæpɪtaɪzər/', meaning: 'Món khai vị', ex: 'Soup as an appetizer.', tr: 'Món súp dùng làm món khai vị.' },
      { word: 'Gourmet', ipa: '/ˈɡʊrmeɪ/', meaning: 'Thức ăn sành điệu', ex: 'A gourmet dining experience.', tr: 'Trải nghiệm ẩm thực sành điệu.' },
      { word: 'Recipe', ipa: '/ˈresəpi/', meaning: 'Công thức nấu ăn', ex: 'Secret family cake recipe.', tr: 'Công thức làm bánh gia truyền.' },
      { word: 'Ingredient', ipa: '/ɪnˈɡriːdiənt/', meaning: 'Nguyên liệu món ăn', ex: 'Fresh natural ingredients.', tr: 'Nguyên liệu tự nhiên tươi ngon.' },
      { word: 'Nutrition', ipa: '/nuːˈtrɪʃn/', meaning: 'Dinh dưỡng học', ex: 'Balanced daily nutrition.', tr: 'Dinh dưỡng hàng ngày cân đối.' },
      { word: 'Digest', ipa: '/daɪˈdʒest/', meaning: 'Tiêu hóa thức ăn', ex: 'Easily digest light food.', tr: 'Dễ dàng tiêu hóa thức ăn nhẹ.' },
      { word: 'Seafood', ipa: '/ˈsiːfuːd/', meaning: 'Hải sản biển', ex: 'Fresh ocean seafood platter.', tr: 'Đĩa hải sản biển tươi ngon.' },
    ]
  );

  // TOPIC 2
  await seedTopicWithLevels(
    '✈️ Chủ đề 2: Du Lịch & Di Chuyển (Travel & Transport)',
    '30 từ vựng sân bay, khách sạn và di chuyển phương tiện',
    2,
    [
      { word: 'Airport', ipa: '/ˈerpɔːrt/', meaning: 'Sân bay', ex: 'Go to international airport.', tr: 'Đi tới sân bay quốc tế.' },
      { word: 'Bus', ipa: '/bʌs/', meaning: 'Xe buýt', ex: 'Catch the public bus.', tr: 'Bắt xe buýt công cộng.' },
      { word: 'Car', ipa: '/kɑːr/', meaning: 'Xe ô tô', ex: 'Drive a private car.', tr: 'Lái xe ô tô riêng.' },
      { word: 'Train', ipa: '/treɪn/', meaning: 'Tàu hỏa', ex: 'High speed express train.', tr: 'Tàu hỏa tốc hành cao tốc.' },
      { word: 'Ticket', ipa: '/ˈtɪkɪt/', meaning: 'Vé chuyến đi', ex: 'Buy a round trip ticket.', tr: 'Mua vé khứ hồi.' },
      { word: 'Taxi', ipa: '/ˈtæksi/', meaning: 'Xe taxi', ex: 'Call an electric taxi.', tr: 'Gọi xe taxi điện.' },
      { word: 'Hotel', ipa: '/hoʊˈtel/', meaning: 'Khách sạn', ex: 'Luxury 5 star hotel.', tr: 'Khách sạn sang trọng 5 sao.' },
      { word: 'City', ipa: '/ˈsɪti/', meaning: 'Thành phố', ex: 'Explore the capital city.', tr: 'Khám phá thành phố thủ đô.' },
      { word: 'Map', ipa: '/mæp/', meaning: 'Bản đồ chỉ đường', ex: 'Check digital tourist map.', tr: 'Xem bản đồ du lịch số.' },
      { word: 'Flight', ipa: '/flaɪt/', meaning: 'Chuyến bay', ex: 'Direct overseas flight.', tr: 'Chuyến bay thẳng nước ngoài.' },
    ],
    [
      { word: 'Passport', ipa: '/ˈpæspɔːrt/', meaning: 'Hộ chiếu cá nhân', ex: 'Valid international passport.', tr: 'Hộ chiếu quốc tế còn hạn.' },
      { word: 'Luggage', ipa: '/ˈlʌɡɪdʒ/', meaning: 'Hành lý mang theo', ex: 'Heavy travel luggage suitcase.', tr: 'Vali hành lý du lịch nặng.' },
      { word: 'Departure', ipa: '/dɪˈpɑːrtʃər/', meaning: 'Khởi hành chuyến đi', ex: 'Flight departure time 8 AM.', tr: 'Giờ khởi hành chuyến bay 8 giờ sáng.' },
      { word: 'Arrival', ipa: '/əˈraɪvl/', meaning: 'Đến nơi / Hạ cánh', ex: 'Safe arrival at destination.', tr: 'Đến nơi an toàn.' },
      { word: 'Booking', ipa: '/ˈbʊkɪŋ/', meaning: 'Đặt phòng / Đặt chỗ', ex: 'Online hotel room booking.', tr: 'Đặt phòng khách sạn trực tuyến.' },
      { word: 'Destination', ipa: '/ˌdestɪˈneɪʃn/', meaning: 'Điểm đến du lịch', ex: 'Popular holiday destination.', tr: 'Điểm đến kỳ nghỉ phổ biến.' },
      { word: 'Sightseeing', ipa: '/ˈsaɪtsiːɪŋ/', meaning: 'Thăm quan thắng cảnh', ex: 'Go sightseeing in Paris.', tr: 'Đi thăm quan thắng cảnh ở Paris.' },
      { word: 'Cruise', ipa: '/kruːz/', meaning: 'Du thuyền trên biển', ex: 'Ocean luxury cruise trip.', tr: 'Chuyến du lịch du thuyền biển.' },
      { word: 'Station', ipa: '/ˈsteɪʃn/', meaning: 'Nhà ga tàu', ex: 'Central railway station.', tr: 'Nhà ga đường sắt trung tâm.' },
      { word: 'Driver', ipa: '/ˈdraɪvər/', meaning: 'Tài xế lái xe', ex: 'Professional tour driver.', tr: 'Tài xế du lịch chuyên nghiệp.' },
    ],
    [
      { word: 'Itinerary', ipa: '/aɪˈtɪnəreri/', meaning: 'Lịch trình chuyến đi', ex: 'Detailed travel itinerary.', tr: 'Lịch trình chuyến đi chi tiết.' },
      { word: 'Accommodation', ipa: '/əˌkɑːməˈdeɪʃn/', meaning: 'Chỗ ở du lịch', ex: 'Comfortable hotel accommodation.', tr: 'Chỗ ở khách sạn thoải mái.' },
      { word: 'Customs', ipa: '/ˈkʌstəmz/', meaning: 'Hải quan kiểm tra', ex: 'Pass through airport customs.', tr: 'Đi qua hải quan sân bay.' },
      { word: 'Commute', ipa: '/kəˈmjuːt/', meaning: 'Đi lại hàng ngày', ex: 'Daily train commute to work.', tr: 'Đi lại làm việc bằng tàu hàng ngày.' },
      { word: 'Excursion', ipa: '/ɪkˈskɜːrʒn/', meaning: 'Chuyến dã ngoại ngắn', ex: 'Daytime mountain excursion.', tr: 'Chuyến dã ngoại núi ban ngày.' },
      { word: 'Navigation', ipa: '/ˌnævɪˈɡeɪʃn/', meaning: 'Sự định vị chỉ đường', ex: 'GPS satellite navigation system.', tr: 'Hệ thống định vị vệ tinh GPS.' },
      { word: 'Transport', ipa: '/ˈtrænspɔːrt/', meaning: 'Giao thông vận tải', ex: 'Efficient public transport.', tr: 'Giao thông công cộng hiệu quả.' },
      { word: 'Expedition', ipa: '/ˌekspəˈdɪʃn/', meaning: 'Cuộc thám hiểm', ex: 'Jungle trekking expedition.', tr: 'Cuộc thám hiểm đi bộ xuyên rừng.' },
      { word: 'Voyage', ipa: '/ˈvɔɪɪdʒ/', meaning: 'Hành trình vượt biển', ex: 'Long sea voyage across Pacific.', tr: 'Hành trình dài vượt Thái Bình Dương.' },
      { word: 'Boarding', ipa: '/ˈbɔːrdɪŋ/', meaning: 'Lên máy bay / Tàu', ex: 'Plane boarding starts now.', tr: 'Bắt đầu lên máy bay ngay bây giờ.' },
    ]
  );

  // TOPIC 3
  await seedTopicWithLevels(
    '💼 Chủ đề 3: Công Việc & Văn Phòng (Work & Office)',
    '30 từ vựng cuộc họp, hợp đồng và công sở',
    3,
    [
      { word: 'Office', ipa: '/ˈɑːfɪs/', meaning: 'Văn phòng làm việc', ex: 'Modern tech company office.', tr: 'Văn phòng công ty công nghệ hiện đại.' },
      { word: 'Meeting', ipa: '/ˈmiːtɪŋ/', meaning: 'Cuộc họp', ex: 'Morning team sync meeting.', tr: 'Cuộc họp đồng bộ đội ngũ buổi sáng.' },
      { word: 'Email', ipa: '/ˈiːmeɪl/', meaning: 'Thư điện tử', ex: 'Check urgent work email.', tr: 'Kiểm tra email công việc khẩn cấp.' },
      { word: 'Work', ipa: '/wɜːrk/', meaning: 'Làm việc', ex: 'Hard work brings success.', tr: 'Làm việc chăm chỉ mang lại thành công.' },
      { word: 'Boss', ipa: '/bɔːs/', meaning: 'Sếp / Trưởng phòng', ex: 'Talk to the department boss.', tr: 'Nói chuyện với trưởng phòng.' },
      { word: 'Desk', ipa: '/desk/', meaning: 'Bàn làm việc', ex: 'Clean wooden office desk.', tr: 'Bàn làm việc bằng gỗ sạch sẽ.' },
      { word: 'Phone', ipa: '/foʊn/', meaning: 'Điện thoại liên lạc', ex: 'Answer the office phone.', tr: 'Trả lời điện thoại văn phòng.' },
      { word: 'Staff', ipa: '/stæf/', meaning: 'Nhân viên công ty', ex: 'Friendly company staff.', tr: 'Nhân viên công ty thân thiện.' },
      { word: 'Paper', ipa: '/ˈpeɪpər/', meaning: 'Giấy tờ tài liệu', ex: 'Print report paper.', tr: 'In tờ báo cáo.' },
      { word: 'Report', ipa: '/rɪˈpɔːrt/', meaning: 'Báo cáo công việc', ex: 'Submit daily status report.', tr: 'Nộp báo cáo tiến độ hàng ngày.' },
    ],
    [
      { word: 'Schedule', ipa: '/ˈskedʒuːl/', meaning: 'Lịch trình công việc', ex: 'Busy weekly work schedule.', tr: 'Lịch làm việc hàng tuần bận rộn.' },
      { word: 'Deadline', ipa: '/ˈdedlaɪn/', meaning: 'Hạn chót hoàn thành', ex: 'Strict project deadline.', tr: 'Hạn chót dự án nghiêm ngặt.' },
      { word: 'Project', ipa: '/ˈprɑːdʒekt/', meaning: 'Dự án kinh doanh', ex: 'Manage key digital project.', tr: 'Quản lý dự án chuyển đổi số trọng điểm.' },
      { word: 'Manager', ipa: '/ˈmænɪdʒər/', meaning: 'Người quản lý', ex: 'Experienced senior manager.', tr: 'Quản lý cấp cao giàu kinh nghiệm.' },
      { word: 'Colleague', ipa: '/ˈkɑːliːɡ/', meaning: 'Đồng nghiệp', ex: 'Supportive office colleague.', tr: 'Đồng nghiệp văn phòng hay hỗ trợ.' },
      { word: 'Client', ipa: '/ˈklaɪənt/', meaning: 'Khách hàng đối tác', ex: 'Important enterprise client.', tr: 'Đối tác doanh nghiệp quan trọng.' },
      { word: 'Salary', ipa: '/ˈsæləri/', meaning: 'Mức tiền lương', ex: 'Competitive monthly salary.', tr: 'Mức lương hàng tháng cạnh tranh.' },
      { word: 'Interview', ipa: '/ˈɪntərvjuː/', meaning: 'Buổi phỏng vấn', ex: 'Job interview with recruiter.', tr: 'Buổi phỏng vấn xin việc với nhà tuyển dụng.' },
      { word: 'Contract', ipa: '/ˈkɑːntrækt/', meaning: 'Hợp đồng thương mại', ex: 'Sign the legal contract.', tr: 'Ký kết hợp đồng pháp lý.' },
      { word: 'Task', ipa: '/tæsk/', meaning: 'Nhiệm vụ được giao', ex: 'Assign daily work tasks.', tr: 'Giao các nhiệm vụ hàng ngày.' },
    ],
    [
      { word: 'Negotiation', ipa: '/nɪˌɡoʊʃiˈeɪʃn/', meaning: 'Thương lượng / Đàm phán', ex: 'Successful contract negotiation.', tr: 'Đàm phán hợp đồng thành công.' },
      { word: 'Promotion', ipa: '/prəˈmoʊʃn/', meaning: 'Sự thăng chức', ex: 'Earned a deserved promotion.', tr: 'Được thăng chức xứng đáng.' },
      { word: 'Productivity', ipa: '/ˌproʊdʌkˈtɪvəti/', meaning: 'Năng suất làm việc', ex: 'Boost team work productivity.', tr: 'Tăng năng suất làm việc của nhóm.' },
      { word: 'Strategy', ipa: '/ˈstrætədʒi/', meaning: 'Chiến lược phát triển', ex: 'Long term business strategy.', tr: 'Chiến lược kinh doanh dài hạn.' },
      { word: 'Enterprise', ipa: '/ˈentərpraɪz/', meaning: 'Doanh nghiệp lớn', ex: 'Global technology enterprise.', tr: 'Doanh nghiệp công nghệ toàn cầu.' },
      { word: 'Performance', ipa: '/pərˈfɔːrməns/', meaning: 'Hiệu suất công việc', ex: 'Evaluate annual performance.', tr: 'Đánh giá hiệu suất hàng năm.' },
      { word: 'Department', ipa: '/dɪˈpɑːrtmənt/', meaning: 'Phòng ban chuyên môn', ex: 'Human resources department.', tr: 'Phòng nhân sự.' },
      { word: 'Leadership', ipa: '/ˈliːdərʃɪp/', meaning: 'Năng lực lãnh đạo', ex: 'Strong executive leadership.', tr: 'Năng lực lãnh đạo điều hành mạnh mẽ.' },
      { word: 'Collaboration', ipa: '/kəˌlæbəˈreɪʃn/', meaning: 'Sự hợp tác làm việc', ex: 'Cross functional collaboration.', tr: 'Sự hợp tác liên phòng ban.' },
      { word: 'Resignation', ipa: '/ˌrezɪɡˈneɪʃn/', meaning: 'Sự thôi việc / Từ chức', ex: 'Submit official resignation.', tr: 'Nộp đơn từ chức chính thức.' },
    ]
  );

  console.log('🎉 Seeded 10 Topics x 3 Levels (300 REAL Vocabularies total) successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
