import { useLocation, useNavigate } from "react-router-dom";
import { Bell, User, Phone, Shield, LogOut, ChevronDown, Mail, Edit2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, getAuthHeaders } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";

// Same pattern as useNotifications.js — RAW host + /api prefix, path must not repeat /api
const RAW_API_URL = (import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000');
const API_BASE = `${RAW_API_URL.replace(/\/$/, '')}/api`;

const PAGE_META = {
  "/":                           { title: "Dashboard",        subtitle: "Admin overview & insights"    },
  "/admin/dashboard":            { title: "Dashboard",        subtitle: "Admin overview & insights"    },
  "/admin/usermanagement":       { title: "User Management",  subtitle: "Manage registered customers"  },
  "/admin/suppliers":            { title: "Suppliers",        subtitle: "Manage supplier partners"     },
  "/admin/products":             { title: "Catalog",          subtitle: "Manage electronics products and stock" },
  "/admin/ordermanagement":      { title: "Orders",           subtitle: "Manage purchase orders"       },
  "/admin/financialAnalytics":   { title: "Financials",       subtitle: "Sales & profit analysis"      },
  "/admin/notifications":        { title: "Notifications",    subtitle: "System alerts & updates"      },
  "/admin/analytics":            { title: "Sales Analytics",  subtitle: "Analyse sales & updates"      },
  "/admin/adminPayments":        { title: "Payments",         subtitle: "Manage payment records"       },
  "/admin/adminproductapproval": { title: "Product Approval", subtitle: "Approve new product listings" },
  "/admin/search-analytics":     { title: "Search Analytics", subtitle: "Analyze search behavior"      },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfile, setShowProfile]   = useState(false);
  const [adminData, setAdminData]       = useState(null);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [currentUser, setCurrentUser]   = useState(null);

  /* ── Edit profile state ── */
  const [isEditing, setIsEditing]       = useState(false);
  const [editForm, setEditForm]         = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState("");

  const { title, subtitle } =
    PAGE_META[location.pathname] || { title: "Admin Panel", subtitle: "Manage your system" };

  /* ── Fetch unread count ── */
  const fetchUnreadCount = async () => {
    try {
      const res  = await fetch(`${API_BASE}/notifications?recipientType=admin`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  };

  /* ── Auth listener ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setCurrentUser(user);
      try {
        const response = await fetch(`${API_BASE}/users/profile`, {
          headers: await getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not load admin profile');
        setAdminData(data);
        setEditForm({
          fullName: data.fullName || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
        });
      } catch (err) {
        console.error('Admin profile load failed:', err.message);
      }
    });
    return () => unsubscribe();
  }, []);

  /* ── Poll notifications ── */
  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 300000); // 5 minutes instead of 30s to save Firebase limit
    return () => clearInterval(id);
  }, []);

  useEffect(() => { fetchUnreadCount(); }, [location.pathname]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const close = () => { setShowProfile(false); setIsEditing(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ── Save profile to Firestore ── */
  const handleSave = async () => {
    if (!currentUser) return;
    if (!editForm.fullName.trim()) { setSaveMsg("Name is required."); return; }
    setSaving(true);
    setSaveMsg("");
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        phone:    editForm.phone.trim(),
      };
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Could not save profile');
      setAdminData((prev) => ({ ...prev, ...payload }));
      setSaveMsg("Saved!");
      setTimeout(() => { setSaveMsg(""); setIsEditing(false); }, 1200);
    } catch (err) {
      console.error('Admin profile save failed:', err.message);
      setSaveMsg(err.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Avatar initials ── */
  const initials = adminData?.fullName
    ? adminData.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <header className="h-[70px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 flex justify-between items-center relative shadow-md">

      {/* ── LEFT: Page title ── */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-6 rounded-full bg-white/60" />
          <h1 className="text-[20px] font-bold text-white leading-tight tracking-tight">
            {title}
          </h1>
        </div>
        <p className="text-[12px] text-blue-100 font-medium ml-3.5 mt-0.5 tracking-wide">
          {subtitle}
        </p>
      </div>

      {/* ── RIGHT: Actions ── */}
      <div className="flex items-center gap-2">

        {/* Notification Bell */}
        <button
          onClick={() => navigate("/admin/notifications")}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center
                     text-white/80 hover:text-white hover:bg-white/15
                     border border-transparent hover:border-white/20
                     transition-all duration-150"
        >
          <Bell size={19} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold
                             rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5
                             ring-2 ring-blue-600 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Profile trigger */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowProfile((p) => !p); if (showProfile) setIsEditing(false); }}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer
              border transition-all duration-150
              ${showProfile
                ? "bg-white/20 border-white/30 shadow-inner"
                : "bg-white/10 border-white/15 hover:bg-white/20 hover:border-white/30"
              }
            `}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-white/25 border border-white/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-white">{initials}</span>
            </div>

            {/* Name + role */}
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-white leading-tight">
                {adminData?.fullName || "Admin User"}
              </p>
              <p className="text-[11px] text-blue-100 leading-tight capitalize">
                {adminData?.role || "Administrator"}
              </p>
            </div>

            <ChevronDown
              size={15}
              strokeWidth={2.5}
              className={`text-white/60 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`}
            />
          </button>

          {/* ── Profile Dropdown ── */}
          {showProfile && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl
                         border border-gray-100 z-50 overflow-hidden"
            >
              {/* ── Card header ── */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30
                                  flex items-center justify-center flex-shrink-0">
                    <span className="text-[16px] font-bold text-white">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-white truncate">
                      {adminData?.fullName || "Add your name"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield size={11} className="text-blue-200" strokeWidth={2} />
                      <p className="text-[11px] text-blue-200 capitalize font-medium">
                        {adminData?.role || "Administrator"}
                      </p>
                    </div>
                  </div>
                  {/* Edit / Cancel toggle */}
                  <button
                    onClick={() => { setIsEditing((e) => !e); setSaveMsg(""); }}
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 border border-white/25
                               flex items-center justify-center flex-shrink-0 transition-all duration-150"
                    title={isEditing ? "Cancel editing" : "Edit profile"}
                  >
                    {isEditing
                      ? <X size={13} strokeWidth={2} className="text-white" />
                      : <Edit2 size={13} strokeWidth={2} className="text-white" />
                    }
                  </button>
                </div>
              </div>

              {/* ── VIEW mode ── */}
              {!isEditing && (
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Mail size={13} strokeWidth={2} className="text-blue-500" />
                    </div>
                    <p className="text-[12.5px] truncate">{adminData?.email || "No email on record"}</p>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={13} strokeWidth={2} className="text-blue-500" />
                    </div>
                    <p className="text-[12.5px]">{adminData?.phone || "No phone on record"}</p>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Shield size={13} strokeWidth={2} className="text-blue-500" />
                    </div>
                    <p className="text-[12.5px] text-blue-600 font-semibold capitalize">
                      {adminData?.role || "Administrator"}
                    </p>
                  </div>

                  {!adminData && (
                    <p className="text-[11.5px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
                      No profile yet — click <Edit2 size={11} className="inline" /> to add your details.
                    </p>
                  )}
                </div>
              )}

              {/* ── EDIT mode ── */}
              {isEditing && (
                <div className="px-4 py-3 space-y-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="e.g. John Silva"
                      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200
                                 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400
                                 focus:border-transparent transition-all duration-150"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      readOnly
                      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200
                                 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400
                                 focus:border-transparent transition-all duration-150"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+94 77 000 0000"
                      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200
                                 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400
                                 focus:border-transparent transition-all duration-150"
                    />
                  </div>

                  {/* Save feedback */}
                  {saveMsg && (
                    <p className={`text-[12px] text-center font-medium rounded-lg px-3 py-1.5
                      ${saveMsg === "Saved!"
                        ? "text-green-700 bg-green-50 border border-green-100"
                        : "text-red-600 bg-red-50 border border-red-100"
                      }`}>
                      {saveMsg}
                    </p>
                  )}

                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                               bg-blue-600 text-white border border-blue-700
                               hover:bg-blue-700
                               disabled:opacity-60 disabled:cursor-not-allowed
                               text-[13px] font-semibold transition-all duration-150"
                  >
                    {saving
                      ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
                      : <><Save size={14} strokeWidth={2} /> Save Profile</>
                    }
                  </button>
                </div>
              )}

             

              {/* ── Divider ── */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* ── Logout ── */}
              <div className="px-4 py-3">
                <button
                  onClick={() => { auth.signOut(); navigate("/login"); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                             bg-red-50 text-red-600 border border-red-100
                             hover:bg-red-500 hover:text-white hover:border-red-500
                             text-[13px] font-semibold transition-all duration-150"
                >
                  <LogOut size={15} strokeWidth={2} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}