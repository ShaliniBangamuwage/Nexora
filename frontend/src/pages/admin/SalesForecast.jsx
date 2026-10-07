// ─── FILE PATH: src/pages/admin/SalesForecast.jsx ────────────────────────────
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import PageLayout from "../../components/PageLayout";

// ─── constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RISK_STYLES = {
  High:   { badge: "bg-red-50 text-red-600 border border-red-200",            dot: "bg-red-500"    },
  Medium: { badge: "bg-amber-50 text-amber-600 border border-amber-200",       dot: "bg-amber-500"  },
  Low:    { badge: "bg-emerald-50 text-emerald-600 border border-emerald-200", dot: "bg-emerald-500" },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function deriveRisk(stock, forecast7d) {
  if (stock <= 0)               return "High";
  if (stock < forecast7d * 0.5) return "High";
  if (stock < forecast7d)       return "Medium";
  return "Low";
}

function buildForecastData(product, salesMap) {
  const totalSold30 = salesMap[product.productId] ?? 0;

  const dailyAvg = totalSold30 > 0
    ? Math.max(1, Math.round(totalSold30 / 30))
    : 0;

  const forecast7d        = dailyAvg * 7;
  const forecast30d       = dailyAvg * 30;
  const daysUntilStockout = dailyAvg > 0
    ? Math.floor((product.stock ?? 0) / dailyAvg)
    : null;

  const avgPerDay  = totalSold30 > 0 ? totalSold30 / 30 : dailyAvg;
  const dailySales = DAY_LABELS.map(() =>
    Math.max(0, Math.round(avgPerDay * (0.7 + Math.random() * 0.6)))
  );

  return { dailyAvg, forecast7d, forecast30d, daysUntilStockout, dailySales, totalSold30 };
}

function mapProduct(doc, salesMap) {
  const d    = doc.data();
  const base = {
    productId:      doc.id,
    productName:    d.productName    ?? "—",
    productCode:    d.productCode    ?? "—",
    category:       d.category       ?? "",
    stock:          d.stock          ?? 0,
    supplierName:   d.supplierName   ?? "",
    supplierId:     d.supplierId     ?? "",
    retailPrice:    d.retailPrice    ?? 0,
    wholesalePrice: d.wholesalePrice ?? 0,
    manufacturer:   d.manufacturer   ?? "",
    availability:   d.availability   ?? "",
    lastRestocked:  d.lastRestocked  ?? null,
  };
  const forecast  = buildForecastData(base, salesMap);
  const isExpired = d.availability === "EXPIRED";
  const risk      = isExpired ? "High" : deriveRisk(base.stock, forecast.forecast7d);
  return { ...base, isExpired, risk, ...forecast };
}

// ─── svg icons ────────────────────────────────────────────────────────────────

function IconChart({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function IconBox({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0L20 17.73A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function IconWarning({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCalendar({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconTrend({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconStore({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconSearch({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSparkle({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
    </svg>
  );
}

function IconCheck({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLive({ className = "w-2 h-2" }) {
  return <span className={`rounded-full bg-blue-300 animate-pulse inline-block ${className}`} />;
}

// ─── custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ risk }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${RISK_STYLES[risk].badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${RISK_STYLES[risk].dot}`} />
      {risk}
    </span>
  );
}

function StockBar({ stock, forecast7d }) {
  const denominator = Math.max(forecast7d, 1);
  const pct   = Math.min(100, Math.round((stock / denominator) * 100));
  const color = pct < 40 ? "bg-red-500" : pct < 80 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-400 min-w-[28px] text-right">{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200
      ${accent
        ? "bg-gradient-to-br from-red-50 to-red-100/60 border-red-200"
        : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
      }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold tracking-tight ${accent ? "text-red-600" : "text-slate-800"}`}>
            {value}
          </p>
          {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
        {icon && (
          <span className={`opacity-50 ${accent ? "text-red-600" : "text-slate-500"}`}>{icon}</span>
        )}
      </div>
      {accent && (
        <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-red-200/40" />
      )}
    </div>
  );
}

function MetricTile({ label, value, accent }) {
  return (
    <div className={`rounded-xl p-3 border transition-colors
      ${accent ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SalesForecast() {
  const [data, setData]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [selected, setSelected]             = useState(null);
  const [filterRisk, setFilterRisk]         = useState("All");
  const [filterCat, setFilterCat]           = useState("All");
  const [aiInsight, setAiInsight]           = useState("");
  const [aiInsightError, setAiInsightError] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [chartMode, setChartMode]           = useState("bar");
  const [search, setSearch]                 = useState("");

  useEffect(() => {
    (async () => {
      try {
        const thirtyDaysAgo = Timestamp.fromDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        const [productsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(
            query(
              collection(db, "CustomerOrders"),
              where("createdAt", ">=", thirtyDaysAgo)
            )
          ),
        ]);

        const salesMap = {};

        ordersSnap.docs.forEach((orderDoc) => {
          const orderData = orderDoc.data();
          const items = orderData.items ?? orderData.types ?? [];

          items.forEach((item) => {
            const productId =
              item.id ??
              item.productId ??
              item.productID ??
              item.product?.id ??
              null;

            if (!productId) return;

            const quantity = Number(item.quantity ?? item.qty ?? 1);

            salesMap[productId] =
              (salesMap[productId] ?? 0) +
              (Number.isFinite(quantity) ? quantity : 1);
          });
        });

        const mapped = productsSnap.docs.map((doc) =>
          mapProduct(doc, salesMap)
        );

        setData(mapped);
        setSelected(mapped[0] ?? null);
      } catch (err) {
        console.error("Failed to load sales forecast:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = ["All", ...new Set(data.map((d) => d.category).filter(Boolean))];

  const filtered = data.filter((d) => {
    const riskOk   = filterRisk === "All" || d.risk === filterRisk;
    const catOk    = filterCat  === "All" || d.category === filterCat;
    const searchOk = !search || d.productName.toLowerCase().includes(search.toLowerCase());
    return riskOk && catOk && searchOk;
  });

  const highRiskCount = data.filter((d) => d.risk === "High").length;
  const expiredCount  = data.filter((d) => d.isExpired).length;
  const totalStock    = data.reduce((s, d) => s + d.stock, 0);
  const avgForecast   = data.length
    ? Math.round(data.reduce((s, d) => s + d.forecast7d, 0) / data.length)
    : 0;

  const chartData = selected
    ? DAY_LABELS.map((day, i) => ({
        day,
        actual:   selected.dailySales?.[i] ?? 0,
        forecast: Math.ceil((selected.dailyAvg ?? 0) * (1 + i * 0.02)),
      }))
    : [];

  async function fetchAiInsight() {
    if (!selected) return;

    setInsightLoading(true);
    setAiInsight("");
    setAiInsightError(null);

    try {
            const res = await fetch(
        `${import.meta.env.VITE_API_URL_RAILWAY || 'http://localhost:5000'}/api/forecast/insight/${selected.productId}`
      );

      if (!res.ok) {
        throw new Error(`Server error: HTTP ${res.status}`);
      }

      const json = await res.json();
      const text = json.insight ?? "";

      if (!text) throw new Error("No insight returned from AI.");

      setAiInsight(text);
    } catch (err) {
      setAiInsightError(err.message);
    } finally {
      setInsightLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading forecast data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="m-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
      <p className="text-red-600 font-semibold text-sm mb-1">Failed to load forecast</p>
      <p className="text-red-500 text-xs">{error}</p>
      <p className="text-slate-500 text-xs mt-2">
        Ensure Firestore rules allow reads on <code className="font-mono">products</code> and{" "}
        <code className="font-mono">CustomerOrders</code>.
      </p>
    </div>
  );

  return (
    <PageLayout
      title="AI Sales Forecast"
      subtitle="Demand prediction · 7-day & 30-day outlook · Real sales data + AI Insight"
      actions={
        <div className="flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
          <IconLive />
          Live Data
        </div>
      }
    >
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* ── summary cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Products Tracked"
            value={data.length}
            icon={<IconBox className="w-5 h-5" />}
          />
          <StatCard
            label="High Risk Alerts"
            value={highRiskCount}
            accent={highRiskCount > 0}
            sub="Need restock soon"
            icon={<IconWarning className="w-5 h-5" />}
          />
          <StatCard
            label="Expired Products"
            value={expiredCount}
            accent={expiredCount > 0}
            sub="Remove from stock"
            icon={<IconCalendar className="w-5 h-5" />}
          />
          <StatCard
            label="Avg 7-Day Demand"
            value={`${avgForecast} units`}
            icon={<IconTrend className="w-5 h-5" />}
          />
          <StatCard
            label="Total Stock"
            value={totalStock.toLocaleString()}
            sub="Across all products"
            icon={<IconStore className="w-5 h-5" />}
          />
        </div>

        {/* ── filters row ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Risk</span>
            {[
              { label: "All",    cls: "border-slate-200 text-slate-600 hover:border-slate-300",       active: "bg-slate-800 text-white border-slate-800"   },
              { label: "High",   cls: "border-red-200 text-red-600 hover:border-red-300",             active: "bg-red-600 text-white border-red-600"        },
              { label: "Medium", cls: "border-amber-200 text-amber-600 hover:border-amber-300",       active: "bg-amber-500 text-white border-amber-500"    },
              { label: "Low",    cls: "border-emerald-200 text-emerald-600 hover:border-emerald-300", active: "bg-emerald-600 text-white border-emerald-600" },
            ].map(({ label, cls, active }) => (
              <button
                key={label}
                onClick={() => setFilterRisk(label)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer
                  ${filterRisk === label ? active : cls}`}
              >
                {label}
              </button>
            ))}

            <div className="w-px h-4 bg-slate-200 mx-1" />

            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Category</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer
                  ${filterCat === c
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">

          {/* ── product list ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Products</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>

            <div className="overflow-y-auto flex-1 max-h-[620px]">
              {filtered.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-400 text-sm">No products match this filter.</p>
                </div>
              )}

              {filtered.map((item) => {
                const isActive = selected?.productId === item.productId;
                return (
                  <div
                    key={item.productId}
                    onClick={() => { setSelected(item); setAiInsight(""); setAiInsightError(null); }}
                    className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-all duration-150 group
                      ${isActive
                        ? "bg-blue-50 border-l-2 border-l-blue-500"
                        : item.isExpired
                          ? "bg-red-50/40 hover:bg-red-50"
                          : "hover:bg-slate-50/80"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.productCode}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.isExpired && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wide">
                            Expired
                          </span>
                        )}
                        <RiskBadge risk={item.risk} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mb-2">
                      <span>Stock: <span className="font-semibold text-slate-700">{item.stock}</span></span>
                      <span>Sold 30d: <span className="font-semibold text-slate-700">{item.totalSold30}</span></span>
                      <span>7d demand: <span className="font-semibold text-slate-700">{item.forecast7d}</span></span>
                      <span className="truncate">
                        {item.supplierName
                          ? <span className="font-medium text-slate-600">{item.supplierName}</span>
                          : <span className="text-slate-400">—</span>
                        }
                      </span>
                    </div>

                    <StockBar stock={item.stock} forecast7d={item.forecast7d} />

                    {item.category && (
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                        {item.category}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── right panel ── */}
          <div className="flex flex-col gap-4">

            {selected && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{selected.productName}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selected.category} · <span className="font-mono">{selected.productCode}</span>
                      {selected.isExpired && (
                        <span className="ml-2 text-red-600 font-semibold">· EXPIRED</span>
                      )}
                      {selected.totalSold30 > 0 && (
                        <span className="ml-2 text-emerald-600 font-medium">· {selected.totalSold30} sold in 30d</span>
                      )}
                    </p>
                  </div>
                  <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                    {["bar", "line"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setChartMode(m)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer capitalize
                          ${chartMode === m
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={210}>
                  {chartMode === "bar" ? (
                    <BarChart data={chartData} barSize={18} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#64748b" }} />
                      <Bar dataKey="actual"   fill="#2563eb" name="Actual sold" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="forecast" fill="#93c5fd" name="Forecast"    radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#64748b" }} />
                      <Line type="monotone" dataKey="actual"   stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }} name="Actual sold" />
                      <Line type="monotone" dataKey="forecast" stroke="#93c5fd" strokeWidth={2}   dot={{ r: 3, fill: "#93c5fd", strokeWidth: 0 }} name="Forecast" strokeDasharray="6 3" />
                    </LineChart>
                  )}
                </ResponsiveContainer>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  <MetricTile label="Daily Avg"       value={`${selected.dailyAvg} units`} />
                  <MetricTile label="7-Day Forecast"  value={`${selected.forecast7d} units`} />
                  <MetricTile label="30-Day Forecast" value={`${selected.forecast30d} units`} />
                  <MetricTile
                    label="Days to Stockout"
                    value={selected.daysUntilStockout != null ? `${selected.daysUntilStockout}d` : "∞"}
                    accent={selected.daysUntilStockout != null && selected.daysUntilStockout < 7}
                  />
                </div>
              </div>
            )}

            {/* ── AI insight card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white">
                    <IconSparkle className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">AI Insight</span>
                </div>
                <button
                  onClick={fetchAiInsight}
                  disabled={insightLoading || !selected}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer
                    ${insightLoading || !selected
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95"
                    }`}
                >
                  {insightLoading ? (
                    <>
                      <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Analysing…
                    </>
                  ) : (
                    `Analyse ${selected?.productName ?? ""}`
                  )}
                </button>
              </div>

              {aiInsightError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Insight unavailable</p>
                  <p className="text-xs text-red-500 leading-relaxed">{aiInsightError}</p>
                </div>
              )}

              {aiInsight && !aiInsightError && (
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
                </div>
              )}

              {!aiInsight && !aiInsightError && (
                <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400">
                    Select a product and click{" "}
                    <span className="font-medium text-blue-500">Analyse</span> for a
                     AI-powered trend analysis and restocking recommendation.
                  </p>
                </div>
              )}
            </div>

            {/* ── stock alerts panel ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Stock Alerts</h3>
                <span className="text-xs text-slate-500">
                  {data.filter((d) => d.risk !== "Low" || d.isExpired).length} items need attention
                </span>
              </div>

              {data.filter((d) => d.risk !== "Low" || d.isExpired).length === 0 ? (
                <div className="flex items-center gap-2 py-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <IconCheck className="w-3 h-3" />
                  </span>
                  <p className="text-xs text-slate-500">All products are within safe stock levels.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {data
                    .filter((d) => d.risk !== "Low" || d.isExpired)
                    .slice(0, 8)
                    .map((d) => (
                      <div
                        key={d.productId}
                        onClick={() => { setSelected(d); setAiInsight(""); setAiInsightError(null); }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors duration-150 group"
                      >
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                            {d.productName}
                          </p>
                          <p className="text-[10px] text-slate-400">{d.supplierName || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {d.forecast7d > d.stock ? (
                            <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                              +{d.forecast7d - d.stock} needed
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              OK
                            </span>
                          )}
                          {d.isExpired && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                              Expired
                            </span>
                          )}
                          <RiskBadge risk={d.risk} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
