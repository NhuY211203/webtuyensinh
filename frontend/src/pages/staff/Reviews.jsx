import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StaffReviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consultantId, setConsultantId] = useState("");
  const [consultants, setConsultants] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);

  // Load consultants list for filter
  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const res = await api.getConsultants({ per_page: 200 });
        if (res.success) {
          const list = res.data || [];
          setConsultants(list);
          // Chọn sẵn tư vấn viên đầu tiên nếu có
          if (list.length > 0) {
            setConsultantId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load consultants", err);
      }
    };
    loadConsultants();
  }, []);

  // Tự động tải nhận xét khi consultantId thay đổi
  useEffect(() => {
    const loadReviews = async () => {
      if (!consultantId) {
        setRatingSummary(null);
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await api.getConsultantRatingForStaff(consultantId);
        if (res.success) {
          setRatingSummary(res.data);
        } else {
          setError(res.message || "Không thể tải nhận xét");
          setRatingSummary(null);
        }
      } catch (err) {
        console.error("Failed to load ratings", err);
        setError(err.message || "Có lỗi xảy ra");
        setRatingSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [consultantId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Nhận xét người dùng
        </h1>
        <p className="text-slate-600">
          Xem đánh giá của người dùng cho từng tư vấn viên.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chọn tư vấn viên
            </label>
            <select
              value={consultantId}
              onChange={(e) => setConsultantId(e.target.value)}
              className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">-- Chọn tư vấn viên --</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.hoten} ({c.email})
                </option>
              ))}
            </select>
          </div>
          {loading && (
            <div className="text-sm text-slate-500">
              Đang tải nhận xét...
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {ratingSummary && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Tổng quan đánh giá
              </h2>
              <p className="text-slate-600 text-sm">
                Điểm trung bình và các nhận xét gần đây từ người dùng.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-500">
                {ratingSummary.average_rating?.toFixed(1) || "0.0"}
              </div>
              <div className="text-xs text-slate-500">
                trên 5.0 ({ratingSummary.total_ratings || 0} lượt đánh giá)
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            {(ratingSummary.reviews || []).length === 0 ? (
              <div className="text-sm text-slate-500">
                Chưa có nhận xét nào cho tư vấn viên này.
              </div>
            ) : (
              ratingSummary.reviews.map((review) => (
                <div
                  key={review.iddanhgia}
                  className="border border-slate-100 rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {review.nguoi_danh_gia}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(review.ngaydanhgia).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-yellow-500">
                          {review.diemdanhgia.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500">/ 5.0</span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          review.trangthai
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {review.trangthai ? "Đang hiển thị" : "Đang ẩn"}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const nextStatus = review.trangthai ? 0 : 1;
                            await api.updateScheduleRating(review.iddanhgia, {
                              trangthai: nextStatus,
                            });
                            // Cập nhật lại danh sách trên giao diện
                            setRatingSummary((prev) => ({
                              ...prev,
                              reviews: (prev?.reviews || []).map((r) =>
                                r.iddanhgia === review.iddanhgia
                                  ? { ...r, trangthai: nextStatus }
                                  : r
                              ),
                              total_ratings: prev.total_ratings,
                              average_rating: prev.average_rating,
                            }));
                          } catch (err) {
                            console.error("Failed to toggle visibility", err);
                            alert("Không thể cập nhật trạng thái nhận xét");
                          }
                        }}
                        className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                      >
                        {review.trangthai ? "Ẩn nhận xét" : "Hiện nhận xét"}
                      </button>
                    </div>
                  </div>
                  {review.nhanxet && (
                    <p className="text-sm text-slate-700">
                      {review.nhanxet}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


