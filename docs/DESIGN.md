# DESIGN.md — PrakashMart

## Tokens
--c-primary: #2874f0
--c-primary-dark: #003580
--c-accent: #fb641b
--c-text: #212121
--c-muted: #878787
--c-border: #e0e0e0
--c-bg: #f1f3f6
--radius: 8px
--shadow: 0 2px 6px rgba(0,0,0,0.08)

## Typography
base: 14px
h1: 24px bold
h2: 20px semibold
h3: 16px semibold
line: 1.4

## Layout
container: max-w-[1200px] mx-auto px-4
grid: gap-4
card: bg-white border border-[--c-border] rounded-[--radius] shadow-[--shadow]

## Button
primary:
  class: bg-[--c-primary] text-white rounded px-4 py-2
  hover: bg-[--c-primary-dark]

accent:
  class: bg-[--c-accent] text-white rounded px-4 py-2

ghost:
  class: border border-[--c-border] text-[--c-text]

## Input
class: border border-[--c-border] px-3 py-2 rounded w-full
focus: outline-none ring-2 ring-[--c-primary]

## Navbar
- sticky top-0 z-50 bg-[--c-primary] text-white
- layout: logo | search | actions
- height: 56px
- mobile: collapse actions → icon

## Footer
- bg-white border-t border-[--c-border]
- grid 4 cols (desktop) / 1 col (mobile)
- text small muted

## ProductCard
- structure:
  image (aspect-[4/5] object-cover)
  title (line-clamp-2 text-sm)
  price (font-semibold)
  rating (badge)
- hover: shadow-md scale-[1.01]
- action: wishlist icon top-right

## ProductGrid
- desktop: grid-cols-4
- tablet: grid-cols-2
- mobile: grid-cols-1

## Filters
- sidebar desktop / drawer mobile
- sections:
  price (slider)
  brand (checkbox)
  rating (buttons)
- clear button resets UI + state

## PDP (Product Detail)
layout:
  left: gallery
  right: info + CTA

gallery:
  main image + thumbnails

info:
  title
  rating
  price
  offers
  variants

cta:
  add to cart (primary)
  buy now (accent)

## Cart
- list items (image + title + qty + price)
- summary right (desktop) / bottom (mobile)

## Checkout
steps:
  address → summary → payment
- keep minimal (no clutter)

## Badges
rating:
  bg-[--c-primary] text-white px-2 py-1 text-xs rounded

discount:
  text-green-600 font-semibold

## States
hover: subtle shadow
active: scale-95
disabled: opacity-50 cursor-not-allowed

## UX Rules
- mobile-first
- max 2 CTAs per screen
- clear hierarchy: title > price > action
- no overflow text
- fast interaction (no delay)

## Accessibility
- all buttons have aria-label
- images have alt
- focus visible
- contrast: text vs bg ≥ AA

## Motion
- duration: 150–200ms
- easing: ease-in-out
- no heavy animation

## Icons
- use Lucide
- size: 16/20/24 only

## Do / Don’t
DO:
- reuse components
- keep spacing consistent
- follow tokens

DON’T:
- inline styles
- random colors
- inconsistent spacing