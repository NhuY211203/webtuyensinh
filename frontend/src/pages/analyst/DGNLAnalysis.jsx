import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Toast from "../../components/Toast";

export default function DGNLAnalysis() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [summary, setSummary] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [bucketData, setBucketData] = useState([]);
  const [attemptScoresByExam, setAttemptScoresByExam] = useState({});
  const [allAttempts, setAllAttempts] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [examsById, setExamsById] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const processData = (attempts, examsById, yearFilter) => {
    const filteredAttempts = attempts.filter((att) => {
      if (yearFilter === "all") return true;
      if (!att.created_at) return false;
      const attemptYear = new Date(att.created_at).getFullYear();
      return String(attemptYear) === String(yearFilter);
    });

    const summaryMap = {};
    const scoresByExam = {};
    filteredAttempts.forEach((att) => {
      const id = att.idkythi;
      if (!id) return;
      if (!summaryMap[id]) {
        const exam = examsById[id];
        summaryMap[id] = {
          idkythi: id,
          tenkythi: exam?.tenkythi || `Kỳ thi ${id}`,
          count: 0,
          totalScore: 0,
          maxScore: null,
          minScore: null,
        };
      }
      const s = Number(att.tong_diem) || 0;
      const item = summaryMap[id];
      item.count += 1;
      item.totalScore += s;
      item.maxScore = item.maxScore === null ? s : Math.max(item.maxScore, s);
      item.minScore = item.minScore === null ? s : Math.min(item.minScore, s);
      if (!scoresByExam[id]) scoresByExam[id] = [];
      scoresByExam[id].push(s);
    });

    const list = Object.values(summaryMap).map((item) => {
      const avg = item.count ? item.totalScore / item.count : 0;
      return {
        ...item,
        avgScore: Number(avg.toFixed(1)),
        tenkythiShort:
          item.tenkythi && item.tenkythi.length > 32
            ? item.tenkythi.slice(0, 32) + "..."
            : item.tenkythi,
      };
    });

    list.sort((a, b) => b.count - a.count);
    return { list, scoresByExam };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        fetch("http://localhost:8000/api/kythi-dgnl/exams"),
        fetch("http://localhost:8000/api/kythi-dgnl/attempts"),
      ]);
      const examsJson = await examsRes.json();
      const attemptsJson = await attemptsRes.json();

      if (!examsJson.success || !attemptsJson.success) {
        showToast("Không thể tải dữ liệu kỳ thi hoặc lượt làm bài ĐGNL", "error");
        return;
      }

      const examsByIdMap = {};
      (examsJson.data || []).forEach((exam) => {
        examsByIdMap[exam.idkythi] = exam;
      });
      setExamsById(examsByIdMap);

      const attempts = attemptsJson.data || [];
      setAllAttempts(attempts);

      // Lấy danh sách các năm có sẵn
      const yearsSet = new Set();
      attempts.forEach((att) => {
        if (att.created_at) {
          const year = new Date(att.created_at).getFullYear();
          yearsSet.add(year);
        }
      });
      const years = Array.from(yearsSet).sort((a, b) => b - a);
      setAvailableYears(years);

      // Xử lý dữ liệu với năm được chọn
      const { list, scoresByExam } = processData(attempts, examsByIdMap, selectedYear);
      setSummary(list);
      setAttemptScoresByExam(scoresByExam);
      if (!selectedExamId && list.length > 0) {
        setSelectedExamId(String(list[0].idkythi));
      }
    } catch (error) {
      console.error("Failed to load DGNL analysis", error);
      showToast("Lỗi khi tải dữ liệu phân tích ĐGNL", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý lại dữ liệu khi năm thay đổi
  useEffect(() => {
    if (allAttempts.length === 0 || Object.keys(examsById).length === 0) return;
    
    const { list, scoresByExam } = processData(allAttempts, examsById, selectedYear);
    setSummary(list);
    setAttemptScoresByExam(scoresByExam);
    // Reset selected exam nếu exam hiện tại không còn trong danh sách
    const currentSelectedId = selectedExamId;
    if (currentSelectedId && !list.find((s) => String(s.idkythi) === String(currentSelectedId))) {
      if (list.length > 0) {
        setSelectedExamId(String(list[0].idkythi));
      } else {
        setSelectedExamId("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, allAttempts, examsById]);

  // Recompute histogram buckets whenever kỳ thi chọn hoặc dữ liệu thay đổi
  useEffect(() => {
    const examId = selectedExamId;
    if (!examId) {
      setBucketData([]);
      return;
    }
    const scores = attemptScoresByExam[examId] || [];
    if (!scores.length) {
      setBucketData([]);
      return;
    }

    let min = Math.min(...scores);
    let max = Math.max(...scores);
    if (min === max) {
      setBucketData([
        {
          range: `≈ ${Math.round(max)}`,
          count: scores.length,
        },
      ]);
      return;
    }

    const bucketCount = 5;
    const size = Math.max((max - min) / bucketCount, 1);
    const buckets = [];

    for (let i = 0; i < bucketCount; i++) {
      const start = min + i * size;
      const end = i === bucketCount - 1 ? max : start + size;
      const label = `${Math.round(start)}–${Math.round(end)}`;
      let count = 0;
      scores.forEach((s) => {
        if (i === bucketCount - 1) {
          if (s >= start && s <= end) count++;
        } else if (s >= start && s < end) {
          count++;
        }
      });
      buckets.push({ range: label, count });
    }

    setBucketData(buckets);
  }, [selectedExamId, attemptScoresByExam]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phân tích kết quả thi thử ĐGNL</h1>
      </div>

      <div className="card p-5 space-y-4">
        {summary.length === 0 ? (
          <p className="text-sm text-gray-500">
            Hiện chưa có lượt thi thử ĐGNL nào được ghi nhận. Khi thí sinh làm bài trong mục Luyện
            thi ĐGNL, kết quả sẽ được lưu và hiển thị tại đây.
          </p>
        ) : (
          <>
            {/* Bộ lọc kỳ thi và năm */}
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-1">Năm</label>
                <select
                  className="input w-40"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kỳ thi</label>
                <select
                  className="input w-64"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                >
                  {summary.map((item) => (
                    <option key={item.idkythi} value={item.idkythi}>
                      {item.tenkythi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">
                Đang chọn:{" "}
                <span className="font-semibold">
                  {summary.find((s) => String(s.idkythi) === String(selectedExamId))?.tenkythi ||
                    "—"}
                </span>
                {selectedYear !== "all" && (
                  <span className="ml-2">
                    (Năm: <span className="font-semibold">{selectedYear}</span>)
                  </span>
                )}
              </div>
            </div>

          <div className="grid md:grid-cols-2 gap-6 mt-2">
            <div>
              <h2 className="text-base font-semibold mb-3">
                Phân bố điểm thi thử (theo khoảng điểm)
              </h2>
              {bucketData.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có dữ liệu điểm cho kỳ thi được chọn.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={bucketData}
                    margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Số lượt" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-3">
                Thống kê tổng quan lượt thi thử ĐGNL
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Kỳ thi</th>
                      <th className="px-3 py-2 text-center">Số lượt</th>
                      <th className="px-3 py-2 text-center">Điểm TB</th>
                      <th className="px-3 py-2 text-center">Cao nhất</th>
                      <th className="px-3 py-2 text-center">Thấp nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((item) => (
                      <tr key={item.idkythi} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.tenkythi}</div>
                          <div className="text-xs text-gray-500">ID: {item.idkythi}</div>
                        </td>
                        <td className="px-3 py-2 text-center">{item.count}</td>
                        <td className="px-3 py-2 text-center">{item.avgScore}</td>
                        <td className="px-3 py-2 text-center">
                          {item.maxScore !== null ? item.maxScore : "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.minScore !== null ? item.minScore : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}


