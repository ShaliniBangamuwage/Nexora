const ModalWrap = ({ onClose, maxW = "max-w-[700px]", children }) => (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5"
    style={{ animation: "fadeIn 0.2s ease-out" }}
    onClick={onClose}
  >
    <div
      className={`bg-white rounded-2xl ${maxW} w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
      style={{ animation: "slideUp 0.3s ease-out" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export default ModalWrap;