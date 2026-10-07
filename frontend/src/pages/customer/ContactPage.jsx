'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Mail, Phone, MapPin, CheckCircle, MailOpen, Clock, Pill, Search, History, ChevronDown, ChevronUp } from 'lucide-react';
import { C, FONT } from '../../components/profile/profileTheme';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

// Base URL for all API calls — falls back to localhost in development
const API_BASE = `${
  (import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;
const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || '';
const STORE_PHONE = import.meta.env.VITE_STORE_PHONE || '';
const STORE_ADDRESS = import.meta.env.VITE_STORE_ADDRESS || '';
// Returns background, text color, border color, icon, and label for each message status
function statusStyle(status) {
  if (status === 'replied') return { bg: "rgba(16,185,129,0.1)",  color: "#059669", border: "rgba(16,185,129,0.25)", icon: CheckCircle, label: "Replied" };
  if (status === 'read')    return { bg: "rgba(26,135,225,0.1)",  color: "#1a87e1", border: "rgba(26,135,225,0.25)", icon: MailOpen,    label: "Read"    };
  return                           { bg: "rgba(245,158,11,0.1)",  color: "#d97706", border: "rgba(245,158,11,0.25)", icon: Clock,       label: "Pending" };
}

// Safe localStorage wrapper — silently fails if storage is unavailable
const storage = {
  get: (k)    => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }           catch {} },
  del: (k)    => { try { localStorage.removeItem(k); }           catch {} },
};

export default function ContactPage() {
  // Contact form fields
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  // Current session message tracking
  const [myMessages, setMyMessages]   = useState([]);
  const [activeEmail, setActiveEmail] = useState('');
  const [checkEmail, setCheckEmail]   = useState('');
  const [checking, setChecking]       = useState(false);

  // Past messages panel state
  const [showPastPanel, setShowPastPanel]   = useState(false);
  const [pastEmail, setPastEmail]           = useState('');
  const [pastMessages, setPastMessages]     = useState([]);
  const [pastChecking, setPastChecking]     = useState(false);
  const [pastError, setPastError]           = useState('');

  // Refs to hold Firestore unsubscribe functions so we can clean up listeners
  const pastUnsubRef = useRef(null);
  const unsubRef     = useRef(null);

  // Sets up a real-time Firestore listener filtered by the customer's email
  const subscribeToMessages = (emailAddr) => {
    // Cancel any existing listener before creating a new one
    if (unsubRef.current) unsubRef.current();
    const q = query(
      collection(db, 'contactMessages'),
      where('email', '==', emailAddr)
    );
    unsubRef.current = onSnapshot(q, (snapshot) => {
      // Sort messages newest-first using Firestore timestamp seconds
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setMyMessages(msgs);
    });
  };

  // On mount, restore saved email from localStorage and re-subscribe to messages
  useEffect(() => {
    const saved = storage.get('contact_email');
    if (saved) {
      setActiveEmail(saved);
      setCheckEmail(saved);
      subscribeToMessages(saved);
    }
    // Cleanup Firestore listener on unmount
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  // Sends a new contact message to the backend, then subscribes to its updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) { alert('Please fill all fields'); return; }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('Failed to send');
      // Persist email so the customer can see replies after page refresh
      storage.set('contact_email', email);
      setActiveEmail(email);
      subscribeToMessages(email);
      setSent(true);
      setMessage('');
      // Auto-hide the success banner after 4 seconds
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Manually checks messages for a typed email and saves it to localStorage
  const handleCheck = () => {
    if (!checkEmail.trim()) return;
    setChecking(true);
    storage.set('contact_email', checkEmail.trim());
    setActiveEmail(checkEmail.trim());
    subscribeToMessages(checkEmail.trim());
    setTimeout(() => setChecking(false), 800);
  };

  // Clears the active session — unsubscribes listener and removes saved email
  const handleClear = () => {
    if (unsubRef.current) unsubRef.current();
    setActiveEmail('');
    setMyMessages([]);
    setCheckEmail('');
    storage.del('contact_email');
  };

  // Toggles the past messages panel and resets its state on close
  const handleTogglePastPanel = () => {
    setShowPastPanel(prev => !prev);
    setPastMessages([]);
    setPastEmail('');
    setPastError('');
    if (pastUnsubRef.current) pastUnsubRef.current();
  };

  // Searches Firestore for past messages matching the entered email
  const handleCheckPast = () => {
    if (!pastEmail.trim()) return;
    setPastChecking(true);
    setPastError('');
    setPastMessages([]);
    // Cancel any existing past-messages listener before starting a new one
    if (pastUnsubRef.current) pastUnsubRef.current();

    const q = query(
      collection(db, 'contactMessages'),
      where('email', '==', pastEmail.trim())
    );

    pastUnsubRef.current = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      if (msgs.length === 0) setPastError('No messages found for this email.');
      setPastMessages(msgs);
      setPastChecking(false);
    }, () => {
      setPastError('Failed to fetch messages.');
      setPastChecking(false);
    });
  };

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: C.bg, fontFamily: FONT.body }}>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="space-y-3 text-center lg:text-left">
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.accent }}>
            Support & Contact
          </p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: C.textPrimary }}>
            Need help? We're here for you.
          </h1>
          <p className="max-w-3xl text-sm leading-7" style={{ color: C.textMuted }}>
            Send a product, order, or delivery question to the NEXORA team.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] p-8" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 15px 40px rgba(15,23,42,0.05)' }}>
            <div className="flex items-start gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl" style={{ background: 'rgba(26,135,225,0.1)' }}>
                <Mail size={24} color={C.accent} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] font-semibold" style={{ color: C.accent }}>
                  Contact Information
                </p>
                <h2 className="mt-3 text-2xl font-semibold" style={{ color: C.textPrimary }}>
                  Store contact details
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {STORE_ADDRESS && <div className="rounded-3xl p-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <MapPin size={18} color={C.accent} />
                  <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                    Address
                  </h3>
                </div>
                <p className="text-sm leading-6" style={{ color: C.textMuted }}>
                  {STORE_ADDRESS}
                </p>
              </div>}

              {STORE_PHONE && <div className="rounded-3xl p-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <Phone size={18} color={C.accent} />
                  <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                    Phone
                  </h3>
                </div>
                <p className="text-sm leading-6" style={{ color: C.textMuted }}>
                  {STORE_PHONE}
                </p>
              </div>}

              {STORE_EMAIL && <div className="rounded-3xl p-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <MailOpen size={18} color={C.accent} />
                  <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                    Email
                  </h3>
                </div>
                <p className="text-sm leading-6" style={{ color: C.textMuted }}>
                  {STORE_EMAIL}
                </p>
              </div>}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] p-8" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 15px 40px rgba(15,23,42,0.05)' }}>
              <div className="text-center mb-8 lg:text-left">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.accent }}>
                  Message us
                </p>
                <h2 className="mt-3 text-3xl font-semibold" style={{ color: C.textPrimary }}>
                  Send a request
                </h2>
                <p className="mt-3 text-sm leading-7" style={{ color: C.textMuted }}>
                  Share a product question or order inquiry and we will follow up using your email.
                </p>
              </div>

              {sent && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span className="text-sm font-medium" style={{ color: '#059669' }}>Message sent successfully.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <input type="text" placeholder="Full Name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-3xl px-5 py-4 text-sm outline-none"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textPrimary, fontFamily: FONT.body }}
                  required />
                <input type="email" placeholder="Email Address" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-3xl px-5 py-4 text-sm outline-none"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textPrimary, fontFamily: FONT.body }}
                  required />
                <textarea placeholder="How can we help you?" value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[170px] rounded-3xl px-5 py-4 text-sm outline-none resize-none"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textPrimary, fontFamily: FONT.body }}
                  required />
                <button type="submit" disabled={sending}
                  className="flex w-full items-center justify-center gap-3 rounded-3xl py-4 text-sm font-semibold border-none text-white"
                  style={{
                    background: sending ? 'rgba(26,135,225,0.4)' : C.accent,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    boxShadow: sending ? 'none' : '0 10px 30px rgba(59,130,246,0.18)',
                    fontFamily: FONT.body,
                  }}>
                  <Send size={16} />
                  {sending ? 'Sending...' : 'Submit Message'}
                </button>
              </form>

              <button
                onClick={handleTogglePastPanel}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-3xl border px-5 py-3 text-sm font-semibold"
                style={{
                  borderColor: C.border,
                  color: C.accent,
                  background: 'transparent',
                  fontFamily: FONT.body,
                }}>
                <History size={14} />
                {showPastPanel ? 'Hide My Messages' : 'View Past Messages'}
                {showPastPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showPastPanel && (
              <div className="rounded-[28px] p-6" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 12px 30px rgba(15,23,42,0.05)' }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <History size={16} color={C.accent} />
                    <h3 className="text-lg font-semibold" style={{ color: C.textPrimary }}>Past support messages</h3>
                  </div>
                  <button onClick={handleClear}
                    className="text-sm font-semibold bg-transparent border-none"
                    style={{ color: C.textMuted, cursor: 'pointer' }}>
                    Clear saved email
                  </button>
                </div>

                <p className="text-sm leading-6 mb-4" style={{ color: C.textMuted }}>
                  Enter the email used when you sent your message to review prior replies.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input type="email" placeholder="Enter your email" value={pastEmail}
                    onChange={(e) => { setPastEmail(e.target.value); setPastError(''); }}
                    className="flex-1 rounded-3xl px-5 py-4 text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textPrimary, fontFamily: FONT.body }} />
                  <button onClick={handleCheckPast} disabled={pastChecking || !pastEmail.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-4 text-sm font-semibold text-white border-none"
                    style={{
                      background: pastChecking || !pastEmail.trim() ? 'rgba(26,135,225,0.4)' : C.accent,
                      cursor: pastChecking || !pastEmail.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: FONT.body,
                    }}>
                    <Search size={14} />
                    {pastChecking ? 'Searching...' : 'Search Messages'}
                  </button>
                </div>

                {pastError && (
                  <p className="mt-4 text-sm" style={{ color: '#d97706' }}>{pastError}</p>
                )}

                {pastMessages.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {pastMessages.map((msg) => {
                      const s = statusStyle(msg.status);
                      const StatusIcon = s.icon;
                      return (
                        <div key={msg.id} className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                          <div className="px-5 py-4" style={{ background: C.bg }}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.textMuted }}>
                                Your Message
                              </p>
                              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
                                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                <StatusIcon size={12} /> {s.label}
                              </span>
                            </div>
                            <p className="text-sm leading-6" style={{ color: C.textPrimary }}>{msg.message}</p>
                          </div>
                          {msg.reply ? (
                            <div className="px-5 py-4" style={{ background: 'rgba(26,135,225,0.04)', borderTop: `1px solid ${C.border}` }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Pill size={14} color={C.accent} />
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.accent }}>
                                  Store Support Reply
                                </p>
                              </div>
                              <p className="text-sm leading-6" style={{ color: C.textPrimary }}>{msg.reply}</p>
                            </div>
                          ) : (
                            <div className="px-5 py-4 flex items-center gap-2 rounded-b-3xl" style={{ background: 'rgba(245,158,11,0.04)', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
                              <Clock size={14} color="#d97706" />
                              <p className="text-sm" style={{ color: '#d97706' }}>
                                Waiting for a reply from store support...
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}