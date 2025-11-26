import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

export default function FloatingChatIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Lấy user ID từ localStorage
  useEffect(() => {
    // Thử lấy từ userId trước
    let userId = localStorage.getItem('userId');
    
    // Nếu không có, lấy từ user object
    if (!userId) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.idnguoidung || user.id || null;
          console.log('Got userId from user object:', userId);
        } catch (e) {
          console.error('Error parsing user object:', e);
        }
      }
    }
    
    // Nếu vẫn không có, dùng giá trị mặc định cho test (có thể xóa sau)
    if (!userId) {
      console.warn('No userId found in localStorage. Using default for testing.');
      // userId = '5'; // Uncomment này nếu muốn test với user ID mặc định
    }
    
    setCurrentUserId(userId);
    console.log('Current userId set to:', userId);
  }, []);

  // Scroll to bottom khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Tạo hoặc lấy phòng chat khi mở
  useEffect(() => {
    if (isOpen && currentUserId && !roomId) {
      createOrGetRoom();
    }
  }, [isOpen, currentUserId]);

  // Load messages khi có roomId
  useEffect(() => {
    if (isOpen && roomId) {
      loadMessages();
      // Polling để lấy tin nhắn mới mỗi 2 giây
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, roomId]);

  // Focus vào input khi modal mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        console.log('Input ref:', inputRef.current);
        console.log('Input disabled:', inputRef.current?.disabled);
        console.log('RoomId:', roomId);
        console.log('Sending:', sending);
      }, 200);
    }
  }, [isOpen, roomId]);

  const createOrGetRoom = async () => {
    if (!currentUserId) {
      console.error('No currentUserId found');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating room for user:', currentUserId);
      const response = await fetch('http://localhost:8000/api/chat-support/get-or-create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          idnguoidung: parseInt(currentUserId),
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Create room response:', data);
      
      if (data.success && data.data) {
        setRoomId(data.data.idphongchat_support);
        console.log('Room ID set to:', data.data.idphongchat_support);
      } else {
        console.error('Failed to create room:', data);
        toast.push({ type: 'error', title: data.message || 'Không thể tạo phòng chat' });
        // Cho phép nhập ngay cả khi chưa có room - sẽ tạo khi gửi
      }
    } catch (error) {
      console.error('Error creating/getting room:', error);
      toast.push({ type: 'error', title: 'Lỗi kết nối. Vui lòng thử lại.' });
      // Cho phép nhập ngay cả khi có lỗi - sẽ tạo khi gửi
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chat-support/messages?idphongchat_support=${roomId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data);
        // Đánh dấu tin nhắn đã xem
        if (currentUserId) {
          markAsRead();
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async () => {
    if (!roomId || !currentUserId) return;

    try {
      await fetch('http://localhost:8000/api/chat-support/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idphongchat_support: roomId,
          idnguoidung: parseInt(currentUserId),
        })
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

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
    console.log('sendMessage called - messageInput:', messageInput, 'attachedFile:', attachedFile, 'currentUserId:', currentUserId, 'sending:', sending, 'roomId:', roomId);
    
    if ((!messageInput.trim() && !attachedFile)) {
      console.log('Message and file are empty');
      return;
    }
    
    if (!currentUserId) {
      console.log('No currentUserId');
      toast.push({ type: 'error', title: 'Vui lòng đăng nhập' });
      return;
    }
    
    if (sending || uploading) {
      console.log('Already sending or uploading');
      return;
    }

    // Nếu chưa có roomId, tạo room trước và lấy roomId trực tiếp từ response
    let currentRoomId = roomId;
    if (!currentRoomId) {
      console.log('No roomId, creating room first...');
      try {
        const response = await fetch('http://localhost:8000/api/chat-support/get-or-create-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            idnguoidung: parseInt(currentUserId),
          })
        });

        const data = await response.json();
        console.log('Create room response in sendMessage:', data);
        
        if (data.success && data.data && data.data.idphongchat_support) {
          currentRoomId = data.data.idphongchat_support;
          setRoomId(currentRoomId); // Update state
          console.log('Room ID set to:', currentRoomId);
        } else {
          console.error('Failed to create room:', data);
          toast.push({ type: 'error', title: data.message || 'Không thể tạo phòng chat. Vui lòng thử lại.' });
          return;
        }
      } catch (error) {
        console.error('Error creating room:', error);
        toast.push({ type: 'error', title: 'Lỗi khi tạo phòng chat' });
        return;
      }
    }

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
          idphongchat_support: currentRoomId,
          idnguoigui: parseInt(currentUserId),
          noi_dung: content,
          tep_dinh_kem: fileUrl,
          ten_file: fileName,
        })
      });

      const data = await response.json();
      if (data.success) {
        // Thêm tin nhắn mới vào danh sách
        setMessages(prev => [...prev, data.data]);
        // Load lại để đảm bảo đồng bộ
        setTimeout(loadMessages, 100);
        // Focus lại input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
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

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setRoomId(null);
    setMessageInput('');
  };

  return (
    <>
      {/* Floating Chat Icon */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          type="button"
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
          aria-label="Mở chat hỗ trợ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window - Popup đơn giản không có backdrop che phủ */}
      {isOpen && (
        <div 
          className="fixed bottom-20 right-6 w-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200"
          style={{ 
            maxHeight: '600px',
            zIndex: 9999
          }}
        >
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
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Đóng chat"
              type="button"
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

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ minHeight: '300px', maxHeight: '400px' }}>
            {loading && !roomId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Chào mừng bạn đến với chat hỗ trợ!</p>
                  <p className="text-sm">Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isMyMessage = message.idnguoigui === parseInt(currentUserId);
                const messageTime = message.ngay_tao 
                  ? new Date(message.ngay_tao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={message.idtinnhan_support}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2 ${
                        isMyMessage
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      {!isMyMessage && message.nguoiGui && (
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {message.nguoiGui.hoten || 'Người phụ trách'}
                        </div>
                      )}
                      {message.noi_dung && message.noi_dung !== '[Đã gửi file]' && (
                        <p className="text-sm whitespace-pre-wrap break-words">
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
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg flex-shrink-0 relative">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if ((messageInput.trim() || attachedFile) && !sending && !uploading && currentUserId) {
                      sendMessage();
                    }
                  }
                }}
                placeholder={attachedFile ? "Nhập tin nhắn (tùy chọn)..." : (roomId ? "Nhập tin nhắn..." : "Nhập tin nhắn... (Đang tải phòng chat)")}
                disabled={sending || uploading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={(!messageInput.trim() && !attachedFile) || !roomId || sending || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                aria-label="Gửi tin nhắn"
              >
                {sending ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
