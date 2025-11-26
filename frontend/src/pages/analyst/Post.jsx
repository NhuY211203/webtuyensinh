import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Filter states
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterLoaiTin, setFilterLoaiTin] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  
  // Dropdown data
  const [universities, setUniversities] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    id_truong: "",
    tieu_de: "",
    tom_tat: "",
    hinh_anh_dai_dien: "",
    nguon_bai_viet: "",
    loai_tin: "Tin tuyển sinh",
    muc_do_uu_tien: 0,
    trang_thai: "Chờ duyệt",
    ngay_het_han: "",
    ma_nguon: ""
  });
  const [fileHinhAnh, setFileHinhAnh] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Load universities for dropdown
  const loadUniversities = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/truongdaihoc?per_page=1000&page=1');
      const data = await response.json();
      if (data.success) {
        setUniversities(data.data);
      }
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  // Load posts data
  const loadPosts = async (page = 1, keyword = "", id_truong = "", loai_tin = "", trang_thai = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
      });
      
      if (keyword) params.append('keyword', keyword);
      if (id_truong) params.append('id_truong', id_truong);
      if (loai_tin) params.append('loai_tin', loai_tin);
      if (trang_thai) params.append('trang_thai', trang_thai);
      
      const response = await fetch(`http://localhost:8000/api/admin/tin-tuyen-sinh?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data || []);
        setTotalPages(data.pagination.last_page || 1);
        setTotalRecords(data.pagination.total || 0);
        setCurrentPage(data.pagination.current_page || 1);
      } else {
        showToast(data.message || "Lỗi khi tải dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    loadUniversities();
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPosts(1, searchTerm, filterUniversity, filterLoaiTin, filterTrangThai);
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterUniversity, filterLoaiTin, filterTrangThai]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        id_truong: item.id_truong || "",
        tieu_de: item.tieu_de || "",
        tom_tat: item.tom_tat || "",
        hinh_anh_dai_dien: item.hinh_anh_dai_dien || "",
        nguon_bai_viet: item.nguon_bai_viet || "",
        loai_tin: item.loai_tin || "Tin tuyển sinh",
        muc_do_uu_tien: item.muc_do_uu_tien || 0,
        trang_thai: item.trang_thai || "Chờ duyệt",
        ngay_het_han: item.ngay_het_han ? item.ngay_het_han.split(' ')[0] : "",
        ma_nguon: item.ma_nguon || ""
      });
      setFileHinhAnh(null);
    } else {
      setEditingItem(null);
      setFormData({
        id_truong: "",
        tieu_de: "",
        tom_tat: "",
        hinh_anh_dai_dien: "",
        nguon_bai_viet: "",
        loai_tin: "Tin tuyển sinh",
        muc_do_uu_tien: 0,
        trang_thai: "Chờ duyệt",
        ngay_het_han: "",
        ma_nguon: ""
      });
      setFileHinhAnh(null);
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const url = editingItem 
        ? `http://localhost:8000/api/admin/tin-tuyen-sinh/${editingItem.id_tin}`
        : 'http://localhost:8000/api/admin/tin-tuyen-sinh';
      
      const method = editingItem ? 'PUT' : 'POST';

      // Build multipart/form-data for Cloudinary upload support
      const fd = new FormData();
      fd.append('id_truong', formData.id_truong || '');
      fd.append('tieu_de', formData.tieu_de || '');
      fd.append('tom_tat', formData.tom_tat || '');
      fd.append('nguon_bai_viet', formData.nguon_bai_viet || '');
      fd.append('loai_tin', formData.loai_tin || 'Tin tuyển sinh');
      fd.append('muc_do_uu_tien', formData.muc_do_uu_tien ?? 0);
      fd.append('trang_thai', formData.trang_thai || 'Chờ duyệt');
      fd.append('ngay_het_han', formData.ngay_het_han || '');
      fd.append('ma_nguon', formData.ma_nguon || '');

      if (fileHinhAnh) {
        fd.append('file_hinh_anh', fileHinhAnh);
      } else if (formData.hinh_anh_dai_dien) {
        fd.append('hinh_anh_dai_dien', formData.hinh_anh_dai_dien);
      }

      const response = await fetch(url, {
        method,
        body: fd,
      });

      const data = await response.json();

      if (data.success) {
        showToast(editingItem ? "Cập nhật tin thành công" : "Thêm tin thành công", "success");
        handleCloseModal();
        loadPosts(currentPage, searchTerm, filterUniversity, filterLoaiTin, filterTrangThai);
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        }
        showToast(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/tin-tuyen-sinh/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast("Xóa tin thành công", "success");
        setShowDeleteModal(false);
        setDeleteId(null);
        loadPosts(currentPage, searchTerm, filterUniversity, filterLoaiTin, filterTrangThai);
      } else {
        showToast(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý tin tuyển sinh</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Thêm tin mới
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mô tả..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input"
            value={filterUniversity}
            onChange={(e) => setFilterUniversity(e.target.value)}
          >
            <option value="">Tất cả trường</option>
            {universities.map((u) => (
              <option key={u.idtruong} value={u.idtruong}>
                {u.tentruong}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filterLoaiTin}
            onChange={(e) => setFilterLoaiTin(e.target.value)}
          >
            <option value="">Tất cả loại tin</option>
            <option value="Tin tuyển sinh">Tin tuyển sinh</option>
            <option value="Thông báo">Thông báo</option>
            <option value="Học bổng">Học bổng</option>
            <option value="Sự kiện">Sự kiện</option>
            <option value="Khác">Khác</option>
          </select>
          <select
            className="input"
            value={filterTrangThai}
            onChange={(e) => setFilterTrangThai(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Ẩn">Ẩn</option>
            <option value="Đã gỡ">Đã gỡ</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button
            className="btn-outline"
            onClick={() => {
              setSearchTerm("");
              setFilterUniversity("");
              setFilterLoaiTin("");
              setFilterTrangThai("");
              loadPosts(1);
            }}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tiêu đề</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trường</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Loại tin</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ngày đăng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id_tin} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{post.id_tin}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{post.tieu_de}</div>
                          {post.tom_tat && (
                            <div className="text-sm text-gray-500 line-clamp-1">{post.tom_tat}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{post.tentruong || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {post.loai_tin}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.trang_thai === 'Đã duyệt' ? 'bg-green-100 text-green-800' :
                            post.trang_thai === 'Chờ duyệt' ? 'bg-yellow-100 text-yellow-800' :
                            post.trang_thai === 'Ẩn' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {post.trang_thai}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(post.ngay_dang)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(post)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(post.id_tin);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalRecords)} trong tổng {totalRecords} tin
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPosts(currentPage - 1, searchTerm, filterUniversity, filterLoaiTin, filterTrangThai)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadPosts(currentPage + 1, searchTerm, filterUniversity, filterLoaiTin, filterTrangThai)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={handleCloseModal} title={editingItem ? "Cập nhật tin" : "Thêm tin mới"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
              <input
                type="text"
                className={`input ${formErrors.tieu_de ? 'border-red-500' : ''}`}
                value={formData.tieu_de}
                onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                required
              />
              {formErrors.tieu_de && (
                <p className="text-red-500 text-xs mt-1">{formErrors.tieu_de[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
              <textarea
                className="input min-h-[100px]"
                value={formData.tom_tat}
                onChange={(e) => setFormData({ ...formData, tom_tat: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trường</label>
                <select
                  className="input"
                  value={formData.id_truong}
                  onChange={(e) => setFormData({ ...formData, id_truong: e.target.value })}
                >
                  <option value="">Chọn trường</option>
                  {universities.map((u) => (
                    <option key={u.idtruong} value={u.idtruong}>
                      {u.tentruong}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Loại tin *</label>
                <select
                  className="input"
                  value={formData.loai_tin}
                  onChange={(e) => setFormData({ ...formData, loai_tin: e.target.value })}
                  required
                >
                  <option value="Tin tuyển sinh">Tin tuyển sinh</option>
                  <option value="Thông báo">Thông báo</option>
                  <option value="Học bổng">Học bổng</option>
                  <option value="Sự kiện">Sự kiện</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Link nguồn bài viết</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.nguon_bai_viet}
                  onChange={(e) => setFormData({ ...formData, nguon_bai_viet: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hình ảnh đại diện</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => setFileHinhAnh(e.target.files?.[0] || null)}
                  />
                  <input
                    type="url"
                    className="input"
                    placeholder="https://... (nếu không chọn file)"
                    value={formData.hinh_anh_dai_dien}
                    onChange={(e) => setFormData({ ...formData, hinh_anh_dai_dien: e.target.value })}
                  />
                  {(fileHinhAnh) && (
                    <img
                      src={URL.createObjectURL(fileHinhAnh)}
                      alt="preview"
                      style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mức độ ưu tiên</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  value={formData.muc_do_uu_tien}
                  onChange={(e) => setFormData({ ...formData, muc_do_uu_tien: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  className="input"
                  value={formData.trang_thai}
                  onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                >
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Đã duyệt">Đã duyệt</option>
                  <option value="Ẩn">Ẩn</option>
                  <option value="Đã gỡ">Đã gỡ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                <input
                  type="date"
                  className="input"
                  value={formData.ngay_het_han}
                  onChange={(e) => setFormData({ ...formData, ngay_het_han: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mã nguồn</label>
              <input
                type="text"
                className="input"
                placeholder="VD: DNU, FPT-HN, UEH"
                value={formData.ma_nguon}
                onChange={(e) => setFormData({ ...formData, ma_nguon: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="btn-outline">
                Hủy
              </button>
              <button type="submit" className="btn-primary">
                {editingItem ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteId(null); }} title="Xác nhận xóa">
          <p className="mb-4">Bạn có chắc chắn muốn xóa tin này không?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
              className="btn-outline"
            >
              Hủy
            </button>
            <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700">
              Xóa
            </button>
          </div>
      </Modal>

      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
