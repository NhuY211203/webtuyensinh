import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext({ push: (_t) => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((t) => {
    const it = { id: Date.now(), type: "info", ...t };
    setItems((s) => [...s, it]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== it.id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-3">
        {items.map((i) => (
          <div
            key={i.id}
            className={[
              "w-[320px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-white/90",
              i.type === "success" && "border-emerald-200",
              i.type === "error" && "border-rose-200",
              i.type === "info" && "border-slate-200",
            ].join(" ")}
          >
            <div className={`text-sm font-semibold ${i.type === "success" ? "text-emerald-700" : i.type === "error" ? "text-rose-700" : "text-slate-800"}`}>
              {i.title}
            </div>
            {i.desc ? <div className="text-xs mt-1 text-slate-600">{i.desc}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}


// Simple standalone Toast component for on-demand usage
// This default export is used by pages that expect a lightweight toast API
// separate from the context provider above.
export default function Toast({ show, message, type = "info", onClose }) {
  if (!show) return null;
  const bgColor = type === "success" ? "bg-emerald-50 border-emerald-200" : type === "error" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200";
  const textColor = type === "success" ? "text-emerald-700" : type === "error" ? "text-rose-700" : "text-slate-800";
  
  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className={`w-[320px] rounded-xl border-2 px-4 py-3 shadow-2xl ${bgColor} ${textColor}`}> 
        <div className="flex items-center gap-3">
          <div className={`text-sm font-semibold flex-1 ${textColor}`}>
            {type === "success" && "✅ "}
            {type === "error" && "❌ "}
            {message}
          </div>
          <button 
            onClick={onClose} 
            className={`text-sm font-bold ${textColor} hover:opacity-70 transition-opacity`}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

