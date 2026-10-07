'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { C, FONT } from './profile/profileTheme';                          // ✅ fixed
import { openWhatsApp, WHATSAPP_COLOR, WHATSAPP_LABEL, WHATSAPP_NUMBER } from './utils/whatsapp';
import { HERO_BADGE_LABEL, HERO_CAROUSEL_HEIGHT, HERO_IMAGE_HEIGHT } from './utils/constants';
// ── Slide data ────────────────────────────────────────────────────────────────
const heroSlides = [
  {
    title: "Upgrade Your World.",
    description: "Discover premium tech designed for work, play, and every moment in between.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
  },
  {
    title: "Power. Precision. Performance.",
    description: "From flagship smartphones to pro-grade laptops, NEXORA keeps you connected to what matters most.",
    image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    gradient: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
  },
  {
    title: "Tech for What's Next.",
    description: "Shop the latest gadgets, audio gear, accessories, and smart-home essentials with confidence.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    gradient: "linear-gradient(135deg, #1f2937 0%, #0ea5e9 100%)",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prev = () => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length);
  const next = () => setCurrentSlide((p) => (p + 1) % heroSlides.length);

  return (
    <section style={{ background: C.bg, fontFamily: FONT.body }}>
      <div>
        <div className="relative overflow-hidden min-h-[400px] md:h-auto" style={{ height: window.innerWidth > 768 ? HERO_CAROUSEL_HEIGHT : 'auto' }}>

          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-500 ease-in-out"
              style={{
                opacity:       currentSlide === index ? 1 : 0,
                pointerEvents: currentSlide === index ? "auto" : "none",
              }}
            >
              <div
                className="h-full flex flex-col md:flex-row justify-center md:items-center px-8 py-10 md:py-0 md:px-14 gap-6 md:gap-10"
                style={{ background: slide.gradient }}
              >

                {/* Text side */}
                <div className="flex flex-col gap-3 w-full md:w-[34%] z-10">

                  <span
                    className="self-start text-[12px] font-bold uppercase tracking-[0.12em] rounded-full px-3 py-0.5"
                    style={{
                      color:      C.bannerSubtitle,
                      background: C.bannerBtnBg,
                      border:     `1px solid ${C.bannerBtnBorder}`,
                    }}
                  >
                    {HERO_BADGE_LABEL}
                  </span>

                  <h1 className="text-3xl font-bold text-white m-0 leading-[1.25]">
                    {slide.title}
                  </h1>

                  <div
                    className="w-12 h-[3px] rounded-[4px]"
                    style={{ background: C.bannerSubtitle }}
                  />

                  <p
                    className="text-[15px] m-0 leading-relaxed"
                    style={{ color: C.bannerSubtitle }}
                  >
                    {slide.description}
                  </p>

                  {/* WhatsApp Button */}
                  {WHATSAPP_NUMBER && <button
                    onClick={() => openWhatsApp(`Hello, I'm interested in: ${slide.title}`)}
                    className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: WHATSAPP_COLOR, color: C.surface }}
                  >
                    {WHATSAPP_LABEL}
                  </button>}

                </div>

                {/* Image side */}
                <div className="flex justify-center items-center w-full md:w-[62%] hidden md:flex">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full object-cover rounded-2xl"
                    style={{
                      height:    HERO_IMAGE_HEIGHT,
                      boxShadow: C.btnShadow,
                      border:    `2px solid ${C.bannerBtnBorder}`,
                    }}
                  />
                </div>

              </div>
            </div>
          ))}

          {/* Prev button */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-[background,box-shadow] duration-150"
            style={{
              background: C.surface,
              border:     `1px solid ${C.border}`,
              boxShadow:  C.btnShadow,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.boxShadow = C.accentShadow; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.boxShadow = C.btnShadow; }}
          >
            <ChevronLeft size={20} color={C.accentDark} />
          </button>

          {/* Next button */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-[background,box-shadow] duration-150"
            style={{
              background: C.surface,
              border:     `1px solid ${C.border}`,
              boxShadow:  C.btnShadow,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.boxShadow = C.accentShadow; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.boxShadow = C.btnShadow; }}
          >
            <ChevronRight size={20} color={C.accentDark} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="h-2 rounded-[4px] border-none cursor-pointer p-0 transition-[width,background] duration-[250ms]"
                style={{
                  width:      currentSlide === i ? 24 : 8,
                  background: currentSlide === i ? C.surface : C.bannerSubtitle,
                }}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}