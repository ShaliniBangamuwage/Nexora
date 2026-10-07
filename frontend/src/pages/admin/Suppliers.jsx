import { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { SupplierCard } from "../../components/admin/SupplierCard";
import { SupplierDetail } from "../../components/admin/SupplierDetail";
import PageLayout from "../../components/PageLayout";

const SUPPLIERS_PER_PAGE = 6;

// Builds a Daraz-style page list with ellipses, e.g. [1,2,3,4,5,'dots-right',12]
const getPageNumbers = (current, total) => {
  const pages = [];
  const siblings = 1;
  const shouldShowLeftDots = current - siblings > 2;
  const shouldShowRightDots = current + siblings < total - 1;

  pages.push(1);

  if (shouldShowLeftDots) pages.push('dots-left');

  for (
    let i = Math.max(2, current - siblings);
    i <= Math.min(total - 1, current + siblings);
    i++
  ) {
    pages.push(i);
  }

  if (shouldShowRightDots) pages.push('dots-right');

  if (total > 1) pages.push(total);

  return pages;
};

// Pagination bar — numbered pages with prev/next arrows, matches app's blue/white theme
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500
                   hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:bg-white transition-colors"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      {pageNumbers.map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-9 px-2.5 flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors
              ${p === page
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
          >
            {p}
          </button>
        ) : (
          <span key={p + i} className="h-9 w-9 flex items-center justify-center text-slate-400 text-sm select-none">
            …
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500
                   hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:bg-white transition-colors"
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

export default function Suppliers() {
  const [suppliers, setSuppliers]               = useState([]);
  const [orders, setOrders]                     = useState([]);       // purchase orders for the selected supplier
  const [search, setSearch]                     = useState("");
  const [loading, setLoading]                   = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);     // null = list view, object = detail view
  const [adminRating, setAdminRating]           = useState(0);        // current rating for the selected supplier
  const [currentPage, setCurrentPage]           = useState(1);        // pagination index for the supplier grid (1-based)

  // Fetch all suppliers from Firestore on mount; filtering is done client-side
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "suppliers"));
        setSuppliers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading suppliers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch purchase orders for the selected supplier whenever selection changes
  // Normalises the display date and seeds the rating control from stored value
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedSupplier) return;
      try {
        const q = query(
          collection(db, "purchaseOrders"),
          // Use userId if present (Auth UID); fall back to Firestore document ID
          where("supplierId", "==", selectedSupplier.userId || selectedSupplier.id),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setOrders(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            // Prefer orderDate, then createdAt, then "N/A" for display
            date: d.data().orderDate?.toDate
              ? d.data().orderDate.toDate().toLocaleDateString()
              : d.data().createdAt?.toDate
              ? d.data().createdAt.toDate().toLocaleDateString()
              : "N/A",
          }))
        );
        // Seed rating with the supplier's existing value, defaulting to 0
        setAdminRating(selectedSupplier.rating || 0);
      } catch (err) {
        console.error("Error loading orders:", err);
        alert("Failed to load orders: " + err.message);
      }
    };
    fetchOrders();
  }, [selectedSupplier]);

  // Writes the new rating to Firestore and optimistically updates both the
  // suppliers list and selected supplier to avoid a full re-fetch
  const handleRating = async (value) => {
    try {
      setAdminRating(value);
      await updateDoc(doc(db, "suppliers", selectedSupplier.id), { rating: value });

      // Update the card in the list
      setSuppliers((prev) =>
        prev.map((s) => (s.id === selectedSupplier.id ? { ...s, rating: value } : s))
      );
      // Keep the detail view in sync
      setSelectedSupplier((prev) => ({ ...prev, rating: value }));
    } catch (err) {
      console.error("Error updating rating:", err);
    }
  };

  // Filter suppliers client-side by name or email against the search term
  const filteredSuppliers = suppliers.filter((s) =>
    (s.name || s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Reset to the first page whenever the search term changes, so a new
  // search never lands the user on a page that's now out of range
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / SUPPLIERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = filteredSuppliers.slice(
    (safePage - 1) * SUPPLIERS_PER_PAGE,
    (safePage - 1) * SUPPLIERS_PER_PAGE + SUPPLIERS_PER_PAGE
  );

  // Loading state — shown while initial supplier fetch is in progress
  if (loading)
    return <div className="p-8 text-slate-500 text-lg">Loading suppliers...</div>;

  // Detail view — replaces the list when a supplier is selected
  if (selectedSupplier)
    return (
      <SupplierDetail
        supplier={selectedSupplier}
        orders={orders}
        adminRating={adminRating}
        onRating={handleRating}
        onBack={() => setSelectedSupplier(null)}
      />
    );

  // Default list view — searchable, paginated supplier grid
  return (
    <PageLayout
      title="Supplier Management"
      subtitle="Manage and view all registered suppliers"
      actions={
        <div className="bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-sm">
          {filteredSuppliers.length} Suppliers
        </div>
      }
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Search bar */}
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search suppliers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[300px] px-4 py-3 border-2 border-slate-200 rounded-xl text-[15px] transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        {/* Supplier grid — empty state shown when no suppliers match the search */}
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-lg text-slate-500">No suppliers found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onView={() => setSelectedSupplier(supplier)}
                />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Showing {(safePage - 1) * SUPPLIERS_PER_PAGE + 1}
                  –{Math.min((safePage - 1) * SUPPLIERS_PER_PAGE + SUPPLIERS_PER_PAGE, filteredSuppliers.length)}
                  {" "}of {filteredSuppliers.length} suppliers
                </p>

                <Pagination page={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}