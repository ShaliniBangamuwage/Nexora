const ProductCatalogHeader = ({ currentUser }) => {
  return (
    <div className="mb-6 bg-white p-6 rounded-2xl shadow-md">
      <h1 className="text-[28px] font-bold mb-1 text-slate-900">Product Catalog</h1>
      <p className="text-slate-500 text-sm">Manage your products supplied to MediCareX</p>
      {currentUser && (
        <span className="inline-block mt-3 bg-blue-50 text-blue-700 text-[13px] font-medium px-3 py-1 rounded-full">
          Logged in as: {currentUser.name}
        </span>
      )}
    </div>
  );
};

export default ProductCatalogHeader;