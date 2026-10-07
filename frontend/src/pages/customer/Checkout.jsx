import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import BillingDetails from '../../components/checkout/BillingDetails';
import OrderSummary from '../../components/checkout/OrderSummary';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../stores/cartStore';
import { getAuthHeaders } from '../../services/firebase';
import API_BASE_URL from '../../config/api';
import { FONT } from '../../components/profile/profileTheme';
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from '../../lib/whatsappOrder';

const SHIPPING_FEE = Number(import.meta.env.VITE_SHIPPING_FEE_LKR || 400);
const CURRENCY = import.meta.env.VITE_PAYHERE_CURRENCY || 'LKR';
const PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout';

const emptyForm = (email = '') => ({
  email,
  firstName: '',
  lastName: '',
  country: 'Sri Lanka',
  district: '',
  houseNumber: '',
  laneStreet: '',
  city: '',
  phone: '',
  secondaryPhone: '',
  orderNotes: '',
  agreeTerms: false,
  paymentMethod: 'ONLINE',
  saveAddressToProfile: false,
});

export default function Checkout() {
  const { currentUser, getCurrentUserData } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const [orderData, setOrderData] = useState(() => emptyForm(currentUser?.email || ''));
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [profileAddress, setProfileAddress] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!items?.length && !new URLSearchParams(location.search).has('payment_status')) {
      navigate('/customer/cart', { replace: true });
    }
  }, [items, location.search, navigate]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!currentUser) return;
      try {
        const profile = await getCurrentUserData();
        if (!active || !profile) return;
        const parts = String(profile.fullName || '').trim().split(/\s+/);
        const address = {
          district: profile.district || '',
          city: profile.city || '',
          houseNumber: profile.houseNumber || '',
          laneStreet: profile.laneStreet || '',
        };
        setProfileAddress(address);
        setOrderData((previous) => ({
          ...previous,
          email: currentUser.email || previous.email,
          firstName: previous.firstName || parts[0] || '',
          lastName: previous.lastName || parts.slice(1).join(' '),
          phone: previous.phone || profile.phone || '',
          ...Object.fromEntries(Object.entries(address).map(([key, value]) => [key, previous[key] || value])),
        }));
      } catch (error) {
        console.warn('Could not load saved customer details', error);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [currentUser, getCurrentUserData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('payment_status')) return;
    let active = true;
    const verifyReturn = async () => {
      const orderId = params.get('order_id');
      if (params.get('payment_status') === 'cancel') {
        if (orderId) {
          try {
            await fetch(`${API_BASE_URL}/customer-orders/${encodeURIComponent(orderId)}/cancel-payment`, {
              method: 'POST', headers: await getAuthHeaders(),
            });
          } catch (error) {
            console.warn('Could not release stock for cancelled payment', error);
          }
        }
        setPaymentError('Payment was cancelled. Your cart is unchanged.');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      if (!orderId) {
        setPaymentError('Payment return did not include an order reference.');
        return;
      }
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/customer-orders/details/${encodeURIComponent(orderId)}`, { headers });
        const order = response.ok ? await response.json() : null;
        if (!active) return;
        if (order?.paymentStatus === 'paid') {
          await clearCart();
          navigate(`/customer/checkout/success?orderId=${encodeURIComponent(orderId)}`, { replace: true });
        } else {
          setPaymentError('The payment provider returned, but the trusted payment notification has not confirmed payment yet. Check My Orders before retrying.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {
        if (active) setPaymentError('Could not verify payment status with the server. Check My Orders before retrying.');
      }
    };
    verifyReturn();
    return () => { active = false; };
  }, [location.search, clearCart, navigate]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setOrderData((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setFormErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const validate = () => {
    const errors = {};
    for (const field of ['email', 'firstName', 'lastName', 'phone', 'district', 'city', 'houseNumber', 'laneStreet']) {
      if (!String(orderData[field] || '').trim()) errors[field] = `${field === 'houseNumber' ? 'House number' : field[0].toUpperCase() + field.slice(1)} is required`;
    }
    if (orderData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.email)) errors.email = 'Enter a valid email address';
    if (orderData.phone && !/^(?:0|\+94)\d{9}$/.test(orderData.phone.replace(/\s+/g, ''))) errors.phone = 'Enter a valid Sri Lankan phone number';
    if (!orderData.agreeTerms) errors.agreeTerms = 'Please accept the terms and conditions';
    if (!items?.length) errors.items = 'Your cart is empty';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createOrder = async (paymentMethod) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customer-orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...orderData,
        paymentMethod,
        items: items.map((item) => ({ productId: item.productId || item.id, quantity: Number(item.qty) })),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || 'Order validation failed. Check stock and try again.');
    const stalePrice = (result.items || []).some((orderedItem) => {
      const cartItem = items.find((item) => String(item.productId || item.id) === String(orderedItem.productId));
      return !cartItem || Number(cartItem.price) !== Number(orderedItem.price);
    });
    if (stalePrice) {
      await fetch(`${API_BASE_URL}/customer-orders/${encodeURIComponent(result.orderId)}/cancel-payment`, {
        method: 'POST', headers: await getAuthHeaders(),
      });
      throw new Error('A product price changed since it was added to your cart. Your cart is unchanged; review the updated prices before ordering.');
    }
    return result;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setPaymentError('');
    let pendingPaymentOrderId = null;
    try {
      if (orderData.saveAddressToProfile && currentUser) {
        const profileResponse = await fetch(`${API_BASE_URL}/profile/${currentUser.uid}`, {
          method: 'PUT',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            phone: orderData.phone,
            secondaryPhone: orderData.secondaryPhone,
            district: orderData.district,
            city: orderData.city,
            houseNumber: orderData.houseNumber,
            laneStreet: orderData.laneStreet,
            address: [orderData.houseNumber, orderData.laneStreet, orderData.city, orderData.district].join(', '),
          }),
        });
        if (!profileResponse.ok) throw new Error('Could not save your delivery details. Please retry or uncheck the save-address option.');
      }
      const order = await createOrder(orderData.paymentMethod);
      if (orderData.paymentMethod === 'COD') {
        await clearCart();
        navigate(`/customer/checkout/success?orderId=${encodeURIComponent(order.orderId)}`, {
          state: { orderData: { ...orderData, orderId: order.orderId, items: order.items, totalAmount: order.totalAmount } },
        });
        return;
      }
      pendingPaymentOrderId = order.orderId;

      const headers = await getAuthHeaders();
      const hashResponse = await fetch(
        `${API_BASE_URL}/customer-orders/generate-hash?orderId=${encodeURIComponent(order.orderId)}&currency=${encodeURIComponent(CURRENCY)}`,
        { headers },
      );
      const payment = await hashResponse.json().catch(() => ({}));
      if (!hashResponse.ok) throw new Error(payment.message || 'Could not initialize PayHere Sandbox');

      const payhereForm = document.createElement('form');
      payhereForm.method = 'POST';
      payhereForm.action = PAYHERE_CHECKOUT_URL;
      const customerName = orderData.firstName.trim();
      const fields = {
        merchant_id: payment.merchantId,
        return_url: `${window.location.origin}/customer/checkout?payment_status=success&order_id=${encodeURIComponent(order.orderId)}`,
        cancel_url: `${window.location.origin}/customer/checkout?payment_status=cancel&order_id=${encodeURIComponent(order.orderId)}`,
        notify_url: `${API_BASE_URL}/customer-orders/notify`,
        order_id: order.orderId,
        items: `NEXORA electronics order ${order.orderId}`,
        currency: payment.currency,
        amount: payment.actualAmount,
        first_name: customerName,
        last_name: orderData.lastName,
        email: orderData.email,
        phone: orderData.phone,
        address: `${orderData.houseNumber}, ${orderData.laneStreet}`,
        city: orderData.city,
        country: 'Sri Lanka',
        hash: payment.hash,
      };
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value ?? '');
        payhereForm.appendChild(input);
      });
      document.body.appendChild(payhereForm);
      payhereForm.submit();
    } catch (error) {
      if (pendingPaymentOrderId) {
        try {
          await fetch(`${API_BASE_URL}/customer-orders/${encodeURIComponent(pendingPaymentOrderId)}/cancel-payment`, {
            method: 'POST', headers: await getAuthHeaders(),
          });
        } catch (cancelError) {
          console.warn('Could not release stock for uninitialized payment', cancelError);
        }
      }
      setPaymentError(error.message || 'Unable to place the order.');
      setIsLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!validate()) return;
    const number = import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || '';
    if (!String(number).replace(/\D/g, '')) {
      setPaymentError('WhatsApp ordering is not configured. Set VITE_WHATSAPP_BUSINESS_NUMBER and restart the frontend.');
      return;
    }
    const popup = window.open('', '_blank');
    setIsLoading(true);
    setPaymentError('');
    createOrder('WHATSAPP').then(async (order) => {
      await clearCart();
      const message = buildWhatsAppOrderMessage(orderData, order);
      const whatsappUrl = buildWhatsAppOrderUrl(number, message);
      if (!whatsappUrl) throw new Error('WhatsApp ordering is not configured.');
      if (popup) popup.location.href = whatsappUrl;
      else window.location.href = whatsappUrl;
    }).catch((error) => {
      if (popup) popup.close();
      setPaymentError(error.message || 'Could not validate this order.');
    }).finally(() => setIsLoading(false));
  };

  const total = getTotal() + SHIPPING_FEE;

  return (
    <div className="min-h-screen bg-slate-100" style={{ fontFamily: FONT.body }}>
      <main className="mx-auto max-w-7xl px-5 py-8 pb-20 sm:px-6">
        <header className="mb-8">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Secure payment</p>
          <h1 className="text-2xl font-black text-slate-900">Checkout</h1>
        </header>
        {paymentError && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{paymentError}</div>}
        {formErrors.items && <p role="alert" className="mb-4 text-sm text-red-600">{formErrors.items}</p>}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <BillingDetails formData={orderData} handleInputChange={handleInputChange} originalProfileAddress={profileAddress} errors={formErrors} isLoading={isLoading} />
          </section>
          <aside className="lg:col-span-5">
            <OrderSummary
              formData={orderData}
              handleInputChange={handleInputChange}
              handlePlaceOrder={handlePlaceOrder}
              handleWhatsAppOrder={handleWhatsAppOrder}
              isLoading={isLoading}
              cartItems={items}
              errors={formErrors}
              shippingCharge={SHIPPING_FEE}
              totalOverride={total}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
