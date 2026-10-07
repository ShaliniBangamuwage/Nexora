/**
 * ResponsiveTable — src/components/ResponsiveTable.jsx
 *
 * Props:
 *  columns     → [{ key, label, render? }]
 *  data        → array of row objects
 *  keyField    → unique key field (default: 'id')
 *  emptyMessage→ string shown when no data
 *  loading     → boolean
 *  cardTitle   → column key used as card title on mobile (default: first col)
 *  cardBadge   → column key shown top-right as badge on mobile
 *  actions     → (row) => JSX  — renders action buttons per row
 */
export default function ResponsiveTable({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No data found',
  loading = false,
  cardTitle,
  cardBadge,
  actions,
}) {
  const titleKey = cardTitle || columns[0]?.key;

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const renderCell = (col, row) =>
    col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');

  return (
    <>
      {/* ── DESKTOP: normal table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-slate-700 text-[13px]">
                    {renderCell(col, row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3.5">{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE: card layout ── */}
      <div className="md:hidden flex flex-col divide-y divide-slate-100">
        {data.map((row, idx) => {
          const otherCols = columns.filter(
            (col) => col.key !== titleKey && col.key !== cardBadge
          );
          return (
            <div key={row[keyField] ?? idx} className="p-4">
              {/* Title + badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-semibold text-slate-800 text-sm flex-1 truncate">
                  {renderCell(columns.find((c) => c.key === titleKey) || columns[0], row)}
                </div>
                {cardBadge && (
                  <div className="shrink-0">
                    {renderCell(columns.find((c) => c.key === cardBadge), row)}
                  </div>
                )}
              </div>

              {/* Other fields */}
              <div className="flex flex-col gap-1.5 mb-3">
                {otherCols.map((col) => (
                  <div key={col.key} className="flex items-start gap-2">
                    <span className="text-[11px] text-slate-400 w-24 shrink-0 pt-0.5">
                      {col.label}
                    </span>
                    <span className="text-[12px] text-slate-700 flex-1">
                      {renderCell(col, row)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex gap-2">{actions(row)}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
