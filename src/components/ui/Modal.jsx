export default function Modal({ open, onClose, children, className = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Card */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={`rounded-2xl bg-slate-900 border border-white/10 shadow-2xl w-full max-w-2xl ${className}`}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
