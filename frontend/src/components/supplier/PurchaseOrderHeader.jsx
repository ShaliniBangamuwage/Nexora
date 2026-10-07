const PurchaseOrderHeader = ({ supplierName }) => {
  return (
    <div className="mb-7 bg-white p-6 rounded-2xl shadow-md">
      <h1 className="text-[28px] font-bold mb-1 text-slate-900">Purchase Orders</h1>
      <p className="text-slate-500 text-sm">Orders received from MediCareX pharmacy</p>
      {supplierName && (
        <span className="inline-block mt-3 bg-blue-50 text-blue-700 text-[13px] font-medium px-3 py-1 rounded-full">
          Logged in as: {supplierName}
        </span>
      )}
    </div>
  );
};

export default PurchaseOrderHeader;