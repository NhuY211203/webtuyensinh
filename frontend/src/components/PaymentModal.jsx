import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, CreditCard, Shield, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import apiService from '../services/api';

const PaymentModal = ({ isOpen, onClose, bookingData }) => {
  const [paymentMethod] = useState('zalopay'); // Chỉ sử dụng ZaloPay
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [expiryAt, setExpiryAt] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const consultationFee = 500000;
  const serviceFee = 50000;
  const pointsDiscount = pointsToUse * 1000; // 1 điểm = 1000 VND
  const total = Math.max(0, consultationFee + serviceFee - pointsDiscount);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Lấy user ID từ localStorage
  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user.user_id || user.idnguoidung;
    }
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      return currentUser.id || currentUser.user_id || currentUser.idnguoidung;
    }
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      const user = JSON.parse(sessionUser);
      return user.id || user.user_id || user.idnguoidung;
    }
    return null;
  };

  // Tạo QR code ZaloPay
  const generateZaloPayQR = async (invoiceId, scheduleId, userId, pointsUsed = 0) => {
    try {
      const response = await apiService.post('/payments/generate-zalopay-qr', {
        invoiceId: invoiceId,
        scheduleId: scheduleId,
        userId: userId,
        pointsUsed: pointsUsed,
        discountAmount: pointsUsed * 1000 // Tổng số tiền giảm
      });
      
      console.log('ZaloPay Response:', response);
      
      if (response.success && response.data) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setQrCodeData(response.data.qrCodeData);
        setOrderId(response.data.orderId);
        setExpiryAt(response.data.expiryAt);
        setShowQRModal(true);
        setPaymentStatus('pending');
        
        // Bắt đầu countdown
        const expiry = new Date(response.data.expiryAt).getTime();
        const now = Date.now();
        setTimeRemaining(Math.max(0, Math.floor((expiry - now) / 1000)));
      } else {
        // Hiển thị chi tiết lỗi
        const errorMessage = response.message || 'Không thể tạo QR code thanh toán';
        const errorDetails = response.error || response.debug || {};
        
        console.error('ZaloPay Error Details:', {
          message: errorMessage,
          error: errorDetails,
          fullResponse: response
        });
        
        throw new Error(errorMessage + (errorDetails.return_message ? `: ${errorDetails.return_message}` : ''));
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await apiService.get(`/payments/status/${orderId}`);
      if (response.success && response.data) {
        return response.data.status;
      }
      return 'pending';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return 'pending';
    }
  };

  // Hoàn thành đặt lịch sau khi thanh toán thành công
  const completeBooking = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        alert('Vui lòng đăng nhập để đặt lịch tư vấn');
        return;
      }

      const response = await apiService.bookConsultationSchedule({
        scheduleId: bookingData.slot.id,
        userId: userId
      });

      if (response.success) {
        setShowQRModal(false);
        alert('Thanh toán thành công! Đặt lịch tư vấn thành công!');
        onClose();
        window.location.reload();
      } else {
        alert('Có lỗi xảy ra: ' + response.message);
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Có lỗi xảy ra khi đặt lịch: ' + error.message);
    }
  };

  // Lấy điểm đổi thưởng của người dùng
  useEffect(() => {
    if (isOpen) {
      fetchRewardPoints();
    }
  }, [isOpen]);

  const fetchRewardPoints = async () => {
    try {
      setLoadingPoints(true);
      const userId = getUserId();
      if (!userId) return;

      const response = await fetch(`http://localhost:8000/api/my-reward-points?user_id=${userId}`);
      const data = await response.json();

      if (data.success && data.summary) {
        // Chỉ lấy điểm chưa sử dụng
        setAvailablePoints(Math.floor(data.summary.tong_diem_chua_dung || 0));
      }
    } catch (error) {
      console.error('Error loading reward points:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setShowQRModal(false);
      setQrCodeUrl(null);
      setQrCodeData(null);
      setOrderId(null);
      setExpiryAt(null);
      setTimeRemaining(0);
      setPaymentStatus('pending');
      setIsProcessing(false);
      setPointsToUse(0);
    }
  }, [isOpen]);

  // Tự động điều chỉnh điểm sử dụng khi tổng tiền thay đổi
  useEffect(() => {
    const maxDiscount = consultationFee + serviceFee;
    const maxPoints = Math.floor(maxDiscount / 1000);
    const maxUsablePoints = Math.min(availablePoints, maxPoints);
    
    if (pointsToUse > maxUsablePoints) {
      setPointsToUse(maxUsablePoints);
    }
  }, [availablePoints, consultationFee, serviceFee]);

  // Polling trạng thái thanh toán
  useEffect(() => {
    if (!orderId || !showQRModal) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(orderId);
        if (status === 'paid') {
          setPaymentStatus('paid');
          clearInterval(interval);
          
          // Đặt lịch tư vấn sau khi thanh toán thành công
          await completeBooking();
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Check mỗi 3 giây

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, showQRModal]);

  // Countdown timer
  useEffect(() => {
    if (!showQRModal || !expiryAt) return;

    const updateCountdown = () => {
      const expiry = new Date(expiryAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setPaymentStatus('expired');
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [showQRModal, expiryAt]);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      const userId = getUserId();
      if (!userId) {
        alert('Vui lòng đăng nhập để đặt lịch tư vấn');
        return;
      }

      if (!bookingData || !bookingData.slot || !bookingData.slot.id) {
        alert('Thông tin đặt lịch không hợp lệ');
        return;
      }

      // Lấy schedule ID và sử dụng làm invoice ID
      const scheduleId = bookingData.slot.id;
      const invoiceId = scheduleId; // Sử dụng schedule ID làm invoice ID
      
      // Tạo QR code ZaloPay với đầy đủ thông tin, bao gồm điểm sử dụng
      await generateZaloPayQR(invoiceId, scheduleId, userId, pointsToUse);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Early return sau tất cả hooks
  if (!isOpen || !bookingData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Thanh toán</h2>
              <p className="text-blue-100 mt-1">Xác nhận thông tin và thanh toán cho buổi tư vấn</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Consultation Details */}
          <div className="flex-1 p-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin buổi tư vấn</h3>
              
              {/* Consultant Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold">
                  {bookingData.consultant?.name?.charAt(0) || 'NV'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{bookingData.consultant?.name}</h4>
                  <p className="text-sm text-gray-600">Trường Đại học</p>
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">Ngày:</span>
                  <span className="font-medium">{bookingData.slot?.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">{bookingData.slot?.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">Hình thức:</span>
                  <span className="font-medium">{bookingData.slot?.platform || 'Google Meet'}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Ghi chú</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Buổi tư vấn sẽ được thực hiện qua {bookingData.slot?.platform || 'Google Meet'}. 
                  Bạn sẽ nhận được link tham gia trước buổi tư vấn 30 phút.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Payment Summary */}
          <div className="lg:w-80 bg-gray-50 p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Reward Points */}
              {availablePoints > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Điểm đổi thưởng</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Điểm khả dụng:</span>
                        <span className="font-semibold text-blue-600">{availablePoints} điểm</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        1 điểm = 1,000 VND
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(availablePoints, Math.floor((consultationFee + serviceFee) / 1000))}
                          value={pointsToUse}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const maxPoints = Math.min(availablePoints, Math.floor((consultationFee + serviceFee) / 1000));
                            setPointsToUse(Math.max(0, Math.min(value, maxPoints)));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Nhập số điểm"
                        />
                        <button
                          onClick={() => {
                            const maxPoints = Math.min(availablePoints, Math.floor((consultationFee + serviceFee) / 1000));
                            setPointsToUse(maxPoints);
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                        >
                          Tối đa
                        </button>
                      </div>
                      {pointsToUse > 0 && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          Giảm: {formatCurrency(pointsDiscount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tổng cộng</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí tư vấn:</span>
                    <span>{formatCurrency(consultationFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí dịch vụ:</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá (điểm):</span>
                      <span>-{formatCurrency(pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-blue-600">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border-2 border-blue-500 rounded-lg bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="zalopay"
                      checked={paymentMethod === 'zalopay'}
                      readOnly
                      className="text-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-blue-700">ZaloPay</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isProcessing 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Thanh toán ngay'
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Quay lại
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Thanh toán an toàn và bảo mật</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Thanh toán bằng ZaloPay</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {paymentStatus === 'paid' ? (
                <div className="py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-green-600 mb-2">Thanh toán thành công!</h4>
                  <p className="text-gray-600">Đang xử lý đặt lịch...</p>
                </div>
              ) : paymentStatus === 'expired' ? (
                <div className="py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-600 mb-2">QR code đã hết hạn</h4>
                  <p className="text-gray-600 mb-4">Vui lòng tạo QR code mới để thanh toán</p>
                  <button
                    onClick={() => {
                      setShowQRModal(false);
                      handlePayment();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tạo QR code mới
                  </button>
                </div>
              ) : (
                <>
                  {(qrCodeUrl || qrCodeData) && (
                    <div className="mb-4 flex justify-center">
                      <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                        <QRCodeSVG 
                          value={qrCodeUrl || qrCodeData} 
                          size={256}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-blue-600 mb-2">
                      {formatCurrency(total)}
                    </p>
                    {pointsDiscount > 0 && (
                      <p className="text-sm text-green-600 mb-1">
                        Đã giảm: {formatCurrency(pointsDiscount)} ({pointsToUse} điểm)
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-2">
                      Quét mã QR bằng ứng dụng ZaloPay để thanh toán
                    </p>
                    {timeRemaining > 0 && (
                      <p className="text-sm text-orange-600 font-medium">
                        Hết hạn sau: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;
