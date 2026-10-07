'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import {
  collection, query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';

const C = {
  accent:       '#1a87e1',
  accentMid:    '#0284c7',
  accentLight:  'rgba(26,135,225,0.10)',
  accentBorder: 'rgba(26,135,225,0.22)',
  surface:      '#ffffff',
  textPrimary:  '#1e293b',
  textMuted:    '#64748b',
  textSoft:     '#475569',
  green:        '#059669',
  greenLight:   'rgba(5,150,105,0.09)',
  greenBorder:  'rgba(5,150,105,0.22)',
};

const FONT = { body: "'DM Sans', sans-serif" };

// How long (ms) a card stays visible before auto-dismissing
const AUTO_DISMISS_MS = 12000;

export default function ApprovedOrdersBanner() {
  const [cards, setCards]   = useState([]);        // { id, data, exiting }
  const timersRef           = useRef({});           // id → timeout handle
  const seenRef             = useRef(new Set());    // doc ids shown this session

  useEffect(() => {
    // Listen to the 20 most recently created adminProducts docs
    // Every time admin approves a product, a new doc is added here — onSnapshot fires
    const q = query(
      collection(db, 'adminProducts'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        // Only react to brand-new docs (fresh approval), not modifications
        if (change.type !== 'added') return;

        const id   = change.doc.id;
        const data = change.doc.data();

        // Don't show the same card twice in one session
        if (seenRef.current.has(id)) return;
        seenRef.current.add(id);

        setCards((prev) => [...prev, { id, data, exiting: false }]);

        // Schedule auto-dismiss
        timersRef.current[id] = setTimeout(() => dismissCard(id), AUTO_DISMISS_MS);
      });
    });

    return () => {
      unsub();
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const dismissCard = (id) => {
    // Start slide-out animation
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, exiting: true } : c)),
    );
    // Remove from DOM after animation completes
    setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }, 380);
  };

  if (cards.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22, fontFamily: FONT.body }}>
      {cards.map((card) => (
        <ApprovalCard
          key={card.id}
          data={card.data}
          exiting={card.exiting}
          onDismiss={() => dismissCard(card.id)}
          autoMs={AUTO_DISMISS_MS}
        />
      ))}

      <style>{`
        @keyframes bnr-slideDown {
          from { opacity: 0; transform: translateY(-16px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);     max-height: 300px; }
        }
        @keyframes bnr-slideUp {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-12px); }
        }
        @keyframes bnr-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Individual approval card ──────────────────────────────────────────────────
function ApprovalCard({ data, exiting, onDismiss, autoMs }) {
  const {
    productName,
    productCode,
    wholesalePrice,
    retailPrice,
    category,
    description,
    stock,
    supplierName,
  } = data;

  // retailPrice is stored directly in adminProducts; fallback to wholesalePrice * 1.2
  const sellingPrice = Number(retailPrice ?? wholesalePrice * 1.2).toFixed(2);

  return (
    <div style={{
      position:     'relative',
      background:   C.surface,
      border:       `1.5px solid ${C.greenBorder}`,
      borderLeft:   `4px solid ${C.green}`,
      borderRadius: 12,
      padding:      '14px 16px 18px',
      overflow:     'hidden',
      animation:    exiting
        ? 'bnr-slideUp 0.35s ease-in forwards'
        : 'bnr-slideDown 0.4s ease-out forwards',
      boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
    }}>

      {/* Auto-dismiss progress bar along the bottom */}
      {!exiting && (
        <div style={{
          position:     'absolute',
          bottom:       0, left: 0,
          height:       3,
          background:   C.green,
          borderRadius: '0 2px 0 0',
          animation:    `bnr-shrink ${autoMs}ms linear forwards`,
        }} />
      )}

      {/* ── Header row: icon + title + dismiss button ── */}
      <div style={{
        display:         'flex',
        alignItems:      'flex-start',
        justifyContent:  'space-between',
        gap:             10,
        marginBottom:    12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Checkmark badge */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background:  C.greenLight,
            border:      `1.5px solid ${C.greenBorder}`,
            display:     'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink:  0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4"
                stroke={C.green} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <div style={{
              fontSize:      11,
              fontWeight:    600,
              color:         C.green,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              lineHeight:    1,
            }}>
              New Product Approved
            </div>
            <div style={{
              fontSize:   15,
              fontWeight: 700,
              color:      C.textPrimary,
              lineHeight: 1.3,
              marginTop:  3,
            }}>
              {productName}
            </div>
          </div>
        </div>

        {/* Dismiss × button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            color:       C.textMuted,
            fontSize:    20,
            lineHeight:  1,
            padding:     '0 2px',
            flexShrink:  0,
            marginTop:   1,
          }}
        >
          ×
        </button>
      </div>

      {/* ── Detail chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: description ? 10 : 0 }}>

        {/* Product code */}
        <Chip
          icon={<CodeIcon />}
          label="Product Code"
          value={productCode}
          mono
          color={C.accent}
          bg={C.accentLight}
          border={C.accentBorder}
        />

        {/* Selling / retail price */}
        <Chip
          icon={<PriceIcon color={C.green} />}
          label="Selling Price"
          value={`Rs. ${sellingPrice}`}
          color={C.green}
          bg={C.greenLight}
          border={C.greenBorder}
        />

        {/* Wholesale price */}
        <Chip
          icon={<PriceIcon color={C.textMuted} />}
          label="Wholesale"
          value={`Rs. ${Number(wholesalePrice).toFixed(2)}`}
          color={C.textSoft}
          bg="rgba(100,116,139,0.07)"
          border="rgba(100,116,139,0.18)"
        />

        {/* Stock */}
        {stock !== undefined && stock !== null && (
          <Chip
            icon={<StockIcon />}
            label="Stock"
            value={`${stock} units`}
            color={C.textSoft}
            bg="rgba(100,116,139,0.07)"
            border="rgba(100,116,139,0.18)"
          />
        )}

        {/* Category */}
        {category && (
          <Chip
            label="Category"
            value={category}
            color={C.accentMid}
            bg={C.accentLight}
            border={C.accentBorder}
          />
        )}

        {/* Supplier */}
        {supplierName && (
          <Chip
            label="Supplier"
            value={supplierName}
            color={C.textSoft}
            bg="rgba(100,116,139,0.07)"
            border="rgba(100,116,139,0.18)"
          />
        )}
      </div>

      {/* ── Description ── */}
      {description ? (
        <div style={{
          fontSize:    12,
          color:       C.textMuted,
          lineHeight:  1.65,
          borderTop:   '1px solid rgba(0,0,0,0.06)',
          paddingTop:  9,
          marginTop:   2,
        }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

// ── Reusable chip ─────────────────────────────────────────────────────────────
function Chip({ icon, label, value, mono, color, bg, border }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          6,
      background:   bg,
      border:       `1px solid ${border}`,
      borderRadius: 7,
      padding:      '5px 10px',
    }}>
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <div>
        <div style={{
          fontSize:      10,
          fontWeight:    600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          lineHeight:    1,
        }}>
          {label}
        </div>
        <div style={{
          fontSize:    13,
          fontWeight:  700,
          color,
          fontFamily:  mono ? "'DM Mono', 'Courier New', monospace" : FONT.body,
          lineHeight:  1.3,
          marginTop:   2,
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Tiny SVG icons ────────────────────────────────────────────────────────────
function CodeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="2" width="11" height="9" rx="1.5" stroke={C.accent} strokeWidth="1.2" />
      <path d="M4 5.5L2.5 6.5L4 7.5M9 5.5L10.5 6.5L9 7.5M7 4.5L6 8.5"
        stroke={C.accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PriceIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke={color} strokeWidth="1.2" />
      <path d="M6.5 3.5V4.5M6.5 8.5V9.5M5 7C5 7 5 8 6.5 8C8 8 8 7 6.5 6.5C5 6 5 5 6.5 5C8 5 8 6 8 6"
        stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1.5" y="6" width="10" height="5.5" rx="1.2" stroke={C.textMuted} strokeWidth="1.2" />
      <path d="M4 6V4C4 2.9 5 2 6.5 2C8 2 9 2.9 9 4V6"
        stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}