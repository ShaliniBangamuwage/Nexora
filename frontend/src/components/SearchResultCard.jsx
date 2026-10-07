/**
 * SearchResultCard
 * Renders one search result as a table-style row card,
 * matching the existing Products.jsx table aesthetic.
 */

const C = {
  surface:     'var(--bg-secondary)',
  border:      'var(--navbar-border)',
  textPrimary: 'var(--text-primary)',
  textMuted:   'var(--text-secondary)',
  accent:      'var(--accent-blue)',
};

export default function SearchResultCard({ product, onOrderClick, pendingOrder }) {
  const getScoreBadge = (score) => {
    if (score >= 90) return { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' };
    if (score >= 70) return { background: 'rgba(37,99,235,0.10)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.22)' };
    if (score >= 50) return { background: 'rgba(217,119,6,0.10)',  color: '#d97706', border: '1px solid rgba(217,119,6,0.22)' };
    return           { background: 'rgba(100,116,139,0.10)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' };
  };

  const getStockStyle = (stock) =>
    stock <= 100
      ? { color: '#ef4444', fontWeight: 600 }
      : { color: C.textPrimary, fontWeight: 600 };

  const getOrderStatusBadge = () => {
    if (!pendingOrder) return null;
    const styles = {
      PENDING:  { background: 'rgba(217,119,6,0.10)',   color: '#b45309', border: '1px solid rgba(217,119,6,0.3)' },
      ACCEPTED: { background: 'rgba(16,185,129,0.10)',  color: '#059669', border: '1px solid rgba(16,185,129,0.3)' },
      REJECTED: { background: 'rgba(239,68,68,0.10)',   color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' },
    };
    const style = styles[pendingOrder.status] || { background: 'rgba(100,116,139,0.08)', color: C.textMuted };
    const label =
      pendingOrder.status.charAt(0) + pendingOrder.status.slice(1).toLowerCase();
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase" style={style}>
          {label}
        </span>
        <span className="text-[11px]" style={{ color: C.textMuted }}>Qty: {pendingOrder.quantity}</span>
      </div>
    );
  };

  return (
    <div
      className="rounded-xl px-4 py-3.5 flex items-center gap-4 min-w-0 transition-all duration-150"
      style={{
        background:  C.surface,
        border:      `1px solid ${C.border}`,
        boxShadow:   '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,135,225,0.12)'; e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = C.border; }}
    >

      {/* Product Code */}
      <div className="w-24 flex-shrink-0">
        <span className="text-sm font-mono" style={{ color: C.textMuted }}>{product.productCode || "—"}</span>
      </div>

      {/* Product Name + Manufacturer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate" style={{ color: C.textPrimary }}>
            {product.productName}
          </p>
          {/* AI Match badge — only for vector results */}
          {product.searchSource === "vector" && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[11px] rounded font-semibold" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
              AI Match
            </span>
          )}
        </div>
        {product.manufacturer && (
          <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{product.manufacturer}</p>
        )}
      </div>

      {/* Category */}
      <div className="w-28 flex-shrink-0 hidden md:block">
        <span className="text-sm" style={{ color: C.textPrimary }}>{product.category}</span>
      </div>

      {/* Supplier */}
      <div className="w-32 flex-shrink-0 hidden lg:block">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
          {product.supplierName || "—"}
        </span>
      </div>

      {/* Stock */}
      <div className="w-20 flex-shrink-0 text-center">
        <span className="text-sm" style={getStockStyle(product.stock)}>
          {product.stock ?? "—"}
        </span>
        {product.stock <= 100 && (
          <span className="ml-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            LOW
          </span>
        )}
      </div>

      {/* Prices */}
      <div className="w-24 flex-shrink-0 hidden xl:block text-sm" style={{ color: C.textPrimary }}>
        Rs. {product.wholesalePrice ? Number(product.wholesalePrice).toFixed(2) : "0.00"}
      </div>
      <div className="w-24 flex-shrink-0 hidden xl:block text-sm" style={{ color: C.textPrimary }}>
        Rs. {product.retailPrice ? Number(product.retailPrice).toFixed(2) : "0.00"}
      </div>

      {/* Similarity Score */}
      <div className="w-24 flex-shrink-0 text-center">
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={getScoreBadge(product.similarityScore)}>
          {product.similarityScore}% match
        </span>
      </div>

      {/* Order Status */}
      <div className="w-28 flex-shrink-0 text-center">
        {getOrderStatusBadge() || (
          <span className="italic text-sm" style={{ color: C.textMuted }}>—</span>
        )}
      </div>

      {/* Action */}
      <div className="w-28 flex-shrink-0 text-right">
        {product.stock <= 100 && (
          <button
            onClick={() => onOrderClick(product)}
            disabled={pendingOrder?.status === "PENDING"}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md"
          >
            {pendingOrder?.status === "PENDING" ? "Order Sent" : "Order Now"}
          </button>
        )}
      </div>
    </div>
  );
}