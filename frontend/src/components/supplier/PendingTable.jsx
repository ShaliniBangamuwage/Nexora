import CategoryBadge from './CategoryBadge';

const STATUS_BADGE = {
  pending:  { cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',    dot: 'bg-amber-400',    label: 'Pending Approval' },
  approved: { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500', label: 'Approved' },
  rejected: { cls: 'bg-red-50 text-red-600 ring-1 ring-red-200',           dot: 'bg-red-500',      label: 'Rejected' },
};

const PendingTable = ({ loading, filteredPending, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-3 text-slate-400 text-[15px]">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading...
          </div>
        </div>
      ) : filteredPending.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-700">No pending submissions</p>
          <p className="text-[13px] text-slate-400">Products you submit will appear here for review</p>
        </div>
      ) : (
        <>
          <div className="mx-4 mt-4 mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[12.5px] text-amber-800 leading-relaxed">
              Products listed here are awaiting admin review. Once approved, they will appear in the{' '}
              <strong>Active Products</strong> tab and be visible in the admin inventory.
              This list updates in real-time — no need to refresh.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Product Name', 'Category', 'Wholesale Price', 'Stock', 'Expiry Date', 'Submitted', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.map((product) => {
                  const badge = STATUS_BADGE[product.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 text-[14px] leading-snug">{product.productName}</p>
                        {product.manufacturer && (
                          <p className="text-[11.5px] text-slate-400 mt-0.5">{product.manufacturer}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <CategoryBadge value={product.category} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[14px] font-bold text-slate-800">Rs.{Number(product.wholesalePrice).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-[13.5px] text-slate-600">{product.stock} units</td>
                      <td className="px-5 py-4 text-[12.5px] text-slate-500">{formatDate(product.expireDate)}</td>
                      <td className="px-5 py-4 text-[12.5px] text-slate-400">{formatDate(product.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${badge.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        {product.status === 'rejected' && product.rejectionReason && (
                          <p className="text-[11px] text-red-500 mt-1.5 leading-snug">{product.rejectionReason}</p>
                        )}
                        {product.status === 'approved' && product.productCode && (
                          <p className="text-[11px] text-emerald-600 mt-1.5 font-mono font-semibold">{product.productCode}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PendingTable;