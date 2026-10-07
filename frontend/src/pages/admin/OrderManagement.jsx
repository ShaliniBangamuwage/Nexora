import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, Timestamp, getDoc, addDoc, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/Card';
import PageLayout from '../../components/PageLayout';
import { OrderFilters } from '../../components/admin/OrderFilters';
import { OrderTable } from '../../components/admin/OrderTable';
import { OrderModal } from '../../components/admin/OrderModal';

/* ─── Confirmation Card ──────────────────────────────────────────── */
const ConfirmReceiptCard = ({ order, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}>
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
      {/* Top accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      <div className="p-7">
        {/* Icon */}
        <div className="mb-5 w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 className="text-[17px] font-bold text-slate-900 mb-1 tracking-tight">Confirm Order Receipt</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Marking this order as <span className="font-semibold text-slate-700">Completed</span> will update
          inventory stock and unlock the final supplier payment. This action cannot be undone.
        </p>

        {/* Order summary pill */}
        {order && (
          <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {order.productName || order.product || 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {order.poId || order.productId} &nbsp;·&nbsp; {order.supplierName || 'Unknown supplier'}
              </p>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-700 whitespace-nowrap">
              Qty {order.quantity ?? '—'}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600
                       hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white
                       hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Processing…
              </>
            ) : (
              'Confirm Receipt'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────────── */
const OrderManagement = () => {
  const [orders, setOrders]                     = useState([]);
  const [filteredOrders, setFilteredOrders]     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [statusFilter, setStatusFilter]         = useState('All');
  const [searchTerm, setSearchTerm]             = useState('');
  const [selectedOrder, setSelectedOrder]       = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmOrder, setConfirmOrder]         = useState(null); // { orderId, order }
  const [confirmLoading, setConfirmLoading]     = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(
        query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc'))
      );
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(data);
      setFilteredOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let filtered = orders;
    if (statusFilter !== 'All') filtered = filtered.filter((o) => o.status === statusFilter);
    if (searchTerm)
      filtered = filtered.filter(
        (o) =>
          o.poId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    setFilteredOrders(filtered);
  }, [statusFilter, searchTerm, orders]);

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  /* Called from OrderModal — instead of window.confirm, show our card */
  const markAsReceived = (orderId, order) => {
    setConfirmOrder({ orderId, order });
  };

  const handleConfirmReceipt = async () => {
    if (!confirmOrder) return;
    const { orderId, order } = confirmOrder;
    setConfirmLoading(true);

    try {
      await updateDoc(doc(db, 'purchaseOrders', orderId), {
        status: 'COMPLETED',
        completionDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const adminProductRef  = doc(db, 'adminProducts', order.adminProductId);
      const adminProductSnap = await getDoc(adminProductRef);

      if (adminProductSnap.exists()) {
        const newStock =
          Number(adminProductSnap.data().stock || 0) +
          Number(order.quantity || 0);

        // Update adminProducts stock
        await updateDoc(adminProductRef, {
          stock:         newStock,
          availability:  'in stock',
          lastRestocked: Timestamp.now(),
          updatedAt:     Timestamp.now(),
        });

        // Update matching products stock
        if (order.productId) {
          const productRef  = doc(db, 'products', order.productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            await updateDoc(productRef, {
              stock:        newStock,
              availability: 'in stock',
              updatedAt:    Timestamp.now(),
            });
          }
        }
      }

      const resolvedProductName = order.productName || order.product || 'N/A';
      const resolvedPoId        = order.poId || order.productId || orderId;
      const resolvedTotal       = order.totalAmount ?? (order.quantity * order.unitPrice) ?? 0;

      const paymentsSnap = await getDocs(
        query(
          collection(db, 'payments'),
          where('purchaseOrderId', '==', orderId),
          where('paymentType', '==', 'FINAL')
        )
      );

      if (!paymentsSnap.empty) {
        await updateDoc(doc(db, 'payments', paymentsSnap.docs[0].id), {
          status:     'PENDING',
          unlockedAt: Timestamp.now(),
          updatedAt:  Timestamp.now(),
        });
      } else {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        await addDoc(collection(db, 'payments'), {
          purchaseOrderId:  orderId,
          orderId:          resolvedPoId,
          supplierId:       order.supplierId   || null,
          supplierName:     order.supplierName || 'N/A',
          productName:      resolvedProductName,
          quantity:         order.quantity     || 0,
          amount:           resolvedTotal / 2,
          totalOrderAmount: resolvedTotal,
          paymentType:      'FINAL',
          paymentLabel:     'Final Payment (50%)',
          status:           'PENDING',
          dueDate:          Timestamp.fromDate(dueDate),
          createdAt:        Timestamp.now(),
          updatedAt:        Timestamp.now(),
        });
      }

      const finalInvoiceSnap = await getDocs(
        query(
          collection(db, 'invoices'),
          where('purchaseOrderId', '==', orderId),
          where('invoiceType', '==', 'FINAL')
        )
      );

      if (finalInvoiceSnap.empty) {
        const invoiceDueDate = new Date();
        invoiceDueDate.setDate(invoiceDueDate.getDate() + 14);

        await addDoc(collection(db, 'invoices'), {
          purchaseOrderId:  orderId,
          invoiceNumber:    `INV-FINAL-${resolvedPoId}`,
          orderId:          resolvedPoId,
          supplierId:       order.supplierId        || null,
          supplierName:     order.supplierName      || 'N/A',
          pharmacy:         order.pharmacy          || order.pharmacyName || order.orderedBy || 'N/A',
          invoiceType:      'FINAL',
          invoiceLabel:     'Final Payment (50%)',
          paymentStatus:    'Pending',
          invoiceDate:      Timestamp.now(),
          dueDate:          Timestamp.fromDate(invoiceDueDate),
          items: order.items || [
            {
              productName: resolvedProductName,
              quantity:    order.quantity  || 0,
              unitPrice:   order.unitPrice || 0,
            },
          ],
          subtotal:         resolvedTotal / 2,
          taxRate:          order.taxRate   || 0,
          taxAmount:        order.taxAmount || 0,
          totalAmount:      resolvedTotal / 2,
          totalOrderAmount: resolvedTotal,
          createdAt:        Timestamp.now(),
          updatedAt:        Timestamp.now(),
        });
      }

      fetchOrders();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error marking order as received:', error);
    } finally {
      setConfirmLoading(false);
      setConfirmOrder(null);
    }
  };

  const stats = [
    { title: 'Total Orders', value: orders.length,                                         color: 'bg-slate-500' },
    { title: 'Pending',      value: orders.filter((o) => o.status === 'PENDING').length,   color: 'bg-amber-500' },
    { title: 'Approved',     value: orders.filter((o) => o.status === 'APPROVED').length,  color: 'bg-blue-500' },
    { title: 'Delivered',    value: orders.filter((o) => o.status === 'DELIVERED').length, color: 'bg-orange-500' },
    { title: 'Completed',    value: orders.filter((o) => o.status === 'COMPLETED').length, color: 'bg-emerald-500' },
    {
      title: 'Total Amount',
      value: `Rs. ${orders.reduce((s, o) => s + ((o.quantity || 0) * (o.unitPrice || 0)), 0).toFixed(2)}`,
      color: 'bg-violet-500',
    },
  ];

  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <PageLayout
      title="Purchase Orders"
      subtitle="Track, manage and verify all supplier orders"
      actions={
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Live</span>
        </div>
      }
    >

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((card) => (
          <Card key={card.title} title={card.title} value={card.value} color={card.color} />
        ))}
      </div>

      {/* ── Delivered Alert Banner ── */}
      {deliveredCount > 0 && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl bg-white border border-orange-200
                        shadow-[0_0_0_4px_rgba(251,146,60,0.08)] px-5 py-4">
          {/* Icon block */}
          <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-orange-50 border border-orange-100
                          flex items-center justify-center">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {deliveredCount} order{deliveredCount > 1 ? 's' : ''} awaiting receipt confirmation
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Verify delivery and mark as Completed to unlock the final supplier payment.
            </p>
          </div>

          {/* Pill count */}
          <div className="flex-shrink-0 self-center px-3 py-1 rounded-full bg-orange-100 border border-orange-200">
            <span className="text-xs font-bold text-orange-700">{deliveredCount}</span>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mb-5">
        <OrderFilters
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-700">
            {filteredOrders.length}{' '}
            {filteredOrders.length === 1 ? 'order' : 'orders'}
            {statusFilter !== 'All' && (
              <span className="ml-1.5 font-normal text-slate-400">— filtered by {statusFilter}</span>
            )}
          </p>

          {/* Subtle refresh button */}
          <button
            onClick={fetchOrders}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        <OrderTable loading={loading} orders={filteredOrders} onView={viewOrderDetails} />
      </div>

      {/* ── Order Details Modal (hidden when confirm card is active) ── */}
      {showDetailsModal && selectedOrder && !confirmOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onMarkReceived={markAsReceived}
        />
      )}

      {/* ── Confirm Receipt Card (takes over from modal) ── */}
      {confirmOrder && (
        <ConfirmReceiptCard
          order={confirmOrder.order}
          onConfirm={handleConfirmReceipt}
          onCancel={() => setConfirmOrder(null)}
          loading={confirmLoading}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.22s cubic-bezier(.22,1,.36,1) both; }
      `}</style>
    </PageLayout>
  );
};

export default OrderManagement;