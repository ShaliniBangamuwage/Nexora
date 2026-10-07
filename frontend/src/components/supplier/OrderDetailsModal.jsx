import React from "react";
import {
  Package,
  FileText,
  Factory,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  StickyNote,
  X,
  CheckCheck,
  Ban,
} from "lucide-react";
import ModalWrap from "./ModalWrap";

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING:  { cls: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",   label: "Pending"  },
  APPROVED: { cls: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500",    label: "Approved" },
  REJECTED: { cls: "bg-red-50 text-red-700 border-red-200",         dot: "bg-red-400",     label: "Rejected" },
};

function StatusBadge({ status }) {
  const s = statusConfig[status] ?? {
    cls: "bg-blue-50 text-blue-400 border-blue-100", dot: "bg-blue-300", label: status ?? "Unknown",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, iconCls = "text-blue-400" }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className={`flex-shrink-0 ${iconCls}`} strokeWidth={2.2} />
      <h4 className="m-0 text-[10px] font-bold text-blue-400 uppercase tracking-widest">{title}</h4>
      <div className="flex-1 h-px bg-blue-50 ml-1" />
    </div>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false, accent = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-blue-50 last:border-none">
      <span className="text-xs text-blue-400 font-medium flex-shrink-0 mr-3">{label}</span>
      <span className={`text-xs font-semibold text-right break-all
        ${accent ? "text-emerald-600" : "text-blue-950"}
        ${mono ? "font-mono" : ""}
      `}>
        {value}
      </span>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, cls = "" }) {
  return (
    <div className={`bg-white border border-blue-50 rounded-xl p-4 ${cls}`}>
      {children}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function OrderDetailsModal({ order, onClose, onApprove, onReject, formatDate }) {
  if (!order) return null;

  const productName  = order.product      || order.productName || "—";
  const supplierName = order.supplierName || order.supplier    || "—";
  const totalAmount  = Number(order.amount || order.totalAmount || 0);
  const unitPrice    = Number(order.unitPrice || 0);
  const quantity     = order.quantity ?? "—";
  const status       = (order.status ?? "PENDING").toUpperCase();
  const isPending    = status === "PENDING";

  return (
    <ModalWrap onClose={onClose} maxW="max-w-[740px]">

      {/* ── Header ── */}
      <div className="bg-blue-950 rounded-t-2xl px-7 py-6 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="flex justify-between items-start gap-3 relative">
          <div>
            <p className="m-0 mb-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              Purchase Order
            </p>
            <h2 className="m-0 mb-3 text-xl font-bold text-white tracking-tight">
              {order.poId || order.id || "—"}
            </h2>
            <StatusBadge status={status} />
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl cursor-pointer transition-all duration-150 flex-shrink-0"
          >
            <X size={15} className="text-blue-300" strokeWidth={2.5} />
          </button>
        </div>

        {/* Callout tiles */}
        <div className="mt-5 flex gap-3 flex-wrap">
          {[
            { label: "Total Amount", value: `Rs. ${totalAmount.toFixed(2)}`, highlight: true },
            { label: "Quantity",     value: `${quantity} units` },
            { label: "Unit Price",   value: unitPrice > 0 ? `Rs. ${unitPrice.toFixed(2)}` : "—" },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`flex-1 basis-28 rounded-xl px-4 py-2.5 border
                ${highlight
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : "bg-white/[0.05] border-white/10"
                }`}
            >
              <p className="m-0 mb-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-500">{label}</p>
              <p className={`m-0 text-base font-bold ${highlight ? "text-emerald-400" : "text-blue-100"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 flex flex-col gap-4 bg-[#f0f4fb]">

        {/* Product + Order Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <SectionTitle icon={Package} title="Product" iconCls="text-blue-500" />
            <DetailRow label="Product Name"   value={productName} />
            <DetailRow label="Product ID"     value={order.productId}      mono />
            <DetailRow label="Admin Prod. ID" value={order.adminProductId} mono />
            <DetailRow label="Category"       value={order.category} />
            <DetailRow label="Unit Price"     value={unitPrice > 0 ? `Rs. ${unitPrice.toFixed(2)}` : null} />
            <DetailRow label="Quantity"       value={quantity !== "—" ? `${quantity} units` : "—"} />
          </Card>

          <Card>
            <SectionTitle icon={FileText} title="Order Info" iconCls="text-amber-400" />
            <DetailRow label="PO Number"     value={order.poId}  mono />
            <DetailRow label="Order ID"      value={order.id}    mono />
            <DetailRow label="Status"        value={status} />
            <DetailRow label="Payment Terms" value={order.paymentTerms} />
            <DetailRow label="Delivery Date" value={order.deliveryDate ? formatDate(order.deliveryDate) : null} />
            <DetailRow label="Created At"    value={order.createdAt  ? formatDate(order.createdAt)  : null} />
            <DetailRow label="Updated At"    value={order.updatedAt  ? formatDate(order.updatedAt)  : null} />
          </Card>
        </div>

        {/* Supplier + Pharmacy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <SectionTitle icon={Factory} title="Supplier" iconCls="text-purple-400" />
            <DetailRow label="Supplier Name" value={supplierName} />
            <DetailRow label="Supplier ID"   value={order.supplierId} mono />
            <DetailRow label="Email"         value={order.supplierEmail} />
            <DetailRow label="Phone"         value={order.supplierPhone} />
          </Card>

          <Card>
            <SectionTitle icon={Building2} title="Pharmacy / Buyer" iconCls="text-sky-400" />
            <DetailRow label="Pharmacy"      value={order.pharmacy     || order.buyer || "MediCareX"} />
            <DetailRow label="Contact"       value={order.buyerContact || order.pharmacyContact} />
            <DetailRow label="Shipping Addr" value={order.shippingAddress} />
            <DetailRow label="Billing Addr"  value={order.billingAddress} />
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <SectionTitle icon={DollarSign} title="Financial Summary" iconCls="text-emerald-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <DetailRow label="Subtotal"   value={order.subtotal  != null ? `Rs. ${Number(order.subtotal).toFixed(2)}`  : null} />
              <DetailRow label="Tax Rate"   value={order.taxRate   != null ? `${order.taxRate}%`                         : null} />
              <DetailRow label="Tax Amount" value={order.taxAmount != null ? `Rs. ${Number(order.taxAmount).toFixed(2)}` : null} />
              <DetailRow label="Discount"   value={order.discount  != null ? `Rs. ${Number(order.discount).toFixed(2)}`  : null} />
            </div>
            <div>
              <DetailRow label="Total Amount"          value={`Rs. ${totalAmount.toFixed(2)}`}            accent />
              <DetailRow label="Initial Payment (50%)" value={`Rs. ${(totalAmount * 0.5).toFixed(2)}`} />
              <DetailRow label="Balance Due (50%)"     value={`Rs. ${(totalAmount * 0.5).toFixed(2)}`} />
              <DetailRow label="Payment Status"        value={order.paymentStatus} />
            </div>
          </div>
        </Card>

        {/* Approval Details */}
        {status === "APPROVED" && (
          <Card cls="border-emerald-100 bg-emerald-50/60">
            <SectionTitle icon={CheckCircle2} title="Approval Details" iconCls="text-emerald-500" />
            <DetailRow label="Approved At"   value={order.approvedAt   ? formatDate(order.approvedAt)   : null} />
            <DetailRow label="Approval Date" value={order.approvalDate ? formatDate(order.approvalDate) : null} />
            <DetailRow label="Approved By"   value={order.approvedBy} />
          </Card>
        )}

        {/* Rejection Details */}
        {status === "REJECTED" && (
          <Card cls="border-red-100 bg-red-50/60">
            <SectionTitle icon={XCircle} title="Rejection Details" iconCls="text-red-400" />
            <DetailRow label="Rejected At"    value={order.rejectedAt    ? formatDate(order.rejectedAt)    : null} />
            <DetailRow label="Rejection Date" value={order.rejectionDate ? formatDate(order.rejectionDate) : null} />
            <DetailRow label="Rejected By"    value={order.rejectedBy} />
            <DetailRow label="Reason"         value={order.rejectionReason} />
          </Card>
        )}

        {/* Notes */}
        {(order.notes || order.adminNotes || order.specialInstructions) && (
          <Card>
            <SectionTitle icon={StickyNote} title="Notes & Instructions" iconCls="text-amber-400" />
            {order.notes               && <DetailRow label="Notes"                value={order.notes} />}
            {order.adminNotes          && <DetailRow label="Admin Notes"          value={order.adminNotes} />}
            {order.specialInstructions && <DetailRow label="Special Instructions" value={order.specialInstructions} />}
          </Card>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 justify-end pt-1 flex-wrap">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-blue-500 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200"
          >
            <X size={13} strokeWidth={2.5} />
            Close
          </button>

          {isPending && (
            <>
              <button
                onClick={() => { onClose(); onReject(order); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-600 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200"
              >
                <Ban size={13} strokeWidth={2.5} />
                Reject Order
              </button>

              <button
                onClick={() => { onClose(); onApprove(order.id, order); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(16,185,129,0.30)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.40)] hover:-translate-y-px"
              >
                <CheckCheck size={14} strokeWidth={2.5} />
                Approve Order
              </button>
            </>
          )}
        </div>

      </div>
    </ModalWrap>
  );
}