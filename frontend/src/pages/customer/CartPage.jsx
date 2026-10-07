'use client';

import { useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuth } from '../../context/AuthContext';        // ← correct import
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Card         from '../../components/Card';
import CartItem     from '../../components/cart/CartItem';
import OrderSummary from '../../components/cart/OrderSummary';
import EmptyCart    from '../../components/cart/EmptyCart';
import { C, FONT }  from '../../components/profile/profileTheme';

export default function CartPage() {
  const { items, removeItem, clearCart, getTotal, fetchItems, error, clearError } = useCartStore();
  const { currentUser } = useAuth();                        // ← get logged-in user
  const navigate = useNavigate();

  // Sync cart scoped to logged-in customer
  useEffect(() => {
    if (currentUser?.uid) {
      fetchItems(currentUser.uid);                          // ← pass firebase UID
    }
  }, [currentUser?.uid]);

  // Derived totals
  const totalItems     = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice     = getTotal();
  const uniqueProducts = items.length;

  if (items.length === 0) {
    if (!error) return <EmptyCart />;
    return <div className="min-h-[60vh] px-5 py-16 text-center" role="alert">
      <p className="text-sm font-semibold text-red-700">{error}</p>
      <button onClick={() => currentUser?.uid && fetchItems(currentUser.uid)} className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Retry cart</button>
    </div>;
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: C.bg, fontFamily: FONT.body }}>
      <div className="max-w-[760px] mx-auto">

        <div className="flex items-end justify-between pb-5 mb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div></div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card key="products" title="Total Products" value={uniqueProducts} />
          <Card key="quantity" title="Total Quantity" value={totalItems} />
          <Card key="amount"   title="Total Amount"   value={`Rs. ${totalPrice.toFixed(2)}`} />
        </div>

        {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button onClick={clearError} aria-label="Dismiss cart error" className="ml-3 font-bold">×</button></div>}

        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={async () => {
              await removeItem(item.id);
            }}
          />
        ))}

        <OrderSummary total={getTotal()} courierCharge={400} />

        <div className="flex items-center justify-between mt-5">

          <button
            onClick={async () => {
              if (currentUser?.uid) await clearCart(currentUser.uid); // ← pass UID
            }}
            className="inline-flex items-center gap-[6px] text-[12px] font-semibold rounded-lg px-[14px] py-[7px] cursor-pointer"
            style={{
              color:      C.dangerText,
              background: C.dangerBg,
              border:     `1px solid ${C.dangerBorder}`,
              fontFamily: FONT.body,
            }}
          >
            <Trash2 size={13} /> Clear Cart
          </button>

          <div className="flex items-center gap-3">
            <Link
              to="/customer/products"
              className="inline-flex items-center gap-[5px] text-[13px] font-medium no-underline"
              style={{ color: C.textSoft }}
            >
              <ArrowLeft size={13} /> Continue Shopping
            </Link>

            <button
              onClick={() => navigate('/customer/checkout')}
              className="text-[14px] font-semibold text-white border-none rounded-[9px] px-6 py-[10px] cursor-pointer"
              style={{ background: C.accent, fontFamily: FONT.body, boxShadow: C.accentShadow }}
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}