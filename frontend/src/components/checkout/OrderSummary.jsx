import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { X, FileText, CheckCircle2, ShieldCheck, AlertCircle, MessageCircle } from 'lucide-react';

const WHATSAPP_CONFIGURED = Boolean(String(import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, ''));

const OrderSummary = ({ formData, handleInputChange, handlePlaceOrder, handleWhatsAppOrder, isLoading, cartItems, errors = {}, shippingCharge = 400, totalOverride }) => {
    const { getTotal } = useCartStore();
    const [showTerms, setShowTerms] = useState(false);
    
    const itemsToDisplay = cartItems || [];
    const subtotal = getTotal();

    const total = totalOverride ?? subtotal + shippingCharge;

    const formatPrice = (price) => `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <section className="rounded-2xl p-7 sticky top-6 bg-white border border-slate-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <header className="flex justify-between items-end mb-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Summary</p>
                    <h2 className="text-xl font-black text-slate-900">Your order</h2>
                </div>
                <Link to="/customer/cart" className="text-sm text-blue-600 hover:text-blue-800 font-bold underline transition-colors">
                    Edit Cart
                </Link>
            </header>
            
            <div className="space-y-4 text-sm font-medium text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-4 text-slate-500 uppercase tracking-wider text-xs font-bold">
                    <span>Product</span>
                    <span>Subtotal</span>
                </div>
                
                {/* Itemized List */}
                <div className="space-y-5 border-b border-slate-100 pb-6">
                    {itemsToDisplay.length > 0 ? (
                        itemsToDisplay.map((item, idx) => {
                            const qty = item.qty || item.quantity || 1;
                            const price = item.price || (item.total / qty) || 0;
                            const itemTotal = (price * qty) || item.total || 0;

                            return (
                                <div key={idx} className="flex justify-between items-start gap-4 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-slate-400 font-bold text-lg">{item.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-blue-900 font-bold text-[15px] leading-tight">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">QTY: {qty}</span>
                                                <span className="text-[11px] text-slate-400 font-medium">× {formatPrice(price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-blue-900 font-black text-base">{formatPrice(itemTotal)}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex justify-between items-center py-2 text-blue-900 font-bold bg-blue-50/50 px-4 rounded-xl border border-blue-100/50">
                            <span>Order items</span>
                            <span className="text-lg">{formatPrice(subtotal)}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between border-b border-slate-100 py-4">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 py-4 text-emerald-600">
                    <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                            Shipping Charge
                            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">Flat Rate</span>
                        </span>
                        {formData.city && <span className="text-xs text-emerald-600/70 mt-1 font-medium">To {formData.city}</span>}
                    </div>
                    <span className="font-bold">{formatPrice(shippingCharge)}</span>
                </div>

                <div className="py-6 border-b border-slate-100">
                    <p className="mb-4 text-blue-900 font-bold uppercase text-xs tracking-widest">
                        Select Payment Method
                    </p>
                    <div className="space-y-3">
                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'ONLINE' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-slate-200'}`}>
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="ONLINE" 
                                checked={formData.paymentMethod === 'ONLINE'} 
                                onChange={handleInputChange} 
                                disabled={isLoading}
                                className="w-5 h-5 accent-blue-600 disabled:opacity-50" 
                            />
                            <div>
                                <p className="font-bold text-blue-900">Online Payment</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Visa / Master / Koko / Mintpay</p>
                            </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-slate-200'}`}>
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="COD" 
                                checked={formData.paymentMethod === 'COD'} 
                                onChange={handleInputChange} 
                                disabled={isLoading}
                                className="w-5 h-5 accent-blue-600 disabled:opacity-50" 
                            />
                            <div>
                                <p className="font-bold text-blue-900">Cash on Delivery</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Pay when you receive the order</p>
                            </div>
                        </label>
                        {formData.paymentMethod === 'COD' && (
                            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-xl flex gap-3 text-orange-800 animate-fadeIn">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <p className="text-xs font-medium leading-relaxed">
                                    You can pay in cash when your order is delivered. Please keep the exact amount ready to avoid delays.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between py-6 text-2xl font-black text-blue-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>

                <div className="flex flex-col gap-2 py-4 border-b border-slate-100">
                    <div className="flex gap-4 text-xs font-normal text-slate-600 leading-relaxed">
                        <input 
                            type="checkbox" 
                            name="agreeTerms" 
                            checked={formData.agreeTerms} 
                            onChange={handleInputChange} 
                            disabled={isLoading}
                            className={`w-5 h-5 accent-blue-600 rounded mt-1 cursor-pointer disabled:opacity-50 ${errors.agreeTerms ? 'outline outline-2 outline-red-500' : ''}`} 
                        />
                        <span>
                            I have read and agree to the website 
                            <span 
                                onClick={() => !isLoading && setShowTerms(true)}
                                className={`underline font-bold ml-1 transition-colors ${isLoading ? 'text-blue-400 cursor-not-allowed' : 'text-blue-600 cursor-pointer hover:text-blue-800'}`}
                            >
                                terms and conditions *
                            </span>
                        </span>
                    </div>
                    {errors.agreeTerms && <p className="text-red-500 text-xs font-semibold animate-in fade-in">{errors.agreeTerms}</p>}
                </div>

                <button 
                    onClick={handlePlaceOrder} 
                    disabled={isLoading} 
                    className="flex items-center justify-center gap-2 w-full py-[13px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </div>
                    ) : "Place order"}
                </button>
                <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    disabled={isLoading || !handleWhatsAppOrder || !WHATSAPP_CONFIGURED}
                    title={!WHATSAPP_CONFIGURED ? 'WhatsApp ordering is not configured' : undefined}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-white py-[13px] text-[12px] font-bold uppercase tracking-wider text-emerald-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <MessageCircle size={17} />
                    {WHATSAPP_CONFIGURED ? 'Order via WhatsApp' : 'WhatsApp not configured'}
                </button>
            </div>
            {/* Terms and Conditions Modal */}
            {showTerms && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 border border-slate-200" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                        <header className="bg-white p-6 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <FileText size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-0.5">NEXORA</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Terms & Conditions</h3>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowTerms(false)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all active:scale-90 relative z-10"
                            >
                                <X size={24} />
                            </button>
                        </header>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8 bg-white">
                            <section className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-blue-900 text-sm uppercase tracking-widest">
                                    <span className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle2 size={16} className="text-emerald-600" /></span>
                                    Order Confirmation
                                </h4>
                                <p className="text-slate-600 text-[14px] leading-relaxed font-medium">
                                    By placing an order, you confirm that your delivery and contact information is accurate. Product availability is subject to confirmation.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-blue-900 text-sm uppercase tracking-widest">
                                    <span className="p-1.5 bg-amber-100 rounded-lg"><AlertCircle size={16} className="text-amber-600" /></span>
                                    Return & Refund Policy
                                </h4>
                                <p className="text-slate-600 text-[14px] leading-relaxed font-medium">
                                    Returns are handled according to the product return terms shown for your order. Delivery charges may be non-refundable after dispatch.
                                </p>
                            </section>

                            <div className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100/50">
                                <p className="text-[13px] text-slate-500 font-bold leading-relaxed italic">
                                    "NEXORA will confirm product availability and delivery details with you after an order is placed."
                                </p>
                            </div>
                        </div>

                        <footer className="p-6 bg-white border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setShowTerms(false)}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-[13px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                            >
                                I Understand & Agree
                            </button>
                        </footer>
                    </div>
                </div>,
                document.body
            )}

        </section>
    );
};

export default OrderSummary;