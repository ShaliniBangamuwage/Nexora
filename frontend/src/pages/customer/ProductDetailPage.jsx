'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Package, ShoppingCart, Star, Send, MessageCircle,
  Heart, Share2, Shield, Truck, RotateCcw, ChevronDown, ChevronUp,
  ThumbsUp, BadgeCheck, Clock, Minus, Plus, ZoomIn, X,
  Tag, BarChart2, CheckCircle, Info, User, Mail, Award,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import API_BASE_URL from '../../config/api';

// ─── Firestore ───────────────────────────────────────────────────────────────
import {
  collection, addDoc, getDocs, query,
  orderBy, where, doc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../services/firebase';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STAR_LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function formatDate(iso) {
  if (!iso) return '';
  const d = iso?.toDate ? iso.toDate() : new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StarRow({ value, size = 14, color = '#2563EB' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} fill={value >= s ? color : 'none'} color={color} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function RatingBar({ label, pct }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs w-6 text-right font-semibold" style={{ color: '#64748B' }}>{label}★</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2563EB, #60A5FA)' }}
        />
      </div>
      <span className="text-xs w-7 font-medium" style={{ color: '#94A3B8' }}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const addItem   = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [product,    setProduct]    = useState(location.state?.product ?? null);
  const [localStock, setLocalStock] = useState(location.state?.product?.stock ?? 0);
  const [loading,    setLoading]    = useState(!location.state?.product);
  const [error,      setError]      = useState(null);
  const [qty,        setQty]        = useState(1);
  const [imgZoom,    setImgZoom]    = useState(false);
  const [wishlist,   setWishlist]   = useState(false);
  const [descExpand, setDescExpand] = useState(false);

  const [hovered,       setHovered]       = useState(0);
  const [reviewRating,  setReviewRating]  = useState(0);
  const [ratingMsg,     setRatingMsg]     = useState('');
  const [ratingSummary, setRatingSummary] = useState({ avg: 0, total: 0, dist: [0,0,0,0,0] });

  const [reviews,       setReviews]       = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const [newComment,   setNewComment]   = useState('');
  const [commName,     setCommName]     = useState('');
  const [commEmail,    setCommEmail]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [commentError, setCommentError] = useState('');
  const [isCartClicked, setIsCartClicked] = useState(false);
  const [cartActionError, setCartActionError] = useState('');

  const [currentUser,  setCurrentUser]  = useState(null);

  const fetchProduct = useCallback(async () => {
    setError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!res.ok) throw new Error('Product is unavailable');
      const data = await res.json();
      if (!data) throw new Error('Product is unavailable');
      setProduct(data);
      setLocalStock(data.stock ?? 0);
    } catch {
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setCommName(firebaseUser.displayName || '');
        setCommEmail(firebaseUser.email || '');
      } else {
        setCurrentUser(null);
        setCommName('');
        setCommEmail('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (reviewsLoaded) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'productRatings'),
          where('productId', '==', String(id)),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const dist = [0, 0, 0, 0, 0];
        let sum = 0, total = 0;
        fetched.forEach((r) => {
          if (r.rating > 0) { dist[r.rating - 1] += 1; sum += r.rating; total += 1; }
        });
        setRatingSummary({ avg: total > 0 ? sum / total : 0, total, dist });
        setReviews(fetched);
      } catch (err) {
        if (err?.code !== 'permission-denied') {
          console.warn('Reviews are currently unavailable:', err);
        }
      }
      setReviewsLoaded(true);
    })();
  }, [reviewsLoaded, id]);

  const productKey    = product?.id || product?.productId || product?.productCode || id;
  const cartQty       = cartItems.find((i) => String(i.productId) === String(productKey))?.qty ?? 0;
  const productStock  = product?.stock ?? localStock;
  const displayStock  = Math.max(0, productStock - cartQty);
  const availableStock = displayStock;

  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (availableStock < qty || !product) return;
    
    setIsCartClicked(true);
    setTimeout(() => setIsCartClicked(false), 200);
    
    const added = await addItem(product, qty);
    setCartActionError(added ? '' : useCartStore.getState().error || 'Could not add this product.');
  };

  const handleStarClick = (star) => {
    setReviewRating(star);
    setRatingMsg(STAR_LABEL[star]);
  };

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    setCommentError('');
    const payload = {
      productId:     String(id),
      productName:   product?.name ?? '',
      userId:        currentUser?.uid || '',
      customerName:  commName.trim() || 'Anonymous',
      customerEmail: commEmail.trim() || '',
      comment:       newComment.trim(),
      rating:        reviewRating > 0 ? reviewRating : 0,
      helpful:       0,
      createdAt:     serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'productRatings'), payload);
      if (reviewRating > 0) {
        setRatingSummary((prev) => {
          const newTotal = prev.total + 1;
          const newAvg   = (prev.avg * prev.total + reviewRating) / newTotal;
          const newDist  = [...prev.dist];
          newDist[reviewRating - 1] += 1;
          return { avg: newAvg, total: newTotal, dist: newDist };
        });
      }
      setReviews((prev) => [{ id: ref.id, ...payload, createdAt: new Date() }, ...prev]);
      setNewComment('');
      setReviewRating(0);
      setRatingMsg('');
      if (!currentUser) { setCommName(''); setCommEmail(''); }
    } catch (err) {
      console.error('Firestore write error:', err);
      setCommentError(`Failed to save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      await updateDoc(doc(db, 'productRatings', reviewId), { helpful: increment(1) });
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r)
      );
    } catch (err) {
      console.error('Helpful update error:', err);
    }
  };

  const price     = product
    ? Number(product.price ?? product.retailPrice ?? 0).toFixed(2)
    : null;
  const maxDist   = Math.max(...ratingSummary.dist, 1);
  const descShort = product?.description?.length > 200;

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFF' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p style={{ color: '#2563EB', fontFamily: "'Sora', sans-serif", fontSize: 13, letterSpacing: 3, fontWeight: 600 }}>
          LOADING
        </p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#F8FAFF' }}>
      <p style={{ color: '#1E40AF', fontFamily: "'Sora', sans-serif", fontSize: 16 }}>
        {error || 'Product not found.'}
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)', color: '#fff', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2 }}
        className="px-8 py-3 rounded-lg uppercase"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="product-detail-container" style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: 'var(--text-primary)',
    }}>

      {/* ── Global Style ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .product-detail-container {
          --blue:        #2563EB;
          --blue-mid:    #3B82F6;
          --blue-light:  #60A5FA;
          --blue-pale:   #DBEAFE;
          --blue-dim:    rgba(37,99,235,0.08);
          --blue-dim2:   rgba(37,99,235,0.14);
          --surface:     var(--bg-secondary);
          --surface2:    var(--bg-primary);
          --border:      var(--navbar-border);
          --border-mid:  var(--card-border);
          --text-primary:   var(--text-primary);
          --text-secondary: var(--text-secondary);
          --text-dim:       var(--text-secondary);
        }
        .product-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 460px);
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .product-detail-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
          }
        }
        .blue-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--blue-mid), transparent); opacity: 0.35; }
        .luxury-input {
          background: #F8FAFF;
          border: 1.5px solid var(--border);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .luxury-input:focus {
          outline: none;
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .luxury-input::placeholder { color: var(--text-dim); }
        .review-card { border-bottom: 1px solid var(--border); }
        .review-card:last-child { border-bottom: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F0F5FF; }
        ::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 2px; }
        .star-btn { transition: transform 0.15s; }
        .star-btn:hover { transform: scale(1.15); }
        .card-shadow { box-shadow: 0 2px 16px rgba(37,99,235,0.06), 0 1px 4px rgba(0,0,0,0.04); }
      `}</style>

      {/* ── Top Navigation Bar ── */}
     

      {/* ── Main Two-Column Layout ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px 60px' }}>
        <div className="product-detail-layout">

          {/* ════════════════════════════════════════════ */}
          {/* LEFT COLUMN — Product Details               */}
          {/* ════════════════════════════════════════════ */}
          <div>

            {/* Product Image */}
            <div
              style={{
                position: 'relative',
                background: '#FFFFFF',
                border: '1.5px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'zoom-in',
                aspectRatio: '4/3',
                marginBottom: 32,
              }}
              className="card-shadow"
              onClick={() => setImgZoom(true)}
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Package size={100} style={{ color: 'var(--border-mid)' }} />
                </div>
              )}

              {/* Zoom hint */}
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                padding: '6px 12px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.12)',
              }}>
                <ZoomIn size={12} style={{ color: 'var(--blue)' }} />
                <span style={{ fontSize: 10, color: 'var(--blue)', letterSpacing: 1, fontWeight: 600, fontFamily: "'Sora', sans-serif" }}>ZOOM</span>
              </div>

              {displayStock > 0 && displayStock <= 5 && (
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'linear-gradient(135deg, #FEF2F2, #FECACA)',
                  color: '#DC2626', fontSize: 10, fontWeight: 700,
                  padding: '5px 14px', letterSpacing: 2,
                  border: '1px solid #FECACA', borderRadius: 20,
                  fontFamily: "'Sora', sans-serif",
                }}>
                  ONLY {displayStock} LEFT
                </div>
              )}

              {displayStock === 0 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 700,
                    letterSpacing: 4, border: '2px solid var(--border)',
                    padding: '10px 28px', borderRadius: 8, background: 'var(--surface)',
                    fontFamily: "'Sora', sans-serif",
                  }}>OUT OF STOCK</span>
                </div>
              )}
            </div>

            {/* Image Zoom Overlay */}
            {imgZoom && product.imageUrl && (
              <div
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
                  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'zoom-out', backdropFilter: 'blur(8px)',
                }}
                onClick={() => setImgZoom(false)}
              >
                <img
                  src={product.imageUrl}
                  alt=""
                  style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }}
                />
                <button
                  style={{
                    position: 'absolute', top: 24, right: 24,
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} style={{ color: '#fff' }} />
                </button>
                {cartActionError && <p role="alert" className="mt-2 text-sm text-red-700">{cartActionError}</p>}
              </div>
            )}

            {/* Product Title & Price */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 34, fontWeight: 600, lineHeight: 1.25,
                color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.5px',
              }}>
                {product.name}
              </h1>

              {ratingSummary.total > 0 && (
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <StarRow value={ratingSummary.avg} size={14} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>{ratingSummary.avg.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>({ratingSummary.total} reviews)</span>
                </div>
              )}

              <div className="blue-divider" style={{ marginBottom: 20 }} />

              <div className="flex items-end gap-4 flex-wrap">
                <span style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 42, fontWeight: 700, lineHeight: 1,
                  background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Rs. {price}
                </span>
                {product.mrp && Number(product.mrp) > Number(price) && (
                  <>
                    <span style={{ fontSize: 16, color: 'var(--text-dim)', textDecoration: 'line-through', lineHeight: 2 }}>
                      Rs. {Number(product.mrp).toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      color: '#16A34A',
                      background: '#F0FDF4',
                      border: '1.5px solid #BBF7D0',
                      padding: '4px 12px', borderRadius: 20,
                      fontFamily: "'Sora', sans-serif",
                    }}>
                      {Math.round((1 - Number(price) / Number(product.mrp)) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
                  color: displayStock > 0 ? '#16A34A' : '#DC2626',
                  background: displayStock > 0 ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${displayStock > 0 ? '#BBF7D0' : '#FECACA'}`,
                  padding: '4px 14px', borderRadius: 20,
                  display: 'inline-block',
                  fontFamily: "'Sora', sans-serif",
                  textTransform: 'uppercase',
                }}>
                  {displayStock > 0 ? `In Stock — ${displayStock} units` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: 12, marginBottom: 32,
            }}>
              {[
                { icon: <Truck size={18} />, label: 'Fast Delivery', sub: '3–5 business days' },
                { icon: <RotateCcw size={18} />, label: '7-Day Returns', sub: 'Hassle-free policy' },
                { icon: <Shield size={18} />, label: '100% Genuine', sub: 'Verified authentic' },
              ].map((t) => (
                <div key={t.label} style={{
                  background: '#FFFFFF',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '18px 14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  textAlign: 'center',
                }}
                className="card-shadow"
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--blue)',
                  }}>{t.icon}</div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>{t.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add to Cart */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 32,
            }}
            className="card-shadow"
            >
              <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', marginBottom: 16, textTransform: 'uppercase', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                Select Quantity
              </p>
              <div className="flex items-center gap-4">
                {/* Qty stepper */}
                <div className="flex items-center gap-3" style={{
                  border: '1.5px solid var(--border)', padding: '8px 16px',
                  background: 'var(--surface2)', borderRadius: 12,
                }}>
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{
                      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--blue)',
                      border: '1.5px solid var(--blue-pale)', background: '#EFF6FF',
                      borderRadius: 8, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = 'var(--blue)'; }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: 18, fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
                    style={{
                      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--blue)',
                      border: '1.5px solid var(--blue-pale)', background: '#EFF6FF',
                      borderRadius: 8, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = 'var(--blue)'; }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                  style={{
                    flex: 1, padding: '14px 24px',
                    background: isCartClicked && availableStock > 0
                      ? 'linear-gradient(135deg, #1a3a70 0%, #2563eb 100%)'
                      : availableStock > 0
                      ? 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)'
                      : '#E2E8F0',
                    color: availableStock > 0 ? '#fff' : 'var(--text-dim)',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 12, fontWeight: 700, letterSpacing: 2,
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    cursor: availableStock > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.25s',
                    fontFamily: "'Sora', sans-serif",
                    boxShadow: isCartClicked && availableStock > 0 
                      ? '0 2px 8px rgba(37,99,235,0.25)' 
                      : availableStock > 0 
                      ? '0 4px 16px rgba(37,99,235,0.35)' 
                      : 'none',
                    transform: isCartClicked && availableStock > 0 ? 'scale(0.98)' : 'scale(1)',
                  }}
                  onMouseEnter={e => availableStock > 0 && !isCartClicked && (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={e => availableStock > 0 && !isCartClicked && (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  <ShoppingCart size={16} />
                  {availableStock <= 0 ? 'Out of Stock' : `Add to Cart${qty > 1 ? ` (${qty})` : ''}`}
                </button>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ marginBottom: 24, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 24 }} className="card-shadow">
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <div className="blue-divider" style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, letterSpacing: 3, color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Sora', sans-serif" }}>
                    Description
                  </span>
                  <div className="blue-divider" style={{ flex: 1 }} />
                </div>
                <p style={{
                  fontSize: 15, lineHeight: 1.85, color: 'var(--text-secondary)',
                  fontWeight: 400,
                  display: !descExpand ? '-webkit-box' : 'block',
                  WebkitLineClamp: !descExpand ? 5 : 'unset',
                  WebkitBoxOrient: 'vertical',
                  overflow: !descExpand ? 'hidden' : 'visible',
                }}>
                  {product.description}
                </p>
                {descShort && (
                  <button
                    onClick={() => setDescExpand((e) => !e)}
                    className="flex items-center gap-1.5"
                    style={{ marginTop: 12, color: 'var(--blue)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', background: 'none', border: 'none', textTransform: 'uppercase', fontFamily: "'Sora', sans-serif" }}
                  >
                    {descExpand ? <><ChevronUp size={12} /> Show Less</> : <><ChevronDown size={12} /> Read More</>}
                  </button>
                )}
              </div>
            )}

            {/* Specifications */}
            {(product.brand || product.warranty || product.specifications || product.weight || product.dimensions) && (
              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 24 }} className="card-shadow">
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <div className="blue-divider" style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, letterSpacing: 3, color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Sora', sans-serif" }}>
                    Specifications
                  </span>
                  <div className="blue-divider" style={{ flex: 1 }} />
                </div>
                <div className="overflow-x-auto w-full">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                    <tbody>
                      {[
                        ['Brand', product.brand || product.manufacturer],
                        ['Category', product.category],
                        ['Warranty', product.warranty],
                        ...Object.entries(product.specifications || {}),
                        ['Weight', product.weight],
                        ['Dimensions', product.dimensions],
                      ].filter(([, v]) => v && typeof v !== 'object').map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 0', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase', width: '40%', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{k}</td>
                          <td style={{ padding: '12px 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* RIGHT COLUMN — Reviews & Comments           */}
          {/* ════════════════════════════════════════════ */}
          <div style={{ position: 'sticky', top: 80 }}>

            {/* Rating Summary */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              marginBottom: 12,
            }}
            className="card-shadow"
            >
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={14} style={{ color: 'var(--blue)' }} />
                </div>
                <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'Sora', sans-serif" }}>
                  Customer Ratings
                </span>
              </div>

              <div className="flex gap-6 items-center">
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 60, fontWeight: 700, lineHeight: 1,
                    background: 'linear-gradient(135deg, #1D4ED8, #60A5FA)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {ratingSummary.avg > 0 ? ratingSummary.avg.toFixed(1) : '—'}
                  </p>
                  <StarRow value={ratingSummary.avg} size={13} />
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6, letterSpacing: 1, fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                    {ratingSummary.total} {ratingSummary.total === 1 ? 'REVIEW' : 'REVIEWS'}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <RatingBar key={s} label={s} pct={ratingSummary.dist[s - 1] / maxDist * 100} />
                  ))}
                </div>
              </div>
            </div>

            {/* Write a Review */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              marginBottom: 12,
            }}
            className="card-shadow"
            >
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={14} style={{ color: 'var(--blue)' }} />
                </div>
                <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'Sora', sans-serif" }}>
                  Write a Review
                </span>
              </div>

              {/* Star picker */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                  Your Rating{reviewRating > 0 && <span style={{ color: 'var(--blue)', marginLeft: 8 }}>— {STAR_LABEL[reviewRating]}</span>}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      className="star-btn"
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => handleStarClick(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={30}
                        fill={(hovered || reviewRating) >= s ? '#2563EB' : 'none'}
                        color={(hovered || reviewRating) >= s ? '#2563EB' : '#CBD5E1'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth state */}
              {currentUser ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--blue-dim)',
                  border: '1.5px solid var(--blue-pale)',
                  padding: '10px 14px',
                  marginBottom: 16,
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    flexShrink: 0, fontFamily: "'Sora', sans-serif",
                  }}>
                    {(commName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', fontFamily: "'Sora', sans-serif" }}>Posting as {commName || 'User'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{commEmail}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    background: '#EFF6FF',
                    border: '1.5px solid var(--blue-pale)',
                    padding: '10px 14px',
                    fontSize: 11, color: '#2563EB',
                    marginBottom: 14, lineHeight: 1.5,
                    borderRadius: 10,
                  }}>
                    💡 Log in to auto-fill your name & email
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        placeholder="Your name"
                        value={commName}
                        onChange={(e) => setCommName(e.target.value)}
                        className="luxury-input"
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 13, borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        placeholder="Your email"
                        value={commEmail}
                        onChange={(e) => setCommEmail(e.target.value)}
                        type="email"
                        className="luxury-input"
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 13, borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <textarea
                rows={3}
                placeholder="Share your experience with this product…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="luxury-input"
                style={{
                  width: '100%', padding: '12px 14px',
                  fontSize: 13, lineHeight: 1.6, resize: 'none',
                  marginBottom: 14, borderRadius: 8, boxSizing: 'border-box',
                }}
              />

              <button
                onClick={handleComment}
                disabled={submitting || !newComment.trim()}
                style={{
                  width: '100%', padding: '13px',
                  background: submitting || !newComment.trim()
                    ? '#E2E8F0'
                    : 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  color: submitting || !newComment.trim() ? 'var(--text-dim)' : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s',
                  fontFamily: "'Sora', sans-serif",
                  boxShadow: submitting || !newComment.trim() ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                <Send size={13} />
                {submitting ? 'Posting…' : 'Post Review'}
              </button>

              {commentError && (
                <p style={{
                  marginTop: 10, fontSize: 11, color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '8px 12px', borderRadius: 8,
                }}>
                  ⚠ {commentError}
                </p>
              )}
            </div>

            {/* Reviews List */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              maxHeight: 520,
              overflowY: 'auto',
            }}
            className="card-shadow"
            >
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={14} style={{ color: 'var(--blue)' }} />
                </div>
                <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'Sora', sans-serif" }}>
                  All Reviews
                  {reviews.length > 0 && <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: 6 }}>({reviews.length})</span>}
                </span>
              </div>

              {!reviewsLoaded ? (
                <div className="flex justify-center" style={{ padding: '32px 0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border-mid)', borderTopColor: 'var(--blue)', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <MessageCircle size={24} style={{ color: 'var(--blue-light)' }} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No reviews yet. Be the first to share.
                  </p>
                </div>
              ) : (
                <div>
                  {reviews.map((r) => (
                    <div key={r.id} className="review-card" style={{ paddingBottom: 20, marginBottom: 20 }}>
                      <div className="flex justify-between items-start" style={{ marginBottom: 10 }}>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #DBEAFE, #EFF6FF)',
                            border: '1.5px solid var(--border-mid)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--blue)', fontSize: 14, fontWeight: 700,
                            fontFamily: "'Sora', sans-serif",
                            flexShrink: 0,
                          }}>
                            {(r.customerName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>
                              {r.customerName || 'Anonymous'}
                            </p>
                            {r.createdAt && (
                              <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={9} />
                                {formatDate(r.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        {r.rating > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: 'var(--blue-dim)',
                            border: '1.5px solid var(--blue-pale)',
                            padding: '4px 10px', borderRadius: 20,
                          }}>
                            <StarRow value={r.rating} size={10} />
                          </div>
                        )}
                      </div>
                      <p style={{
                        fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)',
                        fontWeight: 400,
                        marginBottom: 12,
                      }}>
                        {r.comment}
                      </p>
                      <button
                        onClick={() => handleHelpful(r.id)}
                        className="flex items-center gap-2"
                        style={{
                          background: 'none', border: '1.5px solid var(--border)',
                          color: 'var(--text-dim)', fontSize: 10, letterSpacing: 1.5,
                          padding: '5px 12px', cursor: 'pointer', textTransform: 'uppercase',
                          transition: 'all 0.2s', fontFamily: "'Sora', sans-serif", fontWeight: 600,
                          borderRadius: 20,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'none'; }}
                      >
                        <ThumbsUp size={10} />
                        Helpful{r.helpful > 0 ? ` (${r.helpful})` : ''}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          {/* END RIGHT COLUMN */}

        </div>
      </div>
    </div>
  );
}