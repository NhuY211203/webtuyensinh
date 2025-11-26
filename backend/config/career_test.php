<?php

return [
    'groups' => [
        'IT' => [
            'label' => 'Công nghệ Thông tin',
            'manhom' => 'CNTT',
            'description' => 'Nhóm ngành về phần mềm, phần cứng, mạng máy tính và trí tuệ nhân tạo.'
        ],
        'MED' => [
            'label' => 'Y tế – Sức khỏe',
            'manhom' => 'YTE',
            'description' => 'Nhóm ngành chăm sóc sức khỏe con người, bao gồm y khoa, điều dưỡng, dược.'
        ],
        'BUS' => [
            'label' => 'Kinh tế – Quản lý',
            'manhom' => 'KTQL',
            'description' => 'Nhóm ngành về kinh doanh, tài chính, marketing và quản trị.'
        ],
        'ENG' => [
            'label' => 'Kỹ thuật – Công nghệ',
            'manhom' => 'KTSC',
            'description' => 'Nhóm ngành kỹ thuật ứng dụng, công nghệ chế tạo, xây dựng, điện – điện tử.'
        ],
        'INT' => [
            'label' => 'Ngoại ngữ – Quốc tế',
            'manhom' => 'NNQT',
            'description' => 'Nhóm ngành về ngoại ngữ, giao tiếp quốc tế và văn hóa toàn cầu.'
        ],
        'CRE' => [
            'label' => 'Sáng tạo – Truyền thông',
            'manhom' => 'STTT',
            'description' => 'Nhóm ngành nghệ thuật, thiết kế, truyền thông và sản xuất nội dung.'
        ],
        'LOG' => [
            'label' => 'Thương mại – Logistics',
            'manhom' => 'TMDT',
            'description' => 'Nhóm ngành thương mại điện tử, logistics và quản lý chuỗi cung ứng.'
        ],
        'ENV' => [
            'label' => 'Năng lượng – Bền vững',
            'manhom' => 'NLBT',
            'description' => 'Nhóm ngành năng lượng tái tạo, công nghệ xanh và phát triển bền vững.'
        ],
    ],
    'questions' => [
        [
            'id' => 'L1',
            'prompt' => 'Bạn đang xếp loại học lực nào?',
            'options' => [
                ['id' => 'L1A', 'label' => 'Giỏi / Xuất sắc', 'groups' => []],
                ['id' => 'L1B', 'label' => 'Khá', 'groups' => [], 'effects' => [
                    'exclude_groups' => ['MED'],
                    'reason' => 'Ngành Y tế – Sức khỏe yêu cầu nền tảng học lực Giỏi trở lên.'
                ]],
                ['id' => 'L1C', 'label' => 'Trung bình', 'groups' => [], 'effects' => [
                    'exclude_groups' => ['MED', 'IT', 'ENG'],
                    'reason' => 'Các ngành Công nghệ, Kỹ thuật, Y tế đòi hỏi học lực khá giỏi trở lên.'
                ]],
                ['id' => 'L1D', 'label' => 'Yếu', 'groups' => [], 'effects' => [
                    'exclude_groups' => ['MED', 'IT', 'ENG', 'INT'],
                    'reason' => 'Các ngành yêu cầu nền tảng kiến thức cao không phù hợp với học lực hiện tại.'
                ]],
            ],
        ],
        [
            'id' => 'L2',
            'prompt' => 'Môn học bạn yêu thích nhất?',
            'options' => [
                ['id' => 'L2A', 'label' => 'Toán / Tin học', 'groups' => ['IT', 'ENG']],
                ['id' => 'L2B', 'label' => 'Văn / Lịch sử / Địa lý', 'groups' => ['BUS', 'INT', 'CRE']],
                ['id' => 'L2C', 'label' => 'Sinh / Hóa', 'groups' => ['MED', 'ENV']],
                ['id' => 'L2D', 'label' => 'Ngoại ngữ', 'groups' => ['INT']],
                ['id' => 'L2E', 'label' => 'Mỹ thuật / Âm nhạc / Nghệ thuật', 'groups' => ['CRE']],
            ],
        ],
        [
            'id' => 'L3',
            'prompt' => 'Môn học bạn học tốt nhất?',
            'options' => [
                ['id' => 'L3A', 'label' => 'Toán, Lý hoặc Tin', 'groups' => ['IT', 'ENG', 'ENV']],
                ['id' => 'L3B', 'label' => 'Sinh hoặc Hóa', 'groups' => ['MED', 'ENV']],
                ['id' => 'L3C', 'label' => 'Văn, Sử, Địa', 'groups' => ['BUS', 'INT', 'CRE', 'LOG']],
                ['id' => 'L3D', 'label' => 'Ngoại ngữ', 'groups' => ['INT']],
                ['id' => 'L3E', 'label' => 'Kinh tế / Giáo dục công dân', 'groups' => ['BUS', 'LOG']],
            ],
        ],
        [
            'id' => 'L4',
            'prompt' => 'Bạn tự tin nhất ở khối môn nào?',
            'options' => [
                ['id' => 'L4A', 'label' => 'Khối tự nhiên (Toán – Lý – Hóa)', 'groups' => ['IT', 'ENG', 'ENV']],
                ['id' => 'L4B', 'label' => 'Khối Sinh – Hóa – Sinh học', 'groups' => ['MED', 'ENV']],
                ['id' => 'L4C', 'label' => 'Khối xã hội (Văn – Sử – Địa)', 'groups' => ['BUS', 'INT', 'CRE', 'LOG']],
            ],
        ],
        [
            'id' => 1,
            'prompt' => 'Môn học làm bạn cảm thấy tự tin nhất',
            'options' => [
                ['id' => '1A', 'label' => 'Giải bài lập trình hoặc logic', 'groups' => ['IT']],
                ['id' => '1B', 'label' => 'Nhớ kiến thức Sinh – Hóa nhanh', 'groups' => ['MED']],
                ['id' => '1C', 'label' => 'Tính toán kinh tế, phần trăm', 'groups' => ['BUS']],
                ['id' => '1D', 'label' => 'Phân tích lực, điện, dao động', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 2,
            'prompt' => 'Khi làm bài tập nhóm, bạn thường đảm nhận',
            'options' => [
                ['id' => '2A', 'label' => 'Lập trình, bảng tính', 'groups' => ['IT']],
                ['id' => '2B', 'label' => 'Ghi chép, theo dõi tiến độ, chăm sóc nhóm', 'groups' => ['MED']],
                ['id' => '2C', 'label' => 'Quản lý nhiệm vụ, liên hệ mọi người', 'groups' => ['BUS']],
                ['id' => '2D', 'label' => 'Thiết kế mô hình hoặc lắp ráp', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 3,
            'prompt' => 'Bạn muốn học sâu hơn về chủ đề nào?',
            'options' => [
                ['id' => '3A', 'label' => 'Trí tuệ nhân tạo, lập trình web', 'groups' => ['IT']],
                ['id' => '3B', 'label' => 'Cơ thể người, bệnh lý', 'groups' => ['MED']],
                ['id' => '3C', 'label' => 'Kinh doanh, thị trường, tài chính', 'groups' => ['BUS']],
                ['id' => '3D', 'label' => 'Máy móc, tự động hóa', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 4,
            'prompt' => 'Khi xem TikTok/Youtube, bạn thích nội dung',
            'options' => [
                ['id' => '4A', 'label' => 'Công nghệ, AI, máy tính', 'groups' => ['IT']],
                ['id' => '4B', 'label' => 'Chăm sóc sức khỏe, bệnh học', 'groups' => ['MED']],
                ['id' => '4C', 'label' => 'Kinh tế, làm giàu, marketing', 'groups' => ['BUS']],
                ['id' => '4D', 'label' => 'Robot, chế tạo', 'groups' => ['ENG']],
                ['id' => '4E', 'label' => 'Du lịch nước ngoài', 'groups' => ['INT']],
                ['id' => '4F', 'label' => 'Dựng video, làm content', 'groups' => ['CRE']],
                ['id' => '4G', 'label' => 'Chuỗi cung ứng, vận tải', 'groups' => ['LOG']],
                ['id' => '4H', 'label' => 'Môi trường, khí hậu', 'groups' => ['ENV']],
            ],
        ],
        [
            'id' => 5,
            'prompt' => 'Cách bạn giải quyết vấn đề',
            'options' => [
                ['id' => '5A', 'label' => 'Chia nhỏ, dùng logic để giải', 'groups' => ['IT']],
                ['id' => '5B', 'label' => 'Tìm nguyên nhân gốc rễ, cẩn thận', 'groups' => ['MED']],
                ['id' => '5C', 'label' => 'Đánh giá tổng thể và đưa quyết định', 'groups' => ['BUS']],
                ['id' => '5D', 'label' => 'Thử nghiệm – sửa chữa nhiều lần', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 6,
            'prompt' => 'Bạn thích kiểu bài tập nào nhất?',
            'options' => [
                ['id' => '6A', 'label' => 'Viết code, mô phỏng trên máy', 'groups' => ['IT']],
                ['id' => '6B', 'label' => 'Làm thí nghiệm Sinh – Hóa', 'groups' => ['MED']],
                ['id' => '6C', 'label' => 'Thực hành kinh doanh giả lập', 'groups' => ['BUS']],
                ['id' => '6D', 'label' => 'Lắp mạch điện, mô hình', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 7,
            'prompt' => 'Điều bạn muốn trong công việc tương lai',
            'options' => [
                ['id' => '7A', 'label' => 'Được làm với máy tính, công nghệ mới', 'groups' => ['IT']],
                ['id' => '7B', 'label' => 'Giúp đỡ, cứu người', 'groups' => ['MED']],
                ['id' => '7C', 'label' => 'Thu nhập cao, môi trường năng động', 'groups' => ['BUS']],
                ['id' => '7D', 'label' => 'Làm ra sản phẩm thực tế', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 8,
            'prompt' => 'Bạn có hứng thú với ngoại ngữ đến mức nào?',
            'options' => [
                ['id' => '8A', 'label' => 'Rất thích, muốn dùng hằng ngày', 'groups' => ['INT']],
                ['id' => '8B', 'label' => 'Bình thường, chỉ khi cần thiết', 'groups' => ['BUS', 'CRE']],
                ['id' => '8C', 'label' => 'Không thích lắm', 'groups' => ['IT', 'ENG']],
            ],
        ],
        [
            'id' => 9,
            'prompt' => 'Bạn thích loại dự án nào sau đây?',
            'options' => [
                ['id' => '9A', 'label' => 'Xây website/app', 'groups' => ['IT']],
                ['id' => '9B', 'label' => 'Thiết kế poster/video', 'groups' => ['CRE']],
                ['id' => '9C', 'label' => 'Tính chi phí, lập kế hoạch', 'groups' => ['BUS']],
                ['id' => '9D', 'label' => 'Lắp robot hoặc mô hình kỹ thuật', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 10,
            'prompt' => 'Bạn đánh giá sức khỏe – sự kiên nhẫn của mình',
            'options' => [
                ['id' => '10A', 'label' => 'Không ngại học lâu, học khó', 'groups' => ['MED']],
                ['id' => '10B', 'label' => 'Dễ tập trung vào bài logic', 'groups' => ['IT']],
                ['id' => '10C', 'label' => 'Chịu áp lực khi có deadline', 'groups' => ['BUS']],
                ['id' => '10D', 'label' => 'Chịu được việc thực hành dài', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 11,
            'prompt' => 'Bạn thích đọc loại bài nào?',
            'options' => [
                ['id' => '11A', 'label' => 'Tin công nghệ', 'groups' => ['IT']],
                ['id' => '11B', 'label' => 'Kiến thức y khoa', 'groups' => ['MED']],
                ['id' => '11C', 'label' => 'Phân tích kinh tế – thị trường', 'groups' => ['BUS']],
                ['id' => '11D', 'label' => 'Chuỗi cung ứng – vận tải', 'groups' => ['LOG']],
                ['id' => '11E', 'label' => 'Môi trường – năng lượng sạch', 'groups' => ['ENV']],
            ],
        ],
        [
            'id' => 12,
            'prompt' => 'Nếu được chọn tham gia CLB, bạn chọn',
            'options' => [
                ['id' => '12A', 'label' => 'CLB Tin học', 'groups' => ['IT']],
                ['id' => '12B', 'label' => 'CLB Tình nguyện', 'groups' => ['MED']],
                ['id' => '12C', 'label' => 'CLB Kinh doanh – Khởi nghiệp', 'groups' => ['BUS']],
                ['id' => '12D', 'label' => 'CLB STEM – Robot', 'groups' => ['ENG']],
                ['id' => '12E', 'label' => 'CLB Media – Thiết kế', 'groups' => ['CRE']],
                ['id' => '12F', 'label' => 'CLB Tiếng Anh', 'groups' => ['INT']],
            ],
        ],
        [
            'id' => 13,
            'prompt' => 'Phong cách học tập của bạn',
            'options' => [
                ['id' => '13A', 'label' => 'Tự học qua video, internet', 'groups' => ['IT']],
                ['id' => '13B', 'label' => 'Nghe giảng và ghi chép kỹ', 'groups' => ['MED']],
                ['id' => '13C', 'label' => 'Học qua trao đổi nhóm', 'groups' => ['BUS', 'INT']],
                ['id' => '13D', 'label' => 'Học qua thực hành và thí nghiệm', 'groups' => ['ENG', 'ENV']],
            ],
        ],
        [
            'id' => 14,
            'prompt' => 'Bạn tự mô tả mình là người',
            'options' => [
                ['id' => '14A', 'label' => 'Logic – thích tính toán', 'groups' => ['IT']],
                ['id' => '14B', 'label' => 'Tỉ mỉ – kiên nhẫn', 'groups' => ['MED']],
                ['id' => '14C', 'label' => 'Năng động – nói chuyện tốt', 'groups' => ['BUS']],
                ['id' => '14D', 'label' => 'Sáng tạo – hay nghĩ ý tưởng', 'groups' => ['CRE']],
            ],
        ],
        [
            'id' => 15,
            'prompt' => 'Khi gặp việc khó, bạn thường',
            'options' => [
                ['id' => '15A', 'label' => 'Tìm cách tối ưu, đơn giản hóa', 'groups' => ['IT']],
                ['id' => '15B', 'label' => 'Hỏi thêm thông tin để hiểu rõ', 'groups' => ['MED']],
                ['id' => '15C', 'label' => 'Hỏi ý kiến nhiều người', 'groups' => ['BUS', 'INT']],
                ['id' => '15D', 'label' => 'Thử nghiệm cho đến khi ra kết quả', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 16,
            'prompt' => 'Bạn thích xem gì trong tin tức?',
            'options' => [
                ['id' => '16A', 'label' => 'Công nghệ mới', 'groups' => ['IT']],
                ['id' => '16B', 'label' => 'Y tế – dịch bệnh', 'groups' => ['MED']],
                ['id' => '16C', 'label' => 'Kinh tế – tài chính', 'groups' => ['BUS']],
                ['id' => '16D', 'label' => 'Môi trường – năng lượng', 'groups' => ['ENV']],
            ],
        ],
        [
            'id' => 17,
            'prompt' => 'Bạn bị thu hút bởi công việc nào nhất?',
            'options' => [
                ['id' => '17A', 'label' => 'Lập trình viên, kỹ sư phần mềm', 'groups' => ['IT']],
                ['id' => '17B', 'label' => 'Điều dưỡng, bác sĩ', 'groups' => ['MED']],
                ['id' => '17C', 'label' => 'Chuyên viên kinh doanh', 'groups' => ['BUS']],
                ['id' => '17D', 'label' => 'Kỹ sư cơ điện, cơ khí', 'groups' => ['ENG']],
                ['id' => '17E', 'label' => 'Biên dịch viên, tiếp viên', 'groups' => ['INT']],
                ['id' => '17F', 'label' => 'Designer, làm nội dung', 'groups' => ['CRE']],
                ['id' => '17G', 'label' => 'Logistics, xuất nhập khẩu', 'groups' => ['LOG']],
            ],
        ],
        [
            'id' => 18,
            'prompt' => 'Bạn thích sử dụng công cụ nào nhất?',
            'options' => [
                ['id' => '18A', 'label' => 'Máy tính, IDE lập trình', 'groups' => ['IT']],
                ['id' => '18B', 'label' => 'Dụng cụ y tế, mô hình Sinh', 'groups' => ['MED']],
                ['id' => '18C', 'label' => 'Bảng tính Excel, tài liệu kế hoạch', 'groups' => ['BUS']],
                ['id' => '18D', 'label' => 'Máy móc, thiết bị thực hành', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 19,
            'prompt' => 'Ở trường, bạn thường được giao nhiệm vụ',
            'options' => [
                ['id' => '19A', 'label' => 'Soạn slide, thiết kế', 'groups' => ['CRE']],
                ['id' => '19B', 'label' => 'Ghi chép, hỗ trợ', 'groups' => ['MED']],
                ['id' => '19C', 'label' => 'Tổng hợp ý kiến nhóm', 'groups' => ['BUS']],
                ['id' => '19D', 'label' => 'Tính toán – giải bài khó', 'groups' => ['IT', 'ENG']],
            ],
        ],
        [
            'id' => 20,
            'prompt' => 'Điều khiến bạn thấy hứng thú nhất',
            'options' => [
                ['id' => '20A', 'label' => 'Tạo ra phần mềm hữu ích', 'groups' => ['IT']],
                ['id' => '20B', 'label' => 'Chăm sóc và bảo vệ người khác', 'groups' => ['MED']],
                ['id' => '20C', 'label' => 'Tối ưu lợi nhuận', 'groups' => ['BUS']],
                ['id' => '20D', 'label' => 'Giảm phát thải – bảo vệ môi trường', 'groups' => ['ENV']],
            ],
        ],
        [
            'id' => 21,
            'prompt' => 'Bạn thích kiểu bài kiểm tra nào?',
            'options' => [
                ['id' => '21A', 'label' => 'Trắc nghiệm logic', 'groups' => ['IT']],
                ['id' => '21B', 'label' => 'Tự luận nhớ nhiều chi tiết', 'groups' => ['MED']],
                ['id' => '21C', 'label' => 'Bài tình huống thực tế', 'groups' => ['BUS']],
                ['id' => '21D', 'label' => 'Thực hành – mô phỏng', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 22,
            'prompt' => 'Bạn mơ ước điều gì trong tương lai?',
            'options' => [
                ['id' => '22A', 'label' => 'Làm việc trong ngành công nghệ lớn', 'groups' => ['IT']],
                ['id' => '22B', 'label' => 'Trở thành chuyên gia sức khỏe', 'groups' => ['MED']],
                ['id' => '22C', 'label' => 'Tự kinh doanh hoặc quản lý', 'groups' => ['BUS']],
                ['id' => '22D', 'label' => 'Làm việc ở các nước phát triển', 'groups' => ['INT']],
            ],
        ],
        [
            'id' => 23,
            'prompt' => 'Nếu phải chọn 1 môn để học thêm',
            'options' => [
                ['id' => '23A', 'label' => 'Lập trình', 'groups' => ['IT']],
                ['id' => '23B', 'label' => 'Sơ cứu – y khoa cơ bản', 'groups' => ['MED']],
                ['id' => '23C', 'label' => 'Kỹ năng thuyết trình', 'groups' => ['BUS']],
                ['id' => '23D', 'label' => 'Tiếng Anh giao tiếp', 'groups' => ['INT']],
            ],
        ],
        [
            'id' => 24,
            'prompt' => 'Bạn quen thuộc nhất với các dụng cụ nào?',
            'options' => [
                ['id' => '24A', 'label' => 'Máy tính, phần mềm', 'groups' => ['IT']],
                ['id' => '24B', 'label' => 'Dụng cụ thực hành y – sinh', 'groups' => ['MED']],
                ['id' => '24C', 'label' => 'Sổ tay, kế hoạch, tài liệu kinh doanh', 'groups' => ['BUS']],
                ['id' => '24D', 'label' => 'Máy móc, dụng cụ sửa chữa', 'groups' => ['ENG']],
            ],
        ],
        [
            'id' => 25,
            'prompt' => 'Nếu phải chọn 1 vấn đề muốn giải quyết trong xã hội',
            'options' => [
                ['id' => '25A', 'label' => 'Tự động hóa – công nghệ hóa', 'groups' => ['IT']],
                ['id' => '25B', 'label' => 'Sức khỏe – dịch bệnh', 'groups' => ['MED']],
                ['id' => '25C', 'label' => 'Kinh tế – việc làm', 'groups' => ['BUS']],
                ['id' => '25D', 'label' => 'Giao thông – vận tải hàng hóa', 'groups' => ['LOG']],
                ['id' => '25E', 'label' => 'Môi trường – năng lượng sạch', 'groups' => ['ENV']],
            ],
        ],
    ],
];

