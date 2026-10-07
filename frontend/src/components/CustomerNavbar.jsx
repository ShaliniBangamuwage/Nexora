import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { ShoppingCart, User, LogOut, Phone, Mail, Sun, Moon, Menu, X } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { WHATSAPP_NUMBER } from './utils/whatsapp';

const FONT = { display: "'Playfair Display', serif", body: "'DM Sans', sans-serif" };

const WhatsAppIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function CustomerNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const items     = useCartStore((state) => state.items || []);
  const cartCount = items.reduce((total, item) => total + (item.qty || 0), 0);

  const navLinks = [
    { name: "Home",     href: "/customer" },
    { name: "Shop",     href: "/customer/products" },
    { name: "Brands",   href: "/customer/brands" },
    { name: "Orders",   href: "/customer/orders" },
    { name: "Contact",  href: "/customer/contact" },
    { name: "About",    href: "/customer/about" },
  ];

  const socialLinks = [
    ...(import.meta.env.VITE_STORE_PHONE ? [{ icon: <Phone size={13} strokeWidth={2} />, label: import.meta.env.VITE_STORE_PHONE, href: null }] : []),
    { icon: <FaFacebook size={13} />,               label: "Facebook",           href: "https://facebook.com",      target: "_blank" },
    ...(WHATSAPP_NUMBER ? [{ icon: <WhatsAppIcon size={13} />, label: "WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}`, target: "_blank" }] : []),
    { icon: <FaInstagram size={13} />,              label: "Instagram",          href: "https://instagram.com",     target: "_blank" },
    { icon: <FaLinkedin size={13} />,               label: "LinkedIn",           href: "https://linkedin.com",      target: "_blank" },
    ...(import.meta.env.VITE_STORE_EMAIL ? [{ icon: <Mail size={13} strokeWidth={2} />, label: import.meta.env.VITE_STORE_EMAIL, href: `mailto:${import.meta.env.VITE_STORE_EMAIL}`, target: null }] : []),
  ];

  const isActive = (href) => {
    if (href === "/customer") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const topLinkStyle = {
    fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.82)",
    textDecoration: "none", letterSpacing: "0.01em", transition: "color 0.15s",
    display: "flex", alignItems: "center", gap: 2,
  };

  const iconBtnBase = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, width: "100%", fontFamily: FONT.body }}>

      {/* Top Bar */}
      <div className="hidden sm:block" style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 40px", height: 42, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 20 }}>
          {socialLinks.map(({ icon, label, href, target }) =>
            href ? (
              <a key={label} href={href} target={target || undefined} rel={target === "_blank" ? "noreferrer" : undefined}
                style={topLinkStyle}
                onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.82)"}
              >
                {icon}{label}
              </a>
            ) : (
              <span key={label} style={{ ...topLinkStyle, cursor: "default" }}>{icon}{label}</span>
            )
          )}
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <div style={{
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
        boxShadow: "0 2px 16px rgba(26,135,225,0.09)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}>
        <div style={{ width: "100%", padding: "0 20px", boxSizing: "border-box" }} className="md:px-[40px]">
          <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Logo */}
            <Link to="/customer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
              <img src="/nexora-mark.svg" alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(26,135,225,0.22)", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 20, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  NEXORA
                </div>
                <div className="hidden sm:block" style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.04em", marginTop: 1 }}>
                  Technology for What's Next.
                </div>
              </div>
            </Link>

            {/* Nav Links */}
           <nav className="hidden lg:flex" style={{
  alignItems: "center",
  justifyContent: "center",
  gap: 40,
  flex: 1
}}>
  {navLinks.map((link) => (
    <Link key={link.name} to={link.href}
      style={{
        padding: "8px 16px",
        borderRadius: 10,
        fontSize: 17,
        fontWeight: 800,
        fontFamily: FONT.body,
        textDecoration: "none",
        letterSpacing: "0.01em",
        transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
        ...(isActive(link.href)
          ? {
              background: "#1749b5",
              color: "#ffffff",
              boxShadow: "0 4px 20px rgba(26,135,225,0.28)"
            }
          : {
              color: "var(--accent-blue)",
              background: "transparent"
            }
        ),
      }}
      onMouseEnter={e => {
        if (!isActive(link.href)) {
          e.currentTarget.style.background = "var(--accent-blue-soft)";
          e.currentTarget.style.color = "var(--accent-blue)";
        }
      }}
      onMouseLeave={e => {
        if (!isActive(link.href)) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--accent-blue)";
        }
      }}
    >
      {link.name}
    </Link>
  ))}
</nav>

            {/* Right: Cart + Profile + Theme Toggle + Logout */}
            <div className="hidden lg:flex" style={{ alignItems: "center", gap: 8, flexShrink: 0 }}>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--accent-blue-soft)",
                  border: "1.5px solid var(--card-border)",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,135,225,0.13)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-blue-soft)"; }}
              >
                {isDarkMode ? <Sun size={20} color="var(--accent-blue)" strokeWidth={1.8} /> : <Moon size={20} color="var(--accent-blue)" strokeWidth={1.8} />}
              </button>

              {/* Cart */}
              <Link
                to="/customer/cart"
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--accent-blue-soft)",
                  border: "1.5px solid var(--card-border)",
                  textDecoration: "none",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,135,225,0.13)"; e.currentTarget.style.borderColor = "rgba(26,135,225,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-blue-soft)"; e.currentTarget.style.borderColor = "var(--card-border)"; }}
              >
                <ShoppingCart size={20} color="var(--accent-blue)" strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span style={{ position: "absolute", top: -7, right: -7, background: "#dc2626", color: "#ffffff", fontSize: 10.5, fontWeight: 700, fontFamily: FONT.body, borderRadius: 20, padding: "2px 6px", border: "2px solid #ffffff", minWidth: 18, textAlign: "center", lineHeight: 1.4 }}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile & Auth */}
              {currentUser ? (
                <>
                  <button onClick={() => navigate("/customer/profile")}
                    style={{ ...iconBtnBase, background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)", boxShadow: "0 4px 14px rgba(26,135,225,0.28)" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,135,225,0.38)"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,135,225,0.28)"; }}
                  >
                    <User size={20} color="#ffffff" strokeWidth={1.8} />
                  </button>

                  <button onClick={handleLogout}
                    style={{ ...iconBtnBase, background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.22)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.12)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.45)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <LogOut size={20} color="#dc2626" strokeWidth={1.8} />
                  </button>
                </>
              ) : (
                <button onClick={() => navigate("/login")}
                  style={{ 
                    padding: "0 24px", 
                    height: 44,
                    borderRadius: 12, 
                    background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)", 
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(26,135,225,0.28)",
                    fontFamily: FONT.body,
                    display: "flex",
                    alignItems: "center"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,135,225,0.38)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,135,225,0.28)"; }}
                >
                  Login / Register
                </button>
              )}

            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-3">
              <button
                onClick={toggleTheme}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--accent-blue-soft)",
                  border: "1.5px solid var(--card-border)",
                  cursor: "pointer",
                }}
              >
                {isDarkMode ? <Sun size={18} color="var(--accent-blue)" /> : <Moon size={18} color="var(--accent-blue)" />}
              </button>
              
              <Link
                to="/customer/cart"
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--accent-blue-soft)",
                  border: "1.5px solid var(--card-border)",
                  textDecoration: "none",
                }}
              >
                <ShoppingCart size={18} color="var(--accent-blue)" strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, background: "#dc2626", color: "#ffffff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 5px", border: "2px solid #ffffff", minWidth: 16, textAlign: "center" }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--accent-blue-soft)",
                  border: "1.5px solid var(--card-border)",
                  cursor: "pointer",
                }}
              >
                {isMobileMenuOpen ? <X size={20} color="var(--accent-blue)" /> : <Menu size={20} color="var(--accent-blue)" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden flex flex-col border-t" style={{ background: "var(--navbar-bg)", borderColor: "var(--navbar-border)" }}>
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: "none",
                    ...(isActive(link.href)
                      ? { background: "#1749b5", color: "#ffffff" }
                      : { color: "var(--text-primary)" }
                    ),
                  }}
                >
                  {link.name}
                </Link>
              ))}
              <hr style={{ borderColor: "var(--navbar-border)", margin: "8px 0", borderWidth: "1px 0 0 0" }} />
              {/* Mobile Profile / Auth */}
              {currentUser ? (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate("/customer/profile"); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-none"
                    style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)", color: "#fff", fontWeight: "bold" }}
                  >
                    <User size={18} /> Profile
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-none"
                    style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: "bold" }}
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setIsMobileMenuOpen(false); navigate("/login"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg mt-2 border-none"
                  style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)", color: "#fff", fontWeight: "bold" }}
                >
                  Login / Register
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}