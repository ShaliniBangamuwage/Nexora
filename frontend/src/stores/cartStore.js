import { create } from "zustand";
import { getAuthHeaders } from "../services/firebase";

const getBaseUrl = () => {
  const railway = import.meta.env.VITE_API_URL_RAILWAY;
  const local = import.meta.env.VITE_API_URL;
  if (railway && railway !== 'undefined') return railway;
  if (local && local !== 'undefined') return local;
  return 'http://localhost:5000';
};
const API = `${getBaseUrl()}/api/cart`;

// ==============================
// Reads Firebase UID from sessionStorage
// AuthContext sets this on login: sessionStorage.setItem("userId", user.uid)
// ==============================
const getCustomerId = () => {
  return sessionStorage.getItem("userId") ?? null;
};

const normalizeProductId = (product) => String(product.id || product.productId || product.productCode || '').trim();

export const useCartStore = create((set, get) => ({
  items: [],
  error: null,
  clearError: () => set({ error: null }),

  fetchItems: async (customerId) => {
    if (!customerId) return;
    try {
      const res = await fetch(`${API}/${customerId}`, { headers: await getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      set({ items: data, error: null });
    } catch (err) {
      console.error("fetchItems error:", err);
      set({ error: err.message || 'Could not load your cart.' });
    }
  },

  addItem: async (product, delta = 1) => {
    const customerId = getCustomerId();
    if (!customerId) {
      set({ error: 'Sign in to add products to your cart.' });
      return false;
    }

    const productId = normalizeProductId(product);
    if (!productId) {
      set({ error: 'This product is unavailable.' });
      return false;
    }

    const existing = get().items.find((i) => String(i.productId) === productId);

    if (existing) {
      try {
        const newQty = Math.max(0, Number(existing.qty) + delta);
        const response = newQty === 0
          ? await fetch(`${API}/${existing.id}`, { method: "DELETE", headers: await getAuthHeaders() })
          : await fetch(`${API}/${existing.id}`, {
              method: "PATCH",
              headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
              body: JSON.stringify({ qty: newQty }),
            });
        if (!response.ok) throw new Error((await response.json()).message || "Could not update cart quantity");
        if (newQty === 0) {
          set((state) => ({ items: state.items.filter((item) => item.id !== existing.id) }));
        } else {
          const saved = await response.json();
          set((state) => ({ items: state.items.map((item) => item.id === existing.id ? saved : item) }));
        }
      } catch (err) {
        console.error("updateQty error:", err);
        set({ error: err.message || 'Could not update cart quantity.' });
        get().fetchItems(customerId);
        return false;
      }

      return true;
    }

    try {
      const res = await fetch(API, {
        method:  "POST",
        headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
        body:    JSON.stringify({ productId, qty: Math.max(1, Number(delta) || 1) }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to add item");
      const saved = await res.json();
      set((state) => ({ items: [...state.items, saved] }));
      set({ error: null });
      return true;
    } catch (err) {
      console.error("addItem error:", err);
      set({ error: err.message || 'Could not add this product to your cart.' });
      return false;
    }
  },

  removeItem: async (firestoreId) => {
    const customerId = getCustomerId();

    set((state) => ({
      items: state.items.filter((i) => i.id !== firestoreId),
    }));

    try {
      const response = await fetch(`${API}/${firestoreId}`, { method: "DELETE", headers: await getAuthHeaders() });
      if (!response.ok) throw new Error("Failed to remove item");
    } catch (err) {
      console.error("removeItem error:", err);
      set({ error: err.message || 'Could not remove this product.' });
      get().fetchItems(customerId);
    }
  },

  clearCart: async () => {
    const customerId = getCustomerId();
    if (!customerId) return console.error("No customerId found");

    set({ items: [] });

    try {
      const response = await fetch(`${API}/clear/${customerId}`, { method: "DELETE", headers: await getAuthHeaders() });
      if (!response.ok) throw new Error("Failed to clear cart");
    } catch (err) {
      console.error("clearCart error:", err);
      set({ error: err.message || 'Could not clear your cart.' });
      get().fetchItems(customerId);
    }
  },

  restoreCart: (savedItems) => set({ items: savedItems }),

  getTotal: () =>
    get().items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    ),
}));