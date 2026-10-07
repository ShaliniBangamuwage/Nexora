export default function StatusBadge({ status }) {
  const base =
    "inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";

  const variants = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const style = variants[status.toLowerCase()] ?? "bg-gray-100 text-gray-600";

  return <span className={`${base} ${style}`}>{status.toUpperCase()}</span>;
}