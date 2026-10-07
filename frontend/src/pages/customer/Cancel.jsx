import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { XCircle, AlertCircle } from 'lucide-react';
import { C, FONT } from '../../components/profile/profileTheme';

const UI_CONFIG = {
    ICON_SIZE: 80,
    CHECKOUT_BASE_PATH: "/customer/checkout"
};

const ERROR_MESSAGES = {
    PAYMENT_FAILED_TITLE: "Payment Unsuccessful",
    PAYMENT_FAILED_BODY: "We couldn't process your payment. This could be due to incorrect card details or a bank refusal. Please try again."
};

const Cancel = () => {
    const location = useLocation();
    const { restoreCart } = useCartStore();

    // Try to get from location state first (if navigated internally), otherwise fallback to sessionStorage
    let rxId = location.state?.rxId || sessionStorage.getItem('pendingRxId');
    let rxAmount = location.state?.rxAmount || sessionStorage.getItem('pendingRxAmount');

    if (rxId === 'null') rxId = null;

    // Restore cart if it exists in session storage
    React.useEffect(() => {
        const savedCartItems = sessionStorage.getItem('pendingCartItems');
        if (savedCartItems) {
            restoreCart(JSON.parse(savedCartItems));
            sessionStorage.removeItem('pendingCartItems');
        }
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('pendingRxId');
        sessionStorage.removeItem('pendingRxAmount');
    }, [restoreCart]);

    // Construct the return URL with original parameters if it was a prescription
    const returnUrl = rxId 
        ? `${UI_CONFIG.CHECKOUT_BASE_PATH}?rxId=${rxId}&amount=${rxAmount}`
        : UI_CONFIG.CHECKOUT_BASE_PATH;

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.bg, fontFamily: FONT.body }}>
            <main className="max-w-md w-full p-10 rounded-2xl border text-center animate-in zoom-in duration-500" style={{ background: C.surface, borderColor: C.border, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-red-100 rounded-full scale-150 blur-xl opacity-20"></div>
                    <XCircle 
                        size={UI_CONFIG.ICON_SIZE} 
                        className="text-red-500 relative z-10" 
                    />
                </div>

                <header>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 mt-4" style={{ color: C.textMuted }}>Order Status</p>
                    <h1 className="text-2xl font-black mb-4 tracking-tight" style={{ color: C.textPrimary }}>
                        {ERROR_MESSAGES.PAYMENT_FAILED_TITLE}
                    </h1>
                </header>

                <div className="p-4 rounded-2xl mb-8 flex gap-3 text-left" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                    <AlertCircle className="text-red-600 shrink-0" size={20} />
                    <p className="text-sm leading-relaxed" style={{ color: C.dangerText }}>
                        {ERROR_MESSAGES.PAYMENT_FAILED_BODY}
                    </p>
                </div>

                <Link 
                    to={returnUrl} 
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-[13px] rounded-xl text-[12px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
                >
                    Try Again
                </Link>

                <Link 
                    to="/customer" 
                    className="flex items-center justify-center gap-2 w-full mt-3 font-bold py-[13px] rounded-xl text-[12px] uppercase tracking-wider transition-all border border-solid"
                    style={{ background: C.surface, borderColor: C.border, color: C.textPrimary }}
                >
                    Back to Home
                </Link>
            </main>
        </div>
    );
};

export default Cancel;