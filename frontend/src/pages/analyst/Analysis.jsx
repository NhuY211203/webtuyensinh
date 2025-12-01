import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import Toast from "../../components/Toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Analysis() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Data states
  const [hotMajorsData, setHotMajorsData] = useState([]);
  const [scoreTrendData, setScoreTrendData] = useState([]);
  const [employmentData, setEmploymentData] = useState([]);
  const [scoreComparisonData, setScoreComparisonData] = useState([]);
  const [bubbleData, setBubbleData] = useState([]);
  const [stackedBarData, setStackedBarData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [groupedBarData, setGroupedBarData] = useState([]);
  const [dgnlExamSummary, setDgnlExamSummary] = useState([]);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  // Load data functions
  const loadHotMajorsTrend = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { year: "2020", "Công nghệ thông tin": 1200, "Khoa học máy tính": 980, "Kỹ thuật phần mềm": 850 },
        { year: "2021", "Công nghệ thông tin": 1450, "Khoa học máy tính": 1120, "Kỹ thuật phần mềm": 1020 },
        { year: "2022", "Công nghệ thông tin": 1680, "Khoa học máy tính": 1350, "Kỹ thuật phần mềm": 1250 },
        { year: "2023", "Công nghệ thông tin": 1920, "Khoa học máy tính": 1580, "Kỹ thuật phần mềm": 1480 },
        { year: "2024", "Công nghệ thông tin": 2150, "Khoa học máy tính": 1820, "Kỹ thuật phần mềm": 1720 },
      ];
      setHotMajorsData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu xu hướng ngành hot", "error");
    }
  };

  const loadBubbleData = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { name: "Công nghệ thông tin", employmentRate: 95, avgSalary: 15, quota: 500 },
        { name: "Khoa học máy tính", employmentRate: 92, avgSalary: 14, quota: 400 },
        { name: "Kỹ thuật phần mềm", employmentRate: 90, avgSalary: 13, quota: 350 },
        { name: "Trí tuệ nhân tạo", employmentRate: 98, avgSalary: 18, quota: 200 },
        { name: "An toàn thông tin", employmentRate: 88, avgSalary: 12, quota: 150 },
        { name: "Quản trị kinh doanh", employmentRate: 85, avgSalary: 10, quota: 600 },
        { name: "Tài chính – Ngân hàng", employmentRate: 87, avgSalary: 11, quota: 550 },
      ];
      setBubbleData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu bubble chart", "error");
    }
  };

  const loadStackedBarData = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { name: "CNTT", nv1: 1800, totalNV: 2500 },
        { name: "KHMT", nv1: 1500, totalNV: 2200 },
        { name: "KTPM", nv1: 1300, totalNV: 2000 },
        { name: "TTNT", nv1: 800, totalNV: 1200 },
        { name: "ATTT", nv1: 600, totalNV: 900 },
      ];
      setStackedBarData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu stacked bar", "error");
    }
  };

  const loadScoreTrend = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { year: "2020", "Công nghệ thông tin": 25.5, "Khoa học máy tính": 25.2, "Kỹ thuật phần mềm": 24.8 },
        { year: "2021", "Công nghệ thông tin": 26.0, "Khoa học máy tính": 25.7, "Kỹ thuật phần mềm": 25.3 },
        { year: "2022", "Công nghệ thông tin": 26.5, "Khoa học máy tính": 26.2, "Kỹ thuật phần mềm": 25.8 },
        { year: "2023", "Công nghệ thông tin": 27.0, "Khoa học máy tính": 26.7, "Kỹ thuật phần mềm": 26.3 },
        { year: "2024", "Công nghệ thông tin": 27.5, "Khoa học máy tính": 27.2, "Kỹ thuật phần mềm": 26.8 },
      ];
      setScoreTrendData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu xu hướng điểm chuẩn", "error");
    }
  };

  const loadScatterData = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { applications: 2000, score: 27.5, major: "CNTT" },
        { applications: 1800, score: 27.2, major: "KHMT" },
        { applications: 1600, score: 26.8, major: "KTPM" },
        { applications: 1200, score: 26.5, major: "TTNT" },
        { applications: 1000, score: 26.0, major: "ATTT" },
        { applications: 2500, score: 25.5, major: "QTDN" },
        { applications: 2200, score: 25.2, major: "TCNH" },
      ];
      setScatterData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu scatter plot", "error");
    }
  };

  const loadEmploymentData = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { name: "CNTT", employmentRate: 95, unemployed: 3, continued: 2 },
        { name: "KHMT", employmentRate: 92, unemployed: 5, continued: 3 },
        { name: "KTPM", employmentRate: 90, unemployed: 6, continued: 4 },
        { name: "TTNT", employmentRate: 98, unemployed: 1, continued: 1 },
        { name: "ATTT", employmentRate: 88, unemployed: 8, continued: 4 },
        { name: "QTDN", employmentRate: 85, unemployed: 10, continued: 5 },
        { name: "TCNH", employmentRate: 87, unemployed: 9, continued: 4 },
      ];
      setEmploymentData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu việc làm", "error");
    }
  };

  const loadScoreComparison = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/thongke/top-nganh-2024`);
      const data = await response.json();
      if (data.success) {
        const formatted = data.data.slice(0, 10).map(item => ({
          name: item.tennganh.length > 20 ? item.tennganh.substring(0, 20) + "..." : item.tennganh,
          score: item.diemchuan,
          fullName: item.tennganh
        }));
        setScoreComparisonData(formatted);
      }
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu so sánh điểm", "error");
    }
  };

  const loadGroupedBarData = async () => {
    try {
      // Mock data - Replace with actual API call
      const mockData = [
        { name: "CNTT", "ĐH Bách khoa HN": 28.5, "ĐH Công nghệ": 27.8, "ĐH FPT": 26.5 },
        { name: "KHMT", "ĐH Bách khoa HN": 28.2, "ĐH Công nghệ": 27.5, "ĐH FPT": 26.2 },
        { name: "KTPM", "ĐH Bách khoa HN": 27.8, "ĐH Công nghệ": 27.0, "ĐH FPT": 25.8 },
      ];
      setGroupedBarData(mockData);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu grouped bar", "error");
    }
  };

  // DGNL practice results analysis
  const loadDgnlAnalysis = async () => {
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        fetch("http://localhost:8000/api/kythi-dgnl/exams"),
        fetch("http://localhost:8000/api/kythi-dgnl/attempts"),
      ]);
      const examsJson = await examsRes.json();
      const attemptsJson = await attemptsRes.json();

      if (!examsJson.success || !attemptsJson.success) {
        return;
      }

      const examsById = {};
      (examsJson.data || []).forEach((exam) => {
        examsById[exam.idkythi] = exam;
      });

      const summaryMap = {};
      (attemptsJson.data || []).forEach((att) => {
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
      });

      const summary = Object.values(summaryMap).map((item) => {
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

      summary.sort((a, b) => b.count - a.count);
      setDgnlExamSummary(summary);
    } catch (error) {
      console.error("Failed to load DGNL analysis", error);
      // Không cần toast quá ồn, chỉ log nếu lỗi
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadHotMajorsTrend(),
      loadBubbleData(),
      loadStackedBarData(),
      loadScoreTrend(),
      loadScatterData(),
      loadEmploymentData(),
      loadScoreComparison(),
      loadGroupedBarData(),
      loadDgnlAnalysis(),
    ]).finally(() => setLoading(false));
  }, [selectedYear, selectedMajor, selectedUniversity]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phân tích và Dự báo Tuyển sinh</h1>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Năm</label>
            <select
              className="input w-full"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Ngành</label>
            <select
              className="input w-full"
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
            >
              <option value="">Tất cả ngành</option>
              <option value="CNTT">Công nghệ thông tin</option>
              <option value="KHMT">Khoa học máy tính</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Trường</label>
            <select
              className="input w-full"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
            >
              <option value="">Tất cả trường</option>
              <option value="1">ĐH Bách khoa Hà Nội</option>
              <option value="2">ĐH Công nghệ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 1: Dự báo Ngành học "Hot" */}
      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-4">🔥 Dự báo Ngành học "Hot"</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Line Chart - Xu hướng số lượng đăng ký */}
          <div>
            <h3 className="text-lg font-medium mb-3">Xu hướng số lượng đăng ký qua các năm</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={hotMajorsData}
                margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year"
                  label={{ 
                    value: 'Năm', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ 
                    value: 'Số lượng đăng ký', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg text-sm">
                          <p className="font-semibold mb-2">{payload[0].payload.year}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: <span className="font-medium">{entry.value}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconSize={12}
                />
                <Line type="monotone" dataKey="Công nghệ thông tin" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Khoa học máy tính" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="Kỹ thuật phần mềm" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2" style={{ minHeight: '60px' }}>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Ghi chú:</span> Biểu đồ thể hiện xu hướng đăng ký của các ngành hot qua các năm
              </p>
            </div>
          </div>

          {/* Bubble Chart - Tỷ lệ việc làm, mức lương, chỉ tiêu */}
          <div>
            <h3 className="text-lg font-medium mb-3">So sánh: Tỷ lệ việc làm, Mức lương, Chỉ tiêu</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart 
                data={bubbleData}
                margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="employmentRate" 
                  name="Tỷ lệ việc làm"
                  domain={[80, 100]}
                  label={{ 
                    value: 'Tỷ lệ việc làm (%)', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="avgSalary" 
                  name="Mức lương"
                  domain={[8, 20]}
                  label={{ 
                    value: 'Mức lương (triệu VNĐ)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10,
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <ZAxis type="number" dataKey="quota" range={[50, 600]} name="Chỉ tiêu" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg text-sm">
                          <p className="font-semibold mb-2">{data.name}</p>
                          <p>Tỷ lệ việc làm: <span className="font-medium">{data.employmentRate}%</span></p>
                          <p>Mức lương: <span className="font-medium">{data.avgSalary} triệu VNĐ</span></p>
                          <p>Chỉ tiêu: <span className="font-medium">{data.quota}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {bubbleData.map((entry, index) => (
                  <Scatter 
                    key={entry.name}
                    name={entry.name.length > 20 ? entry.name.substring(0, 20) + "..." : entry.name}
                    data={[entry]}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-2" style={{ minHeight: '60px' }}>
              <p className="text-xs text-gray-500 mb-2">
                <span className="font-semibold">Ghi chú:</span> Kích thước bong bóng = Chỉ tiêu tuyển sinh
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {bubbleData.slice(0, 5).map((entry, index) => (
                  <span key={entry.name} className="flex items-center gap-1">
                    <span 
                      className="inline-block w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-gray-600">
                      {entry.name.length > 15 ? entry.name.substring(0, 15) + "..." : entry.name}
                    </span>
                  </span>
                ))}
                {bubbleData.length > 5 && (
                  <span className="text-gray-500">+{bubbleData.length - 5} ngành khác</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart - Tỷ lệ NV1 */}
        <div>
          <h3 className="text-lg font-medium mb-3">Tỷ lệ Nguyện vọng 1 so với Tổng số nguyện vọng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nv1" stackId="a" fill="#8884d8" name="Nguyện vọng 1" />
              <Bar dataKey="totalNV" stackId="a" fill="#82ca9d" name="Tổng nguyện vọng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 4: Phân tích kết quả thi thử ĐGNL */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">📊 Phân tích kết quả thi thử ĐGNL</h2>
        </div>

        {dgnlExamSummary.length === 0 ? (
          <p className="text-sm text-gray-500">
            Chưa có dữ liệu lượt làm bài ĐGNL nào được ghi nhận từ hệ thống thi thử. Khi thí sinh
            làm bài trên mục "Luyện thi ĐGNL", kết quả sẽ được lưu và hiển thị tại đây.
          </p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-medium mb-3">
                  Điểm trung bình theo từng kỳ thi ĐGNL
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={dgnlExamSummary}
                    margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="tenkythiShort"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" name="Điểm TB" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-base font-medium mb-3">
                  Thống kê tổng quan lượt thi thử ĐGNL
                </h3>
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
                      {dgnlExamSummary.map((item) => (
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

      {/* Section 2: Dự báo Điểm chuẩn Đầu vào */}
      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-4">🎯 Dự báo Điểm chuẩn Đầu vào</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Line Chart - Xu hướng điểm chuẩn */}
          <div>
            <h3 className="text-lg font-medium mb-3">Xu hướng Điểm chuẩn qua các năm</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[24, 28]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Công nghệ thông tin" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Khoa học máy tính" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="Kỹ thuật phần mềm" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Plot - Mối quan hệ điểm chuẩn và số lượng đăng ký */}
          <div>
            <h3 className="text-lg font-medium mb-3">Mối quan hệ: Điểm chuẩn vs Số lượng đăng ký</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="applications" 
                  name="Số lượng đăng ký"
                  domain={[800, 2600]}
                />
                <YAxis 
                  type="number" 
                  dataKey="score" 
                  name="Điểm chuẩn"
                  domain={[24.5, 28]}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Ngành" dataKey="score" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Phân tích Ngành dễ xin việc */}
      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-4">💼 Phân tích Ngành dễ xin việc</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - Tỷ lệ việc làm */}
          <div>
            <h3 className="text-lg font-medium mb-3">Tỷ lệ sinh viên có việc làm sau tốt nghiệp</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="employmentRate" fill="#8884d8" name="Tỷ lệ có việc làm (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked Bar 100% - Tình trạng việc làm */}
          <div>
            <h3 className="text-lg font-medium mb-3">Phân loại tình trạng việc làm</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="employmentRate" stackId="a" fill="#82ca9d" name="Có việc làm (%)" />
                <Bar dataKey="unemployed" stackId="a" fill="#ff8042" name="Thất nghiệp (%)" />
                <Bar dataKey="continued" stackId="a" fill="#8884d8" name="Học lên (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot - Học phí vs Tỷ lệ việc làm */}
        <div>
          <h3 className="text-lg font-medium mb-3">Mối quan hệ: Học phí vs Tỷ lệ có việc làm</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={[
              { tuition: 5, employmentRate: 95, name: "CNTT" },
              { tuition: 6, employmentRate: 92, name: "KHMT" },
              { tuition: 5.5, employmentRate: 90, name: "KTPM" },
              { tuition: 7, employmentRate: 98, name: "TTNT" },
              { tuition: 4.5, employmentRate: 88, name: "ATTT" },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="tuition" 
                name="Học phí (triệu/kỳ)"
                domain={[4, 8]}
              />
              <YAxis 
                type="number" 
                dataKey="employmentRate" 
                name="Tỷ lệ việc làm (%)"
                domain={[85, 100]}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Ngành" dataKey="employmentRate" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 4: Phân tích Số điểm các Ngành */}
      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-4">🔢 Phân tích Số điểm các Ngành</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - So sánh điểm chuẩn */}
          <div>
            <h3 className="text-lg font-medium mb-3">So sánh Điểm chuẩn hiện tại (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={scoreComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[24, 29]} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" name="Điểm chuẩn" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grouped Bar Chart - Điểm chuẩn theo trường */}
          <div>
            <h3 className="text-lg font-medium mb-3">Điểm chuẩn cùng ngành ở các trường khác nhau</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[24, 29]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ĐH Bách khoa HN" fill="#8884d8" />
                <Bar dataKey="ĐH Công nghệ" fill="#82ca9d" />
                <Bar dataKey="ĐH FPT" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}

