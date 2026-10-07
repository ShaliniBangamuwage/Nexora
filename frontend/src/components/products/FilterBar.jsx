'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES }  from '../../data/categories';
import SmartSearch      from '../SmartSearch';
import { getCategoryIcon, C, FONT } from './categoryConfig';

// Prepend "All Products" so it appears at the top of the dropdown
const ALL_CATEGORIES = [{ id: 'all', name: 'All Products' }, ...CATEGORIES]; // Retaining static categories as fallback

// Sticky filter bar rendered below the main navigation.
// Provides a SmartSearch input and a category dropdown to narrow the product list.
export default function FilterBar({
  selectedCategory,
  onCategory,
  smartResults,
  onSmartResults,
  categories = CATEGORIES,
}) {
  const allCategories = [{ id: 'all', name: 'All Products' }, ...categories];
  // Controls open/closed state of the category dropdown
  const [open, setOpen]   = useState(false);
  const dropdownRef       = useRef(null);

  // Close the dropdown when the user clicks outside of it
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resolve the display name for the currently selected category
  const activeName = allCategories.find((c) => c.id === selectedCategory)?.name ?? 'All Products';

  // True when any category other than "all" is active — used to apply accent styling
  const isFiltered = selectedCategory !== 'all';

  return (
    // Sticky bar sits just below the top navigation (top-[122px])
    <div
      className="sticky top-[122px] z-40"
      style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(26,135,225,0.07)' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex gap-3 items-center flex-wrap">

        {/* ── Smart Search input ── */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <SmartSearch onResults={onSmartResults} onLoading={() => {}} />
          {/* "Show All" reset button — only visible while smart results are active */}
          {smartResults !== null && (
            <button
              onClick={() => onSmartResults(null)}
              className="px-3 py-2 text-sm font-semibold whitespace-nowrap rounded-lg border transition-colors"
              style={{ color: C.textSoft, borderColor: C.border, background: C.surface }}
            >
              ← Show All
            </button>
          )}
        </div>

        {/* ── Category dropdown ── */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          {/* Trigger button — turns blue when a non-"all" category is selected */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3.5 py-[9px] rounded-xl text-[13px] font-semibold outline-none cursor-pointer min-w-[180px] transition-all duration-150"
            style={{
              border:     `1px solid ${isFiltered ? C.accent : C.border}`,
              color:      isFiltered ? C.accent : C.textSoft,
              fontFamily: FONT.body,
              background: isFiltered ? 'rgba(26,135,225,0.06)' : C.surface,
              boxShadow:  isFiltered ? '0 2px 8px rgba(26,135,225,0.12)' : 'none',
            }}
          >
            <span className="flex items-center gap-1.5 flex-1">
              {/* Dynamically resolve the icon for the active category */}
              {(() => { const Icon = getCategoryIcon(activeName); return <Icon size={14} color={isFiltered ? C.accent : C.textMuted} />; })()}
              {activeName}
            </span>
            {/* Chevron rotates 180° when the dropdown is open */}
            <ChevronDown
              size={15}
              color={isFiltered ? C.accent : C.textMuted}
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>

          {/* ── Dropdown menu — rendered only when open ── */}
          {open && (
            <div
              className="absolute top-[calc(100%+6px)] left-0 min-w-full z-[100] rounded-xl overflow-y-auto"
              style={{
                maxHeight:  '500px',
                background: C.surface,
                border:     `1px solid ${C.border}`,
                boxShadow:  '0 8px 24px rgba(15,42,94,0.13)',
              }}
            >
              {allCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                const Icon   = getCategoryIcon(cat.name);
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onCategory(cat.id); setOpen(false); }}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] border-none cursor-pointer transition-colors duration-[120ms]"
                    style={{
                      fontWeight:   active ? 700 : 500,
                      fontFamily:   FONT.body,
                      color:        active ? C.accent : C.textPrimary,
                      background:   active ? 'rgba(26,135,225,0.07)' : 'transparent',
                      borderBottom: `1px solid ${C.border}`,
                    }}
                    // Hover highlight — skipped for the already-active item
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(26,135,225,0.04)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={14} color={active ? C.accent : C.textMuted} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}