import CategoryBadge from './CategoryBadge';

const ProductTable = ({ loading, filteredProducts, onAddClick, onEdit, onDelete, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-3 text-slate-400 text-[15px]">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading products...
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-slate-700 mb-1">No approved products yet</p>
            <p className="text-[13px] text-slate-400">Submit a product to get started</p>
          </div>
          <button
            onClick={onAddClick}
            className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-[14px] font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Submit Your First Product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Product Name', 'Category', 'Wholesale Price', 'Stock Supplied', 'Availability', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/60 transition-colors duration-150 group">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 text-[14px] leading-snug">{product.productName}</p>
                    <p className="text-[11.5px] text-slate-400 font-mono mt-0.5">{product.productCode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <CategoryBadge value={product.category} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] font-bold text-slate-800">Rs.{Number(product.wholesalePrice).toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-4 text-[13.5px] text-slate-600">{product.stock} units</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${
                      product.availability === 'in stock'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.availability === 'in stock' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {product.availability}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-800 text-gray-700 hover:text-white text-[12.5px] font-semibold rounded-lg border border-gray-200 hover:border-gray-800 transition-all duration-200"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id, product.productName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white text-[12.5px] font-semibold rounded-lg border border-red-200 hover:border-red-600 transition-all duration-200"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductTable;