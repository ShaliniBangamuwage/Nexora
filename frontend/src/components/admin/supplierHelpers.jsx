export const getOrderStatusStyle = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-600 ring-1 ring-red-200";
    case "completed":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
};

export const formatResponseDate = (order) => {
  if (order.approvalDate?.toDate)  return order.approvalDate.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (order.approvedAt?.toDate)    return order.approvedAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (order.rejectionDate?.toDate) return order.rejectionDate.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (order.rejectedAt?.toDate)    return order.rejectedAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return "—";
};