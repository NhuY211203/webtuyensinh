import { useEffect, useMemo, useState } from "react";
import { 
  TrendingUp, 
  School, 
  Users, 
  MapPin, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Award
} from 'lucide-react';


// Helper: trend badge classes mapping
const getTrendBadgeClass = (x) => {
  switch ((x || '').trim()) {
    case 'Rất nóng': return 'bg-rose-100 text-rose-700';
    case 'Tăng mạnh': return 'bg-emerald-100 text-emerald-700';
    case 'Tăng': return 'bg-lime-100 text-lime-700';
    case 'Ổn định': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-50 text-slate-600';
  }
};

// Stat Card component (enhanced visual style)
function StatCard({ title, value, icon: Icon = BarChart3, tone = 'primary', trendText = null }) {
  const toneToRing = {
    primary: 'ring-emerald-500/20',
    secondary: 'ring-amber-500/20',
    accent: 'ring-purple-500/20',
    neutral: 'ring-slate-200'
  };
  const toneToIcon = {
    primary: 'bg-emerald-50 text-emerald-600',
    secondary: 'bg-amber-50 text-amber-600',
    accent: 'bg-purple-50 text-purple-600',
    neutral: 'bg-slate-50 text-slate-600'
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition ring-1 ${toneToRing[tone]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-3xl font-semibold text-slate-800 mt-1">{value}</p>
          {trendText && (
            <p className="mt-1 text-emerald-600 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {trendText}
            </p>
          )}
        </div>
        <div className={`rounded-xl ${toneToIcon[tone]} p-3`}> 
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Chart components
function TopMajorsChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!RechartsComponents) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 ngành điểm cao nhất</h3>
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.tennganh}</span>
              <span className="text-blue-600 font-bold">{item.diemchuan}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 ngành điểm cao nhất</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="tennganh" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, 'Điểm chuẩn']}
            labelFormatter={(label) => `Ngành: ${label}`}
          />
          <Bar dataKey="diemchuan" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// New: Top 10 by method (4 columns)
function TopMajorsByMethod({ data, loading }) {
  const [active, setActive] = useState('thpt');
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="space-y-2">
              {[...Array(5)].map((__,j) => (
                <div key={j} className="h-8 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'thpt', title: 'Thi THPT' },
    { key: 'hocba', title: 'Học bạ' },
    { key: 'dgnl', title: 'ĐGNL' },
    { key: 'kethop', title: 'Kết hợp' },
  ];

  // Compute max score for progress visualization
  const current = data?.[active] || [];
  const maxScore = current.reduce((m, r) => Math.max(m, Number(r?.diemchuan ?? 0)), 0) || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 ngành điểm cao theo phương thức</h3>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {sections.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActive(sec.key)}
            className={`px-3 py-1.5 rounded-full text-sm border ${active===sec.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {sec.title}
          </button>
        ))}
      </div>
      <div>
        <div className="grid grid-cols-1 gap-3">
          {current.slice(0,10).map((item, idx) => {
            const score = Number(item?.diemchuan ?? 0);
            const pct = Math.round((score / maxScore) * 100);
            const medalBg = idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-600';
            return (
              <div key={idx} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 h-7 grid place-content-center rounded-full text-sm font-semibold ${medalBg}`}>{idx+1}</span>
                  <span className="truncate pr-3 font-medium text-slate-800">{item.tennganh}</span>
                </div>
                <div className="w-48">
                  <div className="text-right text-sm font-semibold text-slate-800 mb-1">{score || '—'}</div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-400" style={{width: `${pct}%`}} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MethodComparisonChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!RechartsComponents) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh điểm TB theo phương thức</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.phuongthuc}</span>
              <span className="text-green-600 font-bold">{item.diemTB}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh điểm TB theo phương thức</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="phuongthuc" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="diemTB" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PopularityChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!RechartsComponents) {
  return (
    <div className="bg-white rounded-xl border border-primary-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary-700 mb-4">Nhóm ngành (số ngành)</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.tennhom || item.tennganh}</span>
              <span className="text-primary-700 font-semibold bg-primary-50 px-3 py-1 rounded ring-1 ring-primary-100">{item.songanh || item.sotruong} ngành</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;
  const mapped = useMemo(() => (data || []).map(r => ({ label: r.tennhom || r.tennganh, value: r.songanh || r.sotruong })), [data]);

  return (
    <div className="bg-white rounded-xl border border-primary-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary-700 mb-4">Nhóm ngành (số ngành)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={mapped} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="label" type="category" width={160} />
          <Tooltip />
          <Bar dataKey="value" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RegionDistributionChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!RechartsComponents) {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố khu vực</h3>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-gray-600 font-bold">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = RechartsComponents;
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố khu vực</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={(data || []).map(r => ({ name: r.name || r.khuvuc || 'Khác', value: r.value ?? r.so_chuong_trinh ?? 0 }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(data || []).map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [stats, setStats] = useState({
    topMajors: 0,
    methodComparison: 0,
    popularity: 0,
    regionDistribution: 0,
    totalMajors: 0,
    totalMethods: 0,
  });
  
  const [chartData, setChartData] = useState({
    topMajors: [],
    methodComparison: [],
    popularity: [],
    regionDistribution: [],
    topByMethod: null,
    groups: [],
  });

  // Xu hướng & Phân khúc lương (không dùng chart)
  const [trendGroups, setTrendGroups] = useState([]);
  const [salaryBins, setSalaryBins] = useState([]);
  const [activeTrend, setActiveTrend] = useState(null);
  const [topTrendSalary, setTopTrendSalary] = useState([]);
  const [nhomNganhList, setNhomNganhList] = useState([]);
  const nhomListMapped = useMemo(() => {
    const src = Array.isArray(nhomNganhList)
      ? nhomNganhList
      : (nhomNganhList?.data ?? nhomNganhList?.items ?? []);

    const pickName = (obj) => {
      let name = obj?.tennhom || obj?.ten_nhom || obj?.motanhom || obj?.manhom;
      if (!name) {
        const key = Object.keys(obj || {}).find(k => (
          typeof obj[k] === 'string' && (k.toLowerCase().includes('ten') || k.toLowerCase().includes('name'))
        ));
        if (key) name = obj[key];
      }
      return name || '—';
    };

    const pickCount = (obj) => {
      let c = obj?.soluong ?? obj?.so_nganh ?? obj?.sotruong ?? obj?.soluong_nganh;
      // Fallback: some endpoints return an array of majors instead of an explicit count
      if (c == null && Array.isArray(obj?.majors)) {
        c = obj.majors.length;
      }
      if (c == null) {
        const key = Object.keys(obj || {}).find(k => typeof obj[k] === 'number');
        if (key) c = obj[key];
      }
      return Number(c || 0);
    };

    return (src || []).map((n, idx) => ({
      key: n?.idnhomnganh ?? n?.manhom ?? idx,
      name: pickName(n),
      count: pickCount(n),
    }));
  }, [nhomNganhList]);

  // Load data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('nam', '2024');

        const [topMajorsRes, methodRes, popularityRes, regionRes, countsRes, topByMethodRes, trendRes, salaryRes, topTrendSalaryRes, nhomListRes] = await Promise.all([
          fetch(`/api/thongke/top-nganh-2024?${params}`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/top-nganh-2024?${params}`)
          ),
          fetch(`/api/thongke/so-sanh-phuong-thuc?${params}`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/so-sanh-phuong-thuc?${params}`)
          ),
          fetch(`/api/thongke/so-truong-theo-nganh?${params}`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/so-truong-theo-nganh?${params}`)
          ),
          fetch(`/api/thongke/theo-khu-vuc?${params}`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/theo-khu-vuc?${params}`)
          ),
          fetch(`/api/thongke/counts`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/counts`)
          ),
          fetch(`/api/thongke/top-nganh-theo-phuong-thuc`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/top-nganh-theo-phuong-thuc`)
          ),
          fetch(`/api/thongke/xu-huong`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/xu-huong`)
          ),
          fetch(`/api/thongke/phan-khuc-luong`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/phan-khuc-luong`)
          ),
          fetch(`/api/thongke/top-nganh-xu-huong-luong`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/top-nganh-xu-huong-luong`)
          ),
          fetch(`/api/thongke/nhom-nganh`).catch(() =>
            fetch(`http://127.0.0.1:8000/api/thongke/nhom-nganh`)
          )
        ]);

        if (!isMounted) return;

        // Process responses - chỉ sử dụng API data
        const processResponse = async (res) => {
          if (res.ok) {
            const data = await res.json();
            return data.data || data || [];
          }
          throw new Error(`API call failed with status: ${res.status}`);
        };

        const [topMajors, methodComparison, popularity, regionDistribution, counts, topByMethod, trendGroupsData, salaryBinsData, topTrendSalaryData, nhomListData] = await Promise.all([
          processResponse(topMajorsRes),
          processResponse(methodRes),
          processResponse(popularityRes),
          processResponse(regionRes),
          processResponse(countsRes),
          processResponse(topByMethodRes),
          processResponse(trendRes),
          processResponse(salaryRes),
          processResponse(topTrendSalaryRes),
          processResponse(nhomListRes)
        ]);

        setChartData({
          topMajors,
          methodComparison,
          popularity,
          regionDistribution,
          topByMethod,
          groups: []
        });

        setStats({
          topMajors: topMajors.length,
          methodComparison: methodComparison.length,
          popularity: popularity.length,
          regionDistribution: regionDistribution.length,
          totalMajors: counts.totalMajors ?? 0,
          totalMethods: counts.totalMethods ?? 0,
        });

        setTrendGroups(trendGroupsData || []);
        setSalaryBins(salaryBinsData || []);
        setTopTrendSalary(topTrendSalaryData || []);
        setNhomNganhList((nhomListData && nhomListData.data) ? nhomListData.data : (nhomListData || []));

      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading trends data:", error);
        setError(`Lỗi kết nối API: ${error.message}. Vui lòng kiểm tra backend server.`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (error) {
    return (
      <div className="w-full px-4 lg:px-6 pt-2 pb-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi kết nối API</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>• Đảm bảo backend server đang chạy trên port 8000</p>
            <p>• Kiểm tra kết nối mạng</p>
            <p>• Xem console để biết thêm chi tiết lỗi</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full px-4 lg:px-6 pt-2 pb-8">
        {/* Header */}
        <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Xu hướng ngành học</h1>
          <p className="mt-2 text-white/90">Phân tích và thống kê chi tiết về các ngành học phổ biến</p>
        </section>

        {/* Loading State */}
        <div className="text-center py-12">
          <div className="mx-auto max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8">
            <div className="flex items-center justify-center gap-3 text-primary-600 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              <span className="font-semibold">Đang xử lý và tải dữ liệu thống kê ngành học...</span>
            </div>
            <p className="text-slate-500 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6 pt-2 pb-8">
      {/* Header */}
      <section className="rounded-2xl p-6 mb-6 text-white bg-gradient-to-r from-emerald-600 to-emerald-500">
        <h1 className="text-2xl md:text-3xl font-bold">Xu hướng ngành học</h1>
        <p className="mt-2 text-white/90">Phân tích và thống kê chi tiết về các ngành học phổ biến</p>
        {/* Insight chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(() => {
            const hot = (trendGroups || []).sort((a,b)=> (b?.so_nganh||0) - (a?.so_nganh||0))[0];
            if (hot) {
              return (
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 backdrop-blur ring-1 ring-white/20`}>Xu hướng mạnh nhất: {hot?.nhom} ({hot?.so_nganh})</span>
              );
            }
            return null;
          })()}
          {topTrendSalary && topTrendSalary[0] && (
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 backdrop-blur ring-1 ring-white/20">Ngành nổi bật: {topTrendSalary[0].tennganh}</span>
          )}
        </div>
      </section>


      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Top ngành (theo bộ lọc)" value={stats.topMajors} icon={BarChart3} tone="primary" />
        <StatCard title="Số phương thức trong hệ thống" value={stats.totalMethods} icon={Target} tone="accent" />
        <StatCard title="Tổng số ngành trong hệ thống" value={stats.totalMajors} icon={School} tone="neutral" />
        <StatCard title="Phân bố khu vực" value={stats.regionDistribution} icon={MapPin} tone="secondary" />
      </div>

      {/* Phân khúc mức lương đã được yêu cầu xóa */}

      {/* Danh sách Nhóm ngành (từ bảng nhomnganh) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" /> Nhóm ngành
          </h3>
          <span className="text-sm px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{nhomListMapped.length} nhóm</span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {nhomListMapped.map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <span className="font-medium text-slate-800 truncate">{n.name}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">{n.count} ngành</span>
            </div>
          ))}
          {(!nhomListMapped || nhomListMapped.length===0) && (
            <div className="py-4 text-sm text-slate-500">Không có dữ liệu.</div>
          )}
        </div>
      </section>

      {/* Bảng Top ngành theo xu hướng & lương */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top ngành theo xu hướng & lương</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Ngành</th>
                <th className="py-2 pr-4">Xu hướng</th>
                <th className="py-2 pr-4">Mức lương</th>
                <th className="py-2 pr-4">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {(topTrendSalary || []).map((r, idx) => (
                <tr key={r.manganh || idx} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-gray-700">{idx + 1}</td>
                  <td className="py-2 pr-4 font-medium text-gray-900">{r.tennganh}</td>
                  <td className="py-2 pr-4 text-gray-800">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTrendBadgeClass(r.xuhuong)}`}>{r.xuhuong || '—'}</span>
                  </td>
                  <td className="py-2 pr-4 text-primary-700 font-semibold">{r.mucluong || '—'}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.motanganh || '—'}</td>
                </tr>
              ))}
              {(!topTrendSalary || topTrendSalary.length===0) && (
                <tr><td className="py-3 text-gray-500" colSpan={5}>Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top 10 ngành theo phương thức */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <TopMajorsByMethod data={chartData.topByMethod} loading={loading} />
      </section>
    </div>
  );
}
