import { useState, useEffect } from "react";
import api from "../../services/api";

export default function StaffNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("now"); // now | schedule
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for notifications list and stats
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(false);

  // State for recipient selection
  const [majorGroups, setMajorGroups] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [selectedMajorGroup, setSelectedMajorGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsultants, setSelectedConsultants] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Lấy user_id từ localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.idnguoidung || currentUser.id;
      
      const notificationData = {
        title,
        body,
        scheduledAt: mode === "schedule" ? time : null,
        user_id: userId, // Gửi user_id để backend có thể lấy
        recipients: {
          allUsers: false,
          roles: [4], // Vai trò tư vấn viên
          userIds: selectedConsultants // ID người dùng cụ thể đã chọn
        }
      };

      let response;
      if (mode === "now") {
        response = await api.sendNotification(notificationData);
      } else {
        response = await api.scheduleNotification(notificationData);
      }

      if (response.success) {
    alert(
      mode === "now"
            ? `✅ Đã gửi thông báo: ${title}`
            : `📅 Đã lên lịch thông báo lúc ${time}: ${title}`
        );
        
        // Reset form
        setTitle(""); 
        setBody(""); 
        setTime("");
        
        // Refresh notifications list
        loadNotifications();
        loadStats();
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load notifications list
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notification stats
  const loadStats = async () => {
    try {
      const response = await api.getNotificationStats();
      if (response.success) {
        setStats(response.data || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadNotifications();
    loadStats();
    loadMajorGroups();
    loadConsultants();
  }, []);

  // Load major groups
  const loadMajorGroups = async () => {
    try {
      const response = await api.getMajorGroups();
      if (response.success) {
        setMajorGroups(response.data || []);
      }
    } catch (error) {
      console.error('Error loading major groups:', error);
    }
  };

  // Load consultants
  const loadConsultants = async () => {
    try {
      setLoadingConsultants(true);
      const response = await api.getConsultantsGroupedByMajor();
      if (response.success) {
        const allConsultants = [];
        (response.data || []).forEach(group => {
          group.consultants.forEach(consultant => {
            allConsultants.push({
              ...consultant,
              groupName: group.groupName
            });
          });
        });
        setConsultants(allConsultants);
      }
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoadingConsultants(false);
    }
  };

  // Filter consultants based on search and major group
  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = !searchQuery || 
      consultant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultant.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMajorGroup = !selectedMajorGroup || 
      consultant.groupId == selectedMajorGroup;
    
    return matchesSearch && matchesMajorGroup;
  });

  // Toggle consultant selection
  const toggleConsultant = (consultantId) => {
    setSelectedConsultants(prev => 
      prev.includes(consultantId) 
        ? prev.filter(id => id !== consultantId)
        : [...prev, consultantId]
    );
  };

  // Select all consultants
  const selectAllConsultants = () => {
    setSelectedConsultants(filteredConsultants.map(c => c.id));
  };

  // Deselect all consultants
  const deselectAllConsultants = () => {
    setSelectedConsultants([]);
  };

  // Get selected consultants data
  const getSelectedConsultantsData = () => {
    return consultants.filter(c => selectedConsultants.includes(c.id));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h15A1.5 1.5 0 0121 6v12a1.5 1.5 0 01-1.5 1.5h-15z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gửi thông báo</h1>
        </div>
        <p className="text-gray-600">Gửi thông báo ngay lập tức hoặc lên lịch gửi cho tư vấn viên</p>
      </div>

      {/* Main Layout - 2 columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form gửi thông báo - 3/5 width */}
        <div className="w-full lg:w-3/5">

          <form onSubmit={submit} className="space-y-6">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Nội dung thông báo
                </h2>
              </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề thông báo *
                </label>
                <input 
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập tiêu đề thông báo..." 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung thông báo *
                </label>
                <div className="relative">
                  <textarea 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows="6" 
                    placeholder="Nhập nội dung chi tiết của thông báo..."
                    value={body} 
                    onChange={e => setBody(e.target.value)}
                    required
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {body.length}/500
                  </div>
                </div>
              </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn phương thức gửi
          </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Send Now Option */}
                <div 
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    mode === "now" 
                      ? "border-teal-500 bg-teal-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setMode("now")}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="mode" 
                      value="now" 
                      checked={mode === "now"} 
                      onChange={() => setMode("now")}
                      className="w-4 h-4 text-teal-600"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span className="font-medium text-gray-900">Gửi ngay</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-7">Thông báo sẽ được gửi ngay lập tức</p>
                </div>

                {/* Schedule Option */}
                <div 
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    mode === "schedule" 
                      ? "border-teal-500 bg-teal-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setMode("schedule")}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="mode" 
                      value="schedule" 
                      checked={mode === "schedule"} 
                      onChange={() => setMode("schedule")}
                      className="w-4 h-4 text-teal-600"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">Lên lịch</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-7">Lên lịch gửi thông báo sau</p>
                </div>
              </div>
            </div>

              {/* Schedule Time Input */}
              {mode === "schedule" && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Thời gian gửi
          </label>
                  <input 
                    type="datetime-local" 
                    value={time} 
                    onChange={e => setTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required={mode === "schedule"}
                  />
                  <p className="text-xs text-gray-500 mt-1">Chọn thời gian để gửi thông báo</p>
                </div>
              )}
            </div>

            {/* Recipient Selection Section */}
            <div className="bg-slate-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Chọn người nhận thông báo
              </h3>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhóm ngành</label>
                  <select
                    value={selectedMajorGroup}
                    onChange={e => setSelectedMajorGroup(e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tất cả nhóm ngành</option>
                    {majorGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tìm theo tên hoặc email</label>
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={selectAllConsultants}
                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllConsultants}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Đã chọn {selectedConsultants.length}/{filteredConsultants.length} tư vấn viên
                </div>
              </div>

              {/* Consultants List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {loadingConsultants ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="mt-2">Đang tải danh sách tư vấn viên...</p>
                  </div>
                ) : filteredConsultants.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-2xl mb-2">👥</div>
                    <p>Không tìm thấy tư vấn viên phù hợp</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConsultants.map(consultant => (
                      <div key={consultant.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedConsultants.includes(consultant.id)}
                            onChange={() => toggleConsultant(consultant.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {consultant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {consultant.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {consultant.email || 'Chưa có email'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {consultant.groupName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>

              {/* Card Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {mode === "now" ? "Thông báo sẽ được gửi ngay lập tức" : "Thông báo sẽ được lên lịch gửi"}
                    {selectedConsultants.length > 0 && (
                      <span className="ml-2 text-indigo-600 font-medium">
                        tới {selectedConsultants.length} tư vấn viên
                      </span>
          )}
        </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setTitle(""); 
                        setBody(""); 
                        setTime("");
                        setSelectedConsultants([]);
                        setSearchQuery("");
                        setSelectedMajorGroup("");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedConsultants.length === 0) {
                          alert("Vui lòng chọn ít nhất một tư vấn viên");
                          return;
                        }
                        setShowConfirmModal(true);
                      }}
                      disabled={isSubmitting || !title.trim() || !body.trim() || (mode === "schedule" && !time) || selectedConsultants.length === 0}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          {mode === "now" ? "Gửi ngay" : "Lên lịch"}
                        </>
                      )}
                    </button>
                  </div>
        </div>
      </div>
    </form>
        </div>

        {/* Lịch sử thông báo - 2/5 width */}
        <div className="w-full lg:w-2/5">
          <div className="bg-slate-50 rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Lịch sử gửi thông báo gần đây
            </h2>

            <div className="space-y-3">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">Đang tải...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">📭</div>
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                            notification.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                            notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.status === 'sent' ? '✅ Đã gửi' :
                             notification.status === 'scheduled' ? '⏰ Đã lên lịch' :
                             notification.status === 'failed' ? '❌ Thất bại' : '⏳ Chờ xử lý'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {notification.recipientCount || 0} người nhận
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          console.log('View notification details:', notification.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadNotifications}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Xem tất cả ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl mr-4">
                {mode === "now" ? "📤" : "⏰"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {mode === "now" ? "Xác nhận gửi thông báo" : "Xác nhận lên lịch thông báo"}
                </h3>
                <p className="text-sm text-gray-500">
                  Bạn sắp {mode === "now" ? "gửi" : "lên lịch gửi"} thông báo tới <strong className="text-indigo-600">{selectedConsultants.length} tư vấn viên</strong>
                </p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Thông báo:</div>
              <div className="text-sm text-gray-900 font-medium">{title}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{body}</div>
              {mode === "schedule" && time && (
                <div className="text-xs text-gray-500 mt-2">
                  Thời gian: {new Date(time).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  await submit({ preventDefault: () => {} });
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {mode === "now" ? "📤 Gửi ngay" : "⏰ Lên lịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// export default function StaffNotifications() {
//   return (
//     <div className="max-w-3xl">
//       <h1 className="text-2xl font-bold mb-4">Gửi thông báo / nhắc lịch</h1>
//       <div className="card p-5 space-y-4">
//         <input className="input" placeholder="Tiêu đề" />
//         <textarea className="input" rows="4" placeholder="Nội dung..." />
//         <div className="flex justify-end">
//           <button className="btn-primary">Gửi</button>
//         </div>
//       </div>
//     </div>
//   );
// }
