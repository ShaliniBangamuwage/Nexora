import { NOTIFICATION_TYPES, getTypeLabel } from './notificationHelpers';

export const FilterBar = ({ filter, onFilter }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm mb-6 flex gap-3 flex-wrap">
    {NOTIFICATION_TYPES.map((type) => (
      <button
        key={type}
        onClick={() => onFilter(type)}
        className={`px-4 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition-all duration-200
          ${filter === type
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
      >
        {type === 'All' ? 'All' : getTypeLabel(type)}
      </button>
    ))}
  </div>
);