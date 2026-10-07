import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import Card from "../../components/Card";
import PageLayout from "../../components/PageLayout";
import ResponsiveTable from "../../components/ResponsiveTable";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

/* ─── constants ─────────────────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BLUE_PALETTE = ["#1d4ed8","#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#2563eb"];
const CURRENT_YEAR = new Date().getFullYear();

/* ─── helpers ───────────────────────────────────────────────── */
const toDate = (v) => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  return new Date(v);
};

const fmtRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


/* ─── sub-components ────────────────────────────────────────── */
const SectionCard = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
    <h3 className="text-base font-semibold text-slate-700 mb-5">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label, prefix = "Rs. " }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {prefix}{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ─── main component ─────────────────────────────────────────── */
export default function SalesAnalytics() {
  const [payments, setPayments]             = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [year, setYear]                     = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab]           = useState("overview"); // overview | products | suppliers

  /* ── fetch ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const [pySnap, coSnap] = await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "CustomerOrders")),
        ]);
        setPayments(pySnap.docs.map((d) => d.data()));
        setCustomerOrders(coSnap.docs.map((d) => d.data()));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* ── derived data ── */
  const { filteredPayments, filteredCustomerOrders } = useMemo(() => {
    return {
      // Cost: payments made by admin to suppliers (PAID status), filtered by year using paidDate or createdAt
      filteredPayments: payments.filter(
        (p) => p.status === "PAID" && toDate(p.paidDate || p.createdAt)?.getFullYear() === year
      ),
      // Revenue: customer orders filtered by year
      filteredCustomerOrders: customerOrders.filter(
        (o) => toDate(o.createdAt)?.getFullYear() === year
      ),
    };
  }, [payments, customerOrders, year]);

  /* ── KPIs ── */
  // Revenue = what customers paid admin (CustomerOrders → totalAmount)
  const totalRevenue  = filteredCustomerOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  // Cost = what admin paid suppliers (payments collection → amount)
  const totalCost     = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalProfit   = totalRevenue - totalCost;
  const margin        = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
  const totalOrders   = filteredCustomerOrders.length;
  const avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0;
  const overdueAmt    = payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + (p.amount || 0), 0);

  /* ── monthly trend ── */
  const monthlyTrend = useMemo(() => MONTHS.map((month, i) => {
    // Revenue: from CustomerOrders
    const rev  = filteredCustomerOrders
      .filter((o) => toDate(o.createdAt)?.getMonth() === i)
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
    // Cost: from payments (admin→supplier), using paidDate or createdAt
    const cost = filteredPayments
      .filter((p) => toDate(p.paidDate || p.createdAt)?.getMonth() === i)
      .reduce((s, p) => s + (p.amount || 0), 0);
    // Order count: from CustomerOrders
    const cnt  = filteredCustomerOrders.filter((o) => toDate(o.createdAt)?.getMonth() === i).length;
    return { month, Revenue: rev, Cost: cost, Profit: rev - cost, Orders: cnt };
  }), [filteredCustomerOrders, filteredPayments]);

  /* ── category breakdown ──
     CustomerOrders don't have a top-level category; derive from types[] items.
     Each item: { id, name, price, quantity, imageUrl }
     We group by item name as a category proxy (or item.category if present). */
  const categoryData = useMemo(() => {
    const map = {};
    filteredCustomerOrders.forEach((o) => {
      if (Array.isArray(o.types)) {
        o.types.forEach((item) => {
          const cat = item.category || item.name || "Uncategorized";
          if (!map[cat]) map[cat] = { category: cat, revenue: 0, orders: 0 };
          map[cat].revenue += (item.price || 0) * (item.quantity || 1);
          map[cat].orders  += 1;
        });
      } else {
        const cat = o.category || "Uncategorized";
        if (!map[cat]) map[cat] = { category: cat, revenue: 0, orders: 0 };
        map[cat].revenue += o.totalAmount || 0;
        map[cat].orders  += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredCustomerOrders]);

  /* ── top products ──
     CustomerOrders carry product info inside types[] array.
     Flatten all items across all orders, group by name.
     Sorted by quantity sold (highest qty = rank 1). */
  const topProducts = useMemo(() => {
    const map = {};
    filteredCustomerOrders.forEach((o) => {
      if (Array.isArray(o.types)) {
        o.types.forEach((item) => {
          const name = item.name || "Unknown";
          if (!map[name]) map[name] = { name, qty: 0, revenue: 0, orders: 0 };
          map[name].qty     += item.quantity || 1;
          map[name].revenue += (item.price || 0) * (item.quantity || 1);
          map[name].orders  += 1;
        });
      } else {
        const name = o.productName || o.product || "Unknown";
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0, orders: 0 };
        map[name].qty     += o.quantity || 0;
        map[name].revenue += o.totalAmount || 0;
        map[name].orders  += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [filteredCustomerOrders]);

  /* ── top suppliers ──
     From payments collection — group by supplierName, sum amount paid */
  const supplierData = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const name = p.supplierName || "Unknown";
      if (!map[name]) map[name] = { name, spend: 0, orders: 0 };
      map[name].spend  += p.amount || 0;
      map[name].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 8);
  }, [filteredPayments]);

  /* ── order status distribution — from CustomerOrders ── */
  const statusDist = useMemo(() => {
    const map = {};
    filteredCustomerOrders.forEach((o) => {
      const s = o.orderStatus || o.status || "UNKNOWN";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [filteredCustomerOrders]);

  /* ── available years — derived from CustomerOrders and payments ── */
  const years = useMemo(() => {
    const ys = new Set([
      ...customerOrders.map((o) => toDate(o.createdAt)?.getFullYear()),
      ...payments.map((p) => toDate(p.paidDate || p.createdAt)?.getFullYear()),
    ].filter(Boolean));
    return [...ys].sort((a, b) => b - a);
  }, [customerOrders, payments]);

  /* ── ResponsiveTable column defs ── */
  const categoryColumns = [
    {
      key: "rank",
      label: "#",
      render: (_v, row) => {
        const i = categoryData.indexOf(row);
        return (
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            {i + 1}
          </span>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (_v, row) => <span className="font-semibold text-slate-800">{row.category}</span>,
    },
    {
      key: "revenue",
      label: "Total Revenue",
      render: (_v, row) => <span className="font-semibold text-blue-600">{fmtRs(row.revenue)}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      render: (_v, row) => <span className="text-slate-700">{row.orders}</span>,
    },
    {
      key: "avgOrder",
      label: "Avg. Order",
      render: (_v, row) => <span className="text-slate-600">{fmtRs(row.orders ? row.revenue / row.orders : 0)}</span>,
    },
    {
      key: "share",
      label: "Share %",
      render: (_v, row) => {
        const pct = totalRevenue ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: 60 }}>
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-600 font-medium">{pct}%</span>
          </div>
        );
      },
    },
  ];

  const productColumns = [
    {
      key: "rank",
      label: "Rank",
      render: (_v, row) => {
        const i = topProducts.indexOf(row);
        return (
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-600 text-white" : i === 1 ? "bg-blue-200 text-blue-800" : i === 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
            {i + 1}
          </span>
        );
      },
    },
    {
      key: "name",
      label: "Product",
      render: (_v, row) => <span className="font-semibold text-slate-800 max-w-[200px] truncate inline-block">{row.name}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      render: (_v, row) => <span className="text-slate-700">{row.orders}</span>,
    },
    {
      key: "qty",
      label: "Qty Sold",
      render: (_v, row) => <span className="text-slate-700">{row.qty.toLocaleString()} units</span>,
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (_v, row) => <span className="font-semibold text-blue-600">{fmtRs(row.revenue)}</span>,
    },
    {
      key: "avgPerOrder",
      label: "Avg / Order",
      render: (_v, row) => <span className="text-slate-600">{fmtRs(row.orders ? row.revenue / row.orders : 0)}</span>,
    },
  ];

  const supplierColumns = [
    {
      key: "rank",
      label: "Rank",
      render: (_v, row) => {
        const i = supplierData.indexOf(row);
        return (
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            {i + 1}
          </span>
        );
      },
    },
    {
      key: "name",
      label: "Supplier",
      render: (_v, row) => <span className="font-semibold text-slate-800">{row.name}</span>,
    },
    {
      key: "orders",
      label: "Payments",
      render: (_v, row) => <span className="text-slate-700">{row.orders}</span>,
    },
    {
      key: "spend",
      label: "Total Spend",
      render: (_v, row) => <span className="font-semibold text-blue-600">{fmtRs(row.spend)}</span>,
    },
    {
      key: "avgPayment",
      label: "Avg. Payment",
      render: (_v, row) => <span className="text-slate-600">{fmtRs(row.orders ? row.spend / row.orders : 0)}</span>,
    },
    {
      key: "spendShare",
      label: "Spend Share",
      render: (_v, row) => {
        const pct = totalCost ? ((row.spend / totalCost) * 100).toFixed(1) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: 60 }}>
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-600 font-medium">{pct}%</span>
          </div>
        );
      },
    },
  ];

  /* ─── loading ─── */
  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  /* ─── tabs ─── */
  const tabs = [
    { id: "overview",   label: "Overview" },
    { id: "products",   label: "Products" },
    { id: "suppliers",  label: "Suppliers" },
  ];

  return (
    <PageLayout
      title="Sales Analytics"
      subtitle="Track revenue, orders, and business performance"
      actions={
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-sm text-slate-500 font-medium">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
          >
            {years.length ? years.map((y) => <option key={y} value={y}>{y}</option>)
              : <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>}
          </select>
        </div>
      }
    >

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card title="Total Revenue"    value={fmtRs(totalRevenue)} />
        <Card title="Total Orders"     value={totalOrders.toLocaleString()} />
        <Card title="Net Profit"       value={fmtRs(totalProfit)} />
        <Card title="Avg. Order Value" value={fmtRs(avgOrderValue)} />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card title="Total Cost"       value={fmtRs(totalCost)} />
        <Card title="Overdue Payments" value={fmtRs(overdueAmt)} />
        <Card title="Categories"       value={categoryData.length} />
        <Card title="Profit Margin"    value={`${margin}%`} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm mb-8 w-fit border border-slate-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-none cursor-pointer
              ${activeTab === t.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-500 bg-transparent hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* Revenue + Orders trend */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-6">
            <SectionCard title="Revenue vs Cost — Monthly Trend">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradRev)" dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="Cost"    stroke="#f97316" strokeWidth={2}   fill="url(#gradCost)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* Order status donut */}
            <SectionCard title="Order Status Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusDist} dataKey="count" nameKey="status" innerRadius={55} outerRadius={100} paddingAngle={3} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusDist.map((_, i) => <Cell key={i} fill={BLUE_PALETTE[i % BLUE_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Monthly profit line + orders bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <SectionCard title="Monthly Profit">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Profit" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4, fill: "#1d4ed8" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Orders per Month">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrend} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Bar dataKey="Orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Category table */}
          <SectionCard title="Revenue by Category">
            <ResponsiveTable
              columns={categoryColumns}
              data={categoryData}
              keyField="category"
              loading={false}
              emptyMessage="No category data available"
              cardTitle="category"
              cardBadge="revenue"
            />
          </SectionCard>
        </>
      )}

      {/* ════════════════════ PRODUCTS TAB ════════════════════ */}
      {activeTab === "products" && (
        <>
          {/* Top products bar chart */}
          <SectionCard title="Top Products by Revenue" className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" barSize={18} margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Top products table */}
          <SectionCard title="Product Performance Table">
            <ResponsiveTable
              columns={productColumns}
              data={topProducts}
              keyField="name"
              loading={false}
              emptyMessage="No product data available"
              cardTitle="name"
              cardBadge="revenue"
            />
          </SectionCard>
        </>
      )}

      {/* ════════════════════ SUPPLIERS TAB ════════════════════ */}
      {activeTab === "suppliers" && (
        <>
          {/* Supplier spend bar */}
          <SectionCard title="Top Suppliers by Spend" className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierData} layout="vertical" barSize={18} margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spend" name="Spend" fill="#1d4ed8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Supplier table */}
          <SectionCard title="Supplier Purchase Summary">
            <ResponsiveTable
              columns={supplierColumns}
              data={supplierData}
              keyField="name"
              loading={false}
              emptyMessage="No supplier data available"
              cardTitle="name"
              cardBadge="spend"
            />
          </SectionCard>
        </>
      )}

    </PageLayout>
  );
}