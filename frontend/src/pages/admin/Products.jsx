import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  Timestamp,
  query,
  where,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { CATEGORIES } from "../../data/categories";
import PageLayout from "../../components/PageLayout";
import ResponsiveTable from "../../components/ResponsiveTable";

// Normalize: lowercase, strip spaces AND underscores/hyphens
const normalize = (v = "") => v.toLowerCase().replace(/[\s_-]+/g, "");

// Toast notification component
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border pointer-events-auto min-w-[300px] max-w-[420px] ${
            t.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : t.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-sky-50 border-sky-200 text-sky-800"
          }`}
          style={{ animation: "slideInRight 0.25s ease-out" }}
        >
          <span className="text-base mt-0.5 shrink-0 font-bold">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "!" : "i"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] leading-tight m-0">{t.title}</p>
            {t.body && <p className="text-[12px] mt-0.5 opacity-80 leading-snug m-0">{t.body}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-40 hover:opacity-100 text-lg leading-none bg-transparent border-none cursor-pointer mt-0.5 p-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Products() {
  const location = useLocation();
  const [products, setProducts]               = useState([]);
  const [search, setSearch]                   = useState(location.state?.searchTarget || "");
  const [category, setCategory]               = useState("all");
  const [pendingOrders, setPendingOrders]     = useState({});
  const [showOrderForm, setShowOrderForm]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQty, setOrderQty]               = useState("");
  const [loading, setLoading]                 = useState(false);
  const [toasts, setToasts]                   = useState([]);

  const addToast = (type, title, body = "") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, body }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    loadProducts();
    const unsub = subscribeToOrders();
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (location.state?.searchTarget) {
      setSearch(location.state.searchTarget);
      const stateObj = { ...location.state };
      delete stateObj.searchTarget;
      window.history.replaceState(stateObj, document.title);
    }
  }, [location]);

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "adminProducts"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(list);
    autoLowStockCheck(list);
  };

  const subscribeToOrders = () => {
    const ordersQuery = query(
      collection(db, "purchaseOrders"),
      where("status", "in", ["PENDING", "APPROVED", "REJECTED"])
    );
    return onSnapshot(ordersQuery, (snapshot) => {
      const ordersByProduct = {};
      snapshot.docs.forEach((docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() };
        const pid = order.adminProductId;
        if (
          !ordersByProduct[pid] ||
          order.createdAt?.toMillis() > ordersByProduct[pid].createdAt?.toMillis()
        ) {
          ordersByProduct[pid] = order;
        }
      });
      setPendingOrders(ordersByProduct);
    });
  };

  const autoLowStockCheck = async (items) => {
    for (const p of items) {
      if (p.stock <= 100 && p.availability !== "LOW STOCK") {
        await updateDoc(doc(db, "adminProducts", p.id), {
          availability: "LOW STOCK",
          updatedAt: Timestamp.now(),
        });
        if (p.supplierId) {
          await addDoc(collection(db, "notifications"), {
            type: "LOW_STOCK",
            recipientId: p.supplierId,
            recipientType: "supplier",
            supplierId: p.supplierId,
            productId: p.productId,
            adminProductId: p.id,
            productName: p.productName,
            currentStock: p.stock,
            message: `LOW STOCK ALERT: ${p.productName} is below 100 units (Current: ${p.stock})`,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }
    }
  };

  const openOrderForm = (product) => {
    if (!product.supplierId) {
      addToast("warning", "No supplier assigned", "This product has no supplier linked.");
      return;
    }
    setSelectedProduct(product);
    setOrderQty("");
    setShowOrderForm(true);
  };

  const placeOrder = async () => {
    const qty = Number(orderQty);
    if (!qty || qty <= 0) {
      addToast("warning", "Invalid quantity", "Please enter a valid quantity greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const adminRef       = doc(db, "adminProducts", selectedProduct.id);
      const adminSnap      = await getDoc(adminRef);
      const latestMinStock = Number(adminSnap.data()?.minStock) || 0;

      if (qty > latestMinStock) {
        addToast(
          "error",
          "Quantity exceeds supplier stock",
          `Supplier only has ${latestMinStock} units remaining. Please order ${latestMinStock} or fewer.`
        );
        return;
      }

      const poId        = `PO-${Date.now()}`;
      const totalAmount = qty * Number(selectedProduct.wholesalePrice);
      const newMinStock = latestMinStock - qty;

      const orderRef = await addDoc(collection(db, "purchaseOrders"), {
        poId,
        product:              selectedProduct.productName,
        productId:            selectedProduct.productId,
        productCode:          selectedProduct.productCode || null,
        adminProductId:       selectedProduct.id,
        category:             selectedProduct.category,
        quantity:             qty,
        reorderLevel:         100,
        supplierId:           selectedProduct.supplierId,
        supplierName:         selectedProduct.supplierName || "Unknown Supplier",
        unitPrice:            Number(selectedProduct.wholesalePrice),
        amount:               totalAmount,
        totalAmount,
        pharmacy:             "MediCareX",
        status:               "PENDING",
        orderDate:            Timestamp.now(),
        date:                 new Date().toISOString().split("T")[0],
        createdAt:            Timestamp.now(),
        updatedAt:            Timestamp.now(),
        pharmacistAcknowledged: false,
      });

      await updateDoc(adminRef, { minStock: newMinStock, updatedAt: Timestamp.now() });

      if (selectedProduct.productId) {
        await updateDoc(doc(db, "products", selectedProduct.productId), {
          minStock:  newMinStock,
          updatedAt: Timestamp.now(),
        });
      }

      await addDoc(collection(db, "notifications"), {
        type:           "ORDER_PLACED",
        recipientId:    selectedProduct.supplierId,
        recipientType:  "supplier",
        supplierId:     selectedProduct.supplierId,
        orderId:        orderRef.id,
        poId,
        adminProductId: selectedProduct.id,
        productId:      selectedProduct.productId,
        productCode:    selectedProduct.productCode || null,
        productName:    selectedProduct.productName,
        quantity:       qty,
        totalAmount,
        message: `New Order Received: ${qty} units of ${selectedProduct.productName} (Total: Rs. ${totalAmount.toFixed(2)})`,
        read:      false,
        createdAt: Timestamp.now(),
      });

      addToast(
        "success",
        "Order placed successfully",
        `${qty} units of ${selectedProduct.productName} — supplier notified.`
      );
      setShowOrderForm(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to place order", "Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = (productId) => {
    const order = pendingOrders[productId];
    if (!order) return null;

    const statusStyle = {
      PENDING:  "bg-amber-50 text-amber-700 border border-amber-200",
      APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      REJECTED: "bg-red-50 text-red-600 border border-red-200",
    };

    const style = statusStyle[order.status] || "bg-slate-100 text-slate-500";
    const label = order.status.charAt(0) + order.status.slice(1).toLowerCase();

    return (
      <div className="flex flex-col items-start gap-1">
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${style}`}>
          {label}
        </span>
        <span className="text-[11px] text-slate-400">Qty: {order.quantity}</span>
      </div>
    );
  };

  // ─── FIXED FILTER ────────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase());

    // Find the selected category object (undefined when "all")
    const selectedCat = CATEGORIES.find((c) => c.id === category);

    const matchCategory =
      category === "all" ||
      // Guard: only compare when selectedCat exists, use normalize on both sides
      (selectedCat !== undefined &&
        normalize(p.category) === normalize(selectedCat.name));

    return matchSearch && matchCategory;
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ── ResponsiveTable column definitions (mirrors original <table> cells) ──
  const columns = [
    {
      key: "productCode",
      label: "ID",
      render: (_v, p) => <span className="text-[12px] font-mono text-slate-500">{p.productCode}</span>,
    },
    {
      key: "productName",
      label: "Product",
      render: (_v, p) => (
        <div className="max-w-[180px]">
          <p className="font-semibold text-slate-800 text-[13px] m-0 truncate">{p.productName}</p>
          {p.manufacturer && (
            <p className="text-[11px] text-slate-400 mt-0.5 m-0 truncate">{p.manufacturer}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_v, p) => {
        const catObj = CATEGORIES.find((c) => normalize(c.name) === normalize(p.category));
        return (
          <span className="text-[12px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
            {catObj ? catObj.name : p.category}
          </span>
        );
      },
    },
    {
      key: "supplierName",
      label: "Supplier",
      render: (_v, p) => (
        <span className="inline-block bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-md text-[12px] font-medium">
          {p.supplierName || "—"}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (_v, p) => (
        <>
          <span className={`text-[13px] font-semibold ${p.stock <= 100 ? "text-red-600" : "text-slate-800"}`}>
            {p.stock}
          </span>
          {p.stock <= 100 && (
            <span className="ml-1.5 inline-block bg-red-50 text-red-500 border border-red-100 text-[10px] font-semibold px-2 py-0.5 rounded-md">
              LOW
            </span>
          )}
        </>
      ),
    },
    {
      key: "reorder",
      label: "Reorder",
      render: () => <span className="text-[13px] text-slate-600">100</span>,
    },
    {
      key: "wholesalePrice",
      label: "Wholesale",
      render: (_v, p) => (
        <span className="text-[13px] text-slate-700">
          Rs. {p.wholesalePrice ? Number(p.wholesalePrice).toFixed(2) : "0.00"}
        </span>
      ),
    },
    {
      key: "retailPrice",
      label: "Retail",
      render: (_v, p) => (
        <span className="text-[13px] text-slate-700">
          Rs. {p.retailPrice ? Number(p.retailPrice).toFixed(2) : "0.00"}
        </span>
      ),
    },
    {
      key: "orderStatus",
      label: "Order Status",
      render: (_v, p) => getOrderStatus(p.id) || <span className="text-slate-300 text-sm italic">—</span>,
    },
  ];

  const renderActions = (p) =>
    p.stock <= 100 ? (
      <button
        onClick={() => openOrderForm(p)}
        disabled={pendingOrders[p.id]?.status === "PENDING"}
        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-150"
      >
        {pendingOrders[p.id]?.status === "PENDING" ? "Order Sent" : "Order Now"}
      </button>
    ) : (
      <span className="text-slate-300 text-sm">—</span>
    );

  return (
    <PageLayout title="Inventory Management" subtitle="Admin Dashboard — Consolidated Inventory">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setCategory("all")}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all duration-150 ${
            category === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all duration-150 ${
              category === cat.id
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] mb-5 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all duration-150"
        placeholder="Search products, manufacturer, supplier…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
        <ResponsiveTable
          columns={columns}
          data={filtered}
          keyField="id"
          loading={false}
          emptyMessage="No products found"
          cardTitle="productName"
          cardBadge="stock"
          actions={renderActions}
        />
      </div>

      {/* Restock order modal */}
      {showOrderForm && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-5"
          style={{ animation: "fadeIn 0.15s ease-out" }}
          onClick={() => setShowOrderForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden"
            style={{ animation: "slideUp 0.2s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-base font-bold">↑</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 m-0">Restock Order</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5 m-0">Place a purchase order with the supplier</p>
                </div>
              </div>
            </div>

            {/* Product details */}
            <div className="px-6 py-4">
              <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden mb-4">
                {[
                  { label: "Product",            value: selectedProduct.productName },
                  { label: "Product code",       value: selectedProduct.productCode || "—" },
                  { label: "Supplier",           value: selectedProduct.supplierName },
                  { label: "Admin stock",        value: `${selectedProduct.stock} units` },
                  { label: "Supplier remaining", value: `${selectedProduct.minStock ?? 0} units` },
                  { label: "Unit price",         value: `Rs. ${Number(selectedProduct.wholesalePrice).toFixed(2)}` },
                ].map((item, i, arr) => (
                  <div
                    key={item.label}
                    className={`flex justify-between items-center px-4 py-2.5 text-[13px] ${
                      i < arr.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Quantity input */}
              <div className="mb-4">
                <label className="block mb-1.5 text-[13px] font-semibold text-slate-700">
                  Order quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  min="1"
                  max={selectedProduct.minStock ?? undefined}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all duration-150 bg-white"
                />
                {selectedProduct.minStock > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Max available from supplier: {selectedProduct.minStock} units
                  </p>
                )}
              </div>

              {/* Total preview */}
              <div className="bg-blue-50 border border-blue-100 px-4 py-3.5 rounded-lg mb-5">
                <p className="text-[12px] text-slate-400 mb-0.5 m-0">Total amount</p>
                <p className="text-[22px] font-bold text-blue-600 m-0">
                  Rs. {(orderQty * selectedProduct.wholesalePrice || 0).toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-150"
                >
                  {loading ? "Placing order…" : "Place order"}
                </button>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn      { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp     { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </PageLayout>
  );
}