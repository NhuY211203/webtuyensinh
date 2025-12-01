import { useState, useEffect, useRef } from "react";
import { Calculator, Info, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import apiService from "../../services/api";

export default function CalculateGraduationScore() {
  // States cho danh mục
  const [monThiList, setMonThiList] = useState([]);
  const [monHocList, setMonHocList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States cho form
  const [mienThiNgoaiNgu, setMienThiNgoaiNgu] = useState(false);
  const [diemThi, setDiemThi] = useState({}); // {idmonthi: diem}
  const [diemMonHoc, setDiemMonHoc] = useState({}); // {idmonhoc_lop: diem}
  const [diemUuTien, setDiemUuTien] = useState(0);
  const [diemKhuyenKhich, setDiemKhuyenKhich] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [ketQua, setKetQua] = useState(null);
  const [warningMonLuaChon, setWarningMonLuaChon] = useState('');
  const [lyDoTruot, setLyDoTruot] = useState('');

  // Refs để theo dõi giá trị trước đó và input elements
  const prevDiemUuTienRef = useRef(0);
  const prevDiemKhuyenKhichRef = useRef(0);
  const diemUuTienInputRef = useRef(null);
  const diemKhuyenKhichInputRef = useRef(null);

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.idnguoidung || user.id;

  // Danh sách môn bắt buộc và môn lựa chọn
  const monBatBuoc = [
    { ma: 'VAN', tenVietTat: 'Văn' },
    { ma: 'TOAN', tenVietTat: 'Toán' },
    { ma: 'NGOAI_NGU', tenVietTat: 'Ngoại ngữ' },
    { ma: 'GDQPAN', tenVietTat: 'GD Quốc phòng & An ninh' },
    { ma: 'SU', tenVietTat: 'Sử' },
  ];

  const monLuaChon = [
    { ma: 'HOA', tenVietTat: 'Hóa' },
    { ma: 'SINH', tenVietTat: 'Sinh' },
    { ma: 'LI', tenVietTat: 'Lí' },
    { ma: 'DIA', tenVietTat: 'Địa' },
    { ma: 'GDCD', tenVietTat: 'GDKTPL' },
    { ma: 'TIN', tenVietTat: 'Tin học' },
    { ma: 'CONG_NGHE', tenVietTat: 'Công nghệ' },
  ];

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load danh sách môn thi
        const monThiRes = await apiService.getMonThiTotNghiep();
        if (monThiRes.success) {
          setMonThiList(monThiRes.data || []);
        }

        // Load danh sách môn học
        const monHocRes = await apiService.getMonHoc();
        if (monHocRes.success) {
          setMonHocList(monHocRes.data || []);
        }

        // Load dữ liệu đã lưu (nếu có)
        if (userId) {
          const ketQuaRes = await apiService.getKetQuaTinhDiemTotNghiep({ idnguoidung: userId, nam_thi: 2025 });
          if (ketQuaRes.success && ketQuaRes.data) {
            setKetQua(ketQuaRes.data);
            setMienThiNgoaiNgu(ketQuaRes.data.mien_thi_ngoai_ngu || false);
            setDiemUuTien(ketQuaRes.data.diem_uu_tien || 0);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Hàm xử lý nhập điểm môn học
  const handleScoreInput = (key, value) => {
    // Xử lý nhập nhanh: 66 => 6.6, 625 => 6.25
    let processedValue = value;
    if (value && !value.includes('.')) {
      if (value.length === 2) {
        processedValue = value[0] + '.' + value[1];
      } else if (value.length === 3) {
        processedValue = value[0] + value[1] + '.' + value[2];
      }
    }
    
    const numValue = parseFloat(processedValue) || 0;
    setDiemMonHoc(prev => ({
      ...prev,
      [key]: numValue > 0 ? numValue : 0
    }));
  };

  // Hàm lấy điểm môn học
  const getDiem = (idmonhoc, lop) => {
    return diemMonHoc[`${idmonhoc}_${lop}`] || 0;
  };

  // Hàm tính điểm
  const handleCalculate = async () => {
    setError(null);
    setKetQua(null);
    setWarningMonLuaChon('');

    // Kiểm tra môn bắt buộc
    const monBatBuocThieu = [];
    monBatBuoc.forEach(mon => {
      const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
      if (!monHoc) return;
      
      let coDiem = false;
      for (let lop = 10; lop <= 12; lop++) {
        if (getDiem(monHoc.idmonhoc, lop) > 0) {
          coDiem = true;
          break;
        }
      }
      if (!coDiem) {
        monBatBuocThieu.push(mon.tenVietTat);
      }
    });

    // Kiểm tra môn lựa chọn (ít nhất 2 môn)
    let soMonLuaChon = 0;
    monLuaChon.forEach(mon => {
      const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
      if (!monHoc) return;
      
      let coDiem = false;
      for (let lop = 10; lop <= 12; lop++) {
        if (getDiem(monHoc.idmonhoc, lop) > 0) {
          coDiem = true;
          break;
        }
      }
      if (coDiem) {
        soMonLuaChon++;
      }
    });

    // Kiểm tra điểm thi
    let tongDiemThi = 0;
    let coDiemLiet = false;
    let coDiemThiBang0 = false;
    const monThiCanKiemTra = mienThiNgoaiNgu 
      ? monThiList.filter(m => m.ma_mon_thi !== 'NGOAI_NGU')
      : monThiList;

    monThiCanKiemTra.forEach(mon => {
      const diem = diemThi[mon.idmonthi] || 0;
      tongDiemThi += diem;
      
      // Kiểm tra điểm liệt (điểm > 0 và <= 1.0)
      if (diem > 0 && diem <= 1.0) {
        coDiemLiet = true;
      }
    });

    // Kiểm tra nếu tổng điểm thi = 0
    if (tongDiemThi === 0) {
      coDiemThiBang0 = true;
    }
    
    // Tạo danh sách lỗi
    const errors = [];
    
    // Kiểm tra điểm thi trước
    if (coDiemThiBang0) {
      errors.push('Bạn phải nhập đủ các môn bắt buộc!');
    }
    
    // Kiểm tra môn học bắt buộc (chỉ thêm nếu chưa có lỗi về điểm thi)
    if (monBatBuocThieu.length > 0 && !coDiemThiBang0) {
      errors.push('Bạn phải nhập đủ các môn bắt buộc!');
    }
    
    if (soMonLuaChon < 2) {
      errors.push('Bạn phải nhập đủ ít nhất 2 môn tự chọn!');
    }
    
    if (soMonLuaChon > 4) {
      errors.push('Bạn đã nhập nhiều hơn 4 môn tự chọn, xem lại các môn lựa chọn!');
    }
    
    // Kiểm tra điểm khuyến khích (tối đa 2)
    if (diemKhuyenKhich > 2) {
      errors.push('Điểm khuyến khích không được vượt quá 2!');
    }
    
    // Kiểm tra điểm ưu tiên (tối đa 10)
    if (diemUuTien > 10) {
      errors.push('Điểm ưu tiên không được vượt quá 10!');
    }

    // Nếu có lỗi, hiển thị và dừng lại
    if (errors.length > 0) {
      setError(errors.join('\n'));
      setKetQua(null);
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      // Lưu điểm thi tốt nghiệp
      const diemThiArray = [];
      monThiList.forEach(mon => {
        const diem = diemThi[mon.idmonthi] || 0;
        if (diem > 0 || (mon.ma_mon_thi === 'NGOAI_NGU' && mienThiNgoaiNgu)) {
          diemThiArray.push({
            idmonthi: mon.idmonthi,
            diem_thi: diem,
            mien_thi: mienThiNgoaiNgu && mon.ma_mon_thi === 'NGOAI_NGU',
          });
        }
      });
      
      await apiService.saveDiemThiTotNghiep({
        idnguoidung: userId,
        nam_thi: 2025,
        replace_all: true,
        diem_thi: diemThiArray,
      });

      // Lưu điểm môn học
      const diemMonHocArray = [];
      [...monBatBuoc, ...monLuaChon].forEach(mon => {
        const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
        if (!monHoc) return;

        for (let lop = 10; lop <= 12; lop++) {
          const diem = getDiem(monHoc.idmonhoc, lop);
          if (diem > 0) {
            diemMonHocArray.push({
              idmonhoc: monHoc.idmonhoc,
              lop: lop,
              diem_trung_binh: diem,
              nam_hoc: 2023 + (lop - 10),
            });
          }
        }
      });

      await apiService.saveDiemMonHocTotNghiep({
        idnguoidung: userId,
        replace_all: true,
        diem_mon_hoc: diemMonHocArray,
      });

      // Lưu điểm khuyến khích
      const diemKKValue = Number(diemKhuyenKhich) || 0;
      const diemKhuyenKhichData = diemKKValue > 0
        ? [{
            loai_kk: 'Khuyến khích',
            diem_kk: diemKKValue,
            mo_ta: 'Điểm khuyến khích',
          }]
        : [];
      
      const requestData = {
          idnguoidung: userId,
          nam_ap_dung: 2025,
          replace_all: true,
        diem_khuyen_khich: Array.isArray(diemKhuyenKhichData) ? diemKhuyenKhichData : [],
      };

      await apiService.saveDiemKhuyenKhich(requestData);

      // Tính điểm
      const result = await apiService.tinhDiemTotNghiep({
        idnguoidung: userId,
        mien_thi_ngoai_ngu: mienThiNgoaiNgu,
        diem_uu_tien: diemUuTien || 0,
        nam_thi: 2025,
      });

      if (result.success) {
        setKetQua(result.data);
        
        const diemXetTotNghiep = parseFloat(result.data.tong_diem_xet_tot_nghiep || 0);
        if (diemXetTotNghiep < 5.0) {
          let lyDo = '';
          if (coDiemLiet) {
            lyDo = 'Bạn bị điểm liệt điểm thi (điểm thi ≤ 1.0)';
          } else if (coDiemThiBang0) {
            lyDo = 'Bạn chưa nhập điểm thi (tổng điểm thi = 0)';
          } else {
            lyDo = 'Điểm xét tốt nghiệp của bạn dưới 5.0';
          }
          setLyDoTruot(lyDo);
        } else {
          setLyDoTruot('');
        }
      } else {
        setError(result.message || 'Lỗi khi tính điểm');
        setLyDoTruot('');
      }
    } catch (err) {
      let errorMessage = 'Lỗi khi tính điểm';
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          errorMessage = `Lỗi: ${errors[errorKeys[0]][0]}`;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Error calculating:', err);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-2">
          <Calculator className="w-8 h-8" />
          CÔNG CỤ TÍNH ĐIỂM TỐT NGHIỆP THPT 2025 NHANH NHẤT, CHÍNH XÁC NHẤT
        </h1>
        <p className="text-gray-600">
          Công cụ giúp bạn tính điểm xét tốt nghiệp THPT nhanh chóng và chính xác.
        </p>
      </div>

      {/* Công thức */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">Công thức tính điểm tốt nghiệp THPT 2025:</h3>
        <div className="space-y-2 text-blue-800">
          <p><strong>DXTN = ((Tổng điểm 4 môn thi + Tổng điểm KK (nếu có)) / 4 + ĐTB các năm học + Điểm ƯT (nếu có)) / 2</strong></p>
          <p>ĐTB các năm học = ((ĐTB lớp 10)x1 + (ĐTB lớp 11)x2 + (ĐTB lớp 12)x3) / 6</p>
          <p className="text-sm mt-2">* Điểm trung bình lớp 10, 11 và 12 là điểm trung bình cộng của tất cả môn học được đánh giá bằng điểm số.</p>
          {mienThiNgoaiNgu && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm"><strong>Công thức miễn thi ngoại ngữ:</strong></p>
              <p className="text-sm">DXTN = ((Tổng điểm 3 môn thi + Tổng điểm KK (nếu có)) / 3 + ĐTB các năm học + Điểm ƯT (nếu có)) / 2</p>
            </div>
          )}
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-orange-900 mb-3">
          Công cụ tính điểm tốt nghiệp THPT nhanh và chính xác nhất
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-orange-800 mb-4">
          <li>Bạn nhập điểm thi tốt nghiệp THPT 2025</li>
          <li>Bạn nhập điểm các môn học đánh giá bằng điểm số.</li>
          <li>Bạn nhập điểm khuyến khích, ưu tiên (nếu có)</li>
          <li>Click nút Xem kết quả để xem điểm xét tốt nghiệp THPT 2025</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form bên trái */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bước 1: Nhập điểm thi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bước 1: Nhập điểm thi tốt nghiệp THPT 2025</h3>
            
            {/* Miễn thi ngoại ngữ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miễn thi ngoại ngữ
                <Info className="w-4 h-4 inline ml-1 text-gray-400" />
              </label>
              <select
                value={mienThiNgoaiNgu ? 'yes' : 'no'}
                onChange={(e) => setMienThiNgoaiNgu(e.target.value === 'yes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="no">Không</option>
                <option value="yes">Có</option>
              </select>
            </div>

            {/* Bảng điểm thi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Môn thi</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Điểm thi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monThiList
                      .filter(mon => ['VAN', 'TOAN'].includes(mon.ma_mon_thi))
                      .sort((a, b) => {
                        const order = { 'VAN': 1, 'TOAN': 2 };
                        return (order[a.ma_mon_thi] || 99) - (order[b.ma_mon_thi] || 99);
                      })
                      .map(mon => (
                        <tr key={mon.idmonthi}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">
                            {mon.ten_mon_thi}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={diemThi[mon.idmonthi] || ''}
                              onChange={(e) => setDiemThi(prev => ({
                                ...prev,
                                [mon.idmonthi]: parseFloat(e.target.value) || 0
                              }))}
                              className={`w-full px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                !diemThi[mon.idmonthi] || diemThi[mon.idmonthi] === 0
                                  ? 'border-2 border-yellow-400 bg-yellow-50'
                                  : 'border border-gray-300'
                              }`}
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Môn thi</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Điểm thi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monThiList
                      .filter(mon => {
                        if (mienThiNgoaiNgu && mon.ma_mon_thi === 'NGOAI_NGU') {
                          return false;
                        }
                        return ['TU_CHON_1', 'TU_CHON_2', 'NGOAI_NGU'].includes(mon.ma_mon_thi);
                      })
                      .sort((a, b) => {
                        const order = { 'TU_CHON_1': 1, 'TU_CHON_2': 2, 'NGOAI_NGU': 3 };
                        return (order[a.ma_mon_thi] || 99) - (order[b.ma_mon_thi] || 99);
                      })
                      .map(mon => (
                        <tr key={mon.idmonthi}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">
                            {mon.ten_mon_thi}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={diemThi[mon.idmonthi] || ''}
                              onChange={(e) => setDiemThi(prev => ({
                                ...prev,
                                [mon.idmonthi]: parseFloat(e.target.value) || 0
                              }))}
                              className={`w-full px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                !diemThi[mon.idmonthi] || diemThi[mon.idmonthi] === 0
                                  ? 'border-2 border-yellow-400 bg-yellow-50'
                                  : 'border border-gray-300'
                              }`}
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bước 2: Nhập điểm môn học */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bước 2: Nhập điểm các môn học đánh giá bằng điểm số</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              *Mẹo nhập nhanh: Nhập 66 → 6.6; 625 → 6.25; ..v..v
            </p>

            {/* Môn bắt buộc */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Môn bắt buộc học trên lớp:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left">Môn học</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 10</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 11</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monBatBuoc.map(mon => {
                      const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
                      if (!monHoc) return null;
                      return (
                        <tr key={mon.ma}>
                          <td className="border px-3 py-2 font-medium">
                            {mon.ma === 'GDQPAN' ? 'GD Quốc phòng & An ninh' : mon.tenVietTat}
                          </td>
                          {[10, 11, 12].map(lop => {
                            const diem = getDiem(monHoc.idmonhoc, lop);
                            const isEmpty = !diem || diem === 0;
                            return (
                            <td key={lop} className="border px-3 py-2">
                              <input
                                type="text"
                                  value={diem || ''}
                                onChange={(e) => handleScoreInput(`${monHoc.idmonhoc}_${lop}`, e.target.value)}
                                  className={`w-full px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                    isEmpty
                                      ? 'border-2 border-yellow-400 bg-yellow-50'
                                      : 'border border-gray-300'
                                  }`}
                                placeholder="0.00"
                              />
                            </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Môn lựa chọn */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Môn lựa chọn học trên lớp:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left">Môn học</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 10</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 11</th>
                      <th className="border px-3 py-2 text-center">Cả năm lớp 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monLuaChon.map(mon => {
                      const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
                      if (!monHoc) return null;
                      return (
                        <tr key={mon.ma}>
                          <td className="border px-3 py-2 font-medium">{mon.tenVietTat}</td>
                          {[10, 11, 12].map(lop => {
                            const diem = getDiem(monHoc.idmonhoc, lop);
                            const isEmpty = !diem || diem === 0;
                            return (
                            <td key={lop} className="border px-3 py-2">
                              <input
                                type="text"
                                  value={diem || ''}
                                onChange={(e) => handleScoreInput(`${monHoc.idmonhoc}_${lop}`, e.target.value)}
                                  className={`w-full px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                    isEmpty
                                      ? 'border-2 border-yellow-400 bg-yellow-50'
                                      : 'border border-gray-300'
                                  }`}
                                placeholder="0.00"
                              />
                            </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bước 3: Nhập điểm ưu tiên, khuyến khích */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Bước 3: Nhập điểm ưu tiên, khuyến khích
              <Info className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm ưu tiên
                </label>
                <input
                  ref={diemUuTienInputRef}
                  type="number"
                  step="1"
                  min="0"
                  max="10"
                  value={diemUuTien || 0}
                  onInput={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      prevDiemUuTienRef.current = 0;
                      setDiemUuTien(0);
                      return;
                    }
                    
                    let value = parseInt(inputValue) || 0;
                    const prevValue = prevDiemUuTienRef.current;
                    
                    if (prevValue === 10 && value === 10) {
                      setTimeout(() => {
                        if (diemUuTienInputRef.current) {
                          const currentValue = parseInt(diemUuTienInputRef.current.value) || 0;
                          if (currentValue === 10) {
                            setDiemUuTien(0);
                            prevDiemUuTienRef.current = 0;
                            if (diemUuTienInputRef.current) {
                              diemUuTienInputRef.current.value = '0';
                            }
                          }
                        }
                      }, 10);
                    }
                    
                    if (value > 10) {
                      value = 0;
                    }
                    if (value < 0) {
                      value = 0;
                    }
                    
                    prevDiemUuTienRef.current = value;
                    setDiemUuTien(value);
                  }}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      prevDiemUuTienRef.current = 0;
                      setDiemUuTien(0);
                      return;
                    }
                    
                    let value = parseInt(inputValue) || 0;
                    
                    if (value > 10) {
                      value = 0;
                    }
                    if (value < 0) {
                      value = 0;
                    }
                    
                    prevDiemUuTienRef.current = value;
                    setDiemUuTien(value);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const currentValue = diemUuTien || 0;
                    if (e.deltaY < 0) {
                      if (currentValue >= 10) {
                        setDiemUuTien(0);
                        prevDiemUuTienRef.current = 0;
                      } else {
                        setDiemUuTien(currentValue + 1);
                        prevDiemUuTienRef.current = currentValue + 1;
                      }
                    } else {
                      if (currentValue <= 0) {
                        setDiemUuTien(10);
                        prevDiemUuTienRef.current = 10;
                      } else {
                        setDiemUuTien(currentValue - 1);
                        prevDiemUuTienRef.current = currentValue - 1;
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const currentValue = diemUuTien || 0;
                      if (currentValue >= 10) {
                        setDiemUuTien(0);
                        prevDiemUuTienRef.current = 0;
                      } else {
                        setDiemUuTien(currentValue + 1);
                        prevDiemUuTienRef.current = currentValue + 1;
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const currentValue = diemUuTien || 0;
                      if (currentValue <= 0) {
                        setDiemUuTien(10);
                        prevDiemUuTienRef.current = 10;
                      } else {
                        setDiemUuTien(currentValue - 1);
                        prevDiemUuTienRef.current = currentValue - 1;
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                      setDiemUuTien(0);
                      prevDiemUuTienRef.current = 0;
                    } else {
                      const value = parseInt(e.target.value);
                      if (value > 10) {
                        setDiemUuTien(0);
                        prevDiemUuTienRef.current = 0;
                      } else if (value < 0) {
                        setDiemUuTien(0);
                        prevDiemUuTienRef.current = 0;
                      } else {
                        prevDiemUuTienRef.current = value;
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nhập điểm ưu tiên (0-10)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm khuyến khích
                </label>
                <input
                  ref={diemKhuyenKhichInputRef}
                  type="number"
                  step="1"
                  min="0"
                  max="2"
                  value={diemKhuyenKhich || 0}
                  onInput={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      prevDiemKhuyenKhichRef.current = 0;
                      setDiemKhuyenKhich(0);
                      return;
                    }
                    
                    let value = parseInt(inputValue) || 0;
                    const prevValue = prevDiemKhuyenKhichRef.current;
                    
                    if (prevValue === 2 && value === 2) {
                      setTimeout(() => {
                        if (diemKhuyenKhichInputRef.current) {
                          const currentValue = parseInt(diemKhuyenKhichInputRef.current.value) || 0;
                          if (currentValue === 2) {
                            setDiemKhuyenKhich(0);
                            prevDiemKhuyenKhichRef.current = 0;
                            if (diemKhuyenKhichInputRef.current) {
                              diemKhuyenKhichInputRef.current.value = '0';
                            }
                          }
                        }
                      }, 10);
                    }
                    
                    if (value > 2) {
                      value = 0;
                    }
                    if (value < 0) {
                      value = 0;
                    }
                    
                    prevDiemKhuyenKhichRef.current = value;
                    setDiemKhuyenKhich(value);
                  }}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      prevDiemKhuyenKhichRef.current = 0;
                      setDiemKhuyenKhich(0);
                      return;
                    }
                    
                    let value = parseInt(inputValue) || 0;
                    
                    if (value > 2) {
                      value = 0;
                    }
                    if (value < 0) {
                      value = 0;
                    }
                    
                    prevDiemKhuyenKhichRef.current = value;
                    setDiemKhuyenKhich(value);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const currentValue = diemKhuyenKhich || 0;
                    if (e.deltaY < 0) {
                      if (currentValue >= 2) {
                        setDiemKhuyenKhich(0);
                        prevDiemKhuyenKhichRef.current = 0;
                      } else {
                        setDiemKhuyenKhich(currentValue + 1);
                        prevDiemKhuyenKhichRef.current = currentValue + 1;
                      }
                    } else {
                      if (currentValue <= 0) {
                        setDiemKhuyenKhich(2);
                        prevDiemKhuyenKhichRef.current = 2;
                      } else {
                        setDiemKhuyenKhich(currentValue - 1);
                        prevDiemKhuyenKhichRef.current = currentValue - 1;
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const currentValue = diemKhuyenKhich || 0;
                      if (currentValue >= 2) {
                        setDiemKhuyenKhich(0);
                        prevDiemKhuyenKhichRef.current = 0;
                      } else {
                        setDiemKhuyenKhich(currentValue + 1);
                        prevDiemKhuyenKhichRef.current = currentValue + 1;
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const currentValue = diemKhuyenKhich || 0;
                      if (currentValue <= 0) {
                        setDiemKhuyenKhich(2);
                        prevDiemKhuyenKhichRef.current = 2;
                      } else {
                        setDiemKhuyenKhich(currentValue - 1);
                        prevDiemKhuyenKhichRef.current = currentValue - 1;
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                      setDiemKhuyenKhich(0);
                      prevDiemKhuyenKhichRef.current = 0;
                    } else {
                      const value = parseInt(e.target.value);
                      if (value > 2) {
                        setDiemKhuyenKhich(0);
                        prevDiemKhuyenKhichRef.current = 0;
                      } else if (value < 0) {
                        setDiemKhuyenKhich(0);
                        prevDiemKhuyenKhichRef.current = 0;
                      } else {
                        prevDiemKhuyenKhichRef.current = value;
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nhập điểm khuyến khích (0-2)"
                />
              </div>
            </div>
          </div>

          {/* Cảnh báo môn lựa chọn */}
          {warningMonLuaChon && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{warningMonLuaChon}</span>
            </div>
          )}

          {/* Bước 4: Xem kết quả */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Bước 4: Chọn "xem kết quả" để xem điểm xét tốt nghiệp THPT 2025
            </h3>
            
            {/* Hiển thị lỗi validation ngay trước nút */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {error.split('\n').map((line, index) => (
                      <div key={index} className={index > 0 ? 'mt-1' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tính...
                </>
              ) : (
                'Xem kết quả'
              )}
            </button>
          </div>

          {/* Kết quả */}
          {ketQua && (
            <>
              {/* Box kết quả màu hồng */}
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl">🎉</span>
                  <span className="text-2xl">✨</span>
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 mb-4">
                  Điểm xét tốt nghiệp THPT 2025
                </h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Tổng điểm 4 môn thi:</span>
                    <span className="font-semibold">{parseFloat(ketQua.tong_diem_4_mon_thi || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng điểm khuyến khích:</span>
                    <span className="font-semibold">{parseFloat(ketQua.tong_diem_kk || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ĐTB các năm học:</span>
                    <span className="font-semibold">{parseFloat(ketQua.dtb_cac_nam_hoc || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Điểm ưu tiên:</span>
                    <span className="font-semibold">{parseFloat(ketQua.diem_uu_tien || 0).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Banner kết quả */}
              {parseFloat(ketQua.tong_diem_xet_tot_nghiep || 0) >= 5.0 ? (
                <div className="bg-green-600 text-white rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">
                    CHÚC MỪNG BẠN ĐÃ ĐỖ TỐT NGHIỆP THPT
                  </h3>
                  <p className="text-lg">
                    Điểm xét tốt nghiệp của bạn là <span className="font-bold text-2xl">{parseFloat(ketQua.tong_diem_xet_tot_nghiep || 0).toFixed(2)}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-red-600 text-white rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">
                    BẠN ĐÃ TRƯỢT TỐT NGHIỆP THPT
                  </h3>
                  <p className="text-lg">
                    Điểm xét tốt nghiệp của bạn là <span className="font-bold text-2xl">{parseFloat(ketQua.tong_diem_xet_tot_nghiep || 0).toFixed(2)}</span>
                  </p>
                  {lyDoTruot && (
                    <p className="text-sm mt-2 opacity-90">
                      Lý do: {lyDoTruot}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quy định bên phải */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Quy định cộng điểm ưu tiên:</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-2">Quy định 1:</p>
                <p className="text-xs">
                  Nếu tổng điểm đạt được theo tổ hợp môn nhỏ hơn 22.5 (khi quy đổi về điểm theo thang 10 và tổng điểm 3 môn tối đa là 30) thì cộng điểm ưu tiên theo khu vực, đối tượng chính sách theo mức thông thường.
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Quy định 2:</p>
                <p className="text-xs">
                  Nếu tổng điểm từ 22.5 điểm trở lên (khi quy đổi về điểm theo thang 10 và tổng điểm 3 môn tối đa là 30) thì cộng điểm ưu tiên theo công thức sau: Điểm ưu tiên = [(30 - Tổng điểm đạt được)/7.5] x Tổng điểm ưu tiên được xác định thông thường
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Áp dụng theo: Quy định điểm ưu tiên 2024 (2024)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
