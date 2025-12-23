import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle, X } from 'lucide-react';

const TestPayment = () => {
  const [amount, setAmount] = useState(50000);
  const [description, setDescription] = useState('Test thanh toán ZaloPay');
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const generateQR = async () => {
    try {
      setLoading(true);
      setPaymentStatus('generating');
      
      const response = await fetch('http://localhost:8000/api/payments/simple/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: description
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrData(data.data);
        setPaymentStatus('pending');
        
        // Bắt đầu countdown
        const expiry = new Date(data.data.expiryAt).getTime();
        const now = Date.now();
        setTimeRemaining(Math.max(0, Math.floor((expiry - now) / 1000)));
        
        // Bắt đầu polling trạng thái thanh toán
        startPaymentPolling(data.data.orderId);
      } else {
        alert('Lỗi tạo QR: ' + data.message);
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối: ' + error.message);
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (orderId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/payments/simple/status/${orderId}`);
        const data = await response.json();
        
        if (data.success && data.data.status === 'paid') {
          setPaymentStatus('paid');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    // Cleanup sau 15 phút
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === 'pending') {
        setPaymentStatus('expired');
      }
    }, 15 * 60 * 1000);
  };

  // Countdown timer
  React.useEffect(() => {
    if (paymentStatus !== 'pending' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setPaymentStatus('expired');
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, timeRemaining]);

  const resetTest = () => {
    setQrData(null);
    setPaymentStatus('idle');
    setTimeRemaining(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Thanh Toán ZaloPay</h1>
          
          {paymentStatus === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (VND)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  step="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={generateQR}
                disabled={loading || amount < 1000}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo QR...
                  </>
                ) : (
                  `Tạo QR thanh toán ${formatCurrency(amount)}`
                )}
              </button>
            </div>
          )}

          {paymentStatus === 'pending' && qrData && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quét mã QR để thanh toán
              </h2>
              
              <div className="mb-4 flex justify-center">
                <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                  <QRCodeSVG 
                    value={qrData.qrCodeUrl} 
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(qrData.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {qrData.description}
                </p>
                <p className="text-sm text-gray-600">
                  Mã đơn hàng: {qrData.orderId}
                </p>
                {timeRemaining > 0 && (
                  <p className="text-sm text-orange-600 font-medium">
                    Hết hạn sau: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  📱 Mở ứng dụng ZaloPay và quét mã QR để thanh toán
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={resetTest}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Hủy và tạo mới
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:8000/api/payments/debug/test-callback/${qrData.orderId}`, {
                        method: 'POST'
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert('✅ Test callback thành công! Hệ thống sẽ cập nhật trạng thái.');
                      } else {
                        alert('❌ Test callback thất bại: ' + data.message);
                      }
                    } catch (error) {
                      alert('❌ Lỗi test callback: ' + error.message);
                    }
                  }}
                  className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 text-sm"
                >
                  🧪 Test Callback
                </button>
              </div>
            </div>
          )}

          {paymentStatus === 'paid' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Thanh toán thành công! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                Đơn hàng {qrData?.orderId} đã được thanh toán thành công
              </p>
              <button
                onClick={resetTest}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Tạo thanh toán mới
              </button>
            </div>
          )}

          {paymentStatus === 'expired' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                QR code đã hết hạn
              </h2>
              <p className="text-gray-600 mb-4">
                Vui lòng tạo QR code mới để thanh toán
              </p>
              <button
                onClick={resetTest}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Tạo QR code mới
              </button>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Có lỗi xảy ra
              </h2>
              <p className="text-gray-600 mb-4">
                Không thể tạo QR code thanh toán
              </p>
              <button
                onClick={resetTest}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPayment;