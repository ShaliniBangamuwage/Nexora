import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, RotateCcw, Package,
  ChevronDown, DollarSign, FileText, Send,
} from "lucide-react";
import { C, FONT } from "../../components/profile/profileTheme";
import { getAuthHeaders } from '../../services/firebase';

// Base URL for all API calls — falls back to localhost in development
const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;

// Predefined return reasons shown in the per-item reason dropdown
const RETURN_REASONS = [
  "Damaged product",
  "Wrong item delivered",
  "Expired product",
  "Quantity mismatch",
  "Other",
];

// Shared input style used across all form fields in this page
const inputStyle = {
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "10px 14px",
  fontSize: 13, color: C.textPrimary, fontFamily: FONT.body,
  outline: "none", width: "100%", boxSizing: "border-box",
};

// Removes keys with undefined values before sending to the backend
function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// Reusable labelled form field wrapper with optional icon and required marker
function Field({ label, children, required, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
        style={{ color: C.textMuted }}
      >
        {Icon && <Icon size={11} color={C.accent} />}
        {label} {required && <span style={{ color: C.error }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Order may be pre-filled if navigated from the Orders page
  const passedOrder   = location.state?.order   || null;
  const passedOrderId = location.state?.orderId || "";

  const [orders, setOrders]                 = useState([]);
  const [orderId, setOrderId]               = useState(passedOrderId);
  const [selectedOrder, setSelectedOrder]   = useState(passedOrder);
  // Each item has returnQuantity, reason, and selected flag added on top of order data
  const [items, setItems]                   = useState([]);
  const [note, setNote]                     = useState("");
  const [loading, setLoading]               = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  // Only fetch orders from backend if no order was passed via navigation state
  const [fetchingOrders, setFetchingOrders] = useState(!passedOrder);

  useEffect(() => {
    // If an order was passed via navigation state, skip the fetch and init items directly
    if (passedOrder) {
      initItems(passedOrder);
      return;
    }
    // Otherwise fetch the list of delivered orders for the dropdown
    const fetchOrders = async () => {
      try {
        const res  = await fetch(`${API_BASE}/customer-orders/delivered`, { headers: await getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  // Maps order items to return-ready items with default returnQuantity, reason, and selected=false
  function initItems(order) {
    if (order?.types) {
      setItems(order.types.map(item => ({
        ...item,
        returnQuantity: 1,
        reason:         RETURN_REASONS[0],
        selected:       false,
      })));
    }
  }

  // Handles order selection from the dropdown — resets items for the newly selected order
  const handleOrderSelect = (e) => {
    const id    = e.target.value;
    setOrderId(id);
    const order = orders.find(o => o.id === id);
    setSelectedOrder(order || null);
    if (order) initItems(order);
    else setItems([]);
  };

  // Toggles the selected state of a return item by its index
  const toggleItem  = (i) =>
    setItems(prev => prev.map((item, idx) =>
      idx === i ? { ...item, selected: !item.selected } : item
    ));

  // Updates a single field on a return item by index
  const updateItem = (i, field, value) =>
    setItems(prev => prev.map((item, idx) =>
      idx === i ? { ...item, [field]: value } : item
    ));

  // Only items the customer has checked will be included in the return submission
  const selectedItems = items.filter(item => item.selected);

  // Calculates estimated refund based on selected items' price × return quantity
  const refundAmount = selectedItems.reduce((sum, item) =>
    sum + ((item.price || 0) * (item.returnQuantity || 1)), 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId)                   return alert("Please select an order.");
    if (selectedItems.length === 0) return alert("Please select at least one item to return.");
    setLoading(true);
    try {
      // Look up the productCode for each selected item via a backend endpoint
      const cleanedItems = await Promise.all(
        selectedItems.map(async (item) => {
          let productCode = null;
          try {
            const res = await fetch(
              `${API_BASE}/orders/product-code/${encodeURIComponent(item.name)}`
            );
            if (res.ok) {
              const data  = await res.json();
              productCode = data.productCode ?? null;
            }
          } catch (err) {
            console.error("Product lookup failed:", err);
          }
          // Strip undefined fields before submitting
          return clean({
            productCode,
            name:     item.name           ?? null,
            price:    item.price          ?? 0,
            quantity: item.returnQuantity ?? 1,
            reason:   item.reason         ?? RETURN_REASONS[0],
          });
        })
      );

      // Submit the full return request to the backend
      const res = await fetch(`${API_BASE}/returns`, {
        method:  'POST',
          headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body:    JSON.stringify(clean({
          orderId:        orderId                     || null,
          customerName:   selectedOrder?.customerName ?? null,
          phone:          selectedOrder?.phone        ?? null,
          address:        selectedOrder?.address      ?? null,
          items:          cleanedItems,
          refundAmount,
          adjustmentNote: note                        || null,
        })),
      });

      if (!res.ok) throw new Error('Failed to submit return');
      setSubmitted(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Success screen shown after a return is successfully submitted
  if (submitted) return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: FONT.body }}>
      <div className="flex items-center justify-center flex-col gap-3.5 min-h-[70vh] px-6">
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)" }}
        >
          <CheckCircle size={36} color="#10b981" />
        </div>
        <h2 className="text-[22px] font-bold" style={{ color: C.textPrimary }}>Return Submitted!</h2>
        <p className="text-sm text-center max-w-[340px] leading-relaxed" style={{ color: C.textMuted }}>
          Your return request has been submitted. Store support will review it shortly.
        </p>
        <div className="flex gap-2.5 mt-2">
          <button
            onClick={() => navigate("/customer/orders")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
            style={{
              background: C.surface, color: C.textPrimary,
              border: `1px solid ${C.border}`, fontFamily: FONT.body,
              boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
            }}
          >
            <ArrowLeft size={14} /> Back to Orders
          </button>
          {/* Resets form state so the customer can submit another return */}
          <button
            onClick={() => {
              setSubmitted(false);
              setItems(prev => prev.map(i => ({ ...i, selected: false })));
              setNote("");
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none text-white"
            style={{ background: C.accent, fontFamily: FONT.body, boxShadow: "0 4px 12px rgba(26,135,225,0.25)" }}
          >
            <RotateCcw size={14} /> Submit Another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: FONT.body }}>
      {/* Page header banner with gradient background */}
      <div
        className="px-6 pt-12 pb-10 text-center"
        style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)" }}
      >
        <h1 className="text-[34px] font-bold text-white mb-2.5" style={{ fontFamily: FONT.display }}>
          Return Request
        </h1>
        <p className="text-sm text-white/75 max-w-[480px] mx-auto">
          Select the items you want to return and we will process your refund.
        </p>
      </div>

      <div className="max-w-[700px] mx-auto px-6 py-8">
        {/* Back navigation button */}
        <button
          onClick={() => navigate("/customer/orders")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-[7px] rounded-lg cursor-pointer mb-6"
          style={{
            color: C.textMuted, background: C.surface,
            border: `1px solid ${C.border}`, fontFamily: FONT.body,
            boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
          }}
        >
          <ArrowLeft size={13} /> Back to Orders
        </button>

        {/* Order summary chip — shown when an order is selected or pre-filled */}
        {selectedOrder && (
          <div
            className="rounded-xl px-[18px] py-3.5 mb-6"
            style={{ background: "rgba(26,135,225,0.06)", border: `1px solid ${C.border}` }}
          >
            <p className="text-[13px] font-bold" style={{ color: C.accentDark }}>
              Order #{orderId.slice(0, 8)}&hellip;
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
              {selectedOrder.customerName ?? "—"} &middot; {selectedOrder.phone ?? "—"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
          {/* Order dropdown — only shown when no order was passed via navigation state */}
          {!passedOrder && (
            <div
              className="rounded-2xl p-5"
              style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(26,135,225,0.07)" }}
            >
              <Field label="Select Order" required icon={Package}>
                {fetchingOrders ? (
                  <p className="text-[13px]" style={{ color: C.textMuted }}>Loading your orders…</p>
                ) : orders.length === 0 ? (
                  <p className="text-[13px]" style={{ color: C.error }}>No delivered orders found.</p>
                ) : (
                  <div className="relative">
                    <select
                      value={orderId}
                      onChange={handleOrderSelect}
                      style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
                      required
                    >
                      <option value="">Choose a delivered order…</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id.slice(0, 8)}… — {o.types?.length ?? 0} item(s)
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14} color={C.textMuted}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  </div>
                )}
              </Field>
            </div>
          )}

          {/* Item selection list — rendered once an order is selected */}
          {items.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(26,135,225,0.07)" }}
            >
              <div
                className="px-5 py-3.5"
                style={{ background: "rgba(26,135,225,0.04)", borderBottom: `1px solid ${C.border}` }}
              >
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.textMuted }}
                >
                  <Package size={12} color={C.accent} />
                  Select Items to Return <span style={{ color: C.error }}>*</span>
                </p>
              </div>

              <div className="px-5 py-4 flex flex-col gap-2.5">
                {items.map((item, i) => (
                  // Border highlights blue when the item is selected for return
                  <div
                    key={i}
                    className="rounded-xl p-3.5 transition-all duration-150"
                    style={{
                      border:     `1px solid ${item.selected ? C.accent : C.border}`,
                      background: item.selected ? "rgba(26,135,225,0.04)" : C.bg,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItem(i)}
                        className="w-4 h-4 flex-shrink-0"
                        style={{ accentColor: C.accent }}
                      />
                      {/* Show product image if available, otherwise show a placeholder icon */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-[42px] h-[42px] rounded-lg object-cover flex-shrink-0"
                          style={{ border: `1px solid ${C.border}` }}
                        />
                      ) : (
                        <div
                          className="w-[42px] h-[42px] rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(26,135,225,0.08)", border: `1px solid ${C.border}` }}
                        >
                          <Package size={18} color={C.accent} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[13px] font-bold" style={{ color: C.textPrimary }}>
                          {item.name ?? "Unnamed item"}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                          Rs. {item.price ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Quantity and reason fields — only visible when item is selected */}
                    {item.selected && (
                      <div className="grid grid-cols-2 gap-3 mt-3.5">
                        <Field label="Return Quantity">
                          <input
                            type="number"
                            min={1}
                            max={item.quantity || 99}
                            value={item.returnQuantity}
                            onChange={e => updateItem(i, "returnQuantity", Number(e.target.value))}
                            style={inputStyle}
                          />
                        </Field>
                        <Field label="Reason">
                          <div className="relative">
                            <select
                              value={item.reason}
                              onChange={e => updateItem(i, "reason", e.target.value)}
                              style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
                            >
                              {RETURN_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={13} color={C.textMuted}
                              className="absolute right-[11px] top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated refund banner — only shown when at least one item is selected */}
          {selectedItems.length > 0 && (
            <div
              className="flex justify-between items-center rounded-xl px-[18px] py-3.5"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.22)" }}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#059669" }}>
                <DollarSign size={14} color="#059669" /> Estimated Refund
              </span>
              <span className="text-[17px] font-bold" style={{ color: "#059669" }}>
                Rs. {refundAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Optional free-text note for additional return context */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(26,135,225,0.07)" }}
          >
            <Field label="Additional Note" icon={FileText}>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any additional details about your return…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </Field>
          </div>

          {/* Submit button — disabled and faded while submission is in progress */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 text-white border-none rounded-xl p-[13px] text-sm font-bold"
            style={{
              background: loading ? "#93c5fd" : C.accent,
              cursor:     loading ? "not-allowed" : "pointer",
              fontFamily: FONT.body,
              boxShadow:  loading ? "none" : "0 4px 12px rgba(26,135,225,0.3)",
            }}
          >
            <Send size={15} />
            {loading ? "Submitting…" : "Submit Return Request"}
          </button>
        </form>
      </div>
    </div>
  );
}