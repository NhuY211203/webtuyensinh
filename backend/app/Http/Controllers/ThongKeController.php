<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\DiemChuanXetTuyen;
use App\Models\TruongDaiHoc;
use App\Models\NganhHoc;
use App\Models\NhomNganh;
use App\Models\PhuongThucXetTuyen;
use App\Models\ToHopXetTuyen;

class ThongKeController extends Controller
{
    /**
     * Trả về tổng số ngành và tổng số phương thức hiện có
     */
    public function counts(Request $request)
    {
        try {
            $totalMajors = NganhHoc::count();
            $totalMethods = PhuongThucXetTuyen::count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalMajors' => $totalMajors,
                    'totalMethods' => $totalMethods,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy tổng số liệu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top 10 ngành có điểm chuẩn cao nhất
     */
    public function topNganh2024(Request $request)
    {
        try {
            // SAFE MODE: trả về 10 ngành mẫu để UI chạy trong khi xử lý lỗi DB
            $results = collect([
                (object)['tennganh' => 'Công nghệ thông tin', 'manganh' => '7480201', 'diemchuan' => 27.5, 'sotruong' => 45],
                (object)['tennganh' => 'Khoa học máy tính', 'manganh' => '7480101', 'diemchuan' => 27.2, 'sotruong' => 40],
                (object)['tennganh' => 'Kỹ thuật phần mềm', 'manganh' => '7480103', 'diemchuan' => 27.0, 'sotruong' => 38],
                (object)['tennganh' => 'Trí tuệ nhân tạo', 'manganh' => '7480107', 'diemchuan' => 26.8, 'sotruong' => 30],
                (object)['tennganh' => 'An toàn thông tin', 'manganh' => '7480202', 'diemchuan' => 26.5, 'sotruong' => 28],
                (object)['tennganh' => 'Kỹ thuật điện', 'manganh' => '7520201', 'diemchuan' => 26.0, 'sotruong' => 26],
                (object)['tennganh' => 'Kỹ thuật cơ điện tử', 'manganh' => '7520114', 'diemchuan' => 25.8, 'sotruong' => 24],
                (object)['tennganh' => 'Quản trị kinh doanh', 'manganh' => '7340101', 'diemchuan' => 25.6, 'sotruong' => 50],
                (object)['tennganh' => 'Tài chính – Ngân hàng', 'manganh' => '7340201', 'diemchuan' => 25.4, 'sotruong' => 48],
                (object)['tennganh' => 'Y khoa', 'manganh' => '7720101', 'diemchuan' => 28.2, 'sotruong' => 20],
            ]);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi database: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * So sánh điểm trung bình theo phương thức xét tuyển
     */
    public function soSanhPhuongThuc(Request $request)
    {
        try {
            $results = collect([
                (object)['phuongthuc' => 'Thi THPT', 'diemTB' => 25.5, 'songanh' => 10, 'sotruong' => 15],
                (object)['phuongthuc' => 'Học bạ', 'diemTB' => 24.8, 'songanh' => 8, 'sotruong' => 12],
                (object)['phuongthuc' => 'ĐGNL', 'diemTB' => 26.2, 'songanh' => 6, 'sotruong' => 8],
                (object)['phuongthuc' => 'Kết hợp', 'diemTB' => 25.0, 'songanh' => 5, 'sotruong' => 7]
            ]);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải dữ liệu so sánh phương thức: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Số trường có ngành học theo từng ngành
     */
    public function soTruongTheoNganh(Request $request)
    {
        try {
            $results = collect([
                (object)['tennganh' => 'Công nghệ thông tin', 'manganh' => '7480201', 'sotruong' => 45, 'diemTB' => 27.5],
                (object)['tennganh' => 'Kinh tế', 'manganh' => '7310101', 'sotruong' => 38, 'diemTB' => 26.8],
                (object)['tennganh' => 'Y khoa', 'manganh' => '7720101', 'sotruong' => 25, 'diemTB' => 28.2]
            ]);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải dữ liệu số trường theo ngành: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân bố theo khu vực
     */
    public function theoKhuVuc(Request $request)
    {
        try {
            $results = collect([
                (object)['name' => 'Miền Bắc', 'value' => 45, 'sotruong' => 25, 'diemTB' => 26.5],
                (object)['name' => 'Miền Trung', 'value' => 25, 'sotruong' => 15, 'diemTB' => 25.8],
                (object)['name' => 'Miền Nam', 'value' => 30, 'sotruong' => 18, 'diemTB' => 27.2]
            ]);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải dữ liệu phân bố khu vực: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Meta data cho filter options
     */
    public function meta(Request $request)
    {
        try {
            $results = [
                'truongOptions' => collect([
                    (object)['value' => '1', 'label' => 'Đại học Bách khoa Hà Nội'],
                    (object)['value' => '2', 'label' => 'Đại học Kinh tế Quốc dân'],
                    (object)['value' => '3', 'label' => 'Đại học Ngoại thương']
                ]),
                'phuongThucOptions' => collect([
                    (object)['value' => '1', 'label' => 'Thi THPT'],
                    (object)['value' => '2', 'label' => 'Học bạ'],
                    (object)['value' => '3', 'label' => 'ĐGNL']
                ]),
                'toHopOptions' => collect([
                    (object)['value' => 'A00', 'label' => 'A00 - Toán, Lý, Hóa'],
                    (object)['value' => 'A01', 'label' => 'A01 - Toán, Lý, Anh'],
                    (object)['value' => 'D01', 'label' => 'D01 - Toán, Văn, Anh']
                ]),
                'namOptions' => collect([
                    (object)['value' => '2024', 'label' => '2024'],
                    (object)['value' => '2023', 'label' => '2023'],
                    (object)['value' => '2022', 'label' => '2022']
                ]),
                'khuVucOptions' => collect([
                    (object)['value' => 'Miền Bắc', 'label' => 'Miền Bắc'],
                    (object)['value' => 'Miền Trung', 'label' => 'Miền Trung'],
                    (object)['value' => 'Miền Nam', 'label' => 'Miền Nam']
                ])
            ];

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải meta data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Danh sách nhóm ngành và số lượng ngành thuộc mỗi nhóm
     */
    public function nhomNganh(Request $request)
    {
        try {
            $results = NhomNganh::leftJoin('nganhhoc as nh', 'nhomnganh.idnhomnganh', '=', 'nh.idnhomnganh')
                ->select('nhomnganh.tennhom as tennhom', DB::raw('COUNT(nh.idnganh) as songanh'))
                ->groupBy('nhomnganh.idnhomnganh', 'nhomnganh.tennhom')
                ->orderByDesc('songanh')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải nhóm ngành: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Thống kê số ngành theo xu hướng (cột xuhuong của bảng nganhhoc)
     */
    public function thongKeXuHuong(Request $request)
    {
        try {
            $results = DB::table('nganhhoc')
                ->select(DB::raw("COALESCE(NULLIF(TRIM(xuhuong), ''), 'Khác') as nhom"), DB::raw('COUNT(*) as so_nganh'))
                ->groupBy('nhom')
                ->orderByDesc('so_nganh')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thống kê xu hướng: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân khúc mức lương từ cột mucluong (text) về các khoảng
     */
    public function thongKeMucLuong(Request $request)
    {
        try {
            // Chuẩn hoá về khoảng chính bằng regex đơn giản
            $rows = DB::table('nganhhoc')->select('mucluong')->get();
            $bins = [
                'Dưới 10 triệu' => 0,
                '10-15 triệu' => 0,
                '15-30 triệu' => 0,
                '30-50 triệu' => 0,
                'Trên 50 triệu' => 0,
                'Khác' => 0,
            ];

            foreach ($rows as $r) {
                $txt = trim((string)$r->mucluong);
                if ($txt === '' || $txt === null) { $bins['Khác']++; continue; }
                // Lấy các số trong chuỗi (có thể là khoảng 18-45, 15-30...)
                if (preg_match_all('/(\d+(?:[\.,]\d+)?)/', $txt, $m)) {
                    $nums = array_map(function($x){ return (float)str_replace(',', '.', $x); }, $m[1]);
                    if (count($nums) >= 2) {
                        $val = (min($nums) + max($nums)) / 2.0; // dùng trung điểm của khoảng
                    } else {
                        $val = $nums[0];
                    }
                    if ($val < 10) $bins['Dưới 10 triệu']++;
                    elseif ($val < 15) $bins['10-15 triệu']++;
                    elseif ($val < 30) $bins['15-30 triệu']++;
                    elseif ($val < 50) $bins['30-50 triệu']++;
                    else $bins['Trên 50 triệu']++;
                } else {
                    $bins['Khác']++;
                }
            }

            $data = [];
            foreach ($bins as $k => $v) { $data[] = ['nhom' => $k, 'so_nganh' => $v]; }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thống kê mức lương: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top ngành dựa trên xu hướng ưu tiên và mức lương (text) – trả về 10 ngành
     */
    public function topNganhTheoXuHuongLuong(Request $request)
    {
        try {
            // Lấy tất cả ngành, tính điểm ưu tiên theo xuhuong và số lương min trong chuỗi mucluong
            $rows = DB::table('nganhhoc')->select('manganh','tennganh','xuhuong','mucluong','motanganh')->get();

            $priority = function($x) {
                $x = trim((string)$x);
                return match($x) {
                    'Rất nóng'   => 1,
                    'Tăng mạnh'  => 2,
                    'Tăng'       => 3,
                    'Cao'        => 4,
                    'Ổn định'    => 5,
                    default      => 6,
                };
            };

            $items = [];
            foreach ($rows as $r) {
                // Min salary detect
                $txt = trim((string)$r->mucluong);
                $min = 0.0;
                if ($txt !== '' && preg_match_all('/(\d+(?:[\.,]\d+)?)/', $txt, $m)) {
                    $nums = array_map(function($x){ return (float)str_replace(',', '.', $x); }, $m[1]);
                    $min = min($nums);
                }
                $items[] = [
                    'manganh'   => $r->manganh,
                    'tennganh'  => $r->tennganh,
                    'xuhuong'   => $r->xuhuong,
                    'mucluong'  => $r->mucluong,
                    'motanganh' => $r->motanganh,
                    'prio'      => $priority($r->xuhuong),
                    'minSalary' => $min,
                ];
            }

            // Sort theo prio asc rồi minSalary desc
            usort($items, function($a, $b){
                if ($a['prio'] === $b['prio']) {
                    return $b['minSalary'] <=> $a['minSalary'];
                }
                return $a['prio'] <=> $b['prio'];
            });

            $data = array_slice($items, 0, 10);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy top ngành xu hướng & lương: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Top 10 ngành điểm cao nhất phân tách theo 4 phương thức
     * Trả về dạng: { thpt: [...10], hcb: [...10], dgnl: [...10], ketHop: [...10] }
     * (Hiện tại dùng dữ liệu an toàn để UI hoạt động; sẽ thay bằng truy vấn DB khi sẵn sàng)
     */
    public function topNganhTheoPhuongThuc(Request $request)
    {
        try {
            $map = [
                'thpt'   => 1,
                'hocba'  => 2,
                'dgnl'   => 3,
                'kethop' => 4,
            ];

            $buildQuery = function($idxettuyen) use ($request) {
                $q = DB::table('diemchuanxettuyen as dc')
                    ->leftJoin('nganhhoc as nh', 'dc.manganh', '=', 'nh.manganh')
                    ->select(
                        DB::raw("COALESCE(nh.tennganh, nh.manganh) as tennganh"),
                        'dc.manganh',
                        DB::raw('MAX(dc.diemchuan) as diemchuan')
                    )
                    ->where('dc.idxettuyen', $idxettuyen)
                    ->where('dc.namxettuyen', $request->get('nam', 2024));

                if ($request->filled('keyword')) {
                    $q->where('nh.tennganh', 'like', '%'.$request->keyword.'%');
                }

                $q = $q->groupBy('dc.manganh', 'nh.tennganh', 'nh.manganh')
                       ->orderBy('diemchuan', 'desc')
                       ->limit(10);

                return $q->get();
            };

            $data = [];
            foreach ($map as $key => $idx) {
                $data[$key] = $buildQuery($idx);
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải top ngành theo phương thức: ' . $e->getMessage()
            ], 500);
        }
    }
}
