
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="bg-primary-500/95 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Tra cứu & tư vấn tuyển sinh <span className="underline decoration-white/50">nhanh & chính xác</span>
            </h1>
            <p className="mt-4 text-white/90">
              Tổng hợp điểm chuẩn, phương thức, học phí từ các trường đại học — có biểu đồ, chatbot và đăng ký xét tuyển trực tuyến.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">Bắt đầu tra cứu</Link>
              <Link to="/login" className="btn-primary">Đăng nhập</Link>
            </div>
          </div>
          <div className="card p-6 bg-white/95 text-gray-800">
            <h3 className="font-semibold text-lg">Số liệu cập nhật</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { k: "Trường", v: "50+" },
                { k: "Ngành", v: "2.000+" },
                { k: "Năm dữ liệu", v: "5 năm" }
              ].map((it) => (
                <div key={it.k} className="rounded-xl bg-gray-50 p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600">{it.v}</div>
                  <div className="text-sm text-gray-500">{it.k}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">Nguồn: Website các trường & Bộ GD&ĐT.</p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-14">
        <h2 className="text-2xl font-bold">Tính năng nổi bật</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            {
              title: "Tìm kiếm & so sánh",
              desc: "Lọc theo trường, ngành, tổ hợp, phương thức, năm và học phí. So sánh 2–3 chương trình.",
            },
            {
              title: "Biểu đồ & phổ điểm",
              desc: "Xem xu hướng điểm chuẩn qua các năm và phân bố điểm theo tổ hợp.",
            },
            {
              title: "Đăng ký & thanh toán",
              desc: "Điền hồ sơ, quản lý nguyện vọng, thanh toán lệ phí và tải biên lai.",
            }
          ].map((c) => (
            <div key={c.title} className="card p-6">
              <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-700 grid place-items-center font-bold mb-3">✓</div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


// import { Link } from "react-router-dom";

// export default function Home() {
//   return (
//     <div>
//       <section className="bg-primary-600 text-white">
//         <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
//           <div>
//             <h1 className="text-4xl md:text-5xl font-bold leading-tight">
//               Tra cứu & tư vấn tuyển sinh nhanh & chính xác
//             </h1>
//             <p className="mt-4 text-white/90">
//               Tổng hợp điểm chuẩn, phương thức, học phí từ các trường đại học — có biểu đồ, chatbot và đăng ký xét tuyển trực tuyến.
//             </p>
//             <div className="mt-8 flex flex-wrap gap-3">
//               <Link to="/search" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">Bắt đầu tra cứu</Link>
//               <Link to="/dashboard" className="btn-primary">Vào bảng điều khiển</Link>
//             </div>
//           </div>
//           <div className="card p-6 bg-white/95 text-gray-800">
//             <h3 className="font-semibold text-lg">Số liệu cập nhật</h3>
//             <div className="grid grid-cols-3 gap-4 mt-4">
//               {[
//                 { k: "Trường", v: "50+" },
//                 { k: "Ngành", v: "2.000+" },
//                 { k: "Năm dữ liệu", v: "5 năm" }
//               ].map((it) => (
//                 <div key={it.k} className="rounded-xl bg-gray-50 p-4 text-center">
//                   <div className="text-2xl font-bold text-primary-100">{it.v}</div>
//                   <div className="text-sm text-gray-500">{it.k}</div>
//                 </div>
//               ))}
//             </div>
//             <p className="mt-4 text-sm text-gray-600">Nguồn: Website các trường & Bộ GD&ĐT.</p>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
