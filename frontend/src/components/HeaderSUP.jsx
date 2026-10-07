import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiUser, FiCamera } from "react-icons/fi";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Header() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [unreadCount,  setUnreadCount]  = useState(0);
  const [supplierData, setSupplierData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const dropdownRef  = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Restock unread badge ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => setUnreadCount(e.detail.count);
    window.addEventListener("restock-unread-count", handler);
    return () => window.removeEventListener("restock-unread-count", handler);
  }, []);

  // ─── Fetch supplier data + load saved photo from localStorage ─────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const q        = query(collection(db, "suppliers"), where("userId", "==", user.uid));
        let   snapshot = await getDocs(q);

        if (snapshot.empty) {
          const q2 = query(collection(db, "suppliers"), where("email", "==", user.email));
          snapshot = await getDocs(q2);
        }

        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          const data = { id: d.id, ...d.data() };
          setSupplierData(data);

          // Load saved photo from localStorage using supplier id as key
          const savedPhoto = localStorage.getItem(`supplierPhoto_${d.id}`);
          if (savedPhoto) setPhotoPreview(savedPhoto);
        }
      } catch (err) {
        console.error("Error fetching supplier:", err);
      }
    });
    return () => unsub();
  }, []);

  // ─── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Profile photo — saved to localStorage as Base64 ──────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ~2MB file limit (Base64 adds ~33% overhead, localStorage limit is ~5MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setPhotoPreview(base64);

      // Persist to localStorage so it survives page refresh
      if (supplierData?.id) {
        try {
          localStorage.setItem(`supplierPhoto_${supplierData.id}`, base64);
        } catch (err) {
          // localStorage quota exceeded (rare at 2MB but handle gracefully)
          console.warn("localStorage quota exceeded:", err);
          alert("Could not save photo — browser storage is full. The photo will show for this session only.");
        }
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Page title map ────────────────────────────────────────────────────────
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":                          return { title: "Dashboard",           subtitle: "Welcome to MediCareX" };
      case "/supplier/product-catalog":  return { title: "Product Catalog",     subtitle: "View and manage products" };
      case "/supplier/purchase-orders":  return { title: "Purchase Orders",     subtitle: "Manage orders from MediCareX" };
      case "/supplier/update-delivery":  return { title: "Update Delivery",     subtitle: "Update delivery status" };
      case "/supplier/restock-alert":    return { title: "Restock Alerts",      subtitle: "Check low stock products" };
      case "/supplier/invoices":         return { title: "Invoices & Payments", subtitle: "View invoices and payments" };
      case "/supplier/aianalytics":      return { title: "AI Analytics",        subtitle: "Insights from our AI-powered analytics" };
      case "/supplier/notifications":    return { title: "Notifications",       subtitle: "Recent notifications" };
      case "/supplier/settings":         return { title: "Settings",            subtitle: "Update your preferences" };
      default:                           return { title: "Dashboard",           subtitle: "Welcome to MediCareX" };
    }
  };

  const { title, subtitle } = getPageTitle();
  const displayName         = supplierData?.name || "Supplier";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="fixed top-0 left-[240px] right-0 h-[68px] bg-blue-600 z-[999] flex items-center px-6 shadow-md">
      <div className="w-full flex items-center justify-between gap-4">

        {/* LEFT — page title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:block w-[3px] h-8 rounded-full bg-white/40 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-white m-0 leading-tight truncate">{title}</h1>
            <p className="text-[12px] text-blue-100 m-0 leading-tight hidden sm:block">{subtitle}</p>
          </div>
        </div>

        {/* RIGHT — bell + profile */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Notification Bell */}
          <button
            onClick={() => navigate("/supplier/restock-alert")}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition border border-blue-400/50"
          >
            <FiBell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-400 text-blue-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-blue-600 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <span className="w-px h-6 bg-blue-500 mx-1" />

          {/* Profile pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 border border-blue-400/50 transition cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={14} className="text-white" />
                )}
              </div>

              {/* Name + role */}
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold text-white leading-tight max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-blue-100 leading-tight">Supplier</span>
              </div>

              {/* Chevron */}
              <svg
                className={`hidden md:block h-3.5 w-3.5 text-blue-200 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* ── Profile Dropdown Card ── */}
            {dropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000]">

                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

                {/* Photo + name section */}
                <div className="flex flex-col items-center pt-5 pb-4 px-5 bg-slate-50 border-b border-slate-100">

                  {/* Avatar with upload overlay */}
                  <div className="relative group mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {photoPreview ? (
                        <img src={photoPreview} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={28} className="text-blue-400" />
                      )}
                    </div>

                    {/* Camera overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload profile photo"
                      className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                    >
                      <FiCamera size={18} className="text-white" />
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  <p className="text-[15px] font-bold text-slate-800 leading-tight text-center truncate max-w-full">
                    {displayName}
                  </p>
                  <span className="mt-1 text-[11px] font-semibold bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Supplier
                  </span>
                </div>

                {/* Info rows */}
                <div className="px-5 py-4 space-y-3">

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email</p>
                      <p className="text-[13px] text-slate-700 font-medium truncate">{supplierData?.email || "—"}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Phone</p>
                      <p className="text-[13px] text-slate-700 font-medium">{supplierData?.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Footer hint */}
                <div className="px-5 pb-4 pt-1 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 text-center">Hover the photo to change picture (max 2MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}