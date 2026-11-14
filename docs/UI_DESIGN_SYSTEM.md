# UI/UX Research & Design System Specification

**Project:** Bus Booking Management System  
**Domain:** Enterprise Transit & Fleet Operations Platform  
**Reference Source:** `UI_INSPIRATION/`  
**Icon Standard:** `@heroicons/react` (Exclusively)  
**Theme:** Modern European/Indian Intercity Coach Platform (GoBus)  

---

## 1. Reference UI Architectural Inspection

A thorough inspection of `UI_INSPIRATION/` revealed six core workflows and architectural design patterns:

| Reference File | Key Structural Patterns | Business Logic & UX Insights |
|---|---|---|
| `App.jsx` | Dynamic page switcher (`home`, `search`, `checkout`), sticky top navigation, global AuthModal trigger, high-contrast selection highlights (`selection:bg-[#73d200]/30`). | Decoupled client router and centralized modal controller. |
| `components/Navbar.jsx` | `#73d200` electric lime header, italic bold logo, country/currency selector (`₹ INR`), user account actions. | Persistent navigation across all authenticated & unauthenticated views. |
| `components/AuthModal.jsx` | Two-panel hero modal with scenic coach photography backdrop, mode toggle (Sign In vs Register), value proposition checklist with check icons, clean email/password inputs. | Seamless auth without redirecting the user away from their current booking workflow. |
| `components/SeatMapModal.jsx` | Side-slide drawer, driver steering wheel indicator (`☸`), 2x2 row layout with central aisle, seat states (Available, Selected, Booked), dynamic price summary footer. | Visual feedback preventing invalid seat selections; intuitive layout matching physical coaches. |
| `pages/HomePage.jsx` | Gradient dark hero banner (`from-gray-900 to-gray-800`), floating search card with instant From/To swap button, journey date picker, passenger counter, and value proposition cards. | Low-friction customer search experience with minimal required fields. |
| `pages/SearchResultsPage.jsx` | Date tabs switcher (Previous Day, Today, Next Day), filter drawer trigger, journey timeline card (Departure point, duration bar with terminal dots, Arrival point), amenities badges, large price callout. | Clear information hierarchy emphasizing departure times, duration, carrier reputation, and price. |
| `pages/CheckoutPage.jsx` | Accordion/multi-step checkout form: 1. Passengers, 2. Seat Reservation, 3. Luggage/Extras, 4. Contact, 5. Simulated Payment (UPI/Cards). Sticky sidebar with 10:00 hold timer and itemized price breakdown. | Prevents cognitive overload by breaking complex booking into 5 structured steps. |

---

## 2. Design Tokens & Color Palette

### A. Primary Brand Colors
- **Brand Electric Lime (`primary`):** `#73d200` — High-visibility primary action buttons, active tabs, selected seats, brand accents.
- **Brand Lime Hover (`primary-hover`):** `#65b800` — Button active and hover states.
- **Deep Navy / Dark Charcoal (`dark`):** `#131b26` or `gray-900` — Navigation text, contrast headings, dark hero headers, footers.
- **Selection Highlight:** `rgba(115, 210, 0, 0.3)`

### B. Neutral & Background Tokens
- **Canvas Background:** `bg-gray-50` (`#f8fafc`)
- **Card / Surface Background:** `bg-white` (`#ffffff`)
- **Subtle Surface / Form Field Background:** `bg-gray-100` (`#f1f5f9`)
- **Border Default:** `border-gray-200` (`#e2e8f0`)
- **Border Active / Focus:** `border-[#73d200]`
- **Text Primary:** `text-gray-900` (`#0f172a`)
- **Text Muted / Subtitle:** `text-gray-500` (`#64748b`)
- **Micro-Label Text:** `text-[10px] uppercase font-bold text-gray-400`

### C. Status & State Colors
- **Available Seat:** `bg-white text-gray-700 border-gray-400 hover:border-gray-800`
- **Selected Seat:** `bg-[#73d200] text-gray-900 border-[#73d200] font-black shadow-sm`
- **Booked / Unavailable Seat:** `bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed`
- **Locked / Expiring Seat:** `bg-amber-100 text-amber-800 border-amber-300 animate-pulse`
- **Success / Confirmed Badge:** `bg-emerald-100 text-emerald-800 border border-emerald-200`
- **Cancelled / Refunded Badge:** `bg-rose-100 text-rose-800 border border-rose-200`

---

## 3. Strict Heroicons Iconography Mapping

Per project guidelines, only `@heroicons/react` is permitted. All icons from the reference UI are mapped directly to their Heroicon counterpart:

| UI Component | Reference Lucide Icon | Official `@heroicons/react` Equivalent |
|---|---|---|
| Navigation User / Auth | `User` | `UserCircleIcon` (`@heroicons/react/24/solid`) |
| Search CTA | `Search` | `MagnifyingGlassIcon` (`@heroicons/react/24/solid`) |
| Station Swap | `ArrowLeftRight` | `ArrowsRightLeftIcon` (`@heroicons/react/24/outline`) |
| Date Picker | `Calendar` | `CalendarDaysIcon` (`@heroicons/react/24/outline`) |
| Filter / Sorting | `SlidersHorizontal` | `AdjustmentsHorizontalIcon` (`@heroicons/react/24/outline`) |
| Breadcrumbs / Next | `ChevronRight` | `ChevronRightIcon` (`@heroicons/react/24/solid`) |
| Back Navigation | `ArrowLeft` | `ArrowLeftIcon` (`@heroicons/react/24/solid`) |
| Modal Close | `X` | `XMarkIcon` (`@heroicons/react/24/outline`) |
| Verified / Checkmark | `Check` / `CheckCircle` | `CheckCircleIcon` (`@heroicons/react/24/solid`) |
| Counter Increment | `Plus` | `PlusIcon` (`@heroicons/react/24/solid`) |
| Counter Decrement | `Minus` | `MinusIcon` (`@heroicons/react/24/solid`) |
| Tooltip / Info | `Info` | `InformationCircleIcon` (`@heroicons/react/24/outline`) |
| 10-Min Reservation Timer | `Timer` | `ClockIcon` (`@heroicons/react/24/solid`) |
| Bus / Carrier Tag | `Bus` | `TruckIcon` (`@heroicons/react/24/solid`) |
| Wi-Fi Amenity | `Wifi` | `WifiIcon` (`@heroicons/react/24/solid`) |
| Charging Port Amenity | `Zap` | `BoltIcon` (`@heroicons/react/24/solid`) |
| Security / Guarantee | `Shield` | `ShieldCheckIcon` (`@heroicons/react/24/solid`) |
| Contact Phone | `Phone` | `PhoneIcon` (`@heroicons/react/24/outline`) |
| Contact Email | `Mail` | `EnvelopeIcon` (`@heroicons/react/24/outline`) |

---

## 4. Reusable UI Component Specifications

### 1. Button Component (`src/components/ui/Button.jsx`)
- **Primary:** `bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold px-5 py-3 rounded-lg shadow-sm transition-all active:scale-[0.98]`
- **Secondary / Dark:** `bg-[#131b26] hover:bg-black text-white font-bold px-5 py-3 rounded-lg`
- **Outline:** `border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-lg`
- **Danger:** `bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-lg`
- **Ghost:** `hover:bg-gray-100 text-gray-700 font-medium px-3 py-2 rounded-lg`

### 2. Badge Component (`src/components/ui/Badge.jsx`)
- **Operator Badge:** `bg-[#73d200]/20 text-gray-900 font-extrabold px-2.5 py-0.5 rounded text-[11px]`
- **Success:** `bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs`
- **Warning:** `bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs`
- **Danger:** `bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-xs`

### 3. Input & Select Field (`src/components/ui/Input.jsx`)
- Standardized container with uppercase micro-label:
  ```jsx
  <div className="border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus-within:border-[#73d200] focus-within:bg-white transition-colors">
    <label className="text-[10px] uppercase font-bold text-gray-400 block">{label}</label>
    <input className="w-full bg-transparent font-medium text-sm focus:outline-none text-gray-900" {...props} />
  </div>
  ```

### 4. Interactive Bus Seat Item (`src/components/seats/SeatItem.jsx`)
- Standard 36px x 36px rounded square with seat number label or unavailable icon.
- Dynamically handles `AVAILABLE`, `SELECTED`, `BOOKED`, and `LOCKED` states.

---

## 5. Indian Context Adaptations

1. **Currency Display:** All fares formatted in Indian Rupees:
   - Primary fare: `₹599`
   - Itemized breakdown: `Base Fare: ₹599 + Seat Charge: ₹50 + GST (5%): ₹32 = Total: ₹681`
2. **Phone Number Formatting:** Indian country code default `+91` with standard 10-digit mobile validation (`/^[6-9]\d{9}$/`).
3. **Realistic Boarding & Dropping Points:** Display major ISBT terminals (e.g. *Kashmiri Gate, Delhi*, *Sindhi Camp, Jaipur*, *Wakad, Pune*).
4. **Simulated Payment Gateways:** Dedicated UI tabs for UPI (Google Pay, PhonePe, Paytm), Net Banking (HDFC, ICICI, SBI), Cards (RuPay, Visa, Mastercard), and Wallets.

