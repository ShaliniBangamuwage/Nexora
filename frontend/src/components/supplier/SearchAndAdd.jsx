const SearchAndAdd = ({ searchTerm, setSearchTerm, onAddClick }) => {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mb-6 flex justify-between items-center gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[280px]">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, code or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-[14px] text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:bg-white"
        />
      </div>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[14px] transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-blue-200 whitespace-nowrap"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add New Product
      </button>
    </div>
  );
};

export default SearchAndAdd;