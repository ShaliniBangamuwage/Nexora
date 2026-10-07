import React from "react";
import { Link } from "react-router-dom";

const RegisterSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400 px-4 py-8 relative overflow-hidden">
      <div className="absolute top-[-90px] right-[-90px] w-72 h-72 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-140px] left-[-140px] w-96 h-96 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 right-[8%] w-52 h-52 rounded-full bg-white/10 animate-pulse pointer-events-none" />

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md px-6 sm:px-8 py-8 sm:py-10 animate-[slideUp_0.5s_ease] text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
          NEXORA
        </h1>
        <p className="text-slate-500 text-sm mt-2 mb-8">
          Electronics & Tech Gadgets Store
        </p>

        <div className="flex items-center justify-center mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100">
          <svg
            className="w-10 h-10 text-emerald-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 mb-3">
          Account Setup Complete
        </h2>

        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Your NEXORA customer account is ready. Sign in to continue shopping.
        </p>

        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-8 text-xs font-medium text-left">
          <span>
            Use the same email address you registered with when signing in.
          </span>
        </div>

        <Link
          to="/login"
          className="block w-full py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-base font-extrabold shadow-lg shadow-blue-400/40 hover:-translate-y-0.5 hover:shadow-xl transition-all text-center"
        >
          Back to Login
        </Link>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RegisterSuccess;
