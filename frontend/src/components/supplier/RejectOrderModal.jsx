import ModalWrap from './ModalWrap';

const RejectOrderModal = ({ order, rejectReason, setRejectReason, onConfirm, onClose }) => {
  if (!order) return null;

  return (
    <ModalWrap onClose={onClose} maxW="max-w-[480px]">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-red-500 flex-shrink-0" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight m-0">Reject Order</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border-none rounded-lg cursor-pointer transition-all duration-200 text-lg font-bold"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-6">

        {/* Order info pill */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Reference</p>
          <p className="text-sm font-bold text-gray-900 m-0">{order.poId}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{order.product || order.productName}</p>
        </div>

        {/* Reason textarea */}
        <div className="flex flex-col mb-5">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Out of stock, Product discontinued, Pricing issue..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 bg-gray-50/40 resize-y transition-all duration-200 focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-500/10 box-border"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-600 font-bold text-sm rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-200 uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!rejectReason.trim()}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl border-none cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(239,68,68,0.25)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.35)] hover:-translate-y-px uppercase tracking-wider"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </ModalWrap>
  );
};

export default RejectOrderModal;