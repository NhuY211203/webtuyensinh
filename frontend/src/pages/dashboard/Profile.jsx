import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast.jsx";

export default function Profile(){
  const { push } = useToast();
  const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
  const [form, setForm] = useState({
    hoten: userLocal.hoten || "",
    ngaysinh: userLocal.ngaysinh || "",
    gioitinh: userLocal.gioitinh || "",
    cccd: userLocal.cccd || "",
    email: userLocal.email || "",
    sodienthoai: userLocal.sodienthoai || "",
    diachi: userLocal.diachi || "",
    truongThpt: userLocal.truongThpt || "",
  });
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdTouched, setPwdTouched] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [currentPwdValid, setCurrentPwdValid] = useState(null); // null: chưa kiểm, true/false: kết quả

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/users').catch(() => fetch('http://127.0.0.1:8000/api/users'));
        if (!mounted || !res?.ok) return;
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        const byEmail = form.email ? list.find(u => (u.email || '').toLowerCase() === String(form.email).toLowerCase()) : null;
        const byAccount = byEmail || (userLocal?.taikhoan ? list.find(u => String(u.taikhoan).toLowerCase() === String(userLocal.taikhoan).toLowerCase()) : null);
        const u = byAccount;
        if (u) {
          setForm(prev => ({
            ...prev,
            hoten: u.hoten ?? prev.hoten,
            ngaysinh: u.ngaysinh ?? prev.ngaysinh,
            gioitinh: u.gioitinh ?? prev.gioitinh,
            email: u.email ?? prev.email,
            sodienthoai: u.sodienthoai ?? prev.sodienthoai,
            diachi: u.diachi ?? prev.diachi,
          }));
        }
      } catch (_) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const onSave = async () => {
    // validate cơ bản
    if (!form.hoten?.trim()) return push({ type: 'error', title: 'Không thể lưu', desc: 'Vui lòng nhập họ và tên' });
    if (!form.ngaysinh) return push({ type: 'error', title: 'Không thể lưu', desc: 'Vui lòng chọn ngày sinh' });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return push({ type: 'error', title: 'Email không hợp lệ' });
    try {
      const payload = {
        id: userLocal.id || userLocal.idnguoidung,
        hoten: form.hoten,
        email: form.email,
        sodienthoai: form.sodienthoai,
        diachi: form.diachi,
        ngaysinh: form.ngaysinh,
        gioitinh: form.gioitinh,
      };
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => fetch('http://127.0.0.1:8000/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
      if (!res?.ok) return push({ type: 'error', title: 'Cập nhật thất bại' });
      const json = await res.json();
      if (json?.success) {
        // lưu lại local để những trang khác dùng
        const current = { ...(userLocal || {}), ...json.data };
        localStorage.setItem('user', JSON.stringify(current));
        push({ type: 'success', title: 'Đã lưu hồ sơ', desc: 'Thông tin cá nhân đã được cập nhật.' });
      } else {
        push({ type: 'error', title: 'Cập nhật thất bại' });
      }
    } catch (e) {
      push({ type: 'error', title: 'Có lỗi xảy ra khi lưu' });
    }
  };

  const onChangePassword = (key) => async (e) => {
    const val = e.target.value;
    setPasswordForm({ ...passwordForm, [key]: val });
    if (!pwdTouched) setPwdTouched(true);
    if (key === 'current') {
      setCurrentPwdValid(null);
      if (val.trim().length > 0) {
        try {
          const payload = { id: (JSON.parse(localStorage.getItem('user')||'{}').id || JSON.parse(localStorage.getItem('user')||'{}').idnguoidung), current_password: val };
          const res = await fetch('/api/password/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .catch(() => fetch('http://127.0.0.1:8000/api/password/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
          if (res?.ok) {
            const json = await res.json();
            if (json?.success) setCurrentPwdValid(Boolean(json.valid));
            else setCurrentPwdValid(false);
          }
        } catch (_) {
          setCurrentPwdValid(false);
        }
      }
    }
  };
  const closePwdModal = () => {
    setShowPwdModal(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
    setPwdTouched(false);
  };
  const pwdRules = {
    hasCurrent: passwordForm.current.trim().length > 0,
    minLen: passwordForm.next.length >= 6,
    notSameAsOld: passwordForm.next && passwordForm.current && passwordForm.next !== passwordForm.current,
    confirmMatch: passwordForm.confirm && passwordForm.next === passwordForm.confirm,
  };
  const canSubmitPwd = pwdRules.hasCurrent && pwdRules.minLen && pwdRules.notSameAsOld && pwdRules.confirmMatch;
  const submitPassword = async () => {
    if (!passwordForm.current?.trim() || !passwordForm.next?.trim() || !passwordForm.confirm?.trim()) {
      return push({ type: 'error', title: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (currentPwdValid === false) {
      return push({ type: 'error', title: 'Mật khẩu hiện tại không đúng' });
    }
    if (passwordForm.next.length < 6) {
      return push({ type: 'error', title: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }
    if (passwordForm.next !== passwordForm.confirm) {
      return push({ type: 'error', title: 'Xác nhận mật khẩu không khớp' });
    }
    try {
      const payload = {
        id: userLocal.id || userLocal.idnguoidung,
        current_password: passwordForm.current,
        new_password: passwordForm.next,
        confirm_password: passwordForm.confirm,
      };
      const res = await fetch('/api/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => fetch('http://127.0.0.1:8000/api/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
      if (!res?.ok) {
        return push({ type: 'error', title: 'Đổi mật khẩu thất bại' });
      }
      const json = await res.json();
      if (json?.success) {
        push({ type: 'success', title: 'Đổi mật khẩu thành công' });
        closePwdModal();
      } else {
        push({ type: 'error', title: json?.message || 'Đổi mật khẩu thất bại' });
      }
    } catch (_) {
      push({ type: 'error', title: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white shadow-sm mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Thông tin cá nhân</h1>
        <p className="text-white/90 mt-1">Cập nhật họ tên, ngày sinh, liên lạc, học vấn.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3 rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <input className="input" placeholder="Họ và tên" value={form.hoten} onChange={onChange('hoten')} />
        <input type="date" className="input" placeholder="Ngày sinh" value={form.ngaysinh} onChange={onChange('ngaysinh')} />
        <select className="input" value={form.gioitinh} onChange={onChange('gioitinh')}>
          <option value="">Giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
        <input className="input" placeholder="CCCD" value={form.cccd} onChange={onChange('cccd')} />
        <input className="input" placeholder="Email" value={form.email} onChange={onChange('email')} />
        <input className="input" placeholder="Số điện thoại" value={form.sodienthoai} onChange={onChange('sodienthoai')} />
        <input className="input md:col-span-2" placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" value={form.diachi} onChange={onChange('diachi')} />
        <input className="input md:col-span-2" placeholder="VD: THPT Lê Quý Đôn / 2023" value={form.truongThpt} onChange={onChange('truongThpt')} />
        <div className="md:col-span-2 flex justify-between items-center gap-3 pt-2">
          <button className="rounded-xl px-4 py-2 border border-teal-600 text-teal-700 hover:bg-teal-50" onClick={() => setShowPwdModal(true)}>Cập nhật mật khẩu</button>
          <div className="flex gap-3">
            <button className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">Hủy</button>
            <button className="rounded-xl bg-teal-600 px-5 py-2.5 text-white font-medium shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300" onClick={onSave}>Lưu</button>
          </div>
        </div>
      </div>
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closePwdModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-800">Đổi mật khẩu</h2>
            <p className="text-slate-500 mt-1 mb-5">Vui lòng nhập mật khẩu hiện tại và đặt mật khẩu mới theo yêu cầu bên dưới.</p>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <input type={showPwd.current ? 'text' : 'password'} className={`input w-full pr-10 ${(pwdTouched && !pwdRules.hasCurrent) || currentPwdValid === false ? 'ring-1 ring-rose-300' : ''}`} placeholder="Mật khẩu hiện tại" value={passwordForm.current} onChange={onChangePassword('current')} />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}>{showPwd.current ? '🙈' : '👁️'}</button>
                </div>
                <div className="min-h-4">
                  {pwdTouched && !pwdRules.hasCurrent && (<p className="mt-1 text-xs text-rose-600">Vui lòng nhập mật khẩu hiện tại.</p>)}
                  {currentPwdValid === false && (<p className="mt-1 text-xs text-rose-600">Mật khẩu hiện tại không đúng.</p>)}
                </div>
              </div>
              <div>
                <div className="relative">
                  <input type={showPwd.next ? 'text' : 'password'} className={`input w-full pr-10 ${(pwdTouched && passwordForm.next && (!pwdRules.minLen || !pwdRules.notSameAsOld)) ? 'ring-1 ring-rose-300' : ''}`} placeholder="Mật khẩu mới" value={passwordForm.next} onChange={onChangePassword('next')} />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}>{showPwd.next ? '🙈' : '👁️'}</button>
                </div>
                <div className="min-h-4">
                  {pwdTouched && passwordForm.next && !pwdRules.minLen && (<p className="mt-1 text-xs text-rose-600">Mật khẩu mới tối thiểu 6 ký tự.</p>)}
                  {pwdTouched && passwordForm.next && !pwdRules.notSameAsOld && (<p className="mt-1 text-xs text-rose-600">Mật khẩu mới không được trùng mật khẩu hiện tại.</p>)}
                </div>
              </div>
              <div>
                <div className="relative">
                  <input type={showPwd.confirm ? 'text' : 'password'} className={`input w-full pr-10 ${pwdTouched && passwordForm.confirm && !pwdRules.confirmMatch ? 'ring-1 ring-rose-300' : ''}`} placeholder="Xác nhận mật khẩu mới" value={passwordForm.confirm} onChange={onChangePassword('confirm')} />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}>{showPwd.confirm ? '🙈' : '👁️'}</button>
                </div>
                <div className="min-h-4">
                  {pwdTouched && passwordForm.confirm && !pwdRules.confirmMatch && (<p className="mt-1 text-xs text-rose-600">Xác nhận mật khẩu không khớp.</p>)}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100" onClick={closePwdModal}>Hủy</button>
              <div title={!canSubmitPwd ? 'Vui lòng hoàn thành đủ các điều kiện' : (currentPwdValid === false ? 'Mật khẩu hiện tại không đúng' : '')}>
                <button disabled={!canSubmitPwd} className={`rounded-xl px-5 py-2.5 text-white font-medium shadow-sm ${!canSubmitPwd ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300'}`} onClick={submitPassword}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


