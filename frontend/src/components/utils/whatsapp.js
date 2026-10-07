export const WHATSAPP_NUMBER = String(import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, '');
export const WHATSAPP_COLOR  = "#25D366";
export const WHATSAPP_LABEL  = "Contact via WhatsApp";

export const openWhatsApp = (message = "Hello, I need more details") => {
  if (!WHATSAPP_NUMBER) return false;
  const text = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  return true;
};