import { useState, useCallback, useRef } from "react";
import API_BASE_URL from "../config/api";

export default function SmartSearch({ onResults, onLoading }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);

  const performSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery.trim()) {
        onResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      if (onLoading) onLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/products/search?q=${encodeURIComponent(searchQuery)}`,
        );

        if (!response.ok) throw new Error(`Search failed: ${response.status}`);

        const data = await response.json();
        onResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Check your connection and try again.");
        onResults([]);
      } finally {
        setIsLoading(false);
        if (onLoading) onLoading(false);
      }
    },
    [onResults, onLoading],
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => performSearch(value), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      performSearch(query);
    }
  };

  const handleClear = () => {
    setQuery("");
    setError(null);
    onResults(null);
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {/* Search icon */}
        <div className="absolute left-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>

        {/* Input — styled to match Products.jsx existing input */}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder='Search products, brands, and categories'
          className="w-full pl-10 pr-36 py-3 border-2 rounded-lg text-[15px] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            borderColor: "var(--navbar-border)",
          }}
        />

        {/* Right-side controls */}
        <div className="absolute right-2 flex items-center gap-2">
          {isLoading && (
            <svg
              className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}

          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 w-5 h-5 flex items-center justify-center text-xl leading-none"
            >
              ×
            </button>
          )}

          <button
            onClick={() => performSearch(query)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[13px] font-semibold rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-md disabled:translate-y-0 disabled:shadow-none border-none cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
