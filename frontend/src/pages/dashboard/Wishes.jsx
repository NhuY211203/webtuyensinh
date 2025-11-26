export default function Wishes(){
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hướng dẫn cách đăng ký nguyện vọng xét tuyển đại học năm 2025</h1>

      {/* Giới thiệu */}
      <div className="card p-4 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Từ năm 2025, Bộ GD-ĐT chính thức bỏ xét tuyển sớm trong tuyển sinh đại học và tất cả đều phải tuân theo quy trình xét tuyển chung trên hệ thống của bộ. Ngay sau khi biết điểm thi tốt nghiệp THPT, thí sinh bắt đầu đăng ký và điều chỉnh nguyện vọng xét tuyển (không giới hạn số lần) trong khoảng thời gian từ ngày <b>16/07 đến 28/07/2025</b>.
        </p>
        <p className="text-sm text-gray-700 mt-3 leading-relaxed">
          Dưới đây là hướng dẫn chi tiết giúp thí sinh thực hiện đúng các bước trên hệ thống tuyển sinh quốc gia.
        </p>
      </div>

      {/* Bước 1 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 1: Đăng nhập hệ thống bằng tài khoản đã được cấp</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Thí sinh truy cập website: <b>http://thisinh.thitotnghiepthpt.edu.vn</b>.</li>
          <li>Đăng nhập bằng <b>Tên đăng nhập</b> (số CMND/CCCD hoặc mã định danh), <b>Mật khẩu</b> và <b>Mã xác nhận</b>.</li>
          <li>Nếu đã đổi mật khẩu sau khi đăng ký dự thi, sử dụng mật khẩu mới để đăng nhập.</li>
        </ul>
        <img src="/Bước 1.jpg" alt="Bước 1 - Đăng nhập hệ thống" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Bước 2 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 2: Khai báo thông tin xét tuyển</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Tại giao diện chính, chọn mục <b>"Đăng ký thông tin xét tuyển sinh"</b>.</li>
          <li>Điền đầy đủ các thông tin: đối tượng ưu tiên, khu vực tuyển sinh, năm tốt nghiệp, thông tin liên thông (nếu có).</li>
          <li>Kiểm tra kỹ thông tin và nhấn <b>"Lưu thông tin"</b>.</li>
        </ul>
        <p className="text-sm text-gray-700 mt-3 ml-5">
          Màn hình Đăng ký thông tin xét tuyển sinh hiện ra, thí sinh bắt đầu kê khai thông tin tại các mục từ 1 – 4 theo hướng dẫn bên dưới.
        </p>
        <div className="mt-3 ml-5 text-sm text-gray-700 space-y-2">
          <p><b>Mục 01 "Danh sách nguyện vọng đủ điều kiện trúng tuyển"</b>: thí sinh lựa chọn nguyện vọng đủ điều kiện trúng tuyển theo mong muốn (nếu có) rồi nhấn vào nút "Tiếp theo".</p>
          <p>Đối với thí sinh đăng ký dự thi theo phương thức xét tuyển thẳng, ưu tiên xét tuyển theo quy định của Quy chế tuyển sinh hiện hành, thí sinh tick chọn các nguyện vọng trúng tuyển thẳng của các cơ sở giáo dục đã lựa chọn, hoàn tất thông tin, thứ tự nguyện vọng tuyển thẳng theo nhu cầu rồi nhấn nút Tiếp theo.</p>
          <p>Đối với thí sinh muốn tiếp tục xét tuyển chọn tiếp chọn mục <b>02 "Thêm nguyện vọng"</b> và thực hiện tiếp bước 3.</p>
          <p className="text-orange-600"><b>Lưu ý:</b> Đối với thí sinh đã trúng tuyển sớm có điều kiện tại và mong muốn học tại HUFLIT nên chọn trường ở nguyện vọng đầu tiên để chính thức trở thành tân sinh viên của HUFLIT với nhiều học bổng hấp dẫn.</p>
        </div>
        <img src="/2-7.jpg" alt="Bước 2 - Khai báo thông tin xét tuyển" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Bước 3 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 3: Thêm và quản lý nguyện vọng</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Nhấn <b>"Thêm nguyện vọng"</b> để đăng ký nguyện vọng mới.</li>
          <li>Khai báo thứ tự nguyện vọng, mã trường, mã ngành, phương thức xét tuyển và tổ hợp môn.</li>
          <li>Có thể sửa, xóa hoặc sắp xếp lại thứ tự nguyện vọng theo nhu cầu.</li>
          <li>Mỗi thao tác đều yêu cầu xác nhận bằng mã OTP được gửi về số điện thoại đã đăng ký.</li>
        </ul>
        <img src="/3-7.jpg" alt="Bước 3 - Danh sách nguyện vọng" className="mt-3 rounded border w-full h-auto" />
        <img src="/2-7.jpg" alt="Bước 3 - Chọn ngành/phương thức" className="mt-3 rounded border w-full h-auto" />
        <img src="/7-2.jpg" alt="Bước 3 - Xác nhận thêm nguyện vọng" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Bước 4 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 4: Xác nhận thông tin đăng ký</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Sau khi hoàn tất việc khai báo, thí sinh kiểm tra lại toàn bộ danh sách nguyện vọng.</li>
          <li>Hệ thống sẽ yêu cầu xác nhận bằng mã OTP – thí sinh soạn tin nhắn lấy mã và nhập vào hệ thống.</li>
          <li>Nhấn <b>"Xác nhận đăng ký"</b> để hoàn tất.</li>
        </ul>
        <img src="/4-5.jpg" alt="Bước 4 - Xác nhận thông tin đăng ký" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Bước 5 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 5: Thanh toán lệ phí xét tuyển</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Sau khi xác nhận đăng ký, truy cập lại mục <b>"Đăng ký thông tin xét tuyển sinh"</b> và nhấn nút <b>"Thanh toán"</b>.</li>
          <li>Thực hiện thanh toán trực tuyến theo hướng dẫn trên hệ thống.</li>
        </ul>
        <img src="/5-5.jpg" alt="Bước 5 - Thanh toán lệ phí xét tuyển" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Bước 6 */}
      <div className="card p-4 mb-4">
        <div className="font-semibold text-lg mb-3">Bước 6: In danh sách nguyện vọng và biên lai</div>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
          <li>Hệ thống sẽ cập nhật trạng thái <b>"Đã thanh toán"</b> cho các nguyện vọng.</li>
          <li>Thí sinh có thể in danh sách nguyện vọng đã đăng ký và biên lai thanh toán để lưu trữ đối chiếu khi cần.</li>
        </ul>
        <img src="/6-3.jpg" alt="Bước 6 - In danh sách và biên lai" className="mt-3 rounded border w-full h-auto" />
      </div>

      {/* Thời gian cần lưu ý */}
      <div className="card p-4 mb-6 bg-orange-50 border-orange-200">
        <div className="font-semibold text-lg mb-3 flex items-center gap-2">
          <span>📌</span>
          <span>Thời gian cần lưu ý</span>
        </div>
        <ul className="list-none text-sm text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-semibold">–</span>
            <span><b>Thời gian đăng ký và điều chỉnh nguyện vọng:</b> Từ ngày 16/07 đến 17h00 ngày 28/07/2025.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">–</span>
            <span><b>Thời gian thanh toán lệ phí xét tuyển:</b> Từ ngày 29/07 đến 17h00 ngày 05/08/2025.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
