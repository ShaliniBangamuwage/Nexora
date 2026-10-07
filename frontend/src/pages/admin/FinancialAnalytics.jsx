import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import Card from "../../components/Card";
import PageLayout from "../../components/PageLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

/* ================= SAFE DATE HELPER ================= */
const getMonth = (val) => {
  if (!val) return -1;
  if (typeof val.toDate === "function") return val.toDate().getMonth();
  if (val instanceof Date) return val.getMonth();
  const d = new Date(val);
  return isNaN(d) ? -1 : d.getMonth();
};

/* ================= CUSTOM TOOLTIPS ================= */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="text-gray-500 font-medium mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
            <span className="text-gray-700">
              {entry.name}:{" "}
              <span className="font-semibold">Rs. {entry.value.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTierPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="text-gray-600 font-semibold mb-1">{d.tier} Cost</p>
        <p style={{ color: payload[0].fill }} className="font-bold">
          Rs. {d.amount.toLocaleString()}
        </p>
        <p className="text-gray-400 text-xs mt-0.5">
          {d.count} payment{d.count !== 1 ? "s" : ""} · {d.pct.toFixed(1)}% of total cost
        </p>
      </div>
    );
  }
  return null;
};

/* ================= MAIN COMPONENT ================= */
export default function FinancialAnalytics() {
  const [products, setProducts]             = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [payments, setPayments]             = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsSnap, customerSnap, paymentsSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "CustomerOrders")),
          // Only PAID payments count as actual cost — pending/partial-unpaid
          // payment docs (if any exist as separate records) are excluded here.
          getDocs(query(collection(db, "payments"), where("status", "==", "PAID"))),
        ]);
        setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCustomerOrders(customerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-700 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading analytics…</p>
        </div>
      </div>
    );

  /* ─────────────────────────────────────────────────────
     TOTAL COST
     Source: payments collection (status === "PAID")
     Logic : sum of amount across all paid payments.
             (payments don't reliably carry a category field,
             so cost is no longer grouped by category — see
             the price-tier breakdown further down instead)
  ───────────────────────────────────────────────────── */
  const totalCost = payments.reduce((s, p) => s + (p.amount || 0), 0);

  /* ─────────────────────────────────────────────────────
     OVERALL SUMMARY
  ───────────────────────────────────────────────────── */
  const totalRevenue = customerOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const profit       = totalRevenue - totalCost;
  const margin       = totalRevenue > 0
    ? ((profit / totalRevenue) * 100).toFixed(1)
    : "0.0";

  /* ─────────────────────────────────────────────────────
     COST BY PRICE TIER  (High / Medium / Low)
     Source: payments collection
     Logic : classify each paid payment into a tier based on
             where its amount falls relative to the tercile
             boundaries (33rd / 66th percentile) of all paid
             amounts — a data-driven High/Medium/Low split
             instead of a category, since payments don't
             reliably carry category. Each tier also keeps
             its top-paid entries so you can see which
             products/suppliers received the largest payments.
  ───────────────────────────────────────────────────── */
  const percentile = (sortedArr, p) => {
    if (!sortedArr.length) return 0;
    const idx   = (sortedArr.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
  };

  const sortedAmounts = payments.map((p) => p.amount || 0).sort((a, b) => a - b);
  const lowBoundary  = percentile(sortedAmounts, 1 / 3);
  const highBoundary = percentile(sortedAmounts, 2 / 3);

  const getTier = (amount) => {
    if (amount <= lowBoundary) return "Low";
    if (amount <= highBoundary) return "Medium";
    return "High";
  };

  const tierBuckets = { High: [], Medium: [], Low: [] };
  payments.forEach((p) => {
    tierBuckets[getTier(p.amount || 0)].push(p);
  });

  const TIER_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };

  const tierData = ["High", "Medium", "Low"].map((tier) => {
    const items  = tierBuckets[tier];
    const amount = items.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      tier,
      amount,
      count: items.length,
      pct: totalCost > 0 ? (amount / totalCost) * 100 : 0,
      topItems: [...items].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 3),
    };
  });

  /* ─────────────────────────────────────────────────────
     MONTHLY TREND  (payments collection for cost,
                     CustomerOrders for revenue)
     payments is already pre-filtered to status === "PAID"
     in the fetch above, so no extra filtering needed here.
  ───────────────────────────────────────────────────── */
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const trendData = months.map((month, i) => {
    const revenue = customerOrders
      .filter((o) => getMonth(o.createdAt) === i)
      .reduce((s, o) => s + (o.totalAmount || 0), 0);

    const cost = payments
      .filter((p) => getMonth(p.paidDate || p.createdAt) === i)
      .reduce((s, p) => s + (p.amount || 0), 0);

    return { month, Revenue: revenue, Cost: cost };
  });

  /* ─────────────────────────────────────────────────────
     COLOURS
  ───────────────────────────────────────────────────── */
  const CHART_COLORS = [
    "#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4",
    "#f97316","#ec4899","#84cc16","#3b82f6","#a16207",
    "#0ea5e9","#d946ef","#14b8a6","#f43f5e","#6366f1",
  ];

  const summaryCards = [
    { title: "Total Cost",    value: `Rs. ${totalCost.toLocaleString()}` },
    { title: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString()}` },
    { title: "Net Profit",    value: `Rs. ${profit.toLocaleString()}` },
    { title: "Profit Margin", value: `${margin}%` },
  ];

  /* ─────────────────────────────────────────────────────
     COST ANALYSIS BY PAYMENT TYPE
     Source: payments collection
     Groups paid amounts by paymentType (e.g. ADVANCE,
     FINAL) instead of by supplier — shows the *structure*
     of spending (how much is upfront vs. final settlement)
     which is more useful for financial analysis than a
     flat list of who was paid.
  ───────────────────────────────────────────────────── */
  const paymentTypeTotals = {};
  payments.forEach((p) => {
    const type = p.paymentType || "OTHER";
    if (!paymentTypeTotals[type]) paymentTypeTotals[type] = { amount: 0, count: 0 };
    paymentTypeTotals[type].amount += p.amount || 0;
    paymentTypeTotals[type].count  += 1;
  });

  const paymentTypeData = Object.entries(paymentTypeTotals)
    .map(([type, d]) => ({
      type,
      amount: d.amount,
      count: d.count,
      pct: totalCost > 0 ? (d.amount / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const avgPayment    = payments.length ? totalCost / payments.length : 0;
  const largestPayment = payments.length ? Math.max(...payments.map((p) => p.amount || 0)) : 0;

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <PageLayout
      title="Financial Analytics"
      subtitle="Track costs, revenue, and profit margins"
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.title} title={card.title} value={card.value} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-6">

        {/* Bar Chart - monthly trend */}
        <div className="bg-white rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Revenue vs Cost Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly breakdown for current year</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
              Monthly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={trendData} barGap={4} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12, color: "#64748b" }} />
              <Bar dataKey="Revenue" fill="#10b981" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Cost"    fill="#f59e0b" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart - cost by price tier */}
        <div className="bg-white rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Cost by Price Tier</h3>
              <p className="text-xs text-gray-400 mt-0.5">Paid amounts split into High / Medium / Low</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
              Donut
            </span>
          </div>

          {/* Show message if no payment data yet */}
          {totalCost === 0 ? (
            <div className="flex flex-col items-center justify-center h-[270px] gap-2">
              <p className="text-sm text-gray-400 text-center">
                No paid payments yet.
              </p>
              <p className="text-xs text-gray-300 text-center">
                Payments with <span className="font-semibold">status: PAID</span> will show up here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={tierData.filter((t) => t.amount > 0)}
                  dataKey="amount"
                  nameKey="tier"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {tierData
                    .filter((t) => t.amount > 0)
                    .map((t) => (
                      <Cell key={t.tier} fill={TIER_COLORS[t.tier]} stroke="transparent" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTierPieTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cost by Price Tier */}
      <div className="bg-white rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Cost by Price Tier</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Payments grouped High / Medium / Low by amount paid (status: PAID)
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
            {payments.length} Payments
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-slate-400 text-sm">No payments recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tierData.map((t) => (
              <div key={t.tier} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TIER_COLORS[t.tier] }} />
                    <span className="font-semibold text-gray-800 text-sm">{t.tier} Cost</span>
                    <span className="text-[10px] text-gray-400">
                      {t.count} payment{t.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-gray-800">
                      Rs. {t.amount.toLocaleString()}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ color: TIER_COLORS[t.tier], background: `${TIER_COLORS[t.tier]}1a` }}
                    >
                      {t.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: TIER_COLORS[t.tier] }} />
                </div>

                {t.topItems.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Top paid
                    </p>
                    {t.topItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate max-w-[60%]">
                          {item.productName || "N/A"}{" "}
                          <span className="text-gray-400">· {item.supplierName || "N/A"}</span>
                        </span>
                        <span className="font-mono font-medium text-gray-700">
                          Rs. {(item.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cost Analysis by Payment Type */}
      <div className="bg-white rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Cost Analysis by Payment Type</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              How paid cost breaks down by advance vs. final settlement (status: PAID)
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
            {payments.length} Payments
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-slate-400 text-sm">No payments recorded</p>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] text-gray-400 mb-1">Total Paid</p>
                <p className="text-sm font-bold text-gray-800 font-mono">Rs. {totalCost.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] text-gray-400 mb-1">Average Payment</p>
                <p className="text-sm font-bold text-gray-800 font-mono">
                  Rs. {avgPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] text-gray-400 mb-1">Largest Payment</p>
                <p className="text-sm font-bold text-gray-800 font-mono">Rs. {largestPayment.toLocaleString()}</p>
              </div>
            </div>

            {/* Ranked bars by payment type */}
            <div className="space-y-4">
              {paymentTypeData.map((pt, i) => (
                <div key={pt.type} className="flex items-center gap-4">
                  <div className="w-28 shrink-0">
                    <span className="text-xs font-semibold text-gray-700 capitalize">{pt.type.toLowerCase()}</span>
                    <p className="text-[10px] text-gray-400">
                      {pt.count} payment{pt.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pt.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                  <div className="w-28 text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-gray-700">
                      Rs. {pt.amount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-gray-400">{pt.pct.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </PageLayout>
  );
}