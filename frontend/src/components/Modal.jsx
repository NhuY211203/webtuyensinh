export default function Modal({ open, title, children, onClose, maxWidth = "max-w-2xl" }) {
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`card w-full ${maxWidth} relative max-h-[90vh] flex flex-col my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-base sm:text-lg pr-2">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 sm:p-2 rounded-full hover:bg-gray-100 flex-shrink-0 text-lg sm:text-xl leading-none"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
