/**
 * seed-extra.ts — Thêm 10 chủ đề mới vào khóa học hiện có
 * Chạy: npx ts-node prisma/seed-extra.ts
 *
 * Chủ đề 4–13:
 *  4. Sức Khỏe & Bệnh Viện
 *  5. Công Nghệ & Internet
 *  6. Tài Chính & Ngân Hàng
 *  7. Thể Thao & Giải Trí
 *  8. Môi Trường & Thiên Nhiên
 *  9. Tình Cảm & Mối Quan Hệ
 * 10. Mua Sắm & Thời Trang
 * 11. Giáo Dục & Học Tập
 * 12. TOEIC Cơ Bản
 * 13. Phỏng Vấn & Sự Nghiệp
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type VocabItem = { word: string; ipa: string; meaning: string; ex: string; tr: string };

async function main() {
  console.log('🌱 Seeding 10 extra topics (chủ đề 4–13)...');

  // Tìm course hiện có
  const course = await prisma.course.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!course) throw new Error('Không tìm thấy course! Chạy seed.ts trước.');

  const currentCount = await prisma.unit.count({ where: { courseId: course.id } });

  const seedTopic = async (
    unitTitle: string,
    unitDesc: string,
    orderIndex: number,
    easy: VocabItem[],
    medium: VocabItem[],
    hard: VocabItem[],
  ) => {
    // Kiểm tra nếu unit đã tồn tại (tránh duplicate)
    const existing = await prisma.unit.findFirst({ where: { title: unitTitle } });
    if (existing) {
      console.log(`⏭️  Skip "${unitTitle}" — đã tồn tại`);
      return;
    }

    const unit = await prisma.unit.create({
      data: { courseId: course.id, title: unitTitle, description: unitDesc, orderIndex },
    });

    const seedLevel = async (name: string, desc: string, xp: number, order: number, list: VocabItem[]) => {
      const lesson = await prisma.lesson.create({
        data: { unitId: unit.id, title: name, description: desc, xpReward: xp, orderIndex: order },
      });

      for (const item of list) {
        const v = await prisma.vocabulary.upsert({
          where: { word: item.word },
          update: { ipa: item.ipa, meaning: item.meaning, exampleSentence: item.ex, exampleTranslation: item.tr },
          create: { word: item.word, ipa: item.ipa, meaning: item.meaning, exampleSentence: item.ex, exampleTranslation: item.tr },
        });
        await prisma.lessonVocabulary.create({ data: { lessonId: lesson.id, vocabularyId: v.id } });

        const wrong = list.filter(i => i.word !== v.word).map(i => i.meaning).sort(() => Math.random() - 0.5).slice(0, 3);
        const opts = [v.meaning, ...wrong].sort(() => Math.random() - 0.5);

        await prisma.question.create({
          data: {
            lessonId: lesson.id,
            type: 'MULTIPLE_CHOICE',
            prompt: `Từ "${v.word}" ${v.ipa ? `(${v.ipa})` : ''} có nghĩa là gì?`,
            options: JSON.stringify(opts),
            correctAnswer: v.meaning,
            explanation: `"${v.word}" nghĩa là: ${v.meaning}. Ví dụ: "${v.exampleSentence}"`,
            orderIndex: 1,
          },
        });
      }
    };

    await seedLevel('🟢 Cấp Mức Dễ (Easy)', 'Học 10 từ vựng căn bản nhất', 20, 1, easy);
    await seedLevel('🟡 Cấp Mức Trung Bình (Medium)', 'Học 10 từ vựng thực tế', 30, 2, medium);
    await seedLevel('🔴 Cấp Mức Khó (Hard)', 'Học 10 từ vựng nâng cao', 40, 3, hard);
    console.log(`✅ Seeded: ${unitTitle}`);
  };

  // ================================================================
  // CHỦ ĐỀ 4: SỨC KHỎE & BỆNH VIỆN
  // ================================================================
  await seedTopic(
    '🏥 Chủ đề 4: Sức Khỏe & Bệnh Viện (Health & Hospital)',
    '30 từ vựng khám bệnh, thuốc và sức khỏe',
    currentCount + 1,
    [
      { word: 'Doctor', ipa: '/ˈdɑːktər/', meaning: 'Bác sĩ', ex: 'See a doctor today.', tr: 'Đi khám bác sĩ hôm nay.' },
      { word: 'Hospital', ipa: '/ˈhɑːspɪtl/', meaning: 'Bệnh viện', ex: 'Go to the hospital.', tr: 'Đi đến bệnh viện.' },
      { word: 'Medicine', ipa: '/ˈmedsn/', meaning: 'Thuốc chữa bệnh', ex: 'Take this medicine daily.', tr: 'Uống thuốc này hàng ngày.' },
      { word: 'Nurse', ipa: '/nɜːrs/', meaning: 'Y tá', ex: 'The nurse is kind.', tr: 'Y tá rất tử tế.' },
      { word: 'Pain', ipa: '/peɪn/', meaning: 'Cơn đau', ex: 'Feel pain in chest.', tr: 'Cảm thấy đau ở ngực.' },
      { word: 'Fever', ipa: '/ˈfiːvər/', meaning: 'Sốt cao', ex: 'High fever for 2 days.', tr: 'Sốt cao 2 ngày.' },
      { word: 'Healthy', ipa: '/ˈhelθi/', meaning: 'Khỏe mạnh', ex: 'Stay healthy and active.', tr: 'Giữ sức khỏe và năng động.' },
      { word: 'Sick', ipa: '/sɪk/', meaning: 'Bị ốm', ex: 'Feeling very sick today.', tr: 'Cảm thấy rất ốm hôm nay.' },
      { word: 'Blood', ipa: '/blʌd/', meaning: 'Máu', ex: 'Blood test results.', tr: 'Kết quả xét nghiệm máu.' },
      { word: 'Cough', ipa: '/kɔːf/', meaning: 'Ho', ex: 'Dry cough at night.', tr: 'Ho khan vào ban đêm.' },
    ],
    [
      { word: 'Symptom', ipa: '/ˈsɪmptəm/', meaning: 'Triệu chứng bệnh', ex: 'Describe all symptoms clearly.', tr: 'Mô tả rõ các triệu chứng.' },
      { word: 'Prescription', ipa: '/prɪˈskrɪpʃn/', meaning: 'Đơn thuốc kê', ex: 'Doctor wrote prescription.', tr: 'Bác sĩ kê đơn thuốc.' },
      { word: 'Appointment', ipa: '/əˈpɔɪntmənt/', meaning: 'Lịch hẹn khám', ex: 'Book doctor appointment.', tr: 'Đặt lịch hẹn khám bác sĩ.' },
      { word: 'Allergy', ipa: '/ˈælədʒi/', meaning: 'Dị ứng', ex: 'Peanut allergy reaction.', tr: 'Phản ứng dị ứng đậu phộng.' },
      { word: 'Injection', ipa: '/ɪnˈdʒekʃn/', meaning: 'Mũi tiêm thuốc', ex: 'Vitamin B injection shot.', tr: 'Tiêm vitamin B.' },
      { word: 'Surgery', ipa: '/ˈsɜːrdʒəri/', meaning: 'Phẫu thuật', ex: 'Minor outpatient surgery.', tr: 'Phẫu thuật nhỏ ngoại trú.' },
      { word: 'Pharmacy', ipa: '/ˈfɑːrməsi/', meaning: 'Nhà thuốc', ex: 'Buy at the pharmacy.', tr: 'Mua ở nhà thuốc.' },
      { word: 'Ambulance', ipa: '/ˈæmbjuləns/', meaning: 'Xe cứu thương', ex: 'Call an ambulance now.', tr: 'Gọi xe cứu thương ngay.' },
      { word: 'Diagnose', ipa: '/ˈdaɪəɡnoʊz/', meaning: 'Chẩn đoán bệnh', ex: 'Diagnose the rare disease.', tr: 'Chẩn đoán căn bệnh hiếm.' },
      { word: 'Recovery', ipa: '/rɪˈkʌvəri/', meaning: 'Sự hồi phục', ex: 'Speedy full recovery.', tr: 'Hồi phục nhanh hoàn toàn.' },
    ],
    [
      { word: 'Diagnosis', ipa: '/ˌdaɪəɡˈnoʊsɪs/', meaning: 'Kết quả chẩn đoán', ex: 'Final medical diagnosis.', tr: 'Kết quả chẩn đoán y tế cuối cùng.' },
      { word: 'Rehabilitation', ipa: '/ˌriːhəˌbɪlɪˈteɪʃn/', meaning: 'Phục hồi chức năng', ex: 'Physical rehabilitation program.', tr: 'Chương trình phục hồi chức năng.' },
      { word: 'Cardiology', ipa: '/ˌkɑːrdiˈɑːlədʒi/', meaning: 'Tim mạch học', ex: 'Specialist in cardiology.', tr: 'Chuyên gia tim mạch học.' },
      { word: 'Hypertension', ipa: '/ˌhaɪpərˈtenʃn/', meaning: 'Tăng huyết áp', ex: 'Chronic hypertension control.', tr: 'Kiểm soát tăng huyết áp mãn tính.' },
      { word: 'Inflammation', ipa: '/ˌɪnfləˈmeɪʃn/', meaning: 'Tình trạng viêm', ex: 'Joint inflammation pain.', tr: 'Đau do viêm khớp.' },
      { word: 'Antibiotic', ipa: '/ˌæntibaɪˈɑːtɪk/', meaning: 'Thuốc kháng sinh', ex: 'Complete the antibiotic course.', tr: 'Hoàn thành liệu trình kháng sinh.' },
      { word: 'Vaccination', ipa: '/ˌvæksɪˈneɪʃn/', meaning: 'Chủng ngừa vắc-xin', ex: 'Annual flu vaccination.', tr: 'Tiêm vắc-xin cúm hàng năm.' },
      { word: 'Anesthesia', ipa: '/ˌænəsˈθiːʒə/', meaning: 'Gây mê phẫu thuật', ex: 'General anesthesia applied.', tr: 'Áp dụng gây mê toàn thân.' },
      { word: 'Pathology', ipa: '/pəˈθɑːlədʒi/', meaning: 'Khoa bệnh lý học', ex: 'Send sample to pathology.', tr: 'Gửi mẫu đến khoa bệnh lý.' },
      { word: 'Prognosis', ipa: '/prɑːɡˈnoʊsɪs/', meaning: 'Tiên lượng bệnh', ex: 'Positive prognosis given.', tr: 'Tiên lượng bệnh tích cực.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 5: CÔNG NGHỆ & INTERNET
  // ================================================================
  await seedTopic(
    '💻 Chủ đề 5: Công Nghệ & Internet (Technology & Internet)',
    '30 từ vựng về thiết bị, mạng xã hội và công nghệ số',
    currentCount + 2,
    [
      { word: 'Phone', ipa: '/foʊn/', meaning: 'Điện thoại di động', ex: 'New smartphone model.', tr: 'Mẫu điện thoại thông minh mới.' },
      { word: 'Computer', ipa: '/kəmˈpjuːtər/', meaning: 'Máy tính', ex: 'Fast laptop computer.', tr: 'Máy tính xách tay nhanh.' },
      { word: 'Internet', ipa: '/ˈɪntərnet/', meaning: 'Mạng Internet', ex: 'Fast internet connection.', tr: 'Kết nối internet nhanh.' },
      { word: 'Screen', ipa: '/skriːn/', meaning: 'Màn hình', ex: 'Bright HD screen.', tr: 'Màn hình HD sáng đẹp.' },
      { word: 'Keyboard', ipa: '/ˈkiːbɔːrd/', meaning: 'Bàn phím', ex: 'Wireless mechanical keyboard.', tr: 'Bàn phím cơ không dây.' },
      { word: 'Camera', ipa: '/ˈkæmərə/', meaning: 'Máy ảnh / Camera', ex: 'High resolution camera.', tr: 'Camera độ phân giải cao.' },
      { word: 'Password', ipa: '/ˈpæswɜːrd/', meaning: 'Mật khẩu bảo mật', ex: 'Strong account password.', tr: 'Mật khẩu tài khoản mạnh.' },
      { word: 'Battery', ipa: '/ˈbætəri/', meaning: 'Pin thiết bị', ex: 'Low phone battery.', tr: 'Pin điện thoại yếu.' },
      { word: 'Download', ipa: '/ˈdaʊnloʊd/', meaning: 'Tải xuống dữ liệu', ex: 'Download the free app.', tr: 'Tải xuống ứng dụng miễn phí.' },
      { word: 'Upload', ipa: '/ˈʌploʊd/', meaning: 'Tải lên dữ liệu', ex: 'Upload photo to cloud.', tr: 'Tải ảnh lên đám mây.' },
    ],
    [
      { word: 'Software', ipa: '/ˈsɔːftwer/', meaning: 'Phần mềm máy tính', ex: 'Update the software.', tr: 'Cập nhật phần mềm.' },
      { word: 'Application', ipa: '/ˌæplɪˈkeɪʃn/', meaning: 'Ứng dụng di động', ex: 'Language learning app.', tr: 'Ứng dụng học ngôn ngữ.' },
      { word: 'Database', ipa: '/ˈdeɪtəbeɪs/', meaning: 'Cơ sở dữ liệu', ex: 'Store data in database.', tr: 'Lưu dữ liệu trong cơ sở dữ liệu.' },
      { word: 'Network', ipa: '/ˈnetwɜːrk/', meaning: 'Mạng kết nối', ex: 'Secure home network.', tr: 'Mạng gia đình bảo mật.' },
      { word: 'Cloud', ipa: '/klaʊd/', meaning: 'Điện toán đám mây', ex: 'Store files in cloud.', tr: 'Lưu tệp trên đám mây.' },
      { word: 'Virus', ipa: '/ˈvaɪrəs/', meaning: 'Vi rút máy tính', ex: 'Detect computer virus.', tr: 'Phát hiện vi rút máy tính.' },
      { word: 'Hacker', ipa: '/ˈhækər/', meaning: 'Tin tặc xâm nhập', ex: 'Block the hacker attack.', tr: 'Chặn cuộc tấn công tin tặc.' },
      { word: 'WiFi', ipa: '/ˈwaɪfaɪ/', meaning: 'Mạng không dây', ex: 'Connect to public WiFi.', tr: 'Kết nối WiFi công cộng.' },
      { word: 'Bluetooth', ipa: '/ˈbluːtuːθ/', meaning: 'Kết nối Bluetooth', ex: 'Pair via Bluetooth.', tr: 'Ghép đôi qua Bluetooth.' },
      { word: 'Notification', ipa: '/ˌnoʊtɪfɪˈkeɪʃn/', meaning: 'Thông báo ứng dụng', ex: 'Turn off phone notifications.', tr: 'Tắt thông báo điện thoại.' },
    ],
    [
      { word: 'Algorithm', ipa: '/ˈælɡərɪðəm/', meaning: 'Thuật toán xử lý', ex: 'AI search algorithm.', tr: 'Thuật toán tìm kiếm AI.' },
      { word: 'Cybersecurity', ipa: '/ˌsaɪbərsɪˈkjʊərəti/', meaning: 'An ninh mạng', ex: 'Improve cybersecurity systems.', tr: 'Cải thiện hệ thống an ninh mạng.' },
      { word: 'Encryption', ipa: '/ɪnˈkrɪpʃn/', meaning: 'Mã hóa dữ liệu', ex: 'End to end encryption.', tr: 'Mã hóa đầu cuối.' },
      { word: 'Bandwidth', ipa: '/ˈbændwɪdθ/', meaning: 'Băng thông mạng', ex: 'High bandwidth connection.', tr: 'Kết nối băng thông cao.' },
      { word: 'Artificial Intelligence', ipa: '/ˌɑːrtɪˈfɪʃl ɪnˈtelɪdʒəns/', meaning: 'Trí tuệ nhân tạo', ex: 'AI in daily life.', tr: 'AI trong cuộc sống hàng ngày.' },
      { word: 'Blockchain', ipa: '/ˈblɒktʃeɪn/', meaning: 'Chuỗi khối dữ liệu', ex: 'Secure blockchain transaction.', tr: 'Giao dịch blockchain bảo mật.' },
      { word: 'Automation', ipa: '/ˌɔːtəˈmeɪʃn/', meaning: 'Tự động hóa quy trình', ex: 'Factory process automation.', tr: 'Tự động hóa quy trình nhà máy.' },
      { word: 'Interface', ipa: '/ˈɪntərfeɪs/', meaning: 'Giao diện người dùng', ex: 'User friendly interface.', tr: 'Giao diện thân thiện người dùng.' },
      { word: 'Processor', ipa: '/ˈprɑːsesər/', meaning: 'Bộ xử lý chip', ex: 'Fast multi-core processor.', tr: 'Bộ xử lý đa nhân tốc độ cao.' },
      { word: 'Semiconductor', ipa: '/ˌsemikənˈdʌktər/', meaning: 'Chất bán dẫn điện', ex: 'Silicon semiconductor chip.', tr: 'Chip bán dẫn silicon.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 6: TÀI CHÍNH & NGÂN HÀNG
  // ================================================================
  await seedTopic(
    '💰 Chủ đề 6: Tài Chính & Ngân Hàng (Finance & Banking)',
    '30 từ vựng về tiền tệ, đầu tư và giao dịch ngân hàng',
    currentCount + 3,
    [
      { word: 'Money', ipa: '/ˈmʌni/', meaning: 'Tiền bạc', ex: 'Save more money monthly.', tr: 'Tiết kiệm thêm tiền mỗi tháng.' },
      { word: 'Bank', ipa: '/bæŋk/', meaning: 'Ngân hàng', ex: 'Open a bank account.', tr: 'Mở tài khoản ngân hàng.' },
      { word: 'Pay', ipa: '/peɪ/', meaning: 'Thanh toán', ex: 'Pay by credit card.', tr: 'Thanh toán bằng thẻ tín dụng.' },
      { word: 'Price', ipa: '/praɪs/', meaning: 'Giá tiền', ex: 'Check the sale price.', tr: 'Kiểm tra giá bán.' },
      { word: 'Cheap', ipa: '/tʃiːp/', meaning: 'Giá rẻ', ex: 'Buy cheap but quality.', tr: 'Mua rẻ nhưng chất lượng.' },
      { word: 'Expensive', ipa: '/ɪkˈspensɪv/', meaning: 'Đắt tiền', ex: 'Too expensive for me.', tr: 'Quá đắt tiền với tôi.' },
      { word: 'Coin', ipa: '/kɔɪn/', meaning: 'Đồng xu tiền', ex: 'Gold coin collection.', tr: 'Bộ sưu tập đồng xu vàng.' },
      { word: 'Cash', ipa: '/kæʃ/', meaning: 'Tiền mặt', ex: 'Pay with cash only.', tr: 'Chỉ thanh toán bằng tiền mặt.' },
      { word: 'Profit', ipa: '/ˈprɑːfɪt/', meaning: 'Lợi nhuận kinh doanh', ex: 'High monthly profit.', tr: 'Lợi nhuận tháng cao.' },
      { word: 'Budget', ipa: '/ˈbʌdʒɪt/', meaning: 'Ngân sách dự phòng', ex: 'Plan family budget.', tr: 'Lập ngân sách gia đình.' },
    ],
    [
      { word: 'Investment', ipa: '/ɪnˈvestmənt/', meaning: 'Đầu tư tài chính', ex: 'Long term investment.', tr: 'Đầu tư dài hạn.' },
      { word: 'Interest Rate', ipa: '/ˈɪntrəst reɪt/', meaning: 'Lãi suất ngân hàng', ex: 'Low interest rate loan.', tr: 'Vay lãi suất thấp.' },
      { word: 'Mortgage', ipa: '/ˈmɔːrɡɪdʒ/', meaning: 'Thế chấp mua nhà', ex: '30-year home mortgage.', tr: 'Thế chấp nhà 30 năm.' },
      { word: 'Transaction', ipa: '/trænˈzækʃn/', meaning: 'Giao dịch chuyển khoản', ex: 'Online bank transaction.', tr: 'Giao dịch ngân hàng trực tuyến.' },
      { word: 'Withdraw', ipa: '/wɪðˈdrɔː/', meaning: 'Rút tiền ATM', ex: 'Withdraw cash from ATM.', tr: 'Rút tiền mặt từ ATM.' },
      { word: 'Deposit', ipa: '/dɪˈpɑːzɪt/', meaning: 'Gửi tiền tiết kiệm', ex: 'Deposit monthly salary.', tr: 'Gửi lương hàng tháng.' },
      { word: 'Currency', ipa: '/ˈkɜːrənsi/', meaning: 'Đơn vị tiền tệ', ex: 'Exchange foreign currency.', tr: 'Đổi ngoại tệ.' },
      { word: 'Dividend', ipa: '/ˈdɪvɪdend/', meaning: 'Cổ tức cổ phần', ex: 'Receive stock dividend.', tr: 'Nhận cổ tức cổ phiếu.' },
      { word: 'Inflation', ipa: '/ɪnˈfleɪʃn/', meaning: 'Lạm phát kinh tế', ex: 'High annual inflation.', tr: 'Lạm phát hàng năm cao.' },
      { word: 'Loan', ipa: '/loʊn/', meaning: 'Khoản vay ngân hàng', ex: 'Apply for bank loan.', tr: 'Xin vay vốn ngân hàng.' },
    ],
    [
      { word: 'Portfolio', ipa: '/pɔːrtˈfoʊlioʊ/', meaning: 'Danh mục đầu tư', ex: 'Diversified investment portfolio.', tr: 'Danh mục đầu tư đa dạng hóa.' },
      { word: 'Cryptocurrency', ipa: '/ˌkrɪptoʊˈkɜːrənsi/', meaning: 'Tiền điện tử mã hóa', ex: 'Bitcoin cryptocurrency market.', tr: 'Thị trường tiền điện tử Bitcoin.' },
      { word: 'Equity', ipa: '/ˈekwɪti/', meaning: 'Vốn chủ sở hữu', ex: 'Build home equity.', tr: 'Tích lũy vốn sở hữu nhà.' },
      { word: 'Derivatives', ipa: '/dɪˈrɪvətɪvz/', meaning: 'Công cụ phái sinh tài chính', ex: 'Trade financial derivatives.', tr: 'Giao dịch công cụ phái sinh tài chính.' },
      { word: 'Hedge Fund', ipa: '/hedʒ fʌnd/', meaning: 'Quỹ phòng hộ', ex: 'Invest in hedge fund.', tr: 'Đầu tư vào quỹ phòng hộ.' },
      { word: 'Liquidity', ipa: '/lɪˈkwɪdɪti/', meaning: 'Tính thanh khoản vốn', ex: 'High asset liquidity.', tr: 'Tài sản thanh khoản cao.' },
      { word: 'Amortization', ipa: '/əˌmɔːrtɪˈzeɪʃn/', meaning: 'Khấu hao dần vốn', ex: 'Loan amortization schedule.', tr: 'Lịch khấu hao khoản vay.' },
      { word: 'Arbitrage', ipa: '/ˈɑːrbɪtrɑːʒ/', meaning: 'Kinh doanh chênh lệch giá', ex: 'Currency arbitrage trading.', tr: 'Giao dịch kiếm lời chênh lệch tiền tệ.' },
      { word: 'Collateral', ipa: '/kəˈlætərəl/', meaning: 'Tài sản thế chấp', ex: 'Property as collateral.', tr: 'Bất động sản làm tài sản thế chấp.' },
      { word: 'Fiscal Policy', ipa: '/ˈfɪskl ˈpɑːləsi/', meaning: 'Chính sách tài khóa', ex: 'Government fiscal policy.', tr: 'Chính sách tài khóa của chính phủ.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 7: THỂ THAO & GIẢI TRÍ
  // ================================================================
  await seedTopic(
    '⚽ Chủ đề 7: Thể Thao & Giải Trí (Sports & Entertainment)',
    '30 từ vựng về thi đấu thể thao và giải trí',
    currentCount + 4,
    [
      { word: 'Football', ipa: '/ˈfʊtbɔːl/', meaning: 'Bóng đá', ex: 'Play football with friends.', tr: 'Chơi bóng đá với bạn bè.' },
      { word: 'Team', ipa: '/tiːm/', meaning: 'Đội thi đấu', ex: 'Strong national team.', tr: 'Đội tuyển quốc gia mạnh.' },
      { word: 'Win', ipa: '/wɪn/', meaning: 'Chiến thắng', ex: 'Win the final match.', tr: 'Thắng trận chung kết.' },
      { word: 'Lose', ipa: '/luːz/', meaning: 'Thua trận', ex: 'Lose gracefully today.', tr: 'Thua một cách thể thao hôm nay.' },
      { word: 'Goal', ipa: '/ɡoʊl/', meaning: 'Bàn thắng / Mục tiêu', ex: 'Score a brilliant goal.', tr: 'Ghi một bàn thắng rực rỡ.' },
      { word: 'Run', ipa: '/rʌn/', meaning: 'Chạy bộ', ex: 'Run 5km every morning.', tr: 'Chạy 5km mỗi buổi sáng.' },
      { word: 'Swim', ipa: '/swɪm/', meaning: 'Bơi lội', ex: 'Swim in the pool.', tr: 'Bơi trong hồ bơi.' },
      { word: 'Champion', ipa: '/ˈtʃæmpiən/', meaning: 'Nhà vô địch', ex: 'World boxing champion.', tr: 'Nhà vô địch quyền anh thế giới.' },
      { word: 'Match', ipa: '/mætʃ/', meaning: 'Trận đấu', ex: 'Exciting final match.', tr: 'Trận chung kết hấp dẫn.' },
      { word: 'Player', ipa: '/ˈpleɪər/', meaning: 'Cầu thủ / Người chơi', ex: 'Star football player.', tr: 'Cầu thủ bóng đá ngôi sao.' },
    ],
    [
      { word: 'Tournament', ipa: '/ˈtɜːrnəmənt/', meaning: 'Giải đấu thể thao', ex: 'National basketball tournament.', tr: 'Giải bóng rổ quốc gia.' },
      { word: 'Stadium', ipa: '/ˈsteɪdiəm/', meaning: 'Sân vận động', ex: 'Packed national stadium.', tr: 'Sân vận động quốc gia đầy người.' },
      { word: 'Coach', ipa: '/koʊtʃ/', meaning: 'Huấn luyện viên', ex: 'Experienced head coach.', tr: 'Huấn luyện viên trưởng kinh nghiệm.' },
      { word: 'Referee', ipa: '/ˌrefəˈriː/', meaning: 'Trọng tài', ex: 'Fair game referee.', tr: 'Trọng tài công bằng.' },
      { word: 'Olympic', ipa: '/əˈlɪmpɪk/', meaning: 'Thế vận hội Olympic', ex: 'Olympic gold medal.', tr: 'Huy chương vàng Olympic.' },
      { word: 'Athlete', ipa: '/ˈæθliːt/', meaning: 'Vận động viên', ex: 'Professional elite athlete.', tr: 'Vận động viên chuyên nghiệp ưu tú.' },
      { word: 'Score', ipa: '/skɔːr/', meaning: 'Tỉ số / Điểm số', ex: 'Final game score.', tr: 'Tỉ số trận đấu cuối.' },
      { word: 'Gym', ipa: '/dʒɪm/', meaning: 'Phòng tập thể dục', ex: 'Daily gym workout.', tr: 'Tập thể dục tại phòng gym hàng ngày.' },
      { word: 'Medal', ipa: '/ˈmedl/', meaning: 'Huy chương thi đấu', ex: 'Silver Olympic medal.', tr: 'Huy chương bạc Olympic.' },
      { word: 'Penalty', ipa: '/ˈpenəlti/', meaning: 'Quả phạt đền', ex: 'Missed penalty kick.', tr: 'Đá hỏng quả phạt đền.' },
    ],
    [
      { word: 'Sportsmanship', ipa: '/ˈspɔːrtsmənʃɪp/', meaning: 'Tinh thần thể thao', ex: 'Show true sportsmanship.', tr: 'Thể hiện tinh thần thể thao thật sự.' },
      { word: 'Doping', ipa: '/ˈdoʊpɪŋ/', meaning: 'Dùng doping gian lận', ex: 'Banned for doping test.', tr: 'Bị cấm vì xét nghiệm doping.' },
      { word: 'Endurance', ipa: '/ɪnˈdjʊərəns/', meaning: 'Sức chịu đựng bền bỉ', ex: 'Build marathon endurance.', tr: 'Xây dựng sức bền marathon.' },
      { word: 'Aerobics', ipa: '/eˈroʊbɪks/', meaning: 'Bài tập thể dục nhịp điệu', ex: 'Morning aerobics class.', tr: 'Lớp thể dục nhịp điệu buổi sáng.' },
      { word: 'Biomechanics', ipa: '/ˌbaɪoʊmɪˈkænɪks/', meaning: 'Sinh cơ học thể thao', ex: 'Sports biomechanics study.', tr: 'Nghiên cứu sinh cơ học thể thao.' },
      { word: 'Commentator', ipa: '/ˈkɑːmənteɪtər/', meaning: 'Bình luận viên thể thao', ex: 'Live match commentator.', tr: 'Bình luận viên trận đấu trực tiếp.' },
      { word: 'Spectator', ipa: '/ˈspekteɪtər/', meaning: 'Khán giả xem thi đấu', ex: '80000 stadium spectators.', tr: '80.000 khán giả trên sân vận động.' },
      { word: 'Decathlon', ipa: '/dɪˈkæθlɑːn/', meaning: 'Mười môn phối hợp', ex: 'Olympic decathlon event.', tr: 'Nội dung mười môn Olympic.' },
      { word: 'Triathlon', ipa: '/traɪˈæθlɑːn/', meaning: 'Ba môn phối hợp', ex: 'Ironman triathlon race.', tr: 'Cuộc đua Ironman ba môn phối hợp.' },
      { word: 'Perseverance', ipa: '/ˌpɜːrsɪˈvɪərəns/', meaning: 'Sự kiên trì bền bỉ', ex: 'Athletic perseverance wins.', tr: 'Sự kiên trì của vận động viên giành chiến thắng.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 8: MÔI TRƯỜNG & THIÊN NHIÊN
  // ================================================================
  await seedTopic(
    '🌿 Chủ đề 8: Môi Trường & Thiên Nhiên (Environment & Nature)',
    '30 từ vựng về thiên nhiên, khí hậu và bảo vệ môi trường',
    currentCount + 5,
    [
      { word: 'Sun', ipa: '/sʌn/', meaning: 'Mặt trời', ex: 'Bright morning sun.', tr: 'Mặt trời buổi sáng rực rỡ.' },
      { word: 'Rain', ipa: '/reɪn/', meaning: 'Mưa', ex: 'Heavy rain today.', tr: 'Mưa lớn hôm nay.' },
      { word: 'Tree', ipa: '/triː/', meaning: 'Cây xanh', ex: 'Plant more trees.', tr: 'Trồng thêm cây xanh.' },
      { word: 'Ocean', ipa: '/ˈoʊʃn/', meaning: 'Đại dương', ex: 'Deep blue ocean.', tr: 'Đại dương xanh sâu.' },
      { word: 'Mountain', ipa: '/ˈmaʊntən/', meaning: 'Núi cao', ex: 'Snow-capped mountain peak.', tr: 'Đỉnh núi cao phủ tuyết.' },
      { word: 'Wind', ipa: '/wɪnd/', meaning: 'Gió', ex: 'Strong coastal wind.', tr: 'Gió ven biển mạnh.' },
      { word: 'River', ipa: '/ˈrɪvər/', meaning: 'Con sông', ex: 'Long flowing river.', tr: 'Con sông dài chảy mạnh.' },
      { word: 'Forest', ipa: '/ˈfɔːrɪst/', meaning: 'Rừng cây', ex: 'Protect the rainforest.', tr: 'Bảo vệ rừng nhiệt đới.' },
      { word: 'Animal', ipa: '/ˈænɪml/', meaning: 'Động vật', ex: 'Wild jungle animal.', tr: 'Động vật hoang dã trong rừng.' },
      { word: 'Flower', ipa: '/ˈflaʊər/', meaning: 'Bông hoa', ex: 'Colorful spring flower.', tr: 'Bông hoa mùa xuân đầy màu sắc.' },
    ],
    [
      { word: 'Climate', ipa: '/ˈklaɪmət/', meaning: 'Khí hậu', ex: 'Changing global climate.', tr: 'Khí hậu toàn cầu đang thay đổi.' },
      { word: 'Pollution', ipa: '/pəˈluːʃn/', meaning: 'Ô nhiễm môi trường', ex: 'Reduce air pollution.', tr: 'Giảm ô nhiễm không khí.' },
      { word: 'Recycle', ipa: '/ˌriːˈsaɪkl/', meaning: 'Tái chế rác thải', ex: 'Recycle plastic bottles.', tr: 'Tái chế chai nhựa.' },
      { word: 'Ecosystem', ipa: '/ˈiːkoʊsɪstəm/', meaning: 'Hệ sinh thái', ex: 'Fragile coral ecosystem.', tr: 'Hệ sinh thái san hô mong manh.' },
      { word: 'Species', ipa: '/ˈspiːʃiːz/', meaning: 'Loài sinh vật', ex: 'Endangered animal species.', tr: 'Loài động vật có nguy cơ tuyệt chủng.' },
      { word: 'Drought', ipa: '/draʊt/', meaning: 'Hạn hán', ex: 'Severe summer drought.', tr: 'Hạn hán mùa hè nghiêm trọng.' },
      { word: 'Flood', ipa: '/flʌd/', meaning: 'Lũ lụt', ex: 'Flash flood warning.', tr: 'Cảnh báo lũ lụt bất ngờ.' },
      { word: 'Renewable', ipa: '/rɪˈnjuːəbl/', meaning: 'Năng lượng tái tạo', ex: 'Solar renewable energy.', tr: 'Năng lượng mặt trời tái tạo.' },
      { word: 'Wildlife', ipa: '/ˈwaɪldlaɪf/', meaning: 'Động thực vật hoang dã', ex: 'Protect local wildlife.', tr: 'Bảo vệ động thực vật hoang dã địa phương.' },
      { word: 'Conservation', ipa: '/ˌkɑːnsərˈveɪʃn/', meaning: 'Bảo tồn thiên nhiên', ex: 'Ocean conservation effort.', tr: 'Nỗ lực bảo tồn đại dương.' },
    ],
    [
      { word: 'Biodiversity', ipa: '/ˌbaɪoʊdaɪˈvɜːrsɪti/', meaning: 'Đa dạng sinh học', ex: 'Protect Amazon biodiversity.', tr: 'Bảo vệ đa dạng sinh học Amazon.' },
      { word: 'Deforestation', ipa: '/ˌdiːˌfɒrɪˈsteɪʃn/', meaning: 'Phá rừng đầu nguồn', ex: 'Stop illegal deforestation.', tr: 'Ngăn chặn phá rừng bất hợp pháp.' },
      { word: 'Sustainability', ipa: '/səˌsteɪnəˈbɪlɪti/', meaning: 'Tính bền vững lâu dài', ex: 'Environmental sustainability goals.', tr: 'Mục tiêu bền vững môi trường.' },
      { word: 'Carbon Footprint', ipa: '/ˈkɑːrbən ˈfʊtprɪnt/', meaning: 'Dấu chân carbon', ex: 'Reduce carbon footprint.', tr: 'Giảm dấu chân carbon.' },
      { word: 'Photosynthesis', ipa: '/ˌfoʊtoʊˈsɪnθəsɪs/', meaning: 'Quang hợp thực vật', ex: 'Plants use photosynthesis.', tr: 'Thực vật dùng quang hợp.' },
      { word: 'Permafrost', ipa: '/ˈpɜːrməfrɒst/', meaning: 'Đất đóng băng vĩnh cửu', ex: 'Arctic permafrost melting.', tr: 'Băng vĩnh cửu Bắc Cực đang tan.' },
      { word: 'Glacial', ipa: '/ˈɡleɪʃl/', meaning: 'Thuộc về sông băng', ex: 'Glacial ice retreat.', tr: 'Sông băng đang rút lui.' },
      { word: 'Geothermal', ipa: '/ˌdʒiːoʊˈθɜːrml/', meaning: 'Địa nhiệt năng', ex: 'Geothermal energy plant.', tr: 'Nhà máy điện địa nhiệt.' },
      { word: 'Atmospheric', ipa: '/ˌætməsˈferɪk/', meaning: 'Thuộc về khí quyển', ex: 'Atmospheric CO2 levels.', tr: 'Mức CO2 trong khí quyển.' },
      { word: 'Desertification', ipa: '/dɪˌzɜːrtɪfɪˈkeɪʃn/', meaning: 'Sa mạc hóa đất đai', ex: 'Prevent land desertification.', tr: 'Ngăn chặn sa mạc hóa đất.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 9: TOEIC CƠ BẢN
  // ================================================================
  await seedTopic(
    '📊 Chủ đề 9: TOEIC Cơ Bản (Basic TOEIC Vocabulary)',
    '30 từ vựng TOEIC thường gặp trong đề thi',
    currentCount + 6,
    [
      { word: 'Confirm', ipa: '/kənˈfɜːrm/', meaning: 'Xác nhận thông tin', ex: 'Confirm your booking.', tr: 'Xác nhận đặt phòng của bạn.' },
      { word: 'Request', ipa: '/rɪˈkwest/', meaning: 'Yêu cầu / Đề nghị', ex: 'Submit a formal request.', tr: 'Gửi yêu cầu chính thức.' },
      { word: 'Arrange', ipa: '/əˈreɪndʒ/', meaning: 'Sắp xếp / Chuẩn bị', ex: 'Arrange the conference.', tr: 'Sắp xếp hội nghị.' },
      { word: 'Approve', ipa: '/əˈpruːv/', meaning: 'Phê duyệt / Chấp thuận', ex: 'Approve the budget.', tr: 'Phê duyệt ngân sách.' },
      { word: 'Apply', ipa: '/əˈplaɪ/', meaning: 'Đăng ký / Ứng tuyển', ex: 'Apply for a position.', tr: 'Ứng tuyển vào vị trí.' },
      { word: 'Obtain', ipa: '/əbˈteɪn/', meaning: 'Thu được / Có được', ex: 'Obtain a work permit.', tr: 'Có được giấy phép lao động.' },
      { word: 'Provide', ipa: '/prəˈvaɪd/', meaning: 'Cung cấp / Đưa ra', ex: 'Provide detailed information.', tr: 'Cung cấp thông tin chi tiết.' },
      { word: 'Submit', ipa: '/səbˈmɪt/', meaning: 'Nộp / Gửi tài liệu', ex: 'Submit report by Friday.', tr: 'Nộp báo cáo trước thứ Sáu.' },
      { word: 'Require', ipa: '/rɪˈkwaɪər/', meaning: 'Yêu cầu bắt buộc', ex: 'Require valid ID.', tr: 'Yêu cầu chứng minh thư hợp lệ.' },
      { word: 'Review', ipa: '/rɪˈvjuː/', meaning: 'Xem xét / Đánh giá', ex: 'Review the proposal.', tr: 'Xem xét đề xuất.' },
    ],
    [
      { word: 'Implement', ipa: '/ˈɪmplɪment/', meaning: 'Thực hiện / Triển khai', ex: 'Implement new policy.', tr: 'Triển khai chính sách mới.' },
      { word: 'Negotiate', ipa: '/nɪˈɡoʊʃieɪt/', meaning: 'Thương lượng hợp đồng', ex: 'Negotiate contract terms.', tr: 'Thương lượng điều khoản hợp đồng.' },
      { word: 'Allocate', ipa: '/ˈæləkeɪt/', meaning: 'Phân bổ nguồn lực', ex: 'Allocate project budget.', tr: 'Phân bổ ngân sách dự án.' },
      { word: 'Evaluate', ipa: '/ɪˈvæljueɪt/', meaning: 'Đánh giá kết quả', ex: 'Evaluate team performance.', tr: 'Đánh giá hiệu suất nhóm.' },
      { word: 'Coordinate', ipa: '/koʊˈɔːrdɪneɪt/', meaning: 'Điều phối hoạt động', ex: 'Coordinate project tasks.', tr: 'Điều phối các nhiệm vụ dự án.' },
      { word: 'Facilitate', ipa: '/fəˈsɪlɪteɪt/', meaning: 'Tạo điều kiện thuận lợi', ex: 'Facilitate team meetings.', tr: 'Tạo điều kiện cho cuộc họp nhóm.' },
      { word: 'Reimburse', ipa: '/ˌriːɪmˈbɜːrs/', meaning: 'Hoàn trả chi phí', ex: 'Reimburse travel expenses.', tr: 'Hoàn trả chi phí đi lại.' },
      { word: 'Inspect', ipa: '/ɪnˈspekt/', meaning: 'Kiểm tra / Thanh tra', ex: 'Inspect product quality.', tr: 'Kiểm tra chất lượng sản phẩm.' },
      { word: 'Discontinue', ipa: '/ˌdɪskənˈtɪnjuː/', meaning: 'Ngừng / Chấm dứt', ex: 'Discontinue old service.', tr: 'Ngừng dịch vụ cũ.' },
      { word: 'Comply', ipa: '/kəmˈplaɪ/', meaning: 'Tuân thủ quy định', ex: 'Comply with regulations.', tr: 'Tuân thủ các quy định.' },
    ],
    [
      { word: 'Consolidate', ipa: '/kənˈsɑːlɪdeɪt/', meaning: 'Hợp nhất / Củng cố', ex: 'Consolidate company branches.', tr: 'Hợp nhất các chi nhánh công ty.' },
      { word: 'Procurement', ipa: '/prəˈkjʊərmənt/', meaning: 'Thu mua / Đấu thầu', ex: 'Manage procurement process.', tr: 'Quản lý quy trình thu mua.' },
      { word: 'Stakeholder', ipa: '/ˈsteɪkhoʊldər/', meaning: 'Các bên liên quan', ex: 'Brief all stakeholders.', tr: 'Thông báo cho tất cả các bên.' },
      { word: 'Feasibility', ipa: '/ˌfiːzəˈbɪlɪti/', meaning: 'Tính khả thi dự án', ex: 'Conduct feasibility study.', tr: 'Tiến hành nghiên cứu khả thi.' },
      { word: 'Merger', ipa: '/ˈmɜːrdʒər/', meaning: 'Sự sáp nhập doanh nghiệp', ex: 'Company merger announcement.', tr: 'Thông báo sáp nhập công ty.' },
      { word: 'Subsidiary', ipa: '/səbˈsɪdiəri/', meaning: 'Công ty con phụ thuộc', ex: 'Acquire foreign subsidiary.', tr: 'Mua lại công ty con nước ngoài.' },
      { word: 'Reimbursement', ipa: '/ˌriːɪmˈbɜːrsmənt/', meaning: 'Tiền hoàn trả chi phí', ex: 'Request expense reimbursement.', tr: 'Yêu cầu hoàn trả chi phí.' },
      { word: 'Compliance', ipa: '/kəmˈplaɪəns/', meaning: 'Sự tuân thủ pháp luật', ex: 'Regulatory compliance audit.', tr: 'Kiểm toán tuân thủ quy định.' },
      { word: 'Jurisdiction', ipa: '/ˌdʒʊərɪsˈdɪkʃn/', meaning: 'Phạm vi thẩm quyền', ex: 'Under local jurisdiction.', tr: 'Thuộc thẩm quyền địa phương.' },
      { word: 'Arbitration', ipa: '/ˌɑːrbɪˈtreɪʃn/', meaning: 'Trọng tài phân xử', ex: 'Resolve via arbitration.', tr: 'Giải quyết qua trọng tài.' },
    ],
  );

  // ================================================================
  // CHỦ ĐỀ 10: PHỎNG VẤN & SỰ NGHIỆP
  // ================================================================
  await seedTopic(
    '🎯 Chủ đề 10: Phỏng Vấn & Sự Nghiệp (Interview & Career)',
    '30 từ vựng thường dùng trong phỏng vấn xin việc tiếng Anh',
    currentCount + 7,
    [
      { word: 'Resume', ipa: '/ˈrezəmeɪ/', meaning: 'Hồ sơ xin việc', ex: 'Send your resume today.', tr: 'Gửi hồ sơ của bạn hôm nay.' },
      { word: 'Skill', ipa: '/skɪl/', meaning: 'Kỹ năng chuyên môn', ex: 'Technical skills needed.', tr: 'Cần kỹ năng kỹ thuật.' },
      { word: 'Experience', ipa: '/ɪkˈspɪəriəns/', meaning: 'Kinh nghiệm làm việc', ex: '5 years of experience.', tr: '5 năm kinh nghiệm làm việc.' },
      { word: 'Position', ipa: '/pəˈzɪʃn/', meaning: 'Vị trí công việc', ex: 'Senior manager position.', tr: 'Vị trí quản lý cấp cao.' },
      { word: 'Candidate', ipa: '/ˈkændɪdeɪt/', meaning: 'Ứng viên xin việc', ex: 'Shortlisted job candidate.', tr: 'Ứng viên vào vòng tiếp theo.' },
      { word: 'Strength', ipa: '/streŋθ/', meaning: 'Điểm mạnh bản thân', ex: 'Your greatest strength.', tr: 'Điểm mạnh lớn nhất của bạn.' },
      { word: 'Weakness', ipa: '/ˈwiːknəs/', meaning: 'Điểm yếu bản thân', ex: 'Discuss a weakness honestly.', tr: 'Thảo luận thành thật về điểm yếu.' },
      { word: 'Hire', ipa: '/haɪər/', meaning: 'Tuyển dụng nhân sự', ex: 'Hire talented engineers.', tr: 'Tuyển dụng kỹ sư tài năng.' },
      { word: 'Reference', ipa: '/ˈrefərəns/', meaning: 'Người tham chiếu / Thư giới thiệu', ex: 'Provide two references.', tr: 'Cung cấp hai người tham chiếu.' },
      { word: 'Offer', ipa: '/ˈɔːfər/', meaning: 'Thư mời làm việc', ex: 'Accept job offer.', tr: 'Chấp nhận thư mời làm việc.' },
    ],
    [
      { word: 'Qualification', ipa: '/ˌkwɒlɪfɪˈkeɪʃn/', meaning: 'Bằng cấp chuyên môn', ex: 'List your qualifications.', tr: 'Liệt kê bằng cấp của bạn.' },
      { word: 'Competency', ipa: '/ˈkɑːmpɪtənsi/', meaning: 'Năng lực chuyên môn', ex: 'Core competency test.', tr: 'Kiểm tra năng lực cốt lõi.' },
      { word: 'Probation', ipa: '/proʊˈbeɪʃn/', meaning: 'Thời gian thử việc', ex: '3-month probation period.', tr: 'Thời gian thử việc 3 tháng.' },
      { word: 'Incentive', ipa: '/ɪnˈsentɪv/', meaning: 'Phần thưởng khuyến khích', ex: 'Performance bonus incentive.', tr: 'Thưởng khuyến khích hiệu suất.' },
      { word: 'Networking', ipa: '/ˈnetwɜːrkɪŋ/', meaning: 'Xây dựng mạng lưới quan hệ', ex: 'Professional networking event.', tr: 'Sự kiện kết nối chuyên nghiệp.' },
      { word: 'Adaptable', ipa: '/əˈdæptəbl/', meaning: 'Có khả năng thích nghi', ex: 'Be adaptable to change.', tr: 'Có khả năng thích nghi với thay đổi.' },
      { word: 'Initiative', ipa: '/ɪˈnɪʃətɪv/', meaning: 'Tinh thần chủ động', ex: 'Take the initiative.', tr: 'Chủ động trong công việc.' },
      { word: 'Multitask', ipa: '/ˌmʌltiˈtæsk/', meaning: 'Làm nhiều việc cùng lúc', ex: 'Ability to multitask.', tr: 'Khả năng làm nhiều việc cùng lúc.' },
      { word: 'Relocation', ipa: '/ˌriːloʊˈkeɪʃn/', meaning: 'Chuyển nơi làm việc', ex: 'Open to job relocation.', tr: 'Sẵn sàng chuyển nơi làm việc.' },
      { word: 'Benchmark', ipa: '/ˈbentʃmɑːrk/', meaning: 'Tiêu chuẩn đánh giá', ex: 'Set performance benchmark.', tr: 'Đặt tiêu chuẩn đánh giá hiệu suất.' },
    ],
    [
      { word: 'Remuneration', ipa: '/rɪˌmjuːnəˈreɪʃn/', meaning: 'Thù lao / Tiền công', ex: 'Competitive remuneration package.', tr: 'Gói thù lao cạnh tranh.' },
      { word: 'Entrepreneurship', ipa: '/ˌɑːntrəprəˈnɜːrʃɪp/', meaning: 'Tinh thần khởi nghiệp', ex: 'Develop entrepreneurship skills.', tr: 'Phát triển kỹ năng khởi nghiệp.' },
      { word: 'Mentorship', ipa: '/ˈmentərʃɪp/', meaning: 'Sự hướng dẫn cố vấn', ex: 'Career mentorship program.', tr: 'Chương trình cố vấn nghề nghiệp.' },
      { word: 'Headhunter', ipa: '/ˈhedhʌntər/', meaning: 'Chuyên gia săn nhân tài', ex: 'Contacted by headhunter.', tr: 'Được chuyên gia săn nhân tài liên hệ.' },
      { word: 'Outplacement', ipa: '/ˈaʊtpleɪsmənt/', meaning: 'Hỗ trợ tái tuyển dụng', ex: 'Outplacement career counseling.', tr: 'Tư vấn tái tuyển dụng nghề nghiệp.' },
      { word: 'Upskilling', ipa: '/ˈʌpskɪlɪŋ/', meaning: 'Nâng cao kỹ năng nghề', ex: 'Continuous upskilling required.', tr: 'Cần liên tục nâng cao kỹ năng.' },
      { word: 'Executive Search', ipa: '/ɪɡˈzekjʊtɪv sɜːrtʃ/', meaning: 'Tuyển dụng cấp điều hành', ex: 'Executive search firm.', tr: 'Công ty tuyển dụng cấp điều hành.' },
      { word: 'Compensation', ipa: '/ˌkɑːmpənˈseɪʃn/', meaning: 'Chế độ đãi ngộ', ex: 'Total compensation package.', tr: 'Gói đãi ngộ tổng thể.' },
      { word: 'Onboarding', ipa: '/ˈɑːnbɔːrdɪŋ/', meaning: 'Đào tạo nhân viên mới', ex: 'Structured onboarding process.', tr: 'Quy trình đào tạo nhân viên mới có cấu trúc.' },
      { word: 'Succession Planning', ipa: '/səkˈseʃn ˈplænɪŋ/', meaning: 'Kế hoạch kế thừa nhân sự', ex: 'CEO succession planning.', tr: 'Kế hoạch kế thừa vị trí CEO.' },
    ],
  );

  console.log('\n🎉 Hoàn thành! Đã thêm 7 chủ đề mới (4–10).');
  console.log('📊 Tổng: 10 chủ đề × 3 cấp × 10 từ = 300 từ vựng mới thêm vào database!');
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
