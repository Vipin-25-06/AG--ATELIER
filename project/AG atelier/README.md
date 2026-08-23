# AG ATELIER — EVA_1: Static HTML/CSS E-Commerce Site

## Project Overview
AG ATELIER is a responsive, multi-page fashion e-commerce storefront built with static HTML5 and CSS3. It provides a polished shopping experience across home, shop, product, cart, checkout, account, and authentication pages, with reusable styling, responsive layouts, native form validation, and prepared hooks for future JavaScript functionality. **Evaluation 1 contains no active JavaScript behavior.**

## Design System
- **Brand:** AG ATELIER (Serene Threads design system)
- **Primary Color:** Terracotta `#B5533C`
- **Background:** Linen `#F5F1EC`
- **Text:** Onyx `#1A1A1A`
- **Fonts:** Poppins (headings) + Inter (body)
- **Border Radius:** 12px everywhere

## File Structure
```
EVA_1/
├── html/
│   ├── index.html              ← Home page (with logout toast + footer)
│   ├── shop.html               ← Shop listing (18 products)
│   ├── product-1.html          ← Product detail: Terracotta Hoodie
│   ├── product-2.html          ← Product detail: Cargo Pant
│   ├── product-3.html          ← Product detail: Canvas Tote
│   ├── cart.html               ← Shopping cart (3 items hardcoded)
│   ├── wishlist.html           ← Wishlist (6 items, 1 out-of-stock)
│   ├── checkout.html           ← Checkout (shipping + payment)
│   ├── order-confirmation.html ← Order confirmed page
│   ├── login.html              ← Login form (with CAPTCHA)
│   ├── signup.html             ← Sign up form (with CAPTCHA + hints)
│   ├── forgot-password.html    ← Reset password (with CAPTCHA + hints)
│   ├── about.html              ← About Us (story + values)
│   ├── contact.html            ← Contact Us (form + info)
│   ├── account.html            ← My Account (logged-in state)
│   └── 404.html                ← 404 Not Found page
│
├── assets/
│   ├── css/
│   │   ├── base.css            ← Design tokens, reset, typography, buttons
│   │   ├── navbar.css          ← Fixed navbar, badges, toast, hamburger
│   │   ├── footer.css          ← Footer (home only)
│   │   ├── home.css            ← Hero, categories, products, newsletter
│   │   ├── shop.css            ← Filter sidebar, sort bar, product grid
│   │   ├── product-detail.css  ← Gallery, size/color/qty, accordions
│   │   ├── cart.css            ← Cart items, order summary
│   │   ├── checkout.css        ← Checkout form, payment cards, confirmation
│   │   ├── auth.css            ← Auth forms, CAPTCHA block, password hints
│   │   └── responsive.css      ← All @media breakpoints (mobile/tablet/desktop)
│   ├── js/                     ← Empty (populated in Evaluation 2)
│   └── images/
│       ├── products/           ← Product photos (see below)
│       ├── banners/            ← Hero + category images
│       └── icons/              ← Icon assets
│
└── README.md                   ← This file
```

## How to Open
1. Open `html/index.html` in any modern browser.
2. All navigation links are relative — no server required.

## Key Requirements Implemented

### ✅ No JavaScript
- Zero `<script>` tags anywhere
- Zero inline handlers (`onclick`, `onsubmit`)
- Zero `javascript:` links

### ✅ Native HTML5 Form Validation
- `type="email"` for email fields
- `type="password"` with `minlength="8"` + `pattern=...` (regex)
- `required` on all mandatory fields
- `pattern` regex for phone, postal code, card number, expiry, CVV, password strength

### ✅ Password Strength Pattern (no JS)
The browser itself validates this pattern on submit:
```
(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}
```

### ✅ CAPTCHA (Static for Evaluation 1)
- Visual captcha code displayed in styled `<div>`
- Refresh button with `data-action="refresh-captcha"` (inert until Eval 2 JS)
- Input field with `type="text"` for entering the code

### ✅ Logout Toast (Home Page Only)
- `<div id="logout-toast" class="toast" hidden>You have been logged out</div>`
- Uses `hidden` HTML attribute (not CSS `display:none`)
- Eval 2 JS calls: `document.getElementById('logout-toast').removeAttribute('hidden')`

### ✅ JS Hook Points (data attributes)
All interactive elements have `data-action` and `data-product-id` attributes
ready for Evaluation 2 JavaScript integration.

## Image Placeholder Strategy
Images use relative paths (e.g., `../assets/images/products/p001-tee.jpg`).
Add actual product photos to these paths — the CSS gracefully handles
missing images with background colors from the Serene Threads palette.

## Responsive Breakpoints
| Breakpoint | Range | Behavior |
|---|---|---|
| Mobile | < 576px | Single column, stacked layouts |
| Tablet | 576–992px | 2-column grids, collapsed nav |
| Desktop | > 992px | Full layout (default) |
| Wide | > 1440px | 4-column product grids |
