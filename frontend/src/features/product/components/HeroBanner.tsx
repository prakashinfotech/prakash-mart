import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ROUTES } from '@/app/router'
import { bannerApi, type BannerDto } from '@/features/banner/api/bannerApi'

const FALLBACK_SLIDES = [
  {
    eyebrow: 'Limited time',
    pct: '80',
    title: 'Electronics Mega Sale',
    sub: 'Phones · Laptops · Audio · Wearables',
    ctaText: 'Shop Electronics',
    ctaCategory: 'Electronics',
    bg: 'linear-gradient(120deg, #006FEE 0%, #2EB6FA 100%)',
    glyph: 'E',
  },
  {
    eyebrow: 'New season',
    pct: '50',
    title: 'Fashion that fits',
    sub: 'Apparel · Footwear · Accessories',
    ctaText: 'Shop Fashion',
    ctaCategory: 'Fashion',
    bg: 'linear-gradient(120deg, #7828C8 0%, #F31260 100%)',
    glyph: 'F',
  },
  {
    eyebrow: "Editor's choice",
    pct: '60',
    title: 'Make it feel like home',
    sub: 'Furniture · Decor · Linens · Kitchen',
    ctaText: 'Shop Home',
    ctaCategory: 'Home & Kitchen',
    bg: 'linear-gradient(120deg, #17C964 0%, #06B6D4 100%)',
    glyph: 'H',
  },
  {
    eyebrow: 'Hot deal',
    pct: '70',
    title: 'Beauty essentials',
    sub: 'Skin · Hair · Fragrance — clean & cruelty-free',
    ctaText: 'Shop Beauty',
    ctaCategory: 'Beauty',
    bg: 'linear-gradient(120deg, #F5A524 0%, #F31260 100%)',
    glyph: 'B',
  },
]

type Slide = typeof FALLBACK_SLIDES[0]

function toSlide(b: BannerDto): Slide {
  return {
    eyebrow: b.badge,
    pct: '',
    title: b.title,
    sub: b.subtitle,
    ctaText: b.ctaText,
    ctaCategory: b.ctaCategory,
    bg: b.gradient || FALLBACK_SLIDES[0].bg,
    glyph: b.title.charAt(0).toUpperCase(),
  }
}

export function HeroBanner() {
  const [apiBanners, setApiBanners] = useState<BannerDto[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    bannerApi.getActive().then(setApiBanners).catch(() => setApiBanners([]))
  }, [])

  const slides: Slide[] = apiBanners.length > 0 ? apiBanners.map(toSlide) : FALLBACK_SLIDES
  const count = slides.length

  useEffect(() => {
    if (paused || count === 0) return
    const id = setInterval(() => setCurrent(c => (c + 1) % count), 5200)
    return () => clearInterval(id)
  }, [paused, count])

  const prev = () => setCurrent(c => (c - 1 + count) % count)
  const next = () => setCurrent(c => (c + 1) % count)

  const slide = slides[current]

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 2-column track */}
      <div
        className="grid grid-cols-[1.2fr_1fr] h-[320px] transition-all duration-[480ms] ease-in-out"
        style={{ background: slide.bg, color: '#ffffff' }}
      >
        {/* Left: text content */}
        <div className="flex flex-col justify-center gap-3.5 px-14 py-14 relative z-10">
          <span className="inline-flex items-center gap-2 self-start bg-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-pill text-[11px] font-semibold tracking-[0.04em]">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {slide.eyebrow}
          </span>
          <h2 className="font-extrabold leading-none tracking-[-0.04em]" style={{ fontSize: '64px' }}>
            {slide.pct ? `Up to ${slide.pct}% Off` : slide.title}
          </h2>
          <p className="text-[16px] opacity-90 max-w-[460px] leading-[1.45]">
            {slide.pct ? `${slide.title} — ${slide.sub}` : slide.sub}
          </p>
          <Link
            to={`${ROUTES.PRODUCTS}?category=${encodeURIComponent(slide.ctaCategory)}`}
            className="self-start mt-2 inline-flex items-center gap-2 bg-white text-ink font-semibold text-[14px] h-11 px-[22px] rounded-pill hover:-translate-y-[2px] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.18)] transition-all duration-[160ms]"
          >
            {slide.ctaText} →
          </Link>
        </div>

        {/* Right: decorative glyph */}
        <div className="relative flex items-center justify-center" aria-hidden="true">
          <div className="absolute w-[280px] h-[280px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute w-[180px] h-[180px] rounded-full translate-x-[70px] -translate-y-[50px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span
            className="relative z-10 font-extrabold leading-none tracking-[-0.06em] select-none"
            style={{ fontSize: '220px', opacity: 0.45, color: '#ffffff' }}
          >
            {slide.glyph}
          </span>
        </div>

        {/* Left arrow */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border border-white/25 bg-white/18 backdrop-blur-sm text-white hover:bg-white/28 transition-colors z-20"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        {/* Right arrow */}
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border border-white/25 bg-white/18 backdrop-blur-sm text-white hover:bg-white/28 transition-colors z-20"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Bar-style dot indicators */}
      <div className="flex justify-center gap-2 mt-3.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className="w-7 h-[14px] flex items-center justify-center"
          >
            <span
              className="block w-full h-[3px] rounded-[2px] transition-colors duration-[160ms]"
              style={{ background: i === current ? '#006FEE' : '#E4E4E7' }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
