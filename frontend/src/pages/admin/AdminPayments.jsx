import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, updateDoc, Timestamp, where, addDoc } from 'firebase/firestore';
import { Check, X, AlertTriangle, Info, Paperclip, FileText, Image as ImageIcon, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../../services/firebase';
import Card from '../../components/Card';
import PageLayout from '../../components/PageLayout';
import ResponsiveTable from '../../components/ResponsiveTable';

/* ───────────── MESSAGE CARD SYSTEM ───────────── */
const MessageCard = ({ messages, removeMessage }) => (
  <div className="fixed top-5 right-5 z-[2000] flex flex-col gap-2 pointer-events-none">
    {messages.map((m) => {
      const styles = {
        success: 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800',
        error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
        warning: 'bg-amber-50 border-l-4 border-amber-500 text-amber-800',
        info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800',
      };
      const iconBg = { success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };
      const icons = { success: Check, error: X, warning: AlertTriangle, info: Info };
      const Icon = icons[m.type] || Info;
      return (
        <div key={m.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg w-[90vw] max-w-[400px] pointer-events-auto ${styles[m.type]}`}
          style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-white flex-shrink-0 mt-0.5 ${iconBg[m.type]}`}>
            <Icon size={14} strokeWidth={2.5} />
          </span>
          <p className="text-sm font-medium m-0 flex-1 leading-snug">{m.message}</p>
          <button type="button" onClick={() => removeMessage(m.id)} className="bg-transparent border-none cursor-pointer p-0 opacity-40 hover:opacity-80 flex-shrink-0" aria-label="Close message">
            <X size={18} />
          </button>
        </div>
      );
    })}
  </div>
);

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptBase64, setReceiptBase64] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const statusOptions = ['All', 'PENDING', 'PAID', 'OVERDUE'];

  /* ───────────── MESSAGE FUNCTIONS ───────────── */
  const showMessage = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeMessage(id), 5000);
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  /* ───────────── RECEIPT UPLOAD ───────────── */
  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) { showMessage('Please select a JPG, PNG or PDF file.', 'error'); return; }
    if (file.size > 900 * 1024) { showMessage('File must be under 900KB.', 'error'); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setReceiptBase64(base64);
      setReceiptFile(file);
      setReceiptPreview(file.type === 'application/pdf' ? 'pdf' : base64);
    };
    reader.onerror = () => { showMessage('Failed to read file.', 'error'); };
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadReceipt = (payment) => {
    if (!payment.receiptBase64) return;
    const link = document.createElement('a');
    link.href = payment.receiptBase64;
    link.download = payment.receiptName || 'receipt';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  /* ─────────────────────────────────────────────
     FETCH ONLY ADMIN → SUPPLIER PAYMENTS
     Only these payment types are fetched: INITIAL, FINAL
     Customer/general payments are not fetched into this page.
     ───────────────────────────────────────────── */
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const supplierPaymentsQuery = query(collection(db, 'payments'), where('paymentType', 'in', ['INITIAL', 'FINAL']));
      const snapshot = await getDocs(supplierPaymentsQuery);

      const paymentsData = snapshot.docs.map(snapshotDoc => {
        const data = { id: snapshotDoc.id, ...snapshotDoc.data() };

        /* Automatically update overdue supplier payments. */
        if (data.status === 'PENDING' && data.dueDate) {
          const dueDate = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
          if (dueDate < new Date()) {
            updateDoc(doc(db, 'payments', snapshotDoc.id), { status: 'OVERDUE' });
            data.status = 'OVERDUE';
          }
        }
        return data;
      });

      /* Sort newest supplier payments first (avoids composite index for paymentType + createdAt) */
      paymentsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setPayments(paymentsData);
    } catch (error) {
      showMessage('Failed to load payments: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  /* ───────────── SEARCH & STATUS FILTER ───────────── */
  const filteredPayments = payments.filter(payment => {
    const matchStatus = statusFilter === 'All' || payment.status === statusFilter;
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const matchSearch = !normalizedSearch ||
      payment.orderId?.toLowerCase().includes(normalizedSearch) ||
      payment.supplierName?.toLowerCase().includes(normalizedSearch) ||
      payment.productName?.toLowerCase().includes(normalizedSearch);
    return matchStatus && matchSearch;
  });

  /* ───────────── PAGINATION (10 per page) ───────────── */
  const paymentsPerPage = 10;
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const startIndex = (currentPage - 1) * paymentsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + paymentsPerPage);

  /* Reset to page 1 on filter/search */
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  /* Keep page valid after updates */
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /* ───────────── STATISTICS ───────────── */
  const stats = {
    total: payments.length,
    pending: payments.filter(payment => payment.status === 'PENDING').length,
    paid: payments.filter(payment => payment.status === 'PAID').length,
    overdue: payments.filter(payment => payment.status === 'OVERDUE').length,
    totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    totalPaid: payments.filter(payment => payment.status === 'PAID').reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    totalPending: payments.filter(payment => payment.status === 'PENDING' || payment.status === 'OVERDUE').reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  };

  /* ───────────── FIND AND UPDATE INVOICE ───────────── */
  const findAndUpdateInvoice = async (payment, invoiceType, extraFields = {}) => {
    const tryQuery = async (...constraints) => {
      try {
        const snap = await getDocs(query(collection(db, 'invoices'), ...constraints));
        return snap.docs;
      } catch {
        return [];
      }
    };

    let invoiceDocs = [];
    if (payment.purchaseOrderId) invoiceDocs = await tryQuery(where('purchaseOrderId', '==', payment.purchaseOrderId), where('invoiceType', '==', invoiceType));
    if (!invoiceDocs.length && payment.orderId) invoiceDocs = await tryQuery(where('orderId', '==', payment.orderId), where('invoiceType', '==', invoiceType));
    if (!invoiceDocs.length && payment.orderId) invoiceDocs = await tryQuery(where('poId', '==', payment.orderId), where('invoiceType', '==', invoiceType));

    if (invoiceDocs.length > 0) {
      await updateDoc(doc(db, 'invoices', invoiceDocs[0].id), {
        paymentStatus: 'Paid', paidAmount: payment.amount, paidDate: Timestamp.now(), paymentMethod: 'Bank Transfer', updatedAt: Timestamp.now(), ...extraFields,
      });
      return true;
    }
    return false;
  };

  /* ───────────── MARK PAYMENT AS PAID ───────────── */
  const markAsPaid = async (paymentId) => {
    const payment = payments.find(paymentItem => paymentItem.id === paymentId);
    if (!payment) return;
    if (!receiptBase64) { showMessage('Please upload a bank receipt before marking as paid.', 'warning'); return; }

    try {
      setUploading(true);
      const receiptFields = { receiptBase64, receiptName: receiptFile.name, receiptType: receiptFile.type, receiptSize: receiptFile.size };

      /* Update payment */
      await updateDoc(doc(db, 'payments', paymentId), { status: 'PAID', paidDate: Timestamp.now(), updatedAt: Timestamp.now(), ...receiptFields });

      /* Update invoice */
      await findAndUpdateInvoice(payment, payment.paymentType === 'INITIAL' ? 'INITIAL' : 'FINAL', receiptFields);

      /* ── INITIAL PAYMENT ── */
      if (payment.paymentType === 'INITIAL') {
        await updateDoc(doc(db, 'purchaseOrders', payment.purchaseOrderId), {
          initialPaymentStatus: 'PAID', initialPaymentDate: Timestamp.now(), updatedAt: Timestamp.now(),
        });
        await addDoc(collection(db, 'notifications'), {
          type: 'INITIAL_PAYMENT_PAID', recipientId: payment.supplierId, recipientType: 'supplier',
          purchaseOrderId: payment.purchaseOrderId, poId: payment.orderId, supplierId: payment.supplierId,
          supplierName: payment.supplierName, productName: payment.productName,
          message: `Initial payment of 50% has been made for order ${payment.orderId}. Please proceed with delivery.`,
          read: false, createdAt: Timestamp.now(),
        });
      }

      /* ── FINAL PAYMENT ── */
      if (payment.paymentType === 'FINAL') {
        await updateDoc(doc(db, 'purchaseOrders', payment.purchaseOrderId), {
          finalPaymentStatus: 'PAID', finalPaymentDate: Timestamp.now(), paymentStatus: 'COMPLETED', orderStatus: 'COMPLETED', updatedAt: Timestamp.now(),
        });
        await addDoc(collection(db, 'notifications'), {
          type: 'FINAL_PAYMENT_PAID', recipientId: payment.supplierId, recipientType: 'supplier',
          purchaseOrderId: payment.purchaseOrderId, poId: payment.orderId, supplierId: payment.supplierId,
          supplierName: payment.supplierName, productName: payment.productName,
          message: `Final payment of 50% has been made for order ${payment.orderId}. All payments are now complete.`,
          read: false, createdAt: Timestamp.now(),
        });
      }

      showMessage(payment.paymentType === 'INITIAL' ? 'Initial payment marked as paid! Supplier notified.' : 'Final payment marked as paid! Order complete.', 'success');
      clearReceipt();
      await fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      showMessage('Failed to update payment: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  /* ───────────── DATE FORMATTER ───────────── */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ───────────── DAYS UNTIL DUE ───────────── */
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return 0;
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
  };

  /* ───────────── STATUS / TYPE STYLES ───────────── */
  const getStatusStyle = status => ({
    PENDING: 'bg-amber-100 text-amber-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    OVERDUE: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-600');

  const getPaymentTypeStyle = type => ({
    INITIAL: 'bg-violet-100 text-violet-800',
    FINAL: 'bg-blue-100 text-blue-800',
  }[type] || 'bg-gray-100 text-gray-600');

  const isPDF = (payment) => payment?.receiptType === 'application/pdf' || payment?.receiptName?.toLowerCase().endsWith('.pdf');

  const handleCloseModal = () => { setSelectedPayment(null); clearReceipt(); };

  /* ───────────── TABLE COLUMNS ───────────── */
  const columns = [
    { key: 'orderId', label: 'PO ID', render: value => <span className="font-mono font-semibold text-blue-600 text-sm">{value}</span> },
    { key: 'supplierName', label: 'Supplier' },
    { key: 'productName', label: 'Product' },
    {
      key: 'paymentType', label: 'Payment Type',
      render: (value, row) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentTypeStyle(value)}`}>
          {row.paymentLabel || value || '—'}
        </span>
      ),
    },
    { key: 'quantity', label: 'Quantity', render: value => `${value} units` },
    { key: 'amount', label: 'Amount', render: value => <span className="font-semibold text-emerald-600">Rs. {Number(value).toFixed(2)}</span> },
    { key: 'dueDate', label: 'Due Date', render: value => formatDate(value) },
    {
      key: 'dueDate', label: 'Days Until Due',
      render: value => {
        const days = getDaysUntilDue(value);
        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${days < 0 ? 'bg-red-100 text-red-800' : days <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
            {days < 0 ? `${Math.abs(days)}d overdue` : `${days} days`}
          </span>
        );
      },
    },
    { key: 'status', label: 'Status', render: value => <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusStyle(value)}`}>{value}</span> },
  ];

  /* ───────────── STAT CARDS ───────────── */
  const statCards = [
    { label: 'Total Payments', value: stats.total },
    { label: 'Pending', value: stats.pending },
    { label: 'Paid', value: stats.paid },
    { label: 'Overdue', value: stats.overdue },
    { label: 'Total Amount', value: `Rs. ${Math.round(stats.totalAmount).toLocaleString('en-US')}` },
    { label: 'Total Paid', value: `Rs. ${Math.round(stats.totalPaid).toLocaleString('en-US')}` },
    { label: 'Total Pending', value: `Rs. ${Math.round(stats.totalPending).toLocaleString('en-US')}` },
  ];

  return (
    <PageLayout title="Payments Management" subtitle="Track and manage supplier payments">
      <MessageCard messages={messages} removeMessage={removeMessage} />

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map(card => <Card key={card.label} title={card.label} value={card.value} />)}
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm mb-4 md:mb-6">
        <input
          type="text"
          placeholder="Search by PO ID, Supplier, or Product..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(status => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 text-xs md:text-sm font-medium cursor-pointer transition-all ${statusFilter === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <ResponsiveTable
          columns={columns}
          data={paginatedPayments}
          keyField="id"
          cardTitle="orderId"
          cardBadge="status"
          loading={loading}
          emptyMessage="No payments found"
          actions={row => (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setSelectedPayment(row); clearReceipt(); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg border-none cursor-pointer">
                View
              </button>
              {row.status !== 'PAID' && (
                <button type="button" onClick={() => { setSelectedPayment(row); clearReceipt(); }} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg border-none cursor-pointer">
                  Pay
                </button>
              )}
            </div>
          )}
        />

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-5 border-t border-slate-100">
            <button type="button" onClick={() => setCurrentPage(previous => Math.max(previous - 1, 1))} disabled={currentPage === 1} aria-label="Previous page"
              className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 cursor-pointer'}`}>
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button key={page} type="button" onClick={() => setCurrentPage(page)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl border text-base font-medium transition-all cursor-pointer ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                {page}
              </button>
            ))}

            <button type="button" onClick={() => setCurrentPage(previous => Math.min(previous + 1, totalPages))} disabled={currentPage === totalPages} aria-label="Next page"
              className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 cursor-pointer'}`}>
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* PAYMENT DETAIL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-[1000] p-0 md:p-5" style={{ animation: 'fadeIn 0.2s ease-out' }} onClick={handleCloseModal}>
          <div className="bg-white w-full md:rounded-2xl md:max-w-[750px] max-h-[95vh] overflow-y-auto shadow-2xl rounded-t-2xl" style={{ animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>

            {/* HEADER */}
            <div className="flex justify-between items-center px-5 md:px-7 py-4 md:py-6 border-b-2 border-slate-100">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 m-0">Payment Details</h2>
              <button type="button" onClick={handleCloseModal} aria-label="Close payment details" className="w-9 h-9 flex items-center justify-center text-slate-400 bg-transparent border-none cursor-pointer rounded-lg hover:bg-slate-100">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 md:p-7">
              {/* ORDER + BADGES */}
              <div className="flex flex-wrap justify-between items-center gap-2 mb-5 pb-4 border-b-2 border-slate-100">
                <h3 className="text-lg md:text-xl font-bold text-blue-600 font-mono m-0">{selectedPayment.orderId}</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedPayment.paymentType && (
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${getPaymentTypeStyle(selectedPayment.paymentType)}`}>
                      {selectedPayment.paymentLabel || selectedPayment.paymentType}
                    </span>
                  )}
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusStyle(selectedPayment.status)}`}>{selectedPayment.status}</span>
                </div>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
                {[
                  { label: 'Supplier', value: selectedPayment.supplierName },
                  { label: 'Product', value: selectedPayment.productName },
                  { label: 'Quantity', value: `${selectedPayment.quantity} units` },
                  { label: 'Payment Amount', value: `Rs. ${Number(selectedPayment.amount).toFixed(2)}`, highlight: 'text-emerald-600 text-xl font-bold' },
                  { label: 'Total Order Amount', value: selectedPayment.totalOrderAmount ? `Rs. ${Number(selectedPayment.totalOrderAmount).toFixed(2)}` : 'N/A' },
                  { label: 'Payment Type', value: selectedPayment.paymentLabel || selectedPayment.paymentType || '—' },
                  { label: 'Created Date', value: formatDate(selectedPayment.createdAt) },
                  { label: 'Due Date', value: formatDate(selectedPayment.dueDate) },
                  ...(selectedPayment.paidDate ? [{ label: 'Paid Date', value: formatDate(selectedPayment.paidDate) }] : []),
                  {
                    label: 'Days Until Due',
                    value: getDaysUntilDue(selectedPayment.dueDate) < 0 ? `${Math.abs(getDaysUntilDue(selectedPayment.dueDate))} days overdue` : `${getDaysUntilDue(selectedPayment.dueDate)} days`,
                    highlight: getDaysUntilDue(selectedPayment.dueDate) < 0 ? 'text-red-500 font-semibold' : '',
                  },
                ].map(item => (
                  <div key={item.label} className="flex flex-col">
                    <label className="text-[13px] text-slate-500 font-medium mb-1">{item.label}</label>
                    <p className={`m-0 text-[15px] text-slate-800 font-medium ${item.highlight || ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* EXISTING RECEIPT */}
              {selectedPayment.status === 'PAID' && selectedPayment.receiptBase64 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2"><Check size={17} /> Bank Receipt Attached</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      {isPDF(selectedPayment) ? <FileText size={22} /> : <ImageIcon size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800 m-0 truncate">{selectedPayment.receiptName || 'Receipt'}</p>
                      <p className="text-xs text-emerald-600 m-0 mt-0.5">{isPDF(selectedPayment) ? 'PDF' : 'Image'} · {((selectedPayment.receiptSize || 0) / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => downloadReceipt(selectedPayment)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg border-none cursor-pointer flex-shrink-0 flex items-center gap-2">
                      <Download size={15} /> Download
                    </button>
                  </div>
                  {!isPDF(selectedPayment) && <img src={selectedPayment.receiptBase64} alt="Receipt" className="mt-4 w-full max-h-[200px] object-contain rounded-lg border border-emerald-200" />}
                </div>
              )}

              {/* INITIAL PAYMENT HINT */}
              {selectedPayment.paymentType === 'INITIAL' && selectedPayment.status !== 'PAID' && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-5">
                  <p className="text-[13px] text-violet-800 font-medium m-0">This is the initial 50% payment. Once paid, the supplier will be notified to proceed with delivery.</p>
                </div>
              )}

              {/* FINAL PAYMENT HINT */}
              {selectedPayment.paymentType === 'FINAL' && selectedPayment.status !== 'PAID' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                  <p className="text-[13px] text-blue-800 font-medium m-0">This is the final 50% payment. Once paid, all transactions for this order will be complete.</p>
                </div>
              )}

              {/* UPLOAD RECEIPT */}
              {selectedPayment.status !== 'PAID' && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Upload Bank Receipt <span className="text-red-500 ml-1">*</span></p>
                  <p className="text-[13px] text-slate-500 mb-4">PDF, JPG or PNG · Max 900KB</p>

                  {!receiptPreview ? (
                    <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <Paperclip size={36} className="text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">Click to upload payment slip</p>
                      <span className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">Browse Files</span>
                    </div>
                  ) : receiptPreview === 'pdf' ? (
                    <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={25} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-800 m-0 truncate">{receiptFile?.name}</p>
                        <p className="text-xs text-blue-600 m-0 mt-1">PDF · {((receiptFile?.size || 0) / 1024).toFixed(0)} KB · Ready</p>
                      </div>
                      <button type="button" onClick={clearReceipt} aria-label="Remove receipt" className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 border-none cursor-pointer flex-shrink-0">
                        <X size={17} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-[200px] object-contain rounded-xl border-2 border-slate-200" />
                        <button type="button" onClick={clearReceipt} aria-label="Remove receipt" className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white border-none cursor-pointer shadow-md">
                          <X size={17} />
                        </button>
                      </div>
                      <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg flex items-center gap-2">
                        <ImageIcon size={17} className="text-slate-500 flex-shrink-0" />
                        <p className="text-xs text-slate-600 m-0 truncate">{receiptFile?.name} · {((receiptFile?.size || 0) / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                  )}

                  {receiptPreview && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg border-none cursor-pointer flex items-center justify-center gap-2">
                      <Paperclip size={15} /> Replace file
                    </button>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleReceiptChange} className="hidden" />
                </div>
              )}

              {/* MARK AS PAID */}
              {selectedPayment.status !== 'PAID' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <button type="button" onClick={() => markAsPaid(selectedPayment.id)} disabled={uploading || !receiptBase64}
                    className={`w-full py-3.5 px-6 text-white border-none rounded-lg text-base font-semibold transition-all mb-2 flex items-center justify-center gap-2 ${uploading || !receiptBase64 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'}`}>
                    {uploading ? (<><Loader2 size={19} className="animate-spin" /> Saving...</>) : (<><Check size={19} strokeWidth={2.5} /> Mark as Paid</>)}
                  </button>
                  <p className="m-0 text-[13px] text-blue-700">{receiptBase64 ? 'Receipt ready — click to complete payment' : 'Upload a bank receipt to enable payment confirmation'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </PageLayout>
  );
};

export default AdminPayments;