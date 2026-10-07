import React from 'react';

const PAYMENT_MODES = {
    ONLINE: 'ONLINE',
    COD: 'COD'
};

const PaymentMethod = ({ selectedMethod, setMethod }) => {
    const getOptionStyles = (mode) => {
        const baseClasses = "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all";
        const activeClasses = "border-blue-600 bg-blue-50 text-blue-600";
        const inactiveClasses = "border-slate-100 hover:border-slate-200 text-slate-600";

        return `${baseClasses} ${selectedMethod === mode ? activeClasses : inactiveClasses}`;
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <header>
                <h2 className="text-xl font-bold text-blue-900 mb-6">Select Payment Method</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    type="button"
                    onClick={() => setMethod(PAYMENT_MODES.ONLINE)}
                    className={getOptionStyles(PAYMENT_MODES.ONLINE)}
                >
                    <span className="font-bold uppercase">Online Payment</span>
                    <span className="text-xs">Visa / Master / Koko</span>
                </button>

                <button 
                    type="button"
                    onClick={() => setMethod(PAYMENT_MODES.COD)}
                    className={getOptionStyles(PAYMENT_MODES.COD)}
                >
                    <span className="font-bold uppercase">Cash on Delivery</span>
                    <span className="text-xs">Pay when you receive</span>
                </button>
            </div>
        </div>
    );
};

export default PaymentMethod;