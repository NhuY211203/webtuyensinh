const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Tạo error object với thông tin chi tiết
        const error = new Error(data.message || 'Có lỗi xảy ra');
        error.response = { data, status: response.status };
        console.error('API Error Details:', {
          message: data.message,
          errors: data.errors,
          debug: data.debug,
          status: response.status
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Catalog helpers
  async getSchools(params = {}) {
    return this.get('/truongdaihoc', params);
  }

  // Admission project APIs
  async getAdmissionProjects(params = {}) {
    return this.get('/de-an-tuyen-sinh', params);
  }

  async getAdmissionProjectDetail(id) {
    return this.get(`/de-an-tuyen-sinh/${id}`);
  }

  async createAdmissionProject(data) {
    return this.post('/de-an-tuyen-sinh', data);
  }

  async updateAdmissionProject(id, data) {
    return this.put(`/de-an-tuyen-sinh/${id}`, data);
  }

  async deleteAdmissionProject(id) {
    return this.delete(`/de-an-tuyen-sinh/${id}`);
  }

  async getAdmissionMethods(params = {}) {
    return this.get('/phuong-thuc-tuyen-sinh', params);
  }

  async getAdmissionMethodDetail(id) {
    return this.get(`/phuong-thuc-tuyen-sinh/${id}`);
  }

  // University majors (nganh_truong)
  async getUniversityMajors(params = {}) {
    return this.get('/nganh-truong', params);
  }

  // Method majors (nganh_theo_phuong_thuc)
  async getMethodMajors(methodId, params = {}) {
    return this.get('/nganh-theo-phuong-thuc', {
      idphuong_thuc_chi_tiet: methodId,
      ...params,
    });
  }

  async createMethodMajor(data) {
    return this.post('/nganh-theo-phuong-thuc', data);
  }

  async updateMethodMajor(id, data) {
    return this.put(`/nganh-theo-phuong-thuc/${id}`, data);
  }

  async deleteMethodMajor(id) {
    return this.delete(`/nganh-theo-phuong-thuc/${id}`);
  }

  // Subject combos (tohop_xettuyen)
  async getSubjectCombos(params = {}) {
    return this.get('/tohop-xettuyen', params);
  }

  // Ho so xet tuyen cho tung phuong thuc (ho_so_xet_tuyen)
  async getMethodDocuments(params = {}) {
    return this.get('/ho-so-xet-tuyen', params);
  }

  async createMethodDocument(data) {
    return this.post('/ho-so-xet-tuyen', data);
  }

  async updateMethodDocument(id, data) {
    return this.put(`/ho-so-xet-tuyen/${id}`, data);
  }

  async deleteMethodDocument(id) {
    return this.delete(`/ho-so-xet-tuyen/${id}`);
  }

  // Bang quy doi diem ngoai ngu (bang_quy_doi_diem_ngoai_ngu)
  async getLanguageConversions(params = {}) {
    return this.get('/bang-quy-doi-diem-ngoai-ngu', params);
  }

  async createLanguageConversion(data) {
    return this.post('/bang-quy-doi-diem-ngoai-ngu', data);
  }

  async updateLanguageConversion(id, data) {
    return this.put(`/bang-quy-doi-diem-ngoai-ngu/${id}`, data);
  }

  async deleteLanguageConversion(id) {
    return this.delete(`/bang-quy-doi-diem-ngoai-ngu/${id}`);
  }

  // Quy dinh diem uu tien de an (quy_dinh_diem_uu_tien_de_an)
  async getMethodPriorityRules(params = {}) {
    return this.get('/quy-dinh-diem-uu-tien-de-an', params);
  }

  async saveMethodPriorityRule(data) {
    // Bảng này thường chỉ có 1 dòng / phương thức, dùng POST hoặc PUT tùy có id
    if (data.idquy_dinh_de_an) {
      const id = data.idquy_dinh_de_an;
      const payload = { ...data };
      delete payload.idquy_dinh_de_an;
      return this.put(`/quy-dinh-diem-uu-tien-de-an/${id}`, payload);
    }
    return this.post('/quy-dinh-diem-uu-tien-de-an', data);
  }

  async deleteMethodPriorityRule(id) {
    return this.delete(`/quy-dinh-diem-uu-tien-de-an/${id}`);
  }

  // Xet tuyen thang (xet_tuyen_thang)
  async getDirectAdmissions(params = {}) {
    return this.get('/xet-tuyen-thang', params);
  }

  async createDirectAdmission(data) {
    return this.post('/xet-tuyen-thang', data);
  }

  async updateDirectAdmission(id, data) {
    return this.put(`/xet-tuyen-thang/${id}`, data);
  }

  async deleteDirectAdmission(id) {
    return this.delete(`/xet-tuyen-thang/${id}`);
  }

  // Thong tin bo sung phuong thuc (thong_tin_bo_sung_phuong_thuc)
  async getMethodExtraInfos(params = {}) {
    return this.get('/thong-tin-bo-sung-phuong-thuc', params);
  }

  async createMethodExtraInfo(data) {
    return this.post('/thong-tin-bo-sung-phuong-thuc', data);
  }

  async updateMethodExtraInfo(id, data) {
    return this.put(`/thong-tin-bo-sung-phuong-thuc/${id}`, data);
  }

  async deleteMethodExtraInfo(id) {
    return this.delete(`/thong-tin-bo-sung-phuong-thuc/${id}`);
  }

  // Admission project methods (phuong_thuc_tuyen_sinh_chi_tiet)
  async getProjectMethods(projectId) {
    return this.get('/phuong-thuc-tuyen-sinh', { idde_an: projectId });
  }

  async createProjectMethod(data) {
    return this.post('/phuong-thuc-tuyen-sinh', data);
  }

  async updateProjectMethod(id, data) {
    return this.put(`/phuong-thuc-tuyen-sinh/${id}`, data);
  }

  async deleteProjectMethod(id) {
    return this.delete(`/phuong-thuc-tuyen-sinh/${id}`);
  }

  // School introduction
  async getSchoolIntroduction(params = {}) {
    return this.get('/gioi-thieu-truong', params);
  }

  async createSchoolIntroduction(data) {
    return this.post('/gioi-thieu-truong', data);
  }

  async updateSchoolIntroduction(id, data) {
    return this.put(`/gioi-thieu-truong/${id}`, data);
  }

  async deleteSchoolIntroduction(id) {
    return this.delete(`/gioi-thieu-truong/${id}`);
  }

  // Consultant APIs
  async getConsultants(params = {}) {
    return this.get('/staff/consultants', params);
  }

  async getConsultantById(id) {
    return this.get(`/staff/consultants/${id}`);
  }

  async createConsultant(data) {
    return this.post('/staff/consultants', data);
  }

  async updateConsultant(id, data) {
    return this.put(`/staff/consultants/${id}`, data);
  }

  async deleteConsultant(id) {
    return this.delete(`/staff/consultants/${id}`);
  }

  async updateConsultantStatus(id, status) {
    return this.put(`/staff/consultants/${id}/status`, { status });
  }

  // Major Groups APIs
  async getMajorGroups() {
    // Use endpoint that includes consultant counts per group
    return this.get('/major-groups');
  }

  // Consultants by major group
  async getConsultantsByMajorGroup(groupId) {
    // Backend expects query param idnhomnganh
    return this.get('/consultants', { idnhomnganh: groupId });
  }

  // Available slots for a consultant - allow filtering by duyetlich (approval)
  async getAvailableSlots(consultantId, params = {}) {
    const query = {
      consultant_id: consultantId,
      duyetlich: 2, // only approved schedules
      status: 1,    // only available slots (server expects 'status')
      date_filter: 'future', // only future schedules
      ...params,
    };
    return this.get('/consultation-schedules', query);
  }

  // Consultants grouped by major
  async getConsultantsGroupedByMajor() {
    return this.get('/consultants-grouped');
  }

  // Consultation schedules for approval
  async getConsultationSchedulesForApproval(params = {}) {
    return this.get('/consultation-schedules-for-approval', params);
  }

  async approveConsultationSchedule(scheduleIds, action, note = '') {
    console.log('API service: approveConsultationSchedule called with:', { scheduleIds, action, note });
    try {
      // Get current user ID from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const approverId = currentUser.idnguoidung || currentUser.id || 34; // Fallback to 34
      console.log('API service: current user:', currentUser);
      console.log('API service: approver ID:', approverId);
      
      // If no user found, try to get from sessionStorage or use default
      if (!approverId || approverId === 34) {
        console.log('API service: No valid user ID found, using default');
      }
      
      const requestData = {
        scheduleIds,
        action,
        note,
        approverId
      };
      console.log('API service: sending request data:', requestData);
      const result = await this.post('/consultation-schedules/approve', requestData);
      console.log('API service: response received:', result);
      return result;
    } catch (error) {
      console.error('API service: error occurred:', error);
      throw error;
    }
  }

  // Booking/Payment: create a booking for a consultation schedule
  // Payload shape is determined by caller; this function forwards to backend
  async bookConsultationSchedule(bookingData = {}) {
    // Backend route: POST /consultation-schedules/{id}/book
    const scheduleId = bookingData.scheduleId ?? bookingData.idlichtuvan;
    const payload = {
      user_id: bookingData.userId ?? bookingData.idnguoidat,
      // Backend chỉ cần user_id, các field khác sẽ được set tự động
    };
    return this.post(`/consultation-schedules/${scheduleId}/book`, payload);
  }

  // Get current user's booked appointments (status = 2)
  async getMyAppointments(params = {}) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.idnguoidung || user.id;
    const query = { user_id: userId, ...params };
    return this.get('/my-appointments', query);
  }

  // Ratings APIs for danhgia_lichtuvan
  async getScheduleRating(scheduleId) {
    return this.get('/ratings/by-schedule', { lichtuvan_id: scheduleId });
  }

  async getConsultantRating(consultantId) {
    return this.get('/ratings/by-consultant', { consultant_id: consultantId });
  }

   // Ratings for staff (bao gồm cả nhận xét đang ẩn)
  async getConsultantRatingForStaff(consultantId) {
    return this.get('/ratings/by-consultant', { consultant_id: consultantId, include_hidden: 1 });
  }

  // Consultation notes APIs
  async getConsultationNoteBySession(sessionId) {
    return this.get(`/consultation-notes/${sessionId}`);
  }

  async createScheduleRating(data) {
    // data: { idlichtuvan, idnguoidat, diemdanhgia, nhanxet, an_danh }
    return this.post('/ratings', data);
  }

  async updateScheduleRating(id, data) {
    return this.put(`/ratings/${id}`, data);
  }

  // Chat APIs
  async getChatContacts(consultantId) {
    return this.get('/chat/contacts', { consultant_id: consultantId });
  }

  async getOrCreateChatRoom(consultantId, userId, scheduleId) {
    const params = { consultant_id: consultantId, user_id: userId };
    if (scheduleId) params.schedule_id = scheduleId;
    return this.get('/chat/room', params);
  }

  async getChatMessagesByRoom(roomId, params = {}) {
    return this.get('/chat/messages', { room_id: roomId, ...params });
  }

  async sendChatMessageByRoom({ roomId, senderId, content }) {
    return this.post('/chat/messages', { room_id: roomId, sender_id: senderId, content });
  }

  // Notification APIs
  async sendNotification(notificationData) {
    return this.post('/notifications/send', notificationData);
  }

  async scheduleNotification(notificationData) {
    return this.post('/notifications/schedule', notificationData);
  }

  async getNotifications(params = {}) {
    return this.get('/notifications', params);
  }

  async getNotificationById(id) {
    return this.get(`/notifications/${id}`);
  }

  async updateNotificationStatus(id, status) {
    return this.put(`/notifications/${id}/status`, { status });
  }

  async getNotificationRecipients(notificationId, params = {}) {
    return this.get(`/notifications/${notificationId}/recipients`, params);
  }

  async getNotificationDetail(id) {
    return this.get(`/notifications/${id}`);
  }

  async openScheduleRegistration() {
    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.idnguoidung || user.id;
    
    console.log('openScheduleRegistration - user from localStorage:', user);
    console.log('openScheduleRegistration - userId:', userId);
    
    const body = {};
    if (userId) {
      body.user_id = userId;
    }
    
    console.log('openScheduleRegistration - request body:', body);
    
    return this.post('/notifications/open-schedule-registration', body);
  }

  async checkScheduleRegistrationStatus() {
    return this.get('/notifications/check-schedule-registration-status');
  }

  async getNotificationStats(params = {}) {
    return this.get('/notifications/stats', params);
  }

  // Get notifications for current user (consultants)
  async getMyNotifications(params = {}) {
    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.idnguoidung || user.id;
    
    if (userId) {
      params.user_id = userId;
    }
    
    return this.get('/notifications/my', params);
  }

  // Mark notification as read
  async markNotificationAsRead(id) {
    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.idnguoidung || user.id;
    
    return this.put(`/notifications/${id}/read`, { user_id: userId });
  }

  // Authentication APIs
  async login(email, password) {
    return this.post('/login', { email, matkhau: password });
  }

  async register(userData) {
    return this.post('/register', userData);
  }

  async getCareerTestQuestions() {
    return this.get('/career-test/questions');
  }

  async submitCareerTest(answers) {
    return this.post('/career-test/submit', { answers });
  }

  // Tin Tuyen Sinh (News) APIs
  async getNewsList(params = {}) {
    return this.get('/admin/tin-tuyen-sinh', params);
  }

  async getNewsById(id) {
    return this.get(`/admin/tin-tuyen-sinh/${id}`);
  }

  async createNews(data) {
    return this.post('/admin/tin-tuyen-sinh', data);
  }

  async updateNews(id, data) {
    return this.put(`/admin/tin-tuyen-sinh/${id}`, data);
  }

  async deleteNews(id) {
    return this.delete(`/admin/tin-tuyen-sinh/${id}`);
  }

  async approveNews(id, postData) {
    // Update status to "Đã duyệt"
    return this.updateNews(id, { ...postData, trang_thai: "Đã duyệt" });
  }

  async rejectNews(id, postData) {
    // Update status to "Đã gỡ"
    return this.updateNews(id, { ...postData, trang_thai: "Đã gỡ" });
  }

  async hideNews(id, postData) {
    // Update status to "Ẩn"
    return this.updateNews(id, { ...postData, trang_thai: "Ẩn" });
  }

  // Public news APIs (only approved news)
  async getPublicNewsList(params = {}) {
    return this.get('/tin-tuyen-sinh', params);
  }

  async getPublicNewsById(id) {
    return this.get(`/tin-tuyen-sinh/${id}`);
  }

  // User management APIs
  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userData) {
    return this.put('/users', userData);
  }

  async getRoles() {
    return this.get('/vaitro');
  }

  // Tính điểm xét học bạ APIs
  async getPhuongThucXetHocBa(params = {}) {
    return this.get('/tinh-diem-hoc-ba/phuong-thuc-xet-hoc-ba', params);
  }

  async getDoiTuongUuTien(params = {}) {
    return this.get('/tinh-diem-hoc-ba/doi-tuong-uu-tien', params);
  }

  async getKhuVucUuTien(params = {}) {
    return this.get('/tinh-diem-hoc-ba/khu-vuc-uu-tien', params);
  }

  async getMonHoc(params = {}) {
    return this.get('/tinh-diem-hoc-ba/mon-hoc', params);
  }

  async getQuyDinhDiemUuTien(params = {}) {
    return this.get('/tinh-diem-hoc-ba/quy-dinh-diem-uu-tien', params);
  }

  async getCauHinhMonNhanHeSo(params = {}) {
    return this.get('/tinh-diem-hoc-ba/cau-hinh-mon-nhan-he-so', params);
  }

  async getDiemHocBa(params = {}) {
    return this.get('/tinh-diem-hoc-ba/diem-hoc-ba', params);
  }

  async saveDiemHocBa(data) {
    return this.post('/tinh-diem-hoc-ba/diem-hoc-ba', data);
  }

  async tinhDiemHocBa(data) {
    return this.post('/tinh-diem-hoc-ba/tinh-diem', data);
  }

  async getKetQuaTinhDiem(params = {}) {
    return this.get('/tinh-diem-hoc-ba/ket-qua', params);
  }

  // Tính điểm tốt nghiệp THPT APIs
  async getMonThiTotNghiep(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/mon-thi-tot-nghiep', params);
  }

  async getMonHocTotNghiep(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/mon-hoc', params);
  }

  async getDiemThiTotNghiep(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/diem-thi-tot-nghiep', params);
  }

  async saveDiemThiTotNghiep(data) {
    return this.post('/tinh-diem-tot-nghiep/diem-thi-tot-nghiep', data);
  }

  async getDiemMonHocTotNghiep(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/diem-mon-hoc', params);
  }

  async saveDiemMonHocTotNghiep(data) {
    return this.post('/tinh-diem-tot-nghiep/diem-mon-hoc', data);
  }

  async getDiemKhuyenKhich(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/diem-khuyen-khich', params);
  }

  async saveDiemKhuyenKhich(data) {
    return this.post('/tinh-diem-tot-nghiep/diem-khuyen-khich', data);
  }

  async tinhDiemTotNghiep(data) {
    return this.post('/tinh-diem-tot-nghiep/tinh-diem', data);
  }

  async getKetQuaTinhDiemTotNghiep(params = {}) {
    return this.get('/tinh-diem-tot-nghiep/ket-qua', params);
  }
  // DGNL Exam Management
  async getDGNLExams(params = {}) {
    return this.get('/admin/dgnl-exams', params);
  }

  async getDGNLExamDetail(id) {
    return this.get(`/admin/dgnl-exams/${id}`);
  }

  async createDGNLExam(data) {
    return this.post('/admin/dgnl-exams', data);
  }

  async updateDGNLExam(id, data) {
    return this.put(`/admin/dgnl-exams/${id}`, data);
  }

  async deleteDGNLExam(id) {
    return this.delete(`/admin/dgnl-exams/${id}`);
  }

  async duplicateDGNLExam(id) {
    return this.post(`/admin/dgnl-exams/${id}/duplicate`);
  }

  async getDGNLExamStatistics(id) {
    return this.get(`/admin/dgnl-exams/${id}/statistics`);
  }

  async importDGNLExam(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idkythi', id);
    return this.request(`/admin/dgnl-exams/${id}/import`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  }

  async exportDGNLExam(id) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/admin/dgnl-exams/${id}/export`;
    const response = await fetch(url, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `DGNL_Export_${id}_${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async downloadDGNLTemplate() {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/admin/dgnl-exams/template`;
    const response = await fetch(url, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `DGNL_Import_Template_${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // DGNL Sections
  async getDGNLSections(idkythi) {
    return this.get(`/admin/dgnl-exams/${idkythi}/sections`);
  }

  async createDGNLSection(idkythi, data) {
    return this.post(`/admin/dgnl-exams/${idkythi}/sections`, data);
  }

  async updateDGNLSection(id, data) {
    return this.put(`/admin/dgnl-exams/sections/${id}`, data);
  }

  async deleteDGNLSection(id) {
    return this.delete(`/admin/dgnl-exams/sections/${id}`);
  }

  // DGNL Questions
  async getDGNLQuestions(idkythi, params = {}) {
    return this.get(`/admin/dgnl-exams/${idkythi}/questions`, params);
  }

  async getDGNLQuestionDetail(id) {
    return this.get(`/admin/dgnl-exams/questions/${id}`);
  }

  async createDGNLQuestion(idkythi, data) {
    return this.post(`/admin/dgnl-exams/${idkythi}/questions`, data);
  }

  // New split update endpoints
  async updateDGNLQuestionBasic(id, data) {
    return this.put(`/admin/dgnl-exams/questions/${id}/basic`, data);
  }
  async updateDGNLQuestionOptions(id, options) {
    return this.put(`/admin/dgnl-exams/questions/${id}/options`, { options });
  }

  // Old monolithic update (no longer used)
  async updateDGNLQuestion(id, data) {
    return this.put(`/admin/dgnl-exams/questions/${id}`, data);
  }

  async deleteDGNLQuestion(id) {
    return this.delete(`/admin/dgnl-exams/questions/${id}`);
  }

  async duplicateDGNLQuestion(id) {
    return this.post(`/admin/dgnl-exams/questions/${id}/duplicate`);
  }
}

export default new ApiService();