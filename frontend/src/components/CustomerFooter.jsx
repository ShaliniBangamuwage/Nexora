import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_NUMBER } from './utils/whatsapp';

const C = {
  bg:          "#0f56d9",
  surface:     "rgba(255,255,255,0.05)",
  border:      "rgba(26,135,225,0.25)",
  accent:      "#1a87e1",
  accentDark:  "#0f2a5e",
  textPrimary: "#ffffff",
  textMuted:   "rgba(255,255,255,0.55)",
  textSoft:    "rgba(255,255,255,0.35)",
};

const FONT = { display: "'Playfair Display', serif", body: "'DM Sans', sans-serif" };

const linkStyle = {
  fontSize: 13,
  color: C.textMuted,
  textDecoration: "none",
  fontFamily: FONT.body,
  transition: "color 0.15s",
};

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        style={linkStyle}
        onMouseEnter={e => e.currentTarget.style.color = C.accent}
        onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  const contactItems = [
    ...(import.meta.env.VITE_STORE_PHONE ? [{ icon: <Phone size={14} strokeWidth={1.8} />, text: import.meta.env.VITE_STORE_PHONE }] : []),
    ...(import.meta.env.VITE_STORE_EMAIL ? [{ icon: <Mail size={14} strokeWidth={1.8} />, text: import.meta.env.VITE_STORE_EMAIL }] : []),
    { icon: <MapPin size={14} strokeWidth={1.8} />, text: "Colombo, Sri Lanka" },
  ];

  const socialLinks = [
    { href: "https://facebook.com",      icon: <FaFacebook size={15} />,  label: "Facebook"  },
    { href: "https://twitter.com",       icon: <FaTwitter size={15} />,   label: "Twitter"   },
    { href: "https://instagram.com",     icon: <FaInstagram size={15} />, label: "Instagram" },
    { href: "https://linkedin.com",      icon: <FaLinkedin size={15} />,  label: "LinkedIn"  },
    ...(WHATSAPP_NUMBER ? [{ href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: <FaWhatsapp size={15} />, label: "WhatsApp" }] : []),
  ];

  return (
    <footer style={{ background: "linear-gradient(135deg, #0f2a5e 0%, #1a87e1 100%)", fontFamily: FONT.body }}>

      {/* Top accent line */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #ffffff33, #ffffffaa, #ffffff33)" }} />

      <div style={{ width: "100%", padding: "36px 40px", boxSizing: "border-box" }}>

        {/* GRID */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 32,
        }}>

          {/* COMPANY */}
          <div>
            <h2 style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 4, marginTop: 0 }}>
              NEXORA
            </h2>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, marginTop: 0 }}>
              Technology for What's Next.
            </p>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>
              Premium electronics and gadgets for work, play, and everyday life.
            </p>
          </div>

          {/* SHOP */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, marginTop: 0 }}>
              Shop
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              <FooterLink to="/customer/products">Phones</FooterLink>
              <FooterLink to="/customer/products">Laptops</FooterLink>
              <FooterLink to="/customer/products">Accessories</FooterLink>
              <FooterLink to="/customer/products">Gaming</FooterLink>
            </ul>
          </div>

          {/* CUSTOMER SERVICE */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, marginTop: 0 }}>
              Customer Service
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              <FooterLink to="/customer/contact">Contact</FooterLink>
              <FooterLink to="/customer/orders">Shipping</FooterLink>
              <FooterLink to="/customer/returns">Returns</FooterLink>
              <FooterLink to="/customer/about">FAQ</FooterLink>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, marginTop: 0 }}>
              Contact
            </h3>

            {/* Contact Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {contactItems.map(({ icon, text }) => (
                <p key={text} style={{
                  fontSize: 13, color: C.textMuted,
                  display: "flex", alignItems: "center", gap: 8,
                  margin: 0,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>{icon}</span>
                  {text}
                </p>
              ))}
            </div>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {socialLinks.map(({ href, icon, label }) => (
  <a
    key={label}
    href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    transition: "background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.22)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>

          </div>
        </div>

        {/* BOTTOM */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.15)",
          marginTop: 32, paddingTop: 20,
          textAlign: "center",
          fontSize: 12, color: "rgba(255,255,255,0.4)",
          fontFamily: FONT.body,
        }}>
          © 2026 NEXORA — Technology for What's Next.
        </div>

      </div>
    </footer>
  );
}