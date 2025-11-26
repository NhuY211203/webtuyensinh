import { useState, useEffect } from "react";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLoaiTin, setFilterLoaiTin] = useState("");
  const [filterTruong, setFilterTruong] = useState("");
  const [universities, setUniversities] = useState([]);

  // Load news
  const loadNews = async (page = 1, keyword = "", loai_tin = "", id_truong = "", per_page = 12) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
      });
      
      if (keyword) params.append('keyword', keyword);
      if (loai_tin) params.append('loai_tin', loai_tin);
      if (id_truong) params.append('id_truong', id_truong);
      
      const url = `/api/tin-tuyen-sinh?${params}`;
      const response = await fetch(url).catch((err) => {
        return fetch(`http://localhost:8000/api/tin-tuyen-sinh?${params}`);
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNews(data.data || []);
        setTotalPages(data.pagination?.last_page || 1);
        setTotalRecords(data.pagination?.total || 0);
        setCurrentPage(data.pagination?.current_page || 1);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Load universities for filter
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const url = '/api/admin/truongdaihoc?per_page=1000&page=1';
        const response = await fetch(url).catch(() => 
          fetch('http://localhost:8000/api/admin/truongdaihoc?per_page=1000&page=1')
        );
        const data = await response.json();
        if (data.success) {
          setUniversities(data.data);
        }
      } catch (error) {
        console.error('Error loading universities:', error);
      }
    };
    loadUniversities();
  }, []);

  // Load news on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadNews(1, searchTerm, filterLoaiTin, filterTruong, perPage);
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterLoaiTin, filterTruong, perPage]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getLoaiTinColor = (loaiTin) => {
    const colors = {
      'Tin tuyển sinh': 'bg-teal-100 text-teal-800 border-teal-200',
      'Thông báo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Học bổng': 'bg-amber-100 text-amber-800 border-amber-200',
      'Sự kiện': 'bg-purple-100 text-purple-800 border-purple-200',
      'Khác': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[loaiTin] || colors['Khác'];
  };

  // Check if news is expiring soon (within 7 days)
  const isExpiringSoon = (ngayHetHan) => {
    if (!ngayHetHan) return false;
    const expiry = new Date(ngayHetHan);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  // Get optimized image URL
  const getImageUrl = (item) => {
    if (!item.hinh_anh_dai_dien) return null;
    
    // If it's already a full URL (Cloudinary or external), return as is
    if (item.hinh_anh_dai_dien.startsWith('http')) {
      // If Cloudinary URL and has public_id, optimize it
      if (item.hinh_anh_public_id && item.hinh_anh_dai_dien.includes('cloudinary.com')) {
        // Extract cloud name and public_id
        const cloudName = item.hinh_anh_dai_dien.match(/res\.cloudinary\.com\/([^\/]+)/)?.[1];
        if (cloudName) {
          return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,dpr_auto,w_480,h_270,c_fill,g_auto/${item.hinh_anh_public_id}`;
        }
      }
      return item.hinh_anh_dai_dien;
    }
    
    // Local storage - convert to full URL
    return `http://localhost:8000${item.hinh_anh_dai_dien}`;
  };

  const handlePageChange = (newPage) => {
    loadNews(newPage, searchTerm, filterLoaiTin, filterTruong, perPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterLoaiTin("");
    setFilterTruong("");
    loadNews(1, "", "", "", perPage);
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="rounded-2xl border border-neutral-200 shadow-sm h-[360px] overflow-hidden">
      <div className="aspect-[16/9] w-full bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-9 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Tin tức tuyển sinh
          </h1>
          <p className="text-white/90 text-sm md:text-base mt-1">
            Cập nhật thông tin tuyển sinh mới nhất từ các trường đại học
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Filter Bar - Floating Card */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm kiếm tin tức"
              />
            </div>

            {/* Loại tin */}
            <select
              className="px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              value={filterLoaiTin}
              onChange={(e) => setFilterLoaiTin(e.target.value)}
              aria-label="Chọn loại tin"
            >
              <option value="">Tất cả loại tin</option>
              <option value="Tin tuyển sinh">Tin tuyển sinh</option>
              <option value="Thông báo">Thông báo</option>
              <option value="Học bổng">Học bổng</option>
              <option value="Sự kiện">Sự kiện</option>
              <option value="Khác">Khác</option>
            </select>

            {/* Trường */}
            <select
              className="px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              value={filterTruong}
              onChange={(e) => setFilterTruong(e.target.value)}
              aria-label="Chọn trường"
            >
              <option value="">Tất cả trường</option>
              {universities.map((u) => (
                <option key={u.idtruong} value={u.idtruong}>
                  {u.tentruong}
                </option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-neutral-200 rounded-xl hover:bg-gray-50 transition-colors flex-1"
                aria-label="Làm mới bộ lọc"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>

          {/* Results count & Per page */}
          {!loading && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
              <span className="text-sm text-gray-600">
                {totalRecords > 0 ? `${totalRecords} kết quả` : 'Không có kết quả'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Hiển thị:</span>
                <select
                  className="px-2 py-1 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-gray-500 text-lg mb-4">Không có tin phù hợp</p>
            {(searchTerm || filterLoaiTin || filterTruong) && (
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              {news.map((item) => {
                const imageUrl = getImageUrl(item);
                const expiringSoon = isExpiringSoon(item.ngay_het_han);
                
                return (
                  <div
                    key={item.id_tin}
                    className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all h-[360px] flex flex-col overflow-hidden focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${item.tieu_de} - ${item.tentruong || ''}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                        <span className="text-gray-400 text-4xl">📷</span>
                      </div>
                      
                      {/* Expiring badge */}
                      {expiringSoon && (
                        <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs text-white font-medium">
                          Sắp hết hạn
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getLoaiTinColor(item.loai_tin)}`}>
                          {item.loai_tin}
                        </span>
                        {item.tentruong && (
                          <span className="text-xs text-gray-500 truncate">• {item.tentruong}</span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-base font-medium mb-2 flex-1">
                        {item.tieu_de}
                      </h3>

                      {item.tom_tat && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.tom_tat}
                        </p>
                      )}

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(item.ngay_dang)}</span>
                          {item.ngay_het_han && (
                            <span className="text-orange-600">
                              Hết hạn: {formatDate(item.ngay_het_han)}
                            </span>
                          )}
                        </div>

                        {item.nguon_bai_viet ? (
                          <a
                            href={item.nguon_bai_viet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-2 bg-teal-600 text-white text-sm text-center rounded-xl hover:bg-teal-700 transition-colors hover:translate-y-0.5 hover:shadow-md"
                          >
                            Xem chi tiết →
                          </a>
                        ) : (
                          <div className="w-full px-4 py-2 bg-gray-100 text-gray-400 text-sm text-center rounded-xl">
                            Không có link
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  aria-label="Trang trước"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  aria-label="Trang sau"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
