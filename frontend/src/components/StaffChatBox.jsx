import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './Toast';

export default function StaffChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Lấy staff ID từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const userIdStr = localStorage.getItem('userId');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const staffId = user.idnguoidung || user.id || userIdStr || null;
        if (staffId) {
          setCurrentStaffId(parseInt(staffId));
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    } else if (userIdStr) {
      setCurrentStaffId(parseInt(userIdStr));
    }
  }, []);

  // Load danh sách conversations
  useEffect(() => {
    if (isOpen && currentStaffId) {
      loadConversations();
      // Tăng interval lên 10 giây để giảm số lần reload
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentStaffId, loadConversations]);

  // Load messages khi chọn conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      // Tăng interval lên 5 giây để giảm số lần reload
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]); // Clear messages khi không có conversation được chọn
    }
  }, [selectedConversation, loadMessages]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!currentStaffId) return;

    try {
      setLoadingConversations(true);
      const response = await fetch(`http://localhost:8000/api/chat-support/staff-rooms?idnguoi_phu_trach=${currentStaffId}`);
      const data = await response.json();
      
      if (data.success) {
        const newConversations = Array.isArray(data.data) ? data.data : [];
        // Chỉ update state nếu data thực sự thay đổi
        setConversations(prev => {
          const prevIds = prev.map(c => c.idphongchat_support).sort().join(',');
          const newIds = newConversations.map(c => c.idphongchat_support).sort().join(',');
          if (prevIds !== newIds) {
            return newConversations;
          }
          // Giữ nguyên state nếu không có thay đổi về danh sách
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [currentStaffId]);

  const loadMessages = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chat-support/messages?idphongchat_support=${selectedConversation.idphongchat_support}`);
      const data = await response.json();
      
      if (data.success) {
        const newMessages = Array.isArray(data.data) ? data.data : [];
        // Chỉ update state nếu có thay đổi
        setMessages(prev => {
          if (prev.length !== newMessages.length) {
            return newMessages;
          }
          // So sánh ID của tin nhắn cuối cùng
          const prevLastId = prev[prev.length - 1]?.idtinnhan_support;
          const newLastId = newMessages[newMessages.length - 1]?.idtinnhan_support;
          if (prevLastId !== newLastId) {
            return newMessages;
          }
          return prev;
        });
        if (currentStaffId) {
          markAsRead();
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [selectedConversation, currentStaffId]);

  const markAsRead = useCallback(async () => {
    if (!selectedConversation || !currentStaffId) return;

    try {
      await fetch('http://localhost:8000/api/chat-support/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idphongchat_support: selectedConversation.idphongchat_support,
          idnguoidung: parseInt(currentStaffId),
        })
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [selectedConversation, currentStaffId]);

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
      });

      const response = await fetch('http://localhost:8000/api/chat-support/upload-file', {
        method: 'POST',
        body: formData,
        // Không set Content-Type header, để browser tự động set với boundary
      });

      const data = await response.json();
      
      console.log('Upload response:', {
        status: response.status,
        success: data.success,
        message: data.message,
        errors: data.errors,
        debug: data.debug
      });

      if (data.success) {
        // Trả về cả URL và tên file gốc
        return {
          url: data.data.url,
          filename: data.data.original_filename || file.name
        };
      } else {
        const errorMsg = data.message || 'Không thể upload file';
        const errorDetails = data.errors ? Object.values(data.errors).flat().join(', ') : '';
        toast.push({ 
          type: 'error', 
          title: errorMsg + (errorDetails ? `: ${errorDetails}` : '') 
        });
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.push({ type: 'error', title: 'Lỗi kết nối khi upload file: ' + error.message });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.push({ type: 'error', title: 'File quá lớn. Kích thước tối đa là 10MB' });
      return;
    }

    // Kiểm tra loại file (mở rộng danh sách)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.push({ type: 'error', title: 'Loại file không được hỗ trợ. Chỉ chấp nhận: ảnh (JPEG, PNG, GIF, WebP) và tài liệu (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)' });
      return;
    }

    const fileResult = await uploadFile(file);
    if (fileResult && fileResult.url) {
      setAttachedFile({
        url: fileResult.url,
        filename: fileResult.filename || file.name
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && !attachedFile) || !selectedConversation || !currentStaffId || sending || uploading) return;

    const content = messageInput.trim();
    const fileUrl = attachedFile?.url || attachedFile;
    const fileName = attachedFile?.filename || null;
    
    setMessageInput('');
    setAttachedFile(null);
    setSending(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat-support/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idphongchat_support: selectedConversation.idphongchat_support,
          idnguoigui: parseInt(currentStaffId),
          noi_dung: content,
          tep_dinh_kem: fileUrl,
          ten_file: fileName,
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        // Chỉ reload messages và conversations sau khi gửi thành công, không cần setTimeout
        loadMessages();
        // Reload conversations để cập nhật unread count, nhưng chỉ khi cần
        setTimeout(() => loadConversations(), 500);
      } else {
        toast.push({ type: 'error', title: data.message || 'Không thể gửi tin nhắn' });
        setMessageInput(content);
        setAttachedFile(attachedFile?.url ? attachedFile : fileUrl);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.push({ type: 'error', title: 'Lỗi kết nối' });
      setMessageInput(content);
      setAttachedFile(fileUrl);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <>
      {/* Floating Chat Icon - chỉ hiện khi modal chưa mở */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
          aria-label="Mở chat hỗ trợ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-full max-w-4xl bg-white rounded-lg shadow-2xl flex flex-col z-[9999]" style={{ maxHeight: '80vh', height: '600px' }}>
          {/* Chat Header */}
          <div className="bg-green-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-semibold">Chat hỗ trợ</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadCount} tin nhắn mới
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Đóng chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Main Content - Sidebar + Chat Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Danh sách conversations */}
            <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-sm text-gray-700">Danh sách người gửi</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <p>Chưa có cuộc trò chuyện</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const userName = conv.nguoiDung?.hoten || `Người dùng #${conv.idnguoidung}`;
                    const userEmail = conv.nguoiDung?.email || '';
                    const isSelected = selectedConversation?.idphongchat_support === conv.idphongchat_support;
                    const hasUnread = conv.unreadCount > 0;
                    
                    return (
                      <div
                        key={conv.idphongchat_support}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMessages([]);
                        }}
                        className={`p-3 border-b border-gray-100 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-green-50 border-l-4 border-l-green-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            isSelected ? 'bg-green-600' : hasUnread ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {userName}
                              </div>
                              {hasUnread && (
                                <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                            {userEmail && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {userEmail}
                              </div>
                            )}
                            {conv.lastMessage?.noi_dung && (
                              <div className="text-xs text-gray-600 truncate mt-1">
                                {conv.lastMessage.noi_dung.length > 30 
                                  ? conv.lastMessage.noi_dung.substring(0, 30) + '...'
                                  : conv.lastMessage.noi_dung}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                        {(selectedConversation.nguoiDung?.hoten || 'Người dùng').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {selectedConversation.nguoiDung?.hoten || 'Người dùng'}
                        </div>
                        {selectedConversation.nguoiDung?.email && (
                          <div className="text-xs text-gray-500">
                            {selectedConversation.nguoiDung.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 text-sm">Đang tải tin nhắn...</div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <p className="text-sm">Chưa có tin nhắn nào</p>
                          <p className="text-xs mt-2">Bắt đầu cuộc trò chuyện với {selectedConversation.nguoiDung?.hoten || 'người dùng'}</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMyMessage = message.idnguoigui === parseInt(currentStaffId);
                        const messageTime = message.ngay_tao 
                          ? new Date(message.ngay_tao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '';

                        return (
                          <div
                            key={message.idtinnhan_support}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isMyMessage && (
                                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                  {(message.nguoiGui?.hoten || 'Người dùng').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                                  isMyMessage
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                                }`}
                              >
                                {message.noi_dung && message.noi_dung !== '[Đã gửi file]' && (
                                  <p className="whitespace-pre-wrap break-words">
                                    {message.noi_dung}
                                  </p>
                                )}
                                
                                {/* Hiển thị file đính kèm */}
                                {message.tep_dinh_kem && (
                                  <div className="mt-2">
                                    {message.isImage ? (
                                      <a
                                        href={message.tep_dinh_kem}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={message.tep_dinh_kem}
                                          alt="Hình ảnh đính kèm"
                                          className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={`http://localhost:8000/api/chat-support/download-file?url=${encodeURIComponent(message.tep_dinh_kem)}&filename=${encodeURIComponent(message.ten_file || 'file')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                                          isMyMessage
                                            ? 'bg-green-500 text-white hover:bg-green-400'
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        } transition-colors`}
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm">{message.ten_file || 'Tải file đính kèm'}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                
                                {messageTime && (
                                  <p className={`text-xs mt-1 ${isMyMessage ? 'text-green-100' : 'text-gray-500'}`}>
                                    {messageTime}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                    {/* Hiển thị file đã chọn */}
                    {attachedFile && (
                      <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {((typeof attachedFile === 'string' ? attachedFile : attachedFile.url) || '').match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={typeof attachedFile === 'string' ? attachedFile : attachedFile.url} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 truncate">
                            {typeof attachedFile === 'string' ? 'File đã chọn' : (attachedFile.filename || 'File đã chọn')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || sending}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                        title="Đính kèm file"
                      >
                        {uploading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a2 2 0 00-2.828-2.828L9 10.172 7.586 8.586a2 2 0 10-2.828 2.828l1.414 1.414a4 4 0 105.657 5.657l6.414-6.414a4 4 0 00-5.657-5.657L9 10.172l-1.414-1.414a4 4 0 10-5.657 5.657l1.414 1.414" />
                          </svg>
                        )}
                      </button>
                      <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={attachedFile ? "Nhập tin nhắn (tùy chọn)..." : "Nhập tin nhắn..."}
                        disabled={sending || uploading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 text-sm"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={(!messageInput.trim() && !attachedFile) || sending || uploading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm mb-2">Chọn một cuộc trò chuyện</p>
                    <p className="text-xs">Chọn người dùng từ danh sách bên trái để xem tin nhắn</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

