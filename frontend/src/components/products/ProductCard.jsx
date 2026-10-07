'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useAuth } from '../../context/AuthContext';
import { C, FONT } from './categoryConfig';

function ProductImage({ imageUrl, name, height = 200, iconSize = 48 }) {
  return imageUrl ? (
    <img src={imageUrl} alt={name} className="w-full object-cover" style={{ height }} />
  ) : (
    <div className="w-full flex items-center justify-center" style={{ height, background: 'rgba(26,135,225,0.06)' }}>
      <Package size={iconSize} color={C.accent} />
    </div>
  );
}

function AddToCartButton({ availableStock, onClick, size = 'sm' }) {
  const [isClicked, setIsClicked] = useState(false);
  const isLarge = size === 'lg';
  
  const handleClick = (e) => {
    setIsClicked(true);
    onClick(e);
    setTimeout(() => setIsClicked(false), 200);
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={availableStock <= 0}
      className={`w-full rounded-xl font-semibold border-none flex items-center justify-center gap-2 transition-all duration-150 ${isLarge ? 'py-3 text-sm' : 'py-2.5 text-[13px]'}`}
      style={{
        fontFamily: FONT.body,
        cursor:     availableStock > 0 ? 'pointer' : 'not-allowed',
        background: isClicked && availableStock > 0 ? 'rgba(26,135,225,0.7)' : availableStock > 0 ? C.accent : '#e2e8f0',
        color:      availableStock > 0 ? '#ffffff' : C.textMuted,
        boxShadow:  isClicked && availableStock > 0 ? '0 2px 8px rgba(26,135,225,0.35)' : availableStock > 0 ? '0 4px 12px rgba(26,135,225,0.25)' : 'none',
        transform:  isClicked && availableStock > 0 ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      <ShoppingCart size={isLarge ? 16 : 14} />
      {availableStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
}

export default function ProductCard({ product }) {
  const [cartError, setCartError] = useState('');
  const navigate       = useNavigate();
  const addItem        = useCartStore((s) => s.addItem);
  const cartItems      = useCartStore((s) => s.items);
  const { currentUser } = useAuth();

  // ── FIXED: String() comparison handles id being number or string ──
  const productKey    = product.id || product.productId || product.productCode;
  const cartQty       = cartItems.find((i) => String(i.productId) === String(productKey))?.qty ?? 0;
  const productStock  = product.stock ?? 0;
  const displayStock  = Math.max(0, productStock - cartQty);
  const availableStock = displayStock;

  const handleAddToCart = async (e) => {
    e?.stopPropagation();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (availableStock <= 0) return;

    const added = await addItem(product, 1);
    setCartError(added ? '' : useCartStore.getState().error || 'Could not add this product.');
  };

  const price = Number(product.price ?? product.retailPrice ?? 0).toFixed(2);

  return (
    <div
      // ── FIXED: absolute path so navigation works correctly from any page ──
      onClick={() => navigate(`/customer/products/${product.id}`, { state: { product } })}
      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200"
      style={{
        background: C.surface,
        border:     `1px solid ${C.border}`,
        boxShadow:  '0 1px 4px rgba(26,135,225,0.07)',
        fontFamily: FONT.body,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,135,225,0.15)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,135,225,0.07)')}
    >
      <ProductImage imageUrl={product.imageUrl} name={product.name} />
      <div className="px-[18px] py-4">
        <h3 className="text-[15px] font-bold mb-1.5" style={{ color: C.textPrimary }}>{product.name}</h3>
        <p className="text-xs leading-relaxed mb-2.5 line-clamp-2" style={{ color: C.textMuted }}>{product.description}</p>
        <p className="text-base font-bold mb-1.5" style={{ color: C.accent }}>Rs. {price}</p>
        <p className="text-xs mb-3.5" style={{ color: C.textMuted }}>Stock: {displayStock}</p>
        <AddToCartButton availableStock={availableStock} onClick={handleAddToCart} />
        {cartError && <p role="alert" className="mt-2 text-xs text-red-700">{cartError}</p>}
      </div>
    </div>
  );
}