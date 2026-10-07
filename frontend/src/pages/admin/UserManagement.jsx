import { useEffect, useState } from "react";
import axios from "axios";
import { getAuthHeaders } from "../../services/firebase";
import {
  MdArrowBack,
  MdVisibility,
  MdBlock,
  MdPeople,
  MdShoppingBag,
  MdPayments,
  MdEmail,
  MdPhone,
  MdCalendarToday,
} from "react-icons/md";
import PageLayout from "../../components/PageLayout";
import ResponsiveTable from "../../components/ResponsiveTable";

const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;

// Generate a stable pastel color from a string (used for avatar backgrounds)
const stringToColor = (str = "") => {
  const palette = [
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const formatDate = (value) => {
  if (!value) return "-";
  // Firestore timestamps can arrive as { _seconds } or ISO strings
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// Formats a number as "144,440.00" (comma thousands separators + 2 decimals)
const formatCurrency = (value = 0) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // null = list view, object = detail view

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const authHeaders = await getAuthHeaders();
        const usersRes = await axios.get(`${API_BASE}/users`, { headers: authHeaders });
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Failed to load users", err);
        setUsers([]);
      }

      try {
        const authHeaders = await getAuthHeaders();
        const ordersRes = await axios.get(`${API_BASE}/orders`, { headers: authHeaders });
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Failed to load orders", err);
        setOrders([]);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  // Orders are matched to a user by EMAIL (CustomerOrders stores `email`, not userId)
  const getUserOrders = (email) => {
    if (!email) return [];
    const normalizedEmail = email.toLowerCase();
    return orders.filter((o) => (o.email || "").toLowerCase() === normalizedEmail);
  };

  const getTotalPurchases = (email) =>
    getUserOrders(email).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const disableUser = async (docId) => {
    if (!window.confirm("Are you sure you want to disable this user?")) return;
    try {
      const authHeaders = await getAuthHeaders();
      await axios.put(
        `${API_BASE}/users/${docId}/status`,
        { status: "inactive" },
        { headers: authHeaders }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === docId ? { ...u, status: "inactive" } : u))
      );
    } catch {
      alert("Failed to disable user");
    }
  };

  // Client-side filter across customerId, fullName, email
  const filteredUsers = users.filter((u) =>
    `${u.fullName} ${u.email} ${u.customerId}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeUsers = users.filter((u) => (u.status || "active") === "active").length;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f8ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Loading users...</span>
        </div>
      </div>
    );

  /* ================= USER DETAIL VIEW ================= */
  if (selectedUser) {
    const userOrders = getUserOrders(selectedUser.email);
    const color = stringToColor(selectedUser.fullName || selectedUser.email);

    return (
      <PageLayout
        title="User Details"
        actions={
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <MdArrowBack size={18} /> Back
          </button>
        }
      >
        {/* Profile header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center text-2xl font-bold shrink-0`}
            >
              {getInitials(selectedUser.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedUser.fullName || "Unnamed User"}
                </h2>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    (selectedUser.status || "active") === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedUser.status || "active"}
                </span>
              </div>
              <span className="inline-block text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {selectedUser.customerId || "N/A"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MdEmail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                <p className="text-sm font-medium text-slate-800 truncate">{selectedUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MdPhone size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase">Phone</p>
                <p className="text-sm font-medium text-slate-800">{selectedUser.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MdPayments size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Purchases</p>
                <p className="text-sm font-bold text-emerald-600">
                  Rs. {formatCurrency(getTotalPurchases(selectedUser.email))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">Order History</h3>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {userOrders.length} order{userOrders.length !== 1 ? "s" : ""}
          </span>
        </div>

        {userOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 shadow-sm border border-slate-100">
            No orders found for this user
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-mono font-bold text-blue-600">
                      {order.orderId || order.id}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MdCalendarToday size={13} /> {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        ["active", "completed", "delivered"].includes(
                          (order.orderStatus || "").toLowerCase()
                        )
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.orderStatus || "pending"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        (order.paymentStatus || "").toLowerCase() === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {order.paymentStatus || "pending"} · {order.paymentMethod || "-"}
                    </span>
                  </div>
                </div>

                {/* Items */}
                {Array.isArray(order.types) && order.types.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {order.types.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-11 h-11 rounded-lg object-cover shrink-0 bg-white border border-slate-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-200 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty {item.quantity || 1} · Rs. {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm text-slate-400">
                    {order.address ? order.address : ""}
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    Rs. {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageLayout>
    );
  }

  /* ================= MAIN TABLE VIEW ================= */
  const userColumns = [
    {
      key: "customerId",
      label: "Customer ID",
      render: (_v, user) => (
        <span className="text-sm font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
          {user.customerId || "N/A"}
        </span>
      ),
    },
    {
      key: "fullName",
      label: "Name",
      render: (_v, user) => {
        const color = stringToColor(user.fullName || user.email);
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg ${color.bg} ${color.text} flex items-center justify-center text-xs font-bold shrink-0`}
            >
              {getInitials(user.fullName)}
            </div>
            <span className="text-sm font-semibold text-slate-800">{user.fullName || "-"}</span>
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      render: (_v, user) => <span className="text-sm text-slate-600">{user.email}</span>,
    },
    {
      key: "createdAt",
      label: "Registered",
      render: (_v, user) => (
        <span className="text-sm text-slate-600">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: "totalPurchases",
      label: "Total Purchases",
      render: (_v, user) => (
        <span className="text-sm font-bold text-emerald-600">
          Rs. {formatCurrency(getTotalPurchases(user.email))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_v, user) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase
          ${
            (user.status || "active") === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.status || "active"}
        </span>
      ),
    },
  ];

  const renderUserActions = (user) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View"
        onClick={() => setSelectedUser(user)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border-none cursor-pointer transition-colors duration-200"
      >
        <MdVisibility size={16} />
      </button>
      <button
        title="Disable"
        onClick={() => disableUser(user.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border-none cursor-pointer transition-colors duration-200"
      >
        <MdBlock size={16} />
      </button>
    </div>
  );

  return (
    <PageLayout title="User Management" subtitle="Manage registered users and their orders">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MdPeople size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Users</p>
            <p className="text-xl font-bold text-slate-800">{users.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MdShoppingBag size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Active Users</p>
            <p className="text-xl font-bold text-slate-800">{activeUsers}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MdPayments size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Revenue</p>
            <p className="text-xl font-bold text-slate-800">Rs. {formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or customer ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 border border-indigo-200 rounded-lg text-[15px] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <ResponsiveTable
          columns={userColumns}
          data={filteredUsers}
          keyField="id"
          loading={false}
          emptyMessage="No users found"
          cardTitle="fullName"
          cardBadge="status"
          actions={renderUserActions}
        />
      </div>
    </PageLayout>
  );
}