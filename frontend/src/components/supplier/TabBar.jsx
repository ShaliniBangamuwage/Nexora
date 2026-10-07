const TabBar = ({ activeTab, setActiveTab, productsCount, pendingCount }) => {
  return (
    <div className="flex gap-2 mb-5">
      <button
        onClick={() => setActiveTab('approved')}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
          activeTab === 'approved'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
            : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        Active Products
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
          activeTab === 'approved' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {productsCount}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('pending')}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 relative ${
          activeTab === 'pending'
            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
            : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300 hover:text-amber-600'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Pending Approval
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default TabBar;