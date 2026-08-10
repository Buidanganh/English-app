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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CoursesService = class CoursesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        console.log('⚡ CoursesService initialized: Automatically seeding 300 real vocabularies...');
        await this.autoSeedAllTopics();
    }
    async findAll(userId) {
        let courses = await this.prisma.course.findMany({
            where: { isPublished: true },
            orderBy: { orderIndex: 'asc' },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                xpReward: true,
                                orderIndex: true,
                            },
                        },
                    },
                },
            },
        });
        const oldPlaceholder = await this.prisma.vocabulary.findFirst({
            where: { word: { contains: '_Med_' } },
        });
        const hasNegotiation = await this.prisma.vocabulary.findFirst({
            where: { word: 'Negotiation' },
        });
        const firstUnitLessonCount = courses[0]?.units[0]?.lessons?.length || 0;
        const totalLessonCount = await this.prisma.lesson.count();
        if (courses.length === 0 ||
            !courses[0]?.units ||
            courses[0].units.length < 10 ||
            firstUnitLessonCount < 3 ||
            totalLessonCount < 30 ||
            oldPlaceholder ||
            !hasNegotiation) {
            await this.autoSeedAllTopics();
            courses = await this.prisma.course.findMany({
                where: { isPublished: true },
                orderBy: { orderIndex: 'asc' },
                include: {
                    units: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            lessons: {
                                orderBy: { orderIndex: 'asc' },
                                select: {
                                    id: true,
                                    title: true,
                                    description: true,
                                    xpReward: true,
                                    orderIndex: true,
                                },
                            },
                        },
                    },
                },
            });
        }
        return courses.map((course) => ({
            ...course,
            units: course.units.map((unit) => ({
                ...unit,
                isUnlocked: true,
            })),
        }));
    }
    async findOne(id) {
        let course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
            },
        });
        if (!course) {
            course = await this.prisma.course.findFirst({
                include: {
                    units: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            lessons: { orderBy: { orderIndex: 'asc' } },
                        },
                    },
                },
            });
        }
        if (!course) {
            throw new common_1.NotFoundException('Khóa học không tồn tại');
        }
        return course;
    }
    async autoSeedAllTopics() {
        console.log('⚡ Auto-seeding 10 topics x 3 levels (Easy, Medium, Hard) = 300 REAL vocabularies...');
        try {
            await this.prisma.userFavoriteVocabulary.deleteMany();
            await this.prisma.userVocabulary.deleteMany();
            await this.prisma.question.deleteMany();
            await this.prisma.lessonVocabulary.deleteMany();
            await this.prisma.userProgress.deleteMany();
            await this.prisma.vocabulary.deleteMany();
            await this.prisma.lesson.deleteMany();
            await this.prisma.unit.deleteMany();
            await this.prisma.course.deleteMany();
        }
        catch (e) {
            console.warn('⚠️ Clear tables non-fatal warning:', e);
        }
        const course = await this.prisma.course.create({
            data: {
                title: 'Tiếng Anh Giao Tiếp 10 Chủ Đề (3 Cấp Mức: Easy • Medium • Hard)',
                description: 'Lộ trình 300 từ vựng thực tế phân cấp chuẩn từ dễ đến nâng cao',
                level: 'ALL_LEVELS',
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/197/197374.png',
                orderIndex: 1,
            },
        });
        const seedTopicWithLevels = async (unitTitle, unitDesc, orderIndex, easyVocab, medVocab, hardVocab) => {
            const unit = await this.prisma.unit.create({
                data: {
                    courseId: course.id,
                    title: unitTitle,
                    description: unitDesc,
                    orderIndex,
                },
            });
            const seedLevel = async (levelName, levelDesc, xpReward, lvlOrder, list) => {
                const lesson = await this.prisma.lesson.create({
                    data: {
                        unitId: unit.id,
                        title: levelName,
                        description: levelDesc,
                        xpReward,
                        orderIndex: lvlOrder,
                    },
                });
                for (const item of list) {
                    const v = await this.prisma.vocabulary.upsert({
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
                    await this.prisma.lessonVocabulary.create({
                        data: { lessonId: lesson.id, vocabularyId: v.id },
                    });
                    const wrongOpts = list
                        .filter((item) => item.word !== v.word)
                        .map((item) => item.meaning)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3);
                    const opts = [v.meaning, ...wrongOpts].sort(() => Math.random() - 0.5);
                    await this.prisma.question.create({
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
        await seedTopicWithLevels('☕ Chủ đề 1: Đồ Ăn & Thức Uống (Food & Drinks)', '30 từ vựng gọi món, thức uống và ẩm thực', 1, [
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
        ], [
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
        ], [
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
        ]);
        await seedTopicWithLevels('✈️ Chủ đề 2: Du Lịch & Di Chuyển (Travel & Transport)', '30 từ vựng sân bay, khách sạn và di chuyển phương tiện', 2, [
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
        ], [
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
        ], [
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
        ]);
        await seedTopicWithLevels('💼 Chủ đề 3: Công Việc & Văn Phòng (Work & Office)', '30 từ vựng cuộc họp, hợp đồng và công sở', 3, [
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
        ], [
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
        ], [
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
        ]);
        await seedTopicWithLevels('🛍️ Chủ đề 4: Mua Sắm & Giá Cả (Shopping & Prices)', '30 từ vựng giá cả, giảm giá và mua sắm', 4, [
            { word: 'Shop', ipa: '/ʃɑːp/', meaning: 'Cửa hàng mua sắm', ex: 'Visit clothes shop.', tr: 'Ghé thăm cửa hàng quần áo.' },
            { word: 'Buy', ipa: '/baɪ/', meaning: 'Mua hàng', ex: 'Buy fresh groceries.', tr: 'Mua thực phẩm tươi.' },
            { word: 'Price', ipa: '/praɪs/', meaning: 'Mức giá', ex: 'Low product price.', tr: 'Giá sản phẩm thấp.' },
            { word: 'Money', ipa: '/ˈmʌni/', meaning: 'Tiền bạc', ex: 'Save pocket money.', tr: 'Tiết kiệm tiền túi.' },
            { word: 'Cash', ipa: '/kæʃ/', meaning: 'Tiền mặt', ex: 'Pay with paper cash.', tr: 'Thanh toán bằng tiền mặt.' },
            { word: 'Card', ipa: '/kɑːrd/', meaning: 'Thẻ thanh toán', ex: 'Swipe bank card.', tr: 'Quẹt thẻ ngân hàng.' },
            { word: 'Size', ipa: '/saɪz/', meaning: 'Kích cỡ đồ', ex: 'Medium clothing size.', tr: 'Quần áo kích cỡ vừa.' },
            { word: 'Sale', ipa: '/seɪl/', meaning: 'Đợt giảm giá', ex: 'Big summer sale.', tr: 'Đợt giảm giá mùa hè lớn.' },
            { word: 'Coat', ipa: '/koʊt/', meaning: 'Áo khoác', ex: 'Warm winter coat.', tr: 'Áo khoác mùa đông ấm áp.' },
            { word: 'Shirt', ipa: '/ʃɜːrt/', meaning: 'Áo sơ mi', ex: 'White formal shirt.', tr: 'Áo sơ mi trắng lịch sự.' },
        ], [
            { word: 'Discount', ipa: '/ˈdɪskaʊnt/', meaning: 'Mức giảm giá', ex: '50 percent special discount.', tr: 'Giảm giá đặc biệt 50%.' },
            { word: 'Cheap', ipa: '/tʃiːp/', meaning: 'Giá rẻ', ex: 'Good cheap goods.', tr: 'Hàng hóa tốt giá rẻ.' },
            { word: 'Expensive', ipa: '/ɪkˈspensɪv/', meaning: 'Đắt tiền', ex: 'Expensive luxury watch.', tr: 'Đồng hồ cao cấp đắt tiền.' },
            { word: 'Receipt', ipa: '/rɪˈsiːt/', meaning: 'Biên lai thanh toán', ex: 'Keep payment receipt.', tr: 'Giữ lại biên lai thanh toán.' },
            { word: 'Customer', ipa: '/ˈkʌstəmər/', meaning: 'Khách mua hàng', ex: 'Happy shop customer.', tr: 'Khách mua hàng hài lòng.' },
            { word: 'Fitting Room', ipa: '/ˈfɪtɪŋ ruːm/', meaning: 'Phòng thử đồ', ex: 'Try clothes in fitting room.', tr: 'Thử quần áo trong phòng thử.' },
            { word: 'Cart', ipa: '/kɑːrt/', meaning: 'Giỏ hàng', ex: 'Fill online shopping cart.', tr: 'Thêm hàng vào giỏ trực tuyến.' },
            { word: 'Refund', ipa: '/ˈriːfʌnd/', meaning: 'Hoàn lại tiền', ex: 'Full money refund.', tr: 'Hoàn trả lại toàn bộ tiền.' },
            { word: 'Quality', ipa: '/ˈkwɑːləti/', meaning: 'Chất lượng sản phẩm', ex: 'High material quality.', tr: 'Chất lượng chất liệu cao.' },
            { word: 'Store', ipa: '/stɔːr/', meaning: 'Cửa hàng bách hóa', ex: 'Department retail store.', tr: 'Cửa hàng bán lẻ bách hóa.' },
        ], [
            { word: 'Merchandise', ipa: '/ˈmɜːrtʃəndaɪs/', meaning: 'Hàng hóa mua bán', ex: 'Inspect imported merchandise.', tr: 'Kiểm tra hàng hóa nhập khẩu.' },
            { word: 'Transaction', ipa: '/trænˈzækʃn/', meaning: 'Giao dịch mua bán', ex: 'Secure online payment transaction.', tr: 'Giao dịch thanh toán an toàn.' },
            { word: 'Bargain', ipa: '/ˈbɑːrɡən/', meaning: 'Món hời giá tốt', ex: 'Find a great price bargain.', tr: 'Tìm được món đồ giá cực hời.' },
            { word: 'Warranty', ipa: '/ˈwɔːrənti/', meaning: 'Chế độ bảo hành', ex: 'Two year product warranty.', tr: 'Bảo hành sản phẩm 2 năm.' },
            { word: 'Wholesale', ipa: '/ˈhoʊlseɪl/', meaning: 'Bán buôn giá sỉ', ex: 'Wholesale price distribution.', tr: 'Phân phối theo giá bán buôn.' },
            { word: 'Clearance', ipa: '/ˈklɪrəns/', meaning: 'Xả hàng tồn kho', ex: 'Stock clearance sale event.', tr: 'Sự kiện xả hàng tồn kho.' },
            { word: 'Inventory', ipa: '/ˈɪnvəntɔːri/', meaning: 'Kho hàng hóa', ex: 'Manage store item inventory.', tr: 'Quản lý tồn kho hàng hóa.' },
            { word: 'Supermarket', ipa: '/ˈsuːpərmɑːrkɪt/', meaning: 'Siêu thị lớn', ex: 'Shop at local supermarket.', tr: 'Mua sắm tại siêu thị địa phương.' },
            { word: 'Barcode', ipa: '/ˈbɑːrkoʊd/', meaning: 'Mã vạch quét giá', ex: 'Scan item price barcode.', tr: 'Quét mã vạch giá sản phẩm.' },
            { word: 'Exchange', ipa: '/ɪksˈtʃeɪndʒ/', meaning: 'Đổi trả hàng hóa', ex: 'Item exchange policy.', tr: 'Chính sách đổi trả hàng hóa.' },
        ]);
        await seedTopicWithLevels('🏥 Chủ đề 5: Sức Khỏe & Y Tế (Health & Medical)', '30 từ vựng bác sĩ, đơn thuốc và y tế', 5, [
            { word: 'Doctor', ipa: '/ˈdɑːktər/', meaning: 'Bác sĩ', ex: 'See the family doctor.', tr: 'Khám bác sĩ gia đình.' },
            { word: 'Nurse', ipa: '/nɜːrs/', meaning: 'Y tá', ex: 'Caring hospital nurse.', tr: 'Y tá bệnh viện tận tụy.' },
            { word: 'Sick', ipa: '/sɪk/', meaning: 'Ốm / Bệnh', ex: 'Stay home when sick.', tr: 'Ở nhà khi bị ốm.' },
            { word: 'Pain', ipa: '/peɪn/', meaning: 'Cơn đau', ex: 'Feel physical back pain.', tr: 'Cảm thấy đau ở lưng.' },
            { word: 'Drug', ipa: '/drʌɡ/', meaning: 'Thuốc chữa bệnh', ex: 'Take doctor prescribed drug.', tr: 'Uống thuốc được kê đơn.' },
            { word: 'Bed', ipa: '/bed/', meaning: 'Giường bệnh', ex: 'Lie on hospital bed.', tr: 'Nằm trên giường bệnh.' },
            { word: 'Body', ipa: '/ˈbɑːdi/', meaning: 'Cơ thể', ex: 'Keep body healthy.', tr: 'Giữ cơ thể khỏe mạnh.' },
            { word: 'Rest', ipa: '/rest/', meaning: 'Nghỉ ngơi', ex: 'Get enough sleep rest.', tr: 'Nghỉ ngơi ngủ đủ giấc.' },
            { word: 'Food', ipa: '/fuːd/', meaning: 'Thức ăn lành mạnh', ex: 'Eat clean organic food.', tr: 'Ăn thực phẩm hữu cơ sạch.' },
            { word: 'Walk', ipa: '/wɔːk/', meaning: 'Đi bộ thể dục', ex: 'Daily morning walk.', tr: 'Đi bộ buổi sáng hàng ngày.' },
        ], [
            { word: 'Hospital', ipa: '/ˈhɑːspɪtl/', meaning: 'Bệnh viện', ex: 'Central city hospital.', tr: 'Bệnh viện trung tâm thành phố.' },
            { word: 'Pharmacy', ipa: '/ˈfɑːrməsi/', meaning: 'Hiệu thuốc', ex: 'Buy medicine at pharmacy.', tr: 'Mua thuốc tại hiệu thuốc.' },
            { word: 'Medicine', ipa: '/ˈmedsn/', meaning: 'Thuốc điều trị', ex: 'Take daily oral medicine.', tr: 'Uống thuốc điều trị hàng ngày.' },
            { word: 'Fever', ipa: '/ˈfiːvər/', meaning: 'Sốt cao', ex: 'High body temperature fever.', tr: 'Sốt nhiệt độ cơ thể cao.' },
            { word: 'Healthy', ipa: '/ˈhelθi/', meaning: 'Khỏe mạnh', ex: 'Maintain a healthy lifestyle.', tr: 'Duy trì lối sống khỏe mạnh.' },
            { word: 'Checkup', ipa: '/ˈtʃekʌp/', meaning: 'Kiểm tra sức khỏe', ex: 'Annual medical checkup.', tr: 'Kiểm tra sức khỏe hàng năm.' },
            { word: 'Appointment', ipa: '/əˈpɔɪntmənt/', meaning: 'Cuộc hẹn khám', ex: 'Doctor consultation appointment.', tr: 'Cuộc hẹn tư vấn bác sĩ.' },
            { word: 'Patient', ipa: '/ˈpeɪʃnt/', meaning: 'Bệnh nhân', ex: 'Care for recovering patient.', tr: 'Chăm sóc bệnh nhân đang hồi phục.' },
            { word: 'Prescription', ipa: '/prɪˈskrɪpʃn/', meaning: 'Đơn thuốc', ex: 'Fill doctor prescription.', tr: 'Lấy thuốc theo đơn.' },
            { word: 'Symptom', ipa: '/ˈsɪmptəm/', meaning: 'Triệu chứng bệnh', ex: 'Flu viral disease symptom.', tr: 'Triệu chứng bệnh cảm cúm.' },
        ], [
            { word: 'Emergency', ipa: '/iˈmɜːrdʒənsi/', meaning: 'Cấp cứu khẩn cấp', ex: 'Hospital emergency room.', tr: 'Phòng cấp cứu bệnh viện.' },
            { word: 'Treatment', ipa: '/ˈtriːtmənt/', meaning: 'Liệu trình điều trị', ex: 'Effective medical treatment.', tr: 'Liệu trình điều trị y tế hiệu quả.' },
            { word: 'Diagnosis', ipa: '/ˌdaɪəɡˈnoʊsɪs/', meaning: 'Sự chẩn đoán', ex: 'Accurate disease diagnosis.', tr: 'Chẩn đoán bệnh chính xác.' },
            { word: 'Vaccine', ipa: '/vækˈsiːn/', meaning: 'Vắc xin phòng bệnh', ex: 'Get preventive vaccine shot.', tr: 'Tiêm mũi vắc xin phòng bệnh.' },
            { word: 'Operation', ipa: '/ˌɑːpəˈreɪʃn/', meaning: 'Ca phẫu thuật', ex: 'Successful heart operation.', tr: 'Ca phẫu thuật tim thành công.' },
            { word: 'Ambulance', ipa: '/ˈæmbjələns/', meaning: 'Xe cấp cứu', ex: 'Call fast emergency ambulance.', tr: 'Gọi xe cấp cứu khẩn cấp.' },
            { word: 'Infection', ipa: '/ɪnˈfekʃn/', meaning: 'Nhiễm trùng', ex: 'Prevent bacterial infection.', tr: 'Phòng ngừa nhiễm trùng vi khuẩn.' },
            { word: 'Recovery', ipa: '/rɪˈkʌvəri/', meaning: 'Sự hồi phục sức khỏe', ex: 'Speedy patient health recovery.', tr: 'Bệnh nhân hồi phục sức khỏe nhanh chóng.' },
            { word: 'Specialist', ipa: '/ˈspeʃəlɪst/', meaning: 'Bác sĩ chuyên khoa', ex: 'Consult medical specialist.', tr: 'Tham khảo bác sĩ chuyên khoa.' },
            { word: 'Therapy', ipa: '/ˈθerəpi/', meaning: 'Trị liệu thần kinh/thể chất', ex: 'Physical rehabilitation therapy.', tr: 'Vật lý trị liệu phục hồi chức năng.' },
        ]);
        await seedTopicWithLevels('💻 Chủ đề 6: Công Nghệ & Mạng Xã Hội (Technology & Social Media)', '30 từ vựng phần mềm, AI, mạng xã hội', 6, [
            { word: 'Phone', ipa: '/foʊn/', meaning: 'Điện thoại thông minh', ex: 'Smart mobile touch phone.', tr: 'Điện thoại cảm ứng thông minh.' },
            { word: 'Laptop', ipa: '/ˈlæptɑːp/', meaning: 'Máy tính xách tay', ex: 'Work on portable laptop.', tr: 'Làm việc trên máy tính xách tay.' },
            { word: 'Web', ipa: '/web/', meaning: 'Trang mạng internet', ex: 'Browse official company web.', tr: 'Duyệt trang web chính thức của công ty.' },
            { word: 'App', ipa: '/æp/', meaning: 'Ứng dụng di động', ex: 'Download mobile learning app.', tr: 'Tải ứng dụng học di động.' },
            { word: 'Video', ipa: '/ˈvɪdioʊ/', meaning: 'Đoạn phim ngắn', ex: 'Watch online streaming video.', tr: 'Xem đoạn phim trực tuyến.' },
            { word: 'Post', ipa: '/poʊst/', meaning: 'Bài đăng MXH', ex: 'Publish social media post.', tr: 'Đăng bài đăng trên mạng xã hội.' },
            { word: 'Like', ipa: '/laɪk/', meaning: 'Nút thích', ex: 'Tap like button on post.', tr: 'Nhấn nút thích trên bài đăng.' },
            { word: 'Share', ipa: '/ʃer/', meaning: 'Chia sẻ thông tin', ex: 'Share photo with friends.', tr: 'Chia sẻ bức ảnh với bạn bè.' },
            { word: 'User', ipa: '/ˈjuːzər/', meaning: 'Người sử dụng', ex: 'Registered active system user.', tr: 'Người dùng hệ thống đã đăng ký.' },
            { word: 'File', ipa: '/faɪl/', meaning: 'Tệp tin tài liệu', ex: 'Send digital PDF file.', tr: 'Gửi tệp tin PDF số.' },
        ], [
            { word: 'Software', ipa: '/ˈsɔːftwer/', meaning: 'Phần mềm máy tính', ex: 'Update latest system software.', tr: 'Cập nhật phần mềm hệ thống mới nhất.' },
            { word: 'Hardware', ipa: '/ˈhɑːrdwer/', meaning: 'Phần cứng thiết bị', ex: 'Computer processor hardware.', tr: 'Phần cứng bộ xử lý máy tính.' },
            { word: 'Network', ipa: '/ˈnetwɜːrk/', meaning: 'Mạng kết nối', ex: 'High speed internet network.', tr: 'Mạng internet tốc độ cao.' },
            { word: 'Cloud', ipa: '/klaʊd/', meaning: 'Lưu trữ đám mây', ex: 'Backup files to cloud.', tr: 'Sao lưu tệp tin lên đám mây.' },
            { word: 'Browser', ipa: '/ˈbraʊzər/', meaning: 'Trình duyệt web', ex: 'Popular Chrome web browser.', tr: 'Trình duyệt web Chrome phổ biến.' },
            { word: 'Server', ipa: '/ˈsɜːrvər/', meaning: 'Máy chủ dữ liệu', ex: 'Cloud database web server.', tr: 'Máy chủ dữ liệu đám mây.' },
            { word: 'Password', ipa: '/ˈpæswɜːrd/', meaning: 'Mật khẩu bảo mật', ex: 'Set strong secret password.', tr: 'Đặt mật khẩu bí mật mạnh.' },
            { word: 'Account', ipa: '/əˈkaʊnt/', meaning: 'Tài khoản người dùng', ex: 'Create new member account.', tr: 'Tạo tài khoản thành viên mới.' },
            { word: 'Privacy', ipa: '/ˈpraɪvəsi/', meaning: 'Quyền riêng tư', ex: 'Protect user data privacy.', tr: 'Bảo vệ quyền riêng tư dữ liệu.' },
            { word: 'Storage', ipa: '/ˈstɔːrɪdʒ/', meaning: 'Dung lượng bộ nhớ', ex: 'Expand phone memory storage.', tr: 'Mở rộng bộ nhớ điện thoại.' },
        ], [
            { word: 'Cybersecurity', ipa: '/ˈsaɪbərsɪkjʊrəti/', meaning: 'An ninh mạng số', ex: 'Advanced cybersecurity defence.', tr: 'Phòng thủ an ninh mạng nâng cao.' },
            { word: 'Algorithm', ipa: '/ˈælɡərɪðəm/', meaning: 'Thuật toán máy tính', ex: 'Smart AI search algorithm.', tr: 'Thuật toán tìm kiếm AI thông minh.' },
            { word: 'Encryption', ipa: '/ɪnˈkrɪpʃn/', meaning: 'Mã hóa dữ liệu', ex: 'End to end data encryption.', tr: 'Mã hóa dữ liệu đầu cuối.' },
            { word: 'Artificial Intelligence', ipa: '/ˌɑːrtɪˈfɪʃl ɪnˈtelɪdʒəns/', meaning: 'Trí tuệ nhân tạo (AI)', ex: 'Generative artificial intelligence.', tr: 'Trí tuệ nhân tạo tạo sinh.' },
            { word: 'Bandwidth', ipa: '/ˈbændwɪdθ/', meaning: 'Băng thông đường truyền', ex: 'High network data bandwidth.', tr: 'Băng thông dữ liệu mạng cao.' },
            { word: 'Database', ipa: '/ˈdeɪtəbeɪs/', meaning: 'Cơ sở dữ liệu', ex: 'Relational SQL database system.', tr: 'Hệ thống cơ sở dữ liệu SQL.' },
            { word: 'Virtual', ipa: '/ˈvɜːrtʃuəl/', meaning: 'Thực tế ảo 3D', ex: 'Immersive virtual reality game.', tr: 'Trò chơi thực tế ảo nhập vai.' },
            { word: 'Interface', ipa: '/ˈɪntərfeɪs/', meaning: 'Giao diện người dùng', ex: 'Sleek mobile app interface.', tr: 'Giao diện ứng dụng di động mượt mà.' },
            { word: 'Developer', ipa: '/dɪˈveləpər/', meaning: 'Lập trình viên', ex: 'Full stack software developer.', tr: 'Lập trình viên phần mềm toàn năng.' },
            { word: 'Innovation', ipa: '/ˌɪnəˈveɪʃn/', meaning: 'Sự đổi mới công nghệ', ex: 'Breakthrough tech innovation.', tr: 'Đổi mới công nghệ đột phá.' },
        ]);
        await seedTopicWithLevels('🏦 Chủ đề 7: Tài Chính & Ngân Hàng (Finance & Banking)', '30 từ vựng tài chính, giao dịch, chứng khoán', 7, [
            { word: 'Bank', ipa: '/bæŋk/', meaning: 'Ngân hàng thương mại', ex: 'Commercial city bank branch.', tr: 'Chi nhánh ngân hàng thương mại.' },
            { word: 'Money', ipa: '/ˈmʌni/', meaning: 'Tiền tệ', ex: 'Manage personal money well.', tr: 'Quản lý tiền bạc cá nhân tốt.' },
            { word: 'Coin', ipa: '/kɔɪn/', meaning: 'Đồng tiền xu', ex: 'Gold shiny money coin.', tr: 'Đồng tiền xu vàng sáng bóng.' },
            { word: 'Save', ipa: '/seɪv/', meaning: 'Tiết kiệm tiền', ex: 'Save money for future.', tr: 'Tiết kiệm tiền cho tương lai.' },
            { word: 'Pay', ipa: '/peɪ/', meaning: 'Thanh toán tiền', ex: 'Pay monthly house rent.', tr: 'Thanh toán tiền thuê nhà hàng tháng.' },
            { word: 'Rich', ipa: '/rɪtʃ/', meaning: 'Giàu có', ex: 'Financially independent rich.', tr: 'Giàu có tự chủ tài chính.' },
            { word: 'Poor', ipa: '/pʊr/', meaning: 'Nghèo khó', ex: 'Help poor communities.', tr: 'Giúp đỡ cộng đồng khó khăn.' },
            { word: 'Cost', ipa: '/kɔːst/', meaning: 'Chi phí sản xuất', ex: 'Low operational cost.', tr: 'Chi phí vận hành thấp.' },
            { word: 'Loan', ipa: '/loʊn/', meaning: 'Khoản vay ngân hàng', ex: 'Apply for home loan.', tr: 'Vay ngân hàng mua nhà.' },
            { word: 'Card', ipa: '/kɑːrd/', meaning: 'Thẻ tín dụng', ex: 'Platinum visa credit card.', tr: 'Thẻ tín dụng Visa Bạch Kim.' },
        ], [
            { word: 'Budget', ipa: '/ˈbʌdʒɪt/', meaning: 'Ngân sách chi tiêu', ex: 'Strict monthly family budget.', tr: 'Ngân sách gia đình hàng tháng nghiêm ngặt.' },
            { word: 'Account', ipa: '/əˈkaʊnt/', meaning: 'Tài khoản ngân hàng', ex: 'Active bank savings account.', tr: 'Tài khoản tiết kiệm ngân hàng.' },
            { word: 'Interest', ipa: '/ˈɪntrəst/', meaning: 'Lãi suất gửi/vay', ex: 'High savings interest rate.', tr: 'Lãi suất tiền gửi tiết kiệm cao.' },
            { word: 'Transfer', ipa: '/trænsˈfɜːr/', meaning: 'Chuyển tiền nhanh', ex: 'Instant online wire transfer.', tr: 'Chuyển tiền điện tử tức thì.' },
            { word: 'Deposit', ipa: '/dɪˈpɑːzɪt/', meaning: 'Gửi tiền vào tài khoản', ex: 'Make a cash deposit.', tr: 'Thực hiện gửi nộp tiền mặt.' },
            { word: 'Withdraw', ipa: '/wɪðˈdrɔː/', meaning: 'Rút tiền mặt', ex: 'Withdraw money from ATM.', tr: 'Rút tiền từ cây ATM.' },
            { word: 'Profit', ipa: '/ˈprɑːfɪt/', meaning: 'Lợi nhuận kinh doanh', ex: 'Net quarterly business profit.', tr: 'Lợi nhuận ròng kinh doanh quý.' },
            { word: 'Expense', ipa: '/ɪkˈspens/', meaning: 'Chi phí phát sinh', ex: 'Track daily personal expense.', tr: 'Theo dõi chi phí cá nhân hàng ngày.' },
            { word: 'Revenue', ipa: '/ˈrevənuː/', meaning: 'Doanh thu thu về', ex: 'Annual company sales revenue.', tr: 'Doanh thu bán hàng năm của công ty.' },
            { word: 'Credit', ipa: '/ˈkredɪt/', meaning: 'Tín dụng vay vốn', ex: 'Good personal credit score.', tr: 'Điểm uy tín tín dụng cá nhân tốt.' },
        ], [
            { word: 'Investment', ipa: '/ɪnˈvestmənt/', meaning: 'Khoản đầu tư sinh lời', ex: 'Profitable stock market investment.', tr: 'Khoản đầu tư chứng khoán sinh lời.' },
            { word: 'Currency', ipa: '/ˈkɜːrənsi/', meaning: 'Đồng tiền ngoại tệ', ex: 'Foreign exchange trading currency.', tr: 'Đồng tiền giao dịch ngoại hối.' },
            { word: 'Mortgage', ipa: '/ˈmɔːrɡɪdʒ/', meaning: 'Thế chấp mua nhà', ex: 'Thirty year home mortgage.', tr: 'Khoản thế chấp mua nhà 30 năm.' },
            { word: 'Dividend', ipa: '/ˈdɪvɪdend/', meaning: 'Cổ tức chia lại', ex: 'Annual company stock dividend.', tr: 'Cổ tức cổ phiếu công ty hàng năm.' },
            { word: 'Assets', ipa: '/ˈæsets/', meaning: 'Tổng tài sản sở hữu', ex: 'Valuable liquid company assets.', tr: 'Tài sản thanh khoản giá trị của công ty.' },
            { word: 'Liabilities', ipa: '/ˌlaɪəˈbɪlətiz/', meaning: 'Nợ tài chính', ex: 'Current balance sheet liabilities.', tr: 'Các khoản nợ trên bảng cân đối kế toán.' },
            { word: 'Bankruptcy', ipa: '/ˈbæŋkrəptsi/', meaning: 'Sự phá sản doanh nghiệp', ex: 'Declare corporate debt bankruptcy.', tr: 'Tuyên bố phá sản nợ doanh nghiệp.' },
            { word: 'Portfolio', ipa: '/pɔːrtˈfoʊlioʊ/', meaning: 'Danh mục đầu tư', ex: 'Diversified fund investment portfolio.', tr: 'Danh mục đầu tư quỹ đa dạng.' },
            { word: 'Inflation', ipa: '/ɪnˈfleɪʃn/', meaning: 'Sự lạm phát tiền tệ', ex: 'High global market inflation rate.', tr: 'Tỷ lệ lạm phát thị trường toàn cầu cao.' },
            { word: 'Capital', ipa: '/ˈkæpɪtl/', meaning: 'Nguồn vốn kinh doanh', ex: 'Raise startup seed capital.', tr: 'Huy động vốn hạt giống cho startup.' },
        ]);
        await seedTopicWithLevels('🎬 Chủ đề 8: Giải Trí & Truyền Thông (Media & Entertainment)', '30 từ vựng phim ảnh, âm nhạc, nghệ thuật', 8, [
            { word: 'Movie', ipa: '/ˈmuːvi/', meaning: 'Phim điện ảnh', ex: 'Watch a cinema movie.', tr: 'Xem phim điện ảnh tại rạp.' },
            { word: 'Music', ipa: '/ˈmjuːzɪk/', meaning: 'Âm nhạc nghệ thuật', ex: 'Listen to pop music.', tr: 'Nghe nhạc pop.' },
            { word: 'Song', ipa: '/sɔːŋ/', meaning: 'Bài hát', ex: 'Sing a favorite song.', tr: 'Hát một bài hát yêu thích.' },
            { word: 'Game', ipa: '/ɡeɪm/', meaning: 'Trò chơi giải trí', ex: 'Play mobile video game.', tr: 'Chơi trò chơi di động.' },
            { word: 'Star', ipa: '/stɑːr/', meaning: 'Ngôi sao nổi tiếng', ex: 'Famous Hollywood movie star.', tr: 'Ngôi sao điện ảnh Hollywood nổi tiếng.' },
            { word: 'Film', ipa: '/fɪlm/', meaning: 'Bộ phim chiếu rạp', ex: 'Action adventure film.', tr: 'Phim phiêu lưu hành động.' },
            { word: 'Show', ipa: '/ʃoʊ/', meaning: 'Chương trình truyền hình', ex: 'Live music concert show.', tr: 'Chương trình hòa nhạc trực tiếp.' },
            { word: 'Play', ipa: '/pleɪ/', meaning: 'Vở kịch sân khấu', ex: 'Watch theatre stage play.', tr: 'Xem vở kịch trên sân khấu.' },
            { word: 'Dance', ipa: '/dæns/', meaning: 'Điệu nhảy vũ đạo', ex: 'Modern hiphop street dance.', tr: 'Điệu nhảy đường phố hiphop hiện đại.' },
            { word: 'Band', ipa: '/bænd/', meaning: 'Ban nhạc âm nhạc', ex: 'Rock music live band.', tr: 'Ban nhạc rock trực tiếp.' },
        ], [
            { word: 'Cinema', ipa: '/ˈsɪnəmɑː/', meaning: 'Rạp chiếu phim', ex: 'Modern multiplex city cinema.', tr: 'Rạp chiếu phim hiện đại trong thành phố.' },
            { word: 'Concert', ipa: '/ˈkɑːnsərt/', meaning: 'Buổi hòa nhạc lớn', ex: 'Outdoor stadium music concert.', tr: 'Buổi hòa nhạc ngoài sân vận động.' },
            { word: 'Actor', ipa: '/ˈæktər/', meaning: 'Nam diễn viên', ex: 'Talented drama film actor.', tr: 'Nam diễn viên phim truyền hình tài năng.' },
            { word: 'Actress', ipa: '/ˈæktrəs/', meaning: 'Nữ diễn viên', ex: 'Award winning lead actress.', tr: 'Nữ diễn viên chính từng đoạt giải thưởng.' },
            { word: 'Director', ipa: '/dəˈrektər/', meaning: 'Đạo diễn phim', ex: 'Famous creative movie director.', tr: 'Đạo diễn điện ảnh sáng tạo nổi tiếng.' },
            { word: 'Audience', ipa: '/ˈɔːdiəns/', meaning: 'Khán giả theo dõi', ex: 'Cheering stadium crowd audience.', tr: 'Khán giả cổ vũ sôi động.' },
            { word: 'Stage', ipa: '/steɪdʒ/', meaning: 'Sân khấu biểu diễn', ex: 'Perform on grand live stage.', tr: 'Biểu diễn trên sân khấu hoành tráng.' },
            { word: 'Ticket', ipa: '/ˈtɪkɪt/', meaning: 'Vé xem chương trình', ex: 'Buy front row show ticket.', tr: 'Mua vé hàng ghế đầu.' },
            { word: 'Drama', ipa: '/ˈdrɑːmə/', meaning: 'Phim truyền hình kịch tính', ex: 'Popular Korean TV drama.', tr: 'Phim kịch tính Hàn Quốc phổ biến.' },
            { word: 'Comedy', ipa: '/ˈkɑːmədi/', meaning: 'Phim hài hước', ex: 'Hilarious stand up comedy.', tr: 'Hài kịch độc thoại hài hước.' },
        ], [
            { word: 'Production', ipa: '/prəˈdʌkʃn/', meaning: 'Sự sản xuất phim', ex: 'High budget film production.', tr: 'Sản xuất phim ngân sách lớn.' },
            { word: 'Soundtrack', ipa: '/ˈsaʊndtræk/', meaning: 'Nhạc nền phim', ex: 'Emotional original movie soundtrack.', tr: 'Nhạc nền phim truyền cảm hứng.' },
            { word: 'Premiere', ipa: '/prɪˈmr/', meaning: 'Buổi ra mắt phim', ex: 'Hollywood world movie premiere.', tr: 'Buổi công chiếu phim toàn cầu tại Hollywood.' },
            { word: 'Celebrity', ipa: '/səˈlebrəti/', meaning: 'Người nổi tiếng', ex: 'A list Hollywood celebrity.', tr: 'Người nổi tiếng hạng A tại Hollywood.' },
            { word: 'Broadcast', ipa: '/ˈbrɔːdkæst/', meaning: 'Phát sóng truyền hình', ex: 'Live satellite news broadcast.', tr: 'Phát sóng tin tức qua vệ tinh trực tiếp.' },
            { word: 'Exhibition', ipa: '/ˌeksɪˈbɪʃn/', meaning: 'Triển lãm nghệ thuật', ex: 'Modern digital art exhibition.', tr: 'Triển lãm nghệ thuật số hiện đại.' },
            { word: 'Genre', ipa: '/ˈʒɑːnrə/', meaning: 'Thể loại nghệ thuật', ex: 'Sci-fi movie fiction genre.', tr: 'Thể loại phim viễn tưởng khoa học.' },
            { word: 'Festival', ipa: '/ˈfestɪvl/', meaning: 'Lễ hội phim quốc tế', ex: 'Cannes international film festival.', tr: 'Lễ hội phim quốc tế Cannes.' },
            { word: 'Performance', ipa: '/pərˈfɔːrməns/', meaning: 'Màn trình diễn', ex: 'Spectacular live stage performance.', tr: 'Màn trình diễn sân khấu sống động.' },
            { word: 'Review', ipa: '/rɪˈvjuː/', meaning: 'Bài đánh giá phim', ex: 'Positive critics movie review.', tr: 'Bài đánh giá phim tích cực từ giới phê bình.' },
        ]);
        await seedTopicWithLevels('🏀 Chủ đề 9: Thể Thao & Thể Hình (Sports & Fitness)', '30 từ vựng thể thao, giải đấu, vận động viên', 9, [
            { word: 'Run', ipa: '/rʌn/', meaning: 'Chạy bộ', ex: 'Run five kilometers daily.', tr: 'Chạy bộ 5 cây số mỗi ngày.' },
            { word: 'Swim', ipa: '/swɪm/', meaning: 'Bơi lội', ex: 'Swim in deep pool water.', tr: 'Bơi trong hồ nước sâu.' },
            { word: 'Ball', ipa: '/bɔːl/', meaning: 'Quả bóng thể thao', ex: 'Kick leather football ball.', tr: 'Đá quả bóng đá da.' },
            { word: 'Game', ipa: '/ɡeɪm/', meaning: 'Trận đấu', ex: 'Play competitive match game.', tr: 'Chơi trận đấu cạnh tranh.' },
            { word: 'Team', ipa: '/tiːm/', meaning: 'Đội bóng / Đồng đội', ex: 'Winning football sport team.', tr: 'Đội bóng đá chiến thắng.' },
            { word: 'Win', ipa: '/wɪn/', meaning: 'Giành chiến thắng', ex: 'Win gold trophy medal.', tr: 'Giành cúp huy chương vàng.' },
            { word: 'Jump', ipa: '/dʒʌmp/', meaning: 'Nhảy cao', ex: 'Jump high over hurdle.', tr: 'Nhảy cao qua sào chắn.' },
            { word: 'Walk', ipa: '/wɔːk/', meaning: 'Đi dạo thể dục', ex: 'Evening park walk.', tr: 'Đi dạo công viên buổi tối.' },
            { word: 'Race', ipa: '/reɪs/', meaning: 'Cuộc đua tốc độ', ex: 'Speed motor bike race.', tr: 'Cuộc đua xe máy tốc độ.' },
            { word: 'Club', ipa: '/klʌb/', meaning: 'Câu lạc bộ thể thao', ex: 'Join local tennis club.', tr: 'Tham gia câu lạc bộ quần vợt.' },
        ], [
            { word: 'Athlete', ipa: '/ˈæθliːt/', meaning: 'Vận động viên', ex: 'Professional Olympic sports athlete.', tr: 'Vận động viên thể thao Olympic chuyên nghiệp.' },
            { word: 'Tournament', ipa: '/ˈtʊrnəmənt/', meaning: 'Giải đấu lớn', ex: 'National football tournament.', tr: 'Giải đấu bóng đá toàn quốc.' },
            { word: 'Fitness', ipa: '/ˈfɪtnəs/', meaning: 'Thể lực / Thể hình', ex: 'Maintain good physical fitness.', tr: 'Duy trì thể lực cá nhân tốt.' },
            { word: 'Champion', ipa: '/ˈtʃæmpiən/', meaning: 'Nhà vô địch', ex: 'World boxing heavyweight champion.', tr: 'Nhà vô địch quyền anh thế giới.' },
            { word: 'Stadium', ipa: '/ˈsteɪdiəm/', meaning: 'Sân vận động lớn', ex: 'Packed 50k capacity stadium.', tr: 'Sân vận động 50 ngàn chỗ chật kín.' },
            { word: 'Coach', ipa: '/koʊtʃ/', meaning: 'Huấn luyện viên', ex: 'Strategic head football coach.', tr: 'Huấn luyện viên trưởng chiến thuật.' },
            { word: 'Exercise', ipa: '/ˈeksərsaɪz/', meaning: 'Bài tập thể dục', ex: 'Regular daily body exercise.', tr: 'Bài tập thể dục đều đặn hàng ngày.' },
            { word: 'Workout', ipa: '/ˈwɜːrkaʊt/', meaning: 'Buổi rèn luyện gym', ex: 'Intense muscle building workout.', tr: 'Buổi tập gym xây dựng cơ bắp cường độ cao.' },
            { word: 'Gym', ipa: '/dʒɪm/', meaning: 'Phòng tập thể hình', ex: 'Train at modern fitness gym.', tr: 'Tập luyện tại phòng gym hiện đại.' },
            { word: 'Muscle', ipa: '/ˈmʌsl/', meaning: 'Cơ bắp', ex: 'Build strong chest muscle.', tr: 'Phát triển cơ ngực khỏe mạnh.' },
        ], [
            { word: 'Endurance', ipa: '/ɪnˈdʊrəns/', meaning: 'Sức bền thể lực', ex: 'Long distance running endurance.', tr: 'Sức bền chạy cự ly dài.' },
            { word: 'Competition', ipa: '/ˌkɑːmpəˈtɪʃn/', meaning: 'Cuộc thi tranh tài', ex: 'Fierce international competition.', tr: 'Cuộc thi tranh tài quốc tế nảy lửa.' },
            { word: 'Opponent', ipa: '/əˈpoʊnənt/', meaning: 'Đối thủ thi đấu', ex: 'Respect tough match opponent.', tr: 'Tôn trọng đối thủ thi đấu đáng gờm.' },
            { word: 'Victory', ipa: '/ˈvɪktəri/', meaning: 'Chiến thắng lừng lẫy', ex: 'Historic team match victory.', tr: 'Chiến thắng trận đấu lịch sử của toàn đội.' },
            { word: 'Referee', ipa: '/ˌrefəˈriː/', meaning: 'Trọng tài điều hành', ex: 'Fair match sports referee.', tr: 'Trọng tài thể thao điều hành công bằng.' },
            { word: 'Marathon', ipa: '/ˈmærəθɑːn/', meaning: 'Chạy việt dã 42km', ex: 'Complete 42km full marathon.', tr: 'Hoàn thành chặng việt dã marathon 42km.' },
            { word: 'Agility', ipa: '/əˈdʒɪləti/', meaning: 'Độ linh hoạt dẻo dai', ex: 'Speed footwork body agility.', tr: 'Độ dẻo dai linh hoạt của bộ chân tốc độ.' },
            { word: 'Hydration', ipa: '/haɪˈdreɪʃn/', meaning: 'Bổ sung nước cơ thể', ex: 'Proper sports drink hydration.', tr: 'Bổ sung nước uống thể thao đúng cách.' },
            { word: 'Nutrition', ipa: '/nuːˈtrɪʃn/', meaning: 'Dinh dưỡng vận động viên', ex: 'Personalized athlete nutrition.', tr: 'Dinh dưỡng cá nhân hóa cho vận động viên.' },
            { word: 'Equipment', ipa: '/ɪˈkwɪpmənt/', meaning: 'Dụng cụ tập luyện', ex: 'Professional gym training equipment.', tr: 'Dụng cụ tập luyện gym chuyên nghiệp.' },
        ]);
        await seedTopicWithLevels('🌍 Chủ đề 10: Môi Trường & Thiên Nhiên (Environment & Nature)', '30 từ vựng biến đổi khí hậu, sinh thái', 10, [
            { word: 'Tree', ipa: '/triː/', meaning: 'Cây xanh', ex: 'Plant green forest tree.', tr: 'Trồng cây xanh gây rừng.' },
            { word: 'Sea', ipa: '/siː/', meaning: 'Biển cả', ex: 'Blue ocean sea water.', tr: 'Nước biển đại dương xanh.' },
            { word: 'Sun', ipa: '/sʌn/', meaning: 'Mặt trời', ex: 'Bright warm morning sun.', tr: 'Ánh mặt trời buổi sáng ấm áp.' },
            { word: 'Rain', ipa: '/reɪn/', meaning: 'Cơn mưa', ex: 'Heavy tropical summer rain.', tr: 'Cơn mưa mùa hè nhiệt đới lớn.' },
            { word: 'Wind', ipa: '/wɪnd/', meaning: 'Cơn gió', ex: 'Fresh cool ocean wind.', tr: 'Làn gió biển mát lành.' },
            { word: 'Park', ipa: '/pɑːrk/', meaning: 'Công viên cây xanh', ex: 'City public green park.', tr: 'Công viên cây xanh công cộng của thành phố.' },
            { word: 'Bird', ipa: '/bɜːrd/', meaning: 'Loài chim', ex: 'Singing wild forest bird.', tr: 'Loài chim rừng hót líu lo.' },
            { word: 'Land', ipa: '/lænd/', meaning: 'Đất đai', ex: 'Fertile agricultural land.', tr: 'Đất đai nông nghiệp phì nhiêu.' },
            { word: 'Air', ipa: '/er/', meaning: 'Không khí', ex: 'Fresh clean mountain air.', tr: 'Không khí núi đồi trong lành.' },
            { word: 'River', ipa: '/ˈrɪvər/', meaning: 'Dòng sông', ex: 'Long winding blue river.', tr: 'Dòng sông xanh uốn lượn dài.' },
        ], [
            { word: 'Nature', ipa: '/ˈneɪtʃər/', meaning: 'Thiên nhiên', ex: 'Protect wild natural nature.', tr: 'Bảo vệ thiên nhiên hoang dã.' },
            { word: 'Climate', ipa: '/ˈklaɪmət/', meaning: 'Khí hậu thời tiết', ex: 'Tropical warm humid climate.', tr: 'Khí hậu nhiệt đới ẩm ấm áp.' },
            { word: 'Ocean', ipa: '/ˈoʊʃn/', meaning: 'Đại dương bao la', ex: 'Deep blue Pacific ocean.', tr: 'Thái Bình Dương xanh thẫm bao la.' },
            { word: 'Forest', ipa: '/ˈfɔːrɪst/', meaning: 'Khu rừng nguyên sinh', ex: 'Dense Amazon rain forest.', tr: 'Khu rừng mưa nguyên sinh Amazon.' },
            { word: 'Animal', ipa: '/ˈænɪml/', meaning: 'Động vật hoang dã', ex: 'Protect endangered wild animal.', tr: 'Bảo vệ động vật hoang dã có nguy cơ tuyệt chủng.' },
            { word: 'Planet', ipa: '/ˈplænɪt/', meaning: 'Hành tinh Trái Đất', ex: 'Protect green Earth planet.', tr: 'Bảo vệ hành tinh Trái Đất xanh.' },
            { word: 'Energy', ipa: '/ˈenərdʒi/', meaning: 'Nguồn năng lượng', ex: 'Clean green solar energy.', tr: 'Nguồn năng lượng mặt trời xanh sạch.' },
            { word: 'Recycle', ipa: '/ˌriːˈsaɪkl/', meaning: 'Tái chế rác thải', ex: 'Recycle plastic waste bottles.', tr: 'Tái chế chai rác thải nhựa.' },
            { word: 'Waste', ipa: '/weɪst/', meaning: 'Rác thải sinh hoạt', ex: 'Reduce toxic chemical waste.', tr: 'Giảm thiểu rác thải hóa chất độc hại.' },
            { word: 'Garden', ipa: '/ˈɡɑːrdn/', meaning: 'Khu vườn hoa', ex: 'Beautiful home flower garden.', tr: 'Khu vườn hoa đẹp tại nhà.' },
        ], [
            { word: 'Ecosystem', ipa: '/ˈiːkoʊsɪstəm/', meaning: 'Hệ sinh thái tự nhiên', ex: 'Fragile marine ecosystem.', tr: 'Hệ sinh thái biển mỏng manh.' },
            { word: 'Climate Change', ipa: '/ˈklaɪmət tʃeɪndʒ/', meaning: 'Biến đổi khí hậu', ex: 'Mitigate global climate change.', tr: 'Giảm thiểu biến đổi khí hậu toàn cầu.' },
            { word: 'Renewable', ipa: '/rɪˈnuːəbl/', meaning: 'Tái tạo được', ex: 'Renewable wind power energy.', tr: 'Nguồn năng lượng điện gió tái tạo được.' },
            { word: 'Pollution', ipa: '/pəˈluːʃn/', meaning: 'Sự ô nhiễm môi trường', ex: 'Severe urban air pollution.', tr: 'Sự ô nhiễm không khí đô thị nghiêm trọng.' },
            { word: 'Conservation', ipa: '/ˌkɑːnsərˈveɪʃn/', meaning: 'Sự bảo tồn thiên nhiên', ex: 'Wild nature conservation fund.', tr: 'Quỹ bảo tồn thiên nhiên hoang dã.' },
            { word: 'Biodiversity', ipa: '/ˌbaɪoʊdaɪˈvɜːrsəti/', meaning: 'Đa dạng sinh học', ex: 'Rich tropical biodiversity.', tr: 'Sự đa dạng sinh học nhiệt đới phong phú.' },
            { word: 'Atmosphere', ipa: '/ˈætməsfɪr/', meaning: 'Bầu khí quyển', ex: 'Protect Earth atmosphere ozone layer.', tr: 'Bảo vệ tầng ozon khí quyển Trái Đất.' },
            { word: 'Global Warming', ipa: '/ˌɡloʊbl ˈwɔːrmɪŋ/', meaning: 'Nóng lên toàn cầu', ex: 'Combat global warming threat.', tr: 'Chống lại hiểm họa nóng lên toàn cầu.' },
            { word: 'Solar', ipa: '/ˈsoʊlər/', meaning: 'Năng lượng mặt trời', ex: 'Solar panel clean energy.', tr: 'Năng lượng sạch từ tấm pin mặt trời.' },
            { word: 'Sustainability', ipa: '/səˌsteɪnəˈbɪləti/', meaning: 'Sự phát triển bền vững', ex: 'Environmental green sustainability.', tr: 'Sự phát triển xanh bền vững của môi trường.' },
        ]);
        console.log('🎉 Seeded 10 Topics x 3 Levels (300 REAL Vocabularies total) successfully!');
    }
    async getUnitTest(unitId) {
        let unit = await this.prisma.unit.findUnique({
            where: { id: unitId },
            include: {
                lessons: {
                    include: {
                        lessonVocabularies: {
                            include: { vocabulary: true },
                        },
                    },
                },
            },
        });
        if (!unit) {
            unit = await this.prisma.unit.findFirst({
                include: {
                    lessons: {
                        include: {
                            lessonVocabularies: {
                                include: { vocabulary: true },
                            },
                        },
                    },
                },
            });
        }
        if (!unit) {
            throw new common_1.NotFoundException('Chủ đề bài thi không tồn tại');
        }
        const allVocabs = unit.lessons.flatMap((l) => l.lessonVocabularies.map((lv) => lv.vocabulary));
        if (allVocabs.length === 0) {
            throw new common_1.NotFoundException('Chưa có từ vựng để tạo bài test');
        }
        const shuffledVocabs = [...allVocabs].sort(() => Math.random() - 0.5);
        const selectedVocabs = shuffledVocabs.slice(0, 20);
        const generatedQuestions = selectedVocabs.map((vocab, index) => {
            const wrongOptions = allVocabs
                .filter((v) => v.id !== vocab.id)
                .map((v) => v.meaning)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            const options = [vocab.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
            return {
                id: `q_test_${index + 1}_${vocab.id}`,
                type: 'MULTIPLE_CHOICE',
                prompt: `Câu ${index + 1}/20: Từ "${vocab.word}" ${vocab.ipa ? `(${vocab.ipa})` : ''} có nghĩa là gì?`,
                options,
                correctAnswer: vocab.meaning,
                explanation: `"${vocab.word}" nghĩa là: ${vocab.meaning}.${vocab.exampleSentence ? ` Ví dụ: "${vocab.exampleSentence}"` : ''}`,
            };
        });
        return {
            unitId: unit.id,
            unitTitle: unit.title,
            totalQuestions: generatedQuestions.length,
            questions: generatedQuestions,
        };
    }
    async submitUnitTest(userId, unitId, score) {
        let unit = await this.prisma.unit.findUnique({
            where: { id: unitId },
        });
        if (!unit) {
            unit = await this.prisma.unit.findFirst();
        }
        const normalizedScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
        const isPassed = normalizedScore >= 80;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const currentUnlockedIndex = user?.unlockedUnitIndex || 1;
        let xpToAdd = 0;
        let nextUnlockedIndex = currentUnlockedIndex;
        if (isPassed && unit) {
            xpToAdd = 100;
            nextUnlockedIndex = Math.max(currentUnlockedIndex, unit.orderIndex + 1);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                totalXp: { increment: xpToAdd },
                unlockedUnitIndex: nextUnlockedIndex,
                streakCount: { increment: 1 },
            },
        });
        return {
            message: isPassed
                ? `🎉 XUẤT SẮC! Bạn đạt ${normalizedScore}% (>= 80%). Nhận THƯỞNG NÓNG +100 XP & Tự Động Mở Khóa Chủ Đề Tiếp Theo!`
                : `Bạn đạt ${normalizedScore}%. Hãy cố gắng đạt từ 80% trở lên để nhận +100 XP nhé!`,
            passed: isPassed,
            score: normalizedScore,
            xpEarned: xpToAdd,
            totalXp: updatedUser.totalXp,
            streakCount: updatedUser.streakCount,
            badge: isPassed ? '🎖️ Huy Hiệu Quán Quân Chủ Đề' : null,
            nextUnitUnlocked: isPassed,
        };
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map