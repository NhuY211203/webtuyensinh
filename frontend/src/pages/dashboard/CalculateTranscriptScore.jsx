import { useState, useEffect } from "react";
import { Calculator, Info, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import apiService from "../../services/api";

export default function CalculateTranscriptScore() {
  // States cho danh mục
  const [phuongThucList, setPhuongThucList] = useState([]);
  const [doiTuongList, setDoiTuongList] = useState([]);
  const [khuVucList, setKhuVucList] = useState([]);
  const [monHocList, setMonHocList] = useState([]);
  const [quyDinh, setQuyDinh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States cho form
  const [selectedPhuongThuc, setSelectedPhuongThuc] = useState(null);
  const [selectedDoiTuong, setSelectedDoiTuong] = useState(null);
  const [selectedKhuVuc, setSelectedKhuVuc] = useState(null);
  const [selectedMonNhanHeSo, setSelectedMonNhanHeSo] = useState(null);
  const [diemHocBa, setDiemHocBa] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [ketQua, setKetQua] = useState(null);
  const [ketQuaTheoKhoi, setKetQuaTheoKhoi] = useState([]); // Kết quả theo từng khối
  const [diemTrungBinhMon, setDiemTrungBinhMon] = useState({}); // Điểm trung bình từng môn

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.idnguoidung || user.id;

  // Danh sách môn học cần nhập điểm
  const monHocCanNhap = [
    { ma: 'TOAN', ten: 'Toán', tenVietTat: 'Toán' },
    { ma: 'VAN', ten: 'Ngữ văn', tenVietTat: 'Văn' },
    { ma: 'ANH', ten: 'Tiếng Anh', tenVietTat: 'T.Anh' },
    { ma: 'SU', ten: 'Lịch sử', tenVietTat: 'Sử' },
    { ma: 'DIA', ten: 'Địa lý', tenVietTat: 'Địa' },
    { ma: 'GDKTPL', ten: 'Giáo dục kinh tế và pháp luật', tenVietTat: 'GDKTPL' },
    { ma: 'LI', ten: 'Vật lý', tenVietTat: 'Lí' },
    { ma: 'HOA', ten: 'Hóa học', tenVietTat: 'Hóa' },
    { ma: 'SINH', ten: 'Sinh học', tenVietTat: 'Sinh' },
    { ma: 'TIN', ten: 'Tin học', tenVietTat: 'Tin học' },
    { ma: 'CN', ten: 'Công nghệ', tenVietTat: 'Công nghệ' },
  ];

  // Danh sách tổ hợp môn phổ biến (có thể lấy từ API sau)
  const toHopMonList = [
    { ma: 'A00', mon: ['TOAN', 'LI', 'HOA'], ten: 'A00 (Toán, Lý, Hóa)' },
    { ma: 'A01', mon: ['TOAN', 'LI', 'ANH'], ten: 'A01 (Toán, Lý, Anh)' },
    { ma: 'B00', mon: ['TOAN', 'HOA', 'SINH'], ten: 'B00 (Toán, Hóa, Sinh)' },
    { ma: 'C00', mon: ['VAN', 'SU', 'DIA'], ten: 'C00 (Văn, Sử, Địa)' },
    { ma: 'C01', mon: ['VAN', 'TOAN', 'LI'], ten: 'C01 (Văn, Toán, Lý)' },
    { ma: 'C02', mon: ['VAN', 'TOAN', 'HOA'], ten: 'C02 (Văn, Toán, Hóa)' },
    { ma: 'C03', mon: ['VAN', 'TOAN', 'SINH'], ten: 'C03 (Văn, Toán, Sinh)' },
    { ma: 'C04', mon: ['VAN', 'TOAN', 'DIA'], ten: 'C04 (Văn, Toán, Địa)' },
    { ma: 'C08', mon: ['VAN', 'HOA', 'SINH'], ten: 'C08 (Văn, Hóa, Sinh)' },
    { ma: 'D01', mon: ['TOAN', 'VAN', 'ANH'], ten: 'D01 (Toán, Văn, Anh)' },
    { ma: 'D07', mon: ['TOAN', 'HOA', 'ANH'], ten: 'D07 (Toán, Hóa, Anh)' },
    { ma: 'D08', mon: ['TOAN', 'SINH', 'ANH'], ten: 'D08 (Toán, Sinh, Anh)' },
    { ma: 'D09', mon: ['TOAN', 'DIA', 'ANH'], ten: 'D09 (Toán, Địa, Anh)' },
    { ma: 'D10', mon: ['TOAN', 'LI', 'ANH'], ten: 'D10 (Toán, Lý, Anh)' },
    { ma: 'D11', mon: ['VAN', 'HOA', 'ANH'], ten: 'D11 (Văn, Hóa, Anh)' },
    { ma: 'D13', mon: ['VAN', 'SINH', 'ANH'], ten: 'D13 (Văn, Sinh, Anh)' },
    { ma: 'D14', mon: ['VAN', 'SU', 'ANH'], ten: 'D14 (Văn, Sử, Anh)' },
    { ma: 'D15', mon: ['VAN', 'DIA', 'ANH'], ten: 'D15 (Văn, Địa, Anh)' },
    { ma: 'A02', mon: ['TOAN', 'LI', 'SINH'], ten: 'A02 (Toán, Lý, Sinh)' },
    { ma: 'A04', mon: ['TOAN', 'LI', 'DIA'], ten: 'A04 (Toán, Lý, Địa)' },
    { ma: 'A05', mon: ['TOAN', 'HOA', 'SU'], ten: 'A05 (Toán, Hóa, Sử)' },
    { ma: 'A06', mon: ['TOAN', 'HOA', 'DIA'], ten: 'A06 (Toán, Hóa, Địa)' },
    { ma: 'A07', mon: ['TOAN', 'SU', 'DIA'], ten: 'A07 (Toán, Sử, Địa)' },
    { ma: 'B02', mon: ['TOAN', 'SINH', 'DIA'], ten: 'B02 (Toán, Sinh, Địa)' },
    { ma: 'B03', mon: ['TOAN', 'SINH', 'SU'], ten: 'B03 (Toán, Sinh, Sử)' },
    { ma: 'B08', mon: ['TOAN', 'SINH', 'ANH'], ten: 'B08 (Toán, Sinh, Anh)' },
  ];

  // Lấy phương thức đã chọn để xác định cấu trúc bảng
  const selectedPhuongThucObj = phuongThucList.find(pt => pt.idphuongthuc_hb === selectedPhuongThuc);
  const maPhuongThuc = selectedPhuongThucObj?.ma_phuong_thuc || '';

  // Xác định các cột cần hiển thị dựa trên phương thức
  const getTableColumns = () => {
    switch (maPhuongThuc) {
      case 'HB_3_NAM':
        return [
          { key: 'lop10', label: 'Cả năm lớp 10', lop: 10, hocKy: null },
          { key: 'lop11', label: 'Cả năm lớp 11', lop: 11, hocKy: null },
          { key: 'lop12', label: 'Cả năm lớp 12', lop: 12, hocKy: null },
        ];
      case 'HB_12_NAM':
        return [
          { key: 'lop12', label: 'Điểm', lop: 12, hocKy: null },
        ];
      case 'HB_6_HK':
        return [
          { key: 'hk1_10', label: 'HK1 lớp 10', lop: 10, hocKy: 1 },
          { key: 'hk2_10', label: 'HK2 lớp 10', lop: 10, hocKy: 2 },
          { key: 'hk1_11', label: 'HK1 lớp 11', lop: 11, hocKy: 1 },
          { key: 'hk2_11', label: 'HK2 lớp 11', lop: 11, hocKy: 2 },
          { key: 'hk1_12', label: 'HK1 lớp 12', lop: 12, hocKy: 1 },
          { key: 'hk2_12', label: 'HK2 lớp 12', lop: 12, hocKy: 2 },
        ];
      case 'HB_10_11_HK1_12':
        return [
          { key: 'lop10', label: 'Cả năm lớp 10', lop: 10, hocKy: null },
          { key: 'lop11', label: 'Cả năm lớp 11', lop: 11, hocKy: null },
          { key: 'hk1_12', label: 'HK1 lớp 12', lop: 12, hocKy: 1 },
        ];
      case 'HB_3_HK':
        return [
          { key: 'hk2_11', label: 'HK2 lớp 11', lop: 11, hocKy: 2 },
          { key: 'hk1_12', label: 'HK1 lớp 12', lop: 12, hocKy: 1 },
          { key: 'hk2_12', label: 'HK2 lớp 12', lop: 12, hocKy: 2 },
        ];
      case 'HB_5_HK':
        return [
          { key: 'hk2_10', label: 'HK2 lớp 10', lop: 10, hocKy: 2 },
          { key: 'hk1_11', label: 'HK1 lớp 11', lop: 11, hocKy: 1 },
          { key: 'hk2_11', label: 'HK2 lớp 11', lop: 11, hocKy: 2 },
          { key: 'hk1_12', label: 'HK1 lớp 12', lop: 12, hocKy: 1 },
          { key: 'hk2_12', label: 'HK2 lớp 12', lop: 12, hocKy: 2 },
        ];
      default:
        return [
          { key: 'lop10', label: 'Cả năm lớp 10', lop: 10, hocKy: null },
          { key: 'lop11', label: 'Cả năm lớp 11', lop: 11, hocKy: null },
          { key: 'lop12', label: 'Cả năm lớp 12', lop: 12, hocKy: null },
        ];
    }
  };

  const tableColumns = getTableColumns();

  // Load danh mục
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [phuongThucRes, doiTuongRes, khuVucRes, monHocRes, quyDinhRes] = await Promise.all([
          apiService.getPhuongThucXetHocBa(),
          apiService.getDoiTuongUuTien(),
          apiService.getKhuVucUuTien(),
          apiService.getMonHoc(),
          apiService.getQuyDinhDiemUuTien(),
        ]);

        if (phuongThucRes.success) setPhuongThucList(phuongThucRes.data || []);
        if (doiTuongRes.success) setDoiTuongList(doiTuongRes.data || []);
        if (khuVucRes.success) setKhuVucList(khuVucRes.data || []);
        if (monHocRes.success) setMonHocList(monHocRes.data || []);
        if (quyDinhRes.success) setQuyDinh(quyDinhRes.data);

        // Chọn phương thức đầu tiên mặc định
        if (phuongThucRes.success && phuongThucRes.data?.length > 0) {
          setSelectedPhuongThuc(phuongThucRes.data[0].idphuongthuc_hb);
        }
      } catch (err) {
        setError(err.message || 'Lỗi khi tải dữ liệu');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Không tự động load điểm học bạ khi mount - để người dùng nhập mới mỗi lần
  // Nếu cần load điểm đã lưu, có thể thêm nút "Tải điểm đã lưu" riêng

  // Xử lý nhập điểm nhanh: 9 => 9.0, 90 => 9.0, 625 => 6.25
  const handleScoreInput = (idmonhoc, lop, hocKy, value) => {
    let numValue = value.replace(/[^0-9]/g, '');
    if (numValue.length === 0) {
      numValue = '0';
    } else if (numValue.length === 1) {
      // 1 chữ số: giữ nguyên (9 => 9.0)
      numValue = parseFloat(numValue).toFixed(2);
    } else if (numValue.length === 2) {
      // 2 chữ số: chia 10 (90 => 9.0, 66 => 6.6)
      numValue = (parseFloat(numValue) / 10).toFixed(2);
    } else {
      // 3+ chữ số: chia 100 (625 => 6.25, 1000 => 10.00)
      numValue = (parseFloat(numValue) / 100).toFixed(2);
    }

    const key = `${idmonhoc}_${lop}_${hocKy || 'nam'}`;
    setDiemHocBa(prev => ({
      ...prev,
      [key]: parseFloat(numValue) || 0
    }));
  };

  // Lấy điểm từ state
  const getDiem = (idmonhoc, lop, hocKy = null) => {
    const key = `${idmonhoc}_${lop}_${hocKy || 'nam'}`;
    return diemHocBa[key] || 0;
  };

  // Kiểm tra đã nhập đủ điểm chưa
  const checkValidInput = () => {
    if (!selectedPhuongThuc) {
      return { valid: false, message: 'Vui lòng chọn phương thức xét học bạ' };
    }

    // Đếm số môn đã nhập điểm (ít nhất 3 môn)
    let soMonCoDiem = 0;
    const monHocDaNhap = new Set();

    monHocCanNhap.forEach(mon => {
      const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
      if (!monHoc) return;

      // Kiểm tra xem môn này có ít nhất 1 điểm đã nhập không
      const hasDiem = tableColumns.some(col => {
        const diem = getDiem(monHoc.idmonhoc, col.lop, col.hocKy);
        return diem > 0;
      });

      if (hasDiem) {
        monHocDaNhap.add(monHoc.idmonhoc);
      }
    });

    soMonCoDiem = monHocDaNhap.size;

    if (soMonCoDiem < 3) {
      return { valid: false, message: `Bạn cần nhập đủ điểm ít nhất 3 môn để tính toán. Hiện tại đã nhập ${soMonCoDiem} môn.` };
    }

    return { valid: true };
  };

  // Tính điểm
  const handleCalculate = async () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    const validation = checkValidInput();
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      // Lưu điểm học bạ trước - chỉ lưu các cột hiển thị trong bảng
      const diemHocBaArray = [];
      monHocCanNhap.forEach(mon => {
        const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
        if (!monHoc) return;

        // Lưu điểm theo các cột hiển thị trong bảng
        tableColumns.forEach(col => {
          const diem = getDiem(monHoc.idmonhoc, col.lop, col.hocKy);
          if (diem > 0) {
            diemHocBaArray.push({
              idmonhoc: monHoc.idmonhoc,
              lop: col.lop,
              hoc_ky: col.hocKy,
              diem_trung_binh: diem,
              nam_hoc: new Date().getFullYear(),
            });
          }
        });
      });

      // Lưu điểm học bạ
      if (diemHocBaArray.length > 0) {
        await apiService.saveDiemHocBa({
          idnguoidung: userId,
          replace_all: true,
          diem_hoc_ba: diemHocBaArray,
        });
      }

      // Tính điểm trung bình từng môn theo phương thức đã chọn
      const diemTBMon = {};
      monHocCanNhap.forEach(mon => {
        const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
        if (!monHoc) return;

        // Tính điểm trung bình theo phương thức
        let tongDiem = 0;
        let soDiem = 0;

        switch (maPhuongThuc) {
          case 'HB_3_NAM':
            // Trung bình cả năm của 3 năm
            for (let lop = 10; lop <= 12; lop++) {
              const diem = getDiem(monHoc.idmonhoc, lop, null);
              if (diem > 0) {
                tongDiem += diem;
                soDiem++;
              }
            }
            break;
          case 'HB_12_NAM':
            // Chỉ lấy lớp 12
            const diem12 = getDiem(monHoc.idmonhoc, 12, null);
            if (diem12 > 0) {
              tongDiem = diem12;
              soDiem = 1;
            }
            break;
          case 'HB_6_HK':
            // Trung bình 6 học kỳ
            for (let lop = 10; lop <= 12; lop++) {
              for (let hk = 1; hk <= 2; hk++) {
                const diem = getDiem(monHoc.idmonhoc, lop, hk);
                if (diem > 0) {
                  tongDiem += diem;
                  soDiem++;
                }
              }
            }
            break;
          case 'HB_10_11_HK1_12':
            // Lớp 10, 11 cả năm + HK1 lớp 12
            const diem10 = getDiem(monHoc.idmonhoc, 10, null);
            const diem11 = getDiem(monHoc.idmonhoc, 11, null);
            const diemHK1_12 = getDiem(monHoc.idmonhoc, 12, 1);
            if (diem10 > 0) { tongDiem += diem10; soDiem++; }
            if (diem11 > 0) { tongDiem += diem11; soDiem++; }
            if (diemHK1_12 > 0) { tongDiem += diemHK1_12; soDiem++; }
            break;
          case 'HB_3_HK':
            // HK2 lớp 11, HK1 và HK2 lớp 12
            const diemHK2_11 = getDiem(monHoc.idmonhoc, 11, 2);
            const diemHK1_12_3 = getDiem(monHoc.idmonhoc, 12, 1);
            const diemHK2_12_3 = getDiem(monHoc.idmonhoc, 12, 2);
            if (diemHK2_11 > 0) { tongDiem += diemHK2_11; soDiem++; }
            if (diemHK1_12_3 > 0) { tongDiem += diemHK1_12_3; soDiem++; }
            if (diemHK2_12_3 > 0) { tongDiem += diemHK2_12_3; soDiem++; }
            break;
          case 'HB_5_HK':
            // HK2 lớp 10, HK1 và HK2 lớp 11, HK1 và HK2 lớp 12
            const diemHK2_10 = getDiem(monHoc.idmonhoc, 10, 2);
            const diemHK1_11_5 = getDiem(monHoc.idmonhoc, 11, 1);
            const diemHK2_11_5 = getDiem(monHoc.idmonhoc, 11, 2);
            const diemHK1_12_5 = getDiem(monHoc.idmonhoc, 12, 1);
            const diemHK2_12_5 = getDiem(monHoc.idmonhoc, 12, 2);
            if (diemHK2_10 > 0) { tongDiem += diemHK2_10; soDiem++; }
            if (diemHK1_11_5 > 0) { tongDiem += diemHK1_11_5; soDiem++; }
            if (diemHK2_11_5 > 0) { tongDiem += diemHK2_11_5; soDiem++; }
            if (diemHK1_12_5 > 0) { tongDiem += diemHK1_12_5; soDiem++; }
            if (diemHK2_12_5 > 0) { tongDiem += diemHK2_12_5; soDiem++; }
            break;
          default:
            // Mặc định: trung bình tất cả điểm đã nhập
            tableColumns.forEach(col => {
              const diem = getDiem(monHoc.idmonhoc, col.lop, col.hocKy);
              if (diem > 0) {
                tongDiem += diem;
                soDiem++;
              }
            });
        }

        if (soDiem > 0) {
          diemTBMon[mon.ma] = {
            ten: mon.tenVietTat,
            diem: (tongDiem / soDiem).toFixed(2)
          };
        }
      });
      setDiemTrungBinhMon(diemTBMon);

      // Tính điểm ở frontend để tăng tốc (không cần gọi API nhiều lần)
      const ketQuaKhoi = [];
      
      // Tính điểm ưu tiên một lần
      const diemDoiTuong = selectedDoiTuong 
        ? parseFloat(doiTuongList.find(dt => dt.iddoituong === selectedDoiTuong)?.diem_uu_tien || 0)
        : 0;
      const diemKhuVuc = selectedKhuVuc
        ? parseFloat(khuVucList.find(kv => kv.idkhuvuc === selectedKhuVuc)?.diem_uu_tien || 0)
        : 0;
      const tongDiemUuTienThongThuong = diemDoiTuong + diemKhuVuc;

      // Tính điểm cho từng tổ hợp môn
      for (const tohop of toHopMonList) {
        // Kiểm tra xem có đủ môn trong tổ hợp không
        const monHocIds = [];
        let coDuMon = true;
        
        for (const maMon of tohop.mon) {
          const monHoc = monHocList.find(m => m.ma_mon_hoc === maMon);
          if (!monHoc) {
            coDuMon = false;
            break;
          }
          
          // Kiểm tra xem môn này có điểm không
          const hasDiem = tableColumns.some(col => {
            const diem = getDiem(monHoc.idmonhoc, col.lop, col.hocKy);
            return diem > 0;
          });
          
          if (!hasDiem) {
            coDuMon = false;
            break;
          }
          
          monHocIds.push(monHoc.idmonhoc);
        }

        if (!coDuMon || monHocIds.length < 3) continue;

        // Tính điểm tổ hợp môn ở frontend
        let diemToHop = 0;
        for (const idmonhoc of monHocIds) {
          let diemMon = 0;

          switch (maPhuongThuc) {
            case 'HB_3_NAM':
              // Trung bình cả năm của 3 năm
              let tongDiem3Nam = 0;
              let soDiem3Nam = 0;
              for (let lop = 10; lop <= 12; lop++) {
                const diem = getDiem(idmonhoc, lop, null);
                if (diem > 0) {
                  tongDiem3Nam += diem;
                  soDiem3Nam++;
                }
              }
              diemMon = soDiem3Nam > 0 ? tongDiem3Nam / soDiem3Nam : 0;
              break;

            case 'HB_12_NAM':
              // Chỉ lấy lớp 12
              diemMon = getDiem(idmonhoc, 12, null);
              break;

            case 'HB_6_HK':
              // Trung bình 6 học kỳ
              let tongDiem6HK = 0;
              let soDiem6HK = 0;
              for (let lop = 10; lop <= 12; lop++) {
                for (let hk = 1; hk <= 2; hk++) {
                  const diem = getDiem(idmonhoc, lop, hk);
                  if (diem > 0) {
                    tongDiem6HK += diem;
                    soDiem6HK++;
                  }
                }
              }
              diemMon = soDiem6HK > 0 ? tongDiem6HK / soDiem6HK : 0;
              break;

            case 'HB_10_11_HK1_12':
              // Lớp 10, 11 cả năm + HK1 lớp 12
              const diem10 = getDiem(idmonhoc, 10, null);
              const diem11 = getDiem(idmonhoc, 11, null);
              const diemHK1_12 = getDiem(idmonhoc, 12, 1);
              const tong = (diem10 > 0 ? diem10 : 0) + (diem11 > 0 ? diem11 : 0) + (diemHK1_12 > 0 ? diemHK1_12 : 0);
              const so = (diem10 > 0 ? 1 : 0) + (diem11 > 0 ? 1 : 0) + (diemHK1_12 > 0 ? 1 : 0);
              diemMon = so > 0 ? tong / so : 0;
              break;

            case 'HB_3_HK':
              // HK2 lớp 11, HK1 và HK2 lớp 12
              const diemHK2_11 = getDiem(idmonhoc, 11, 2);
              const diemHK1_12_3 = getDiem(idmonhoc, 12, 1);
              const diemHK2_12_3 = getDiem(idmonhoc, 12, 2);
              const tong3HK = (diemHK2_11 > 0 ? diemHK2_11 : 0) + (diemHK1_12_3 > 0 ? diemHK1_12_3 : 0) + (diemHK2_12_3 > 0 ? diemHK2_12_3 : 0);
              const so3HK = (diemHK2_11 > 0 ? 1 : 0) + (diemHK1_12_3 > 0 ? 1 : 0) + (diemHK2_12_3 > 0 ? 1 : 0);
              diemMon = so3HK > 0 ? tong3HK / so3HK : 0;
              break;

            case 'HB_5_HK':
              // HK2 lớp 10, HK1 và HK2 lớp 11, HK1 và HK2 lớp 12
              const diemHK2_10 = getDiem(idmonhoc, 10, 2);
              const diemHK1_11_5 = getDiem(idmonhoc, 11, 1);
              const diemHK2_11_5 = getDiem(idmonhoc, 11, 2);
              const diemHK1_12_5 = getDiem(idmonhoc, 12, 1);
              const diemHK2_12_5 = getDiem(idmonhoc, 12, 2);
              const tong5HK = (diemHK2_10 > 0 ? diemHK2_10 : 0) + (diemHK1_11_5 > 0 ? diemHK1_11_5 : 0) + 
                             (diemHK2_11_5 > 0 ? diemHK2_11_5 : 0) + (diemHK1_12_5 > 0 ? diemHK1_12_5 : 0) + 
                             (diemHK2_12_5 > 0 ? diemHK2_12_5 : 0);
              const so5HK = (diemHK2_10 > 0 ? 1 : 0) + (diemHK1_11_5 > 0 ? 1 : 0) + (diemHK2_11_5 > 0 ? 1 : 0) + 
                           (diemHK1_12_5 > 0 ? 1 : 0) + (diemHK2_12_5 > 0 ? 1 : 0);
              diemMon = so5HK > 0 ? tong5HK / so5HK : 0;
              break;

            default:
              // Mặc định: trung bình tất cả điểm đã nhập
              let tongDiemDefault = 0;
              let soDiemDefault = 0;
              tableColumns.forEach(col => {
                const diem = getDiem(idmonhoc, col.lop, col.hocKy);
                if (diem > 0) {
                  tongDiemDefault += diem;
                  soDiemDefault++;
                }
              });
              diemMon = soDiemDefault > 0 ? tongDiemDefault / soDiemDefault : 0;
          }

          // Nhân hệ số 2 nếu có
          if (selectedMonNhanHeSo && idmonhoc === selectedMonNhanHeSo) {
            diemMon = diemMon * 2;
          }

          diemToHop += diemMon;
        }

        diemToHop = Math.round(diemToHop * 100) / 100;

        // Áp dụng quy định điểm ưu tiên
        let tongDiemUuTien = tongDiemUuTienThongThuong;
        if (quyDinh && diemToHop >= parseFloat(quyDinh.nguong_diem || 22.5)) {
          tongDiemUuTien = ((30 - diemToHop) / 7.5) * tongDiemUuTienThongThuong;
        }
        tongDiemUuTien = Math.round(tongDiemUuTien * 100) / 100;

        const tongDiemXetTuyen = diemToHop + tongDiemUuTien;

        ketQuaKhoi.push({
          khoi: tohop.ma,
          diem: diemToHop,
          diemUT: tongDiemUuTien,
          tongDiem: tongDiemXetTuyen,
        });
      }

      // Sắp xếp kết quả theo điểm giảm dần
      ketQuaKhoi.sort((a, b) => b.tongDiem - a.tongDiem);
      setKetQuaTheoKhoi(ketQuaKhoi);

      // Hiển thị kết quả ngay lập tức (tính ở frontend)
      if (ketQuaKhoi.length > 0) {
        setKetQua({
          diem_to_hop: ketQuaKhoi[0].diem,
          diem_uu_tien_doi_tuong: diemDoiTuong,
          diem_uu_tien_khu_vuc: diemKhuVuc,
          tong_diem_uu_tien: ketQuaKhoi[0].diemUT,
          tong_diem_xet_tuyen: ketQuaKhoi[0].tongDiem,
        });
      }

      // Lưu kết quả vào database ở background (không chặn UI)
      if (ketQuaKhoi.length > 0) {
        const firstToHop = toHopMonList.find(t => t.ma === ketQuaKhoi[0].khoi);
        if (firstToHop) {
          const tohopmonString = firstToHop.mon.join(';');
          // Gọi API ở background, không cần await
          apiService.tinhDiemHocBa({
            idnguoidung: userId,
            idphuongthuc_hb: selectedPhuongThuc,
            tohopmon: tohopmonString,
            mon_nhan_he_so_2: selectedMonNhanHeSo,
            iddoituong: selectedDoiTuong,
            idkhuvuc: selectedKhuVuc,
          }).catch(err => {
            console.error('Error saving result (background):', err);
            // Không cần thông báo lỗi cho user vì đã hiển thị kết quả
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tính điểm');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-2">
            <Calculator className="w-8 h-8" />
            CÔNG CỤ TÍNH ĐIỂM XÉT HỌC BẠ THPT NHANH NHẤT
          </h1>
          <p className="text-gray-600">
            Công cụ giúp bạn tính điểm xét tuyển học bạ nhanh chóng và chính xác dựa trên các phương thức:
            Xét học bạ 3 năm, cả năm lớp 12, 6 học kỳ, lớp 10-11-HK1 lớp 12, 3 học kỳ, 5 học kỳ.
          </p>
        </div>

        {/* Hướng dẫn */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-orange-900 mb-3">
            Công cụ tính điểm xét học bạ THPT nhanh và chính xác nhất
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-orange-800 mb-4">
            <li>Bạn chọn phương thức xét học bạ</li>
            <li>Bạn chọn đối tượng ưu tiên, khu vực ưu tiên</li>
            <li>Bạn nhập thông tin điểm các môn học vào các ô tương ứng phía dưới</li>
            <li>Click nút Xem kết quả để xem kết quả học bạ THPT theo tổ hợp môn, ĐTB môn</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form bên trái */}
          <div className="lg:col-span-2 space-y-6">
            {/* Phương thức xét học bạ */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phương thức xét học bạ:
              </label>
              <div className="space-y-2">
                {phuongThucList.map(pt => (
                  <label key={pt.idphuongthuc_hb} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="phuongThuc"
                      value={pt.idphuongthuc_hb}
                      checked={selectedPhuongThuc === pt.idphuongthuc_hb}
                      onChange={(e) => setSelectedPhuongThuc(parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <span className="text-sm">{pt.ten_phuong_thuc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Điểm ưu tiên */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                Nhập điểm ưu tiên (U.T):
                <Info className="w-4 h-4 text-gray-400" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chọn đối tượng</label>
                  <select
                    value={selectedDoiTuong || ''}
                    onChange={(e) => setSelectedDoiTuong(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Chọn đối tượng</option>
                    {doiTuongList.map(dt => (
                      <option key={dt.iddoituong} value={dt.iddoituong}>
                        {dt.ten_doi_tuong} {parseFloat(dt.diem_uu_tien || 0) > 0 ? `(+${parseFloat(dt.diem_uu_tien || 0).toFixed(2)} điểm)` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedDoiTuong && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      +{parseFloat(doiTuongList.find(dt => dt.iddoituong === selectedDoiTuong)?.diem_uu_tien || 0).toFixed(2)} điểm
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chọn khu vực</label>
                  <select
                    value={selectedKhuVuc || ''}
                    onChange={(e) => setSelectedKhuVuc(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Chọn khu vực</option>
                    {khuVucList.map(kv => (
                      <option key={kv.idkhuvuc} value={kv.idkhuvuc}>
                        {kv.ten_khu_vuc} {parseFloat(kv.diem_uu_tien || 0) > 0 ? `(+${parseFloat(kv.diem_uu_tien || 0).toFixed(2)} điểm)` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedKhuVuc && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      +{parseFloat(khuVucList.find(kv => kv.idkhuvuc === selectedKhuVuc)?.diem_uu_tien || 0).toFixed(2)} điểm
                    </div>
                  )}
                </div>
              </div>
              {/* Tổng điểm ưu tiên dự kiến */}
              {(selectedDoiTuong || selectedKhuVuc) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tổng điểm ưu tiên dự kiến:</span>
                    <span className="text-lg font-bold text-green-600">
                      +{(
                        parseFloat(selectedDoiTuong ? (doiTuongList.find(dt => dt.iddoituong === selectedDoiTuong)?.diem_uu_tien || 0) : 0) +
                        parseFloat(selectedKhuVuc ? (khuVucList.find(kv => kv.idkhuvuc === selectedKhuVuc)?.diem_uu_tien || 0) : 0)
                      ).toFixed(2)} điểm
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    * Điểm ưu tiên thực tế có thể thay đổi nếu tổng điểm ≥ 22.5
                  </p>
                </div>
              )}
            </div>

            {/* Nhập điểm */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nhập điểm vào bảng
              </label>
              <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <strong>Mẹo nhập nhanh:</strong> Nhập 9 → 9.0; 90 → 9.0; 625 → 6.25; ..v..v
              </div>
              {selectedPhuongThuc ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left border">Môn học</th>
                        {tableColumns.map(col => (
                          <th key={col.key} className="px-3 py-2 text-center border">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monHocCanNhap.map(mon => {
                        const monHoc = monHocList.find(m => m.ma_mon_hoc === mon.ma);
                        if (!monHoc) return null;

                        return (
                          <tr key={mon.ma}>
                            <td className="px-3 py-2 border font-medium">{mon.tenVietTat}</td>
                            {tableColumns.map(col => (
                              <td key={col.key} className="px-3 py-2 border">
                                <input
                                  type="text"
                                  value={getDiem(monHoc.idmonhoc, col.lop, col.hocKy) || ''}
                                  onChange={(e) => handleScoreInput(monHoc.idmonhoc, col.lop, col.hocKy, e.target.value)}
                                  className="w-full text-center border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1"
                                  placeholder="0.00"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Vui lòng chọn phương thức xét học bạ để hiển thị bảng nhập điểm
                </div>
              )}
            </div>

            {/* Chọn môn nhân hệ số */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn môn nhân hệ số 2 (nếu có):
              </label>
              <select
                value={selectedMonNhanHeSo || ''}
                onChange={(e) => setSelectedMonNhanHeSo(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Chọn môn</option>
                {monHocList.map(mh => (
                  <option key={mh.idmonhoc} value={mh.idmonhoc}>
                    {mh.ten_mon_hoc}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút tính điểm */}
            <div>
              <button
                onClick={handleCalculate}
                disabled={calculating || !selectedPhuongThuc}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              {!selectedPhuongThuc && (
                <p className="text-red-500 text-sm mt-2 text-center">
                  Vui lòng chọn phương thức xét học bạ
                </p>
              )}
              {selectedPhuongThuc && (() => {
                const validation = checkValidInput();
                if (!validation.valid && validation.message.includes('ít nhất 3 môn')) {
                  return (
                    <p className="text-red-500 text-sm mt-2 text-center">
                      {validation.message}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Hiển thị lỗi */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Lỗi</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Hiển thị kết quả theo khối */}
            {ketQuaTheoKhoi.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Kết quả tính điểm theo khối
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bảng 1 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">Khối</th>
                          <th className="border px-3 py-2 text-center">Điểm</th>
                          <th className="border px-3 py-2 text-center">Điểm UT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ketQuaTheoKhoi.slice(0, Math.ceil(ketQuaTheoKhoi.length / 2)).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-medium">{item.khoi}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(item.diem).toFixed(1)}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(item.diemUT).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Bảng 2 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">Khối</th>
                          <th className="border px-3 py-2 text-center">Điểm</th>
                          <th className="border px-3 py-2 text-center">Điểm UT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ketQuaTheoKhoi.slice(Math.ceil(ketQuaTheoKhoi.length / 2)).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-medium">{item.khoi}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(item.diem).toFixed(1)}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(item.diemUT).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Hiển thị điểm trung bình môn */}
            {Object.keys(diemTrungBinhMon).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Điểm trung bình môn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bảng 1 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">Môn</th>
                          <th className="border px-3 py-2 text-center">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(diemTrungBinhMon).slice(0, Math.ceil(Object.keys(diemTrungBinhMon).length / 2)).map(([ma, data]) => (
                          <tr key={ma} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-medium">{data.ten}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(data.diem).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Bảng 2 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">Môn</th>
                          <th className="border px-3 py-2 text-center">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(diemTrungBinhMon).slice(Math.ceil(Object.keys(diemTrungBinhMon).length / 2)).map(([ma, data]) => (
                          <tr key={ma} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-medium">{data.ten}</td>
                            <td className="border px-3 py-2 text-center">{parseFloat(data.diem).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Hiển thị kết quả chi tiết */}
            {ketQua && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Chi tiết tính điểm
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Điểm tổ hợp môn:</span>
                    <span className="font-semibold text-lg">{ketQua.diem_to_hop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Điểm ưu tiên đối tượng:</span>
                    <span className="font-semibold">{ketQua.diem_uu_tien_doi_tuong}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Điểm ưu tiên khu vực:</span>
                    <span className="font-semibold">{ketQua.diem_uu_tien_khu_vuc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tổng điểm ưu tiên:</span>
                    <span className="font-semibold">{ketQua.tong_diem_uu_tien}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">Tổng điểm xét tuyển:</span>
                      <span className="font-bold text-2xl text-blue-600">{ketQua.tong_diem_xet_tuyen}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quy định bên phải */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Quy định cộng điểm ưu tiên:</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <p className="mb-2">
                    <strong>Quy định 1:</strong> Nếu tổng điểm đạt được theo tổ hợp môn nhỏ hơn 22.5 (khi quy đổi về điểm theo thang 10 và tổng điểm 3 môn tối đa là 30) thì cộng điểm ưu tiên theo khu vực, đối tượng chính sách theo mức thông thường.
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Quy định 2:</strong> Nếu tổng điểm từ 22.5 điểm trở lên (khi quy đổi về điểm theo thang 10 và tổng điểm 3 môn tối đa là 30) thì cộng điểm ưu tiên theo công thức sau:
                  </p>
                  <p className="mt-2 italic text-gray-600">
                    Điểm ưu tiên = [(30 - Tổng điểm đạt được)/7.5] x Tổng điểm ưu tiên được xác định thông thường
                  </p>
                </div>
                {quyDinh && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Áp dụng theo: {quyDinh.ten_quy_dinh} ({quyDinh.nam_ap_dung})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

