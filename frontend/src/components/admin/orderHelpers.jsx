export const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'COMPLETED'];

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getStatusStyle = (status) => {
  switch (status) {
    case 'PENDING':     return 'bg-amber-100 text-amber-800';
    case 'APPROVED':    return 'bg-blue-100 text-blue-800';
    case 'REJECTED':    return 'bg-red-100 text-red-800';
    case 'PACKED':      return 'bg-sky-100 text-sky-800';
    case 'IN DELIVERY': return 'bg-violet-100 text-violet-800';
    case 'DELIVERED':   return 'bg-orange-100 text-orange-800';
    case 'COMPLETED':   return 'bg-emerald-100 text-emerald-800';
    default:            return 'bg-gray-100 text-gray-600';
  }
};