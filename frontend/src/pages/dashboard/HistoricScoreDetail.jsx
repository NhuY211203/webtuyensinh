import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function HistoricScoreDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientError, setClientError] = useState(null);
  const [relatedSameGroup, setRelatedSameGroup] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/diemchuan/${id}`).catch(() =>
          fetch(`http://127.0.0.1:8000/api/diemchuan/${id}`)
        );
        if (!isMounted) return;
        if (res.ok) {
          const json = await res.json();
          // Detail aggregator returns shape { data: { detail, nganh_truong, dieukien, coso } }
          setData(json.data?.detail ? json.data : { detail: json.data || json });
        } else {
          setError("Không tìm thấy dữ liệu chi tiết");
        }
      } catch (e) {
        if (!isMounted) return;
        setError("Không thể tải dữ liệu chi tiết");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id]);

  // Load related majors from the same group (nhomnganh) – limit 7
  useEffect(() => {
    let isMounted = true;
    async function loadRelatedFromGroup() {
      try {
        // Need base.manganh; if data not yet ready, wait for it via dependency below
        const res = await fetch('/api/nhomnganh?perPage=500').catch(() =>
          fetch('http://127.0.0.1:8000/api/nhomnganh?perPage=500')
        );
        if (!isMounted) return;
        if (res?.ok) {
          const json = await res.json();
          const groups = json?.data || [];
          const code = (data && (data.detail || data)?.manganh) || null;
          if (!code) return;
          const group = groups.find(g => Array.isArray(g.majors) && g.majors.some(m => (m.code || m.manganh) === code));
          if (group) {
            const items = (group.majors || [])
              .filter(m => (m.code || m.manganh) !== code)
              .slice(0, 7)
              .map(m => ({ code: m.code || m.manganh, name: m.name || m.tennganh }));
            setRelatedSameGroup(items);
          }
        }
      } catch (_) {
        // silently ignore; fall back to existing suggestions
      }
    }
    loadRelatedFromGroup();
    return () => { isMounted = false; };
  }, [data]);

  // Đừng return sớm để tránh thay đổi thứ tự hooks giữa các render

  // Fallback mock so you can preview the layout even if API data is missing
  const mockBase = {
    tennganh: 'Công nghệ thông tin',
    manganh: '7480201',
    tentruong: 'Trường Đại học Bách khoa Hà Nội',
    phuongthuc: 'Thi THPT',
    tohopmon: 'A00;A01;D01',
    namxettuyen: 2024,
    diemchuan: 27.5,
    hocphi: 14500000,
    khuvuc: 'Miền Bắc',
    ghichu: ''
  };
  const base = (data && (data.detail || data)) || mockBase;

  // Mappers
  const mapMethod = (idx) => {
    const m = {
      1: 'Thi THPT',
      2: 'Học bạ',
      3: 'ĐGNL',
      4: 'Kết hợp',
    };
    return m[idx] || base.phuongthuc || 'N/A';
  };
  const mapMode = (v) => {
    const m = {
      1: 'Chính quy',
      2: 'Chất lượng cao',
      3: 'Liên kết',
    };
    return m[v] || 'Chính quy';
  };

  // Build display object based on API data following your spec
  const apiDisplay = useMemo(() => {
    try {
      if (!data) return null;
      const d = data;
      const latest = d.latest || {};
      const nt = d.nganh_truong || {};
      const main = d.main_campus || {};
      const displayObj = {
        school: base.tentruong,
        region: main.khuvuc || base.khuvuc || 'N/A',
        major: base.tennganh || nt.mota_tomtat || mockBase.tennganh,
        majorCode: base.manganh,
        method: mapMethod(latest.idxettuyen ?? base.idxettuyen),
        combo: (latest.tohopmon || base.tohopmon || 'N/A'),
        year: latest.namxettuyen || base.namxettuyen,
        score: latest.diemchuan ?? base.diemchuan,
        note: base.ghichu || nt.hocphi_ghichu || '',
        tuition: nt.hocphi_ky ?? base.hocphi ?? 0,
        duration: nt.thoiluong_nam ? `${nt.thoiluong_nam} năm` : '4 năm',
        mode: mapMode(nt.hinhthuc),
        relatedSameSchool: d.related_same_school || [],
        relatedSameCode: d.related_same_code || [],
        requirements: d.dieukien || [],
        careerSalary: base.mucluong,
        careerTrend: base.xuhuong,
        contact: {
          hotline: base.dienthoai || base.sodienthoai,
          email: base.lienhe,
          address: base.diachi,
          website: base.website,
        },
      };
      return displayObj;
    } catch (e) {
      setClientError('Lỗi render dữ liệu chi tiết');
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const display = apiDisplay || {
    major: base.tennganh || 'N/A',
    majorCode: base.manganh || 'N/A',
    school: base.tentruong || 'N/A',
    method: base.phuongthuc || 'N/A',
    combo: base.tohopmon || 'N/A',
    year: base.namxettuyen || 'N/A',
    score: base.diemchuan || 'N/A',
    tuition: base.hocphi || 0,
    region: base.khuvuc || 'N/A',
    note: base.ghichu || '',
    duration: '4 năm',
    mode: 'Chính quy',
    relatedSameSchool: [],
    relatedSameCode: [],
    requirements: [],
    contact: {},
  };

  // Mocked enrichment data (temporary until backend fields available)
  const mockProgram = {
    level: base?.capdo || 'Đại học',
    degree: base?.bangcap || 'Cử nhân',
    summary: base?.motanganh || 'Chương trình trang bị kiến thức nền tảng và chuyên sâu, chú trọng thực hành và dự án thực tế.',
    duration: '4 năm',
    mode: 'Chính quy',
    syllabusUrl: '#'
  };
  const mockScholarship = {
    estimated4Years: display.tuition > 0 ? `${((display.tuition*(data?.nganh_truong?.so_ky || 8))/1000000).toFixed(1)} triệu` : 'N/A',
    scholarship: 'Học bổng 30%-50% cho thí sinh có thành tích cao, hỗ trợ vay học phí.'
  };
  const mockRequirements = {
    combos: display.combo?.split(';')?.map(s => s.trim()).filter(Boolean) || ['A00','A01','D01'],
    english: 'IELTS 5.5 hoặc tương đương (tuỳ phương thức, có thể không bắt buộc).',
    quota: 'Chỉ tiêu ~200, ưu tiên khu vực theo quy định của Bộ.'
  };
  const mockCareer = {
    positions: ['Lập trình viên', 'Kỹ sư dữ liệu', 'Chuyên viên QA/QC', 'Chuyên viên an toàn thông tin'],
    salary: '12–25 triệu/tháng (junior–mid, tham khảo thị trường)',
    trend: 'Rất nóng'
  };
  const mockRelated = {
    sameSchool: ['Khoa học máy tính', 'Kỹ thuật phần mềm'],
    sameCode: ['Cùng mã ngành ở Trường A', 'Cùng mã ngành ở Trường B']
  };
  const mockTimeline = {
    milestones: [
      { label: 'Mở đăng ký', value: '01/03' },
      { label: 'Hạn nộp hồ sơ', value: '30/06' },
      { label: 'Công bố kết quả', value: '10/07' }
    ],
    contact: {
      hotline: '0123 456 789',
      email: 'tuyensinh@example.edu.vn',
      website: 'https://khoa.example.edu.vn',
      address: 'Cơ sở chính, TP. HCM'
    }
  };

  return (
    <div className="w-full px-4 lg:px-6 pt-2 pb-8">
      {clientError && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm">{clientError}</div>
      )}

      {/* 1) Hero summary */}
      <section className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-lg md:text-xl font-semibold text-white">{display.school} <span className="text-white/80 font-normal">· {display.region}</span></div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{display.major} <span className="text-white/90 text-lg align-top">({display.majorCode})</span></h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs ring-1 ring-white/20">{display.method}</span>
              {display.combo.split(';').map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs ring-1 ring-white/20">{c.trim()}</span>
              ))}
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-white/90 text-sm">Điểm chuẩn mới nhất ({display.year})</div>
            <div className="text-4xl font-extrabold">{display.score}</div>
          </div>
        </div>
      </section>

      {/* 2) Thông tin chương trình */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-800">Thông tin chương trình</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5 bg-white">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-500 text-sm">Cấp độ · Bằng cấp</div>
              <div className="font-medium text-slate-800">{mockProgram.level} · {mockProgram.degree}</div>
            </div>
            <div>
              <div className="text-slate-500 text-sm">Học phí/kỳ</div>
              <div className="font-medium text-slate-800">{display.tuition > 0 ? `${(display.tuition/1000000).toFixed(1)} triệu` : 'N/A'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-sm">Khu vực/Cơ sở</div>
              <div className="font-medium text-slate-800">{display.region}</div>
            </div>
            <div>
              <div className="text-slate-500 text-sm">Thời lượng</div>
              <div className="font-medium text-slate-800">{display.duration}</div>
            </div>
            <div>
              <div className="text-slate-500 text-sm">Hình thức</div>
              <div className="font-medium text-slate-800">{display.mode}</div>
            </div>
          </div>
          <p className="mt-4 text-slate-700 leading-relaxed">{mockProgram.summary}</p>
        </div>
      </section>

      {/* (đã gộp vào mục Thông tin chương trình ở trên) */}

      {/* 4) Học phí & hỗ trợ */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Học phí & hỗ trợ</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5 grid sm:grid-cols-3 gap-4 bg-white">
          <div>
            <div className="text-slate-500 text-sm">Học phí/kỳ</div>
            <div className="font-medium text-slate-800">{display.tuition > 0 ? `${(display.tuition/1000000).toFixed(1)} triệu` : 'N/A'}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Ước tính 4 năm</div>
            <div className="font-medium text-slate-800">{mockScholarship.estimated4Years}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Học bổng</div>
            <div className="font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-100 p-2 rounded-md">{mockScholarship.scholarship}</div>
          </div>
        </div>
      </section>

      {/* 5) Yêu cầu – điều kiện tuyển sinh */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Yêu cầu – điều kiện tuyển sinh</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5 bg-white">
          <div>
            <div className="text-slate-500 text-sm">Tổ hợp xét tuyển</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(display.combo || '').split(';').map(c => (
                <span key={c} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs ring-1 ring-slate-200">{c}</span>
              ))}
            </div>
            {Array.isArray(data?.methods) && data.methods.length > 0 && (
              <div className="mt-4 text-sm text-gray-700">
                <div className="text-slate-500">Các phương thức áp dụng:</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {data.methods.map(m => (
                    <span key={m} className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">{mapMethod(m)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-5">
            <div className="text-slate-500 text-sm mb-2">Điều kiện chi tiết theo phương thức</div>
            {display.requirements && display.requirements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-4">Năm</th>
                      <th className="py-2 pr-4">Phương thức</th>
                      <th className="py-2 pr-4">IELTS tối thiểu</th>
                      <th className="py-2 pr-4">Môn bắt buộc</th>
                      <th className="py-2 pr-4">Chứng chỉ khác</th>
                      <th className="py-2 pr-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.requirements.map((r, i) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="py-2 pr-4 text-slate-800">{r.nam || '—'}</td>
                        <td className="py-2 pr-4 text-slate-800">{mapMethod(r.idxettuyen)}</td>
                        <td className="py-2 pr-4 text-slate-800">{r.ielts_min ? `IELTS >= ${r.ielts_min}` : '—'}</td>
                        <td className="py-2 pr-4 text-slate-800">{r.mon_batbuoc || '—'}</td>
                        <td className="py-2 pr-4 text-slate-800">{r.chungchi_khac || '—'}</td>
                        <td className="py-2 pr-4 text-slate-800">{r.ghichu || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-600 text-sm">Chưa có dữ liệu điều kiện.</div>
            )}
          </div>
        </div>
      </section>

      {/* 6) Cơ hội nghề nghiệp */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Cơ hội nghề nghiệp</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5 grid sm:grid-cols-3 gap-4 bg-white">
          <div>
            <div className="text-slate-500 text-sm">Vị trí tiêu biểu</div>
            <ul className="mt-2 list-disc list-inside text-slate-700 space-y-1">
              {(base.motanganh ? ['Lập trình viên','Kỹ sư dữ liệu','Chuyên viên QA/QC','Chuyên viên an toàn thông tin'] : mockCareer.positions).map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Mức lương tham khảo</div>
            <div className="font-medium text-indigo-600">{display.careerSalary || mockCareer.salary}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Xu hướng</div>
            <div className="font-medium inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">{display.careerTrend || mockCareer.trend}</div>
          </div>
        </div>
      </section>

      {/* 7) Ngành liên quan / gợi ý khác */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Ngành liên quan / gợi ý khác</h2>
        <div className="mt-3">
          <div className="rounded-xl border border-slate-200 p-5 bg-white">
            <div className="mt-4 text-slate-500 text-sm">Trong cùng nhóm ngành</div>
            <div className="mt-2 flex flex-wrap gap-3">
              {(relatedSameGroup || []).map((s, i) => (
                <span key={i} className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-sm ring-1 ring-emerald-600">{s.code} – {s.name}</span>
              ))}
              {(!relatedSameGroup || relatedSameGroup.length === 0) && (
                <span className="text-slate-400 text-sm">Không có dữ liệu.</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8) Thông tin trường */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Thông tin trường</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5 bg-white">
          <div className="space-y-4">
            <div>
              <div className="text-slate-500 text-sm">Tên trường</div>
              <div className="font-medium text-lg text-slate-800">{display.school}</div>
            </div>
            
            <div>
              <div className="text-slate-500 text-sm">Khu vực</div>
              <div className="font-medium text-slate-800">{display.region}</div>
            </div>

            {Array.isArray(data?.coso) && data.coso.length > 0 && (
              <div>
                <div className="text-gray-500 text-sm">Cơ sở</div>
                <div className="mt-2 flex flex-col gap-2">
                  {data.coso.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg ring-1 ring-emerald-100 bg-emerald-50">
                      <div className="text-emerald-700 font-medium">{c.ten_coso} · {c.khuvuc}</div>
                      <div className="text-slate-700 text-sm">{c.diachi_coso}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-slate-500 text-sm">Liên hệ tuyển sinh</div>
              <div className="mt-2 grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-600 text-sm">Hotline</div>
                  <div className="font-medium text-slate-800">{display.contact.hotline || mockTimeline.contact.hotline}</div>
                </div>
                <div>
                  <div className="text-slate-600 text-sm">Email</div>
                  <div className="font-medium text-slate-800">{display.contact.email || mockTimeline.contact.email}</div>
                </div>
                {(display.contact.website || mockTimeline.contact.website) && (
                  <div>
                    <div className="text-slate-600 text-sm">Website</div>
                    <div className="font-medium">
                      <a className="text-emerald-600 hover:underline" href={(display.contact.website || mockTimeline.contact.website)} target="_blank" rel="noreferrer">
                        {display.contact.website || mockTimeline.contact.website}
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-slate-600 text-sm">Địa chỉ</div>
                  <div className="font-medium text-slate-800">{display.contact.address || mockTimeline.contact.address}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ghi chú đã được yêu cầu xóa */}
    </div>
  );
}


