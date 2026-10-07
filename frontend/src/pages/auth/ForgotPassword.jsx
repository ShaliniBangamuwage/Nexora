// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, email:', email);
    if (!validateEmail()) return;

    setLoading(true);
    setError('');

    try {
      console.log('Calling resetPassword...');
      await resetPassword(email);
      console.log('resetPassword success!');
      setEmailSent(true);
    } catch (error) {
      console.error('Reset password error:', error.code, error.message, error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('This email is not registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await resetPassword(email);
      setResendSuccess(true);
    } catch (error) {
      setError('Failed to resend email. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400 px-4 py-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-90px] right-[-90px] w-72 h-72 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-140px] left-[-140px] w-96 h-96 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 right-[8%] w-52 h-52 rounded-full bg-white/10 animate-pulse pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md px-6 sm:px-10 py-8 sm:py-12 animate-[slideUp_0.5s_ease]">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
            NEXORA
          </h1>
          <p className="text-slate-500 text-sm mt-2">Electronics & Tech Gadgets Store</p>
        </div>

        {!emailSent ? (
          /* ── Enter Email Form ── */
          <>
            <div className="text-center mb-7">
              <h2 className="text-xl font-extrabold text-slate-800">Recover your password</h2>
              <p className="text-slate-500 text-sm mt-2">
                Enter the email address you used to create your account
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm font-medium animate-[slideDown_0.4s_ease]">
                <span className="text-lg font-bold">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-800">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  disabled={loading}
                  className={`px-4 py-3 rounded-xl border-2 text-sm text-slate-800 outline-none transition-all
                    disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed
                    ${error
                      ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-base font-extrabold shadow-lg shadow-blue-400/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/60 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Recover Password'
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </>
        ) : (
          /* ── Email Sent Confirmation ── */
          <div className="flex flex-col items-center text-center gap-5">
            {/* Email icon */}
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-4xl">
              📧
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Check your inbox</h2>
              <p className="text-slate-500 text-sm mt-2">
                We sent password reset instructions to
              </p>
              <p className="text-blue-600 font-bold text-sm mt-1">{email}</p>
            </div>

            <p className="text-xs text-slate-400">
              Please check your inbox and spam folder. The link will expire in 24 hours.
            </p>

            {/* Resend success */}
            {resendSuccess && (
              <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-xl px-5 py-3 text-sm font-medium w-full justify-center">
                <span className="font-bold">✓</span>
                Email resent successfully!
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm font-medium w-full justify-center">
                <span className="font-bold">⚠</span>
                {error}
              </div>
            )}

            {/* Continue button */}
            <Link
              to="/login"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-base font-extrabold shadow-lg shadow-blue-400/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/60 transition-all text-center"
            >
              Continue to Login →
            </Link>

            {/* Resend */}
            <p className="text-sm text-slate-500">
              Didn't receive the email?{' '}
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-blue-500 font-bold hover:text-blue-900 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend email'}
              </button>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;