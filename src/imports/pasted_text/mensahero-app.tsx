Build a multi-page TypeScript React web application called MensaHERO — a clean, minimal SMS gateway dashboard and public landing site. Use React Router for routing. No auth logic needed; auto-login all visitors as a demo user named "Alex Rivera" with a pre-populated demo account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visual style: Clean and minimal. Generous whitespace. Subtle 1px borders. Soft shadows only on cards (box-shadow: 0 1px 3px rgba(0,0,0,0.06)). No gradients. No noise. No decorative blobs.

Color palette (near-monochrome / slate-based):
  - Background:      #FAFAFA (light), #0F0F0F (dark)
  - Surface:         #FFFFFF (light), #1A1A1A (dark)
  - Border:          #E5E5E5 (light), #2A2A2A (dark)
  - Text primary:    #0A0A0A (light), #F5F5F5 (dark)
  - Text secondary:  #6B6B6B (light), #999999 (dark)
  - Accent:          #1A1A1A (light), #F5F5F5 (dark)  — used for primary buttons
  - Status green:    #16A34A  (delivered)
  - Status amber:    #D97706  (pending)
  - Status red:      #DC2626  (failed)

Typography:
  - Display / headings: "Geist" or "DM Sans" — clean, geometric, humanist
  - Body: "Inter" fallback
  - Monospace (API keys, phone numbers): "JetBrains Mono" or "Fira Code"

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Border radius: 6px (inputs, badges), 10px (cards), 14px (modals/panels)

Dark mode: Full support via a toggle button (sun/moon icon) in both the dashboard topbar and landing page nav. Use CSS custom properties so the theme flips globally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Public routes (no sidebar):
  /                → Landing: Home
  /about           → Landing: About
  /features        → Landing: Features
  /docs            → Landing: Docs / API Reference
  /contact         → Landing: Contact

App routes (with sidebar, auto-logged-in as demo user):
  /dashboard       → Overview / Analytics
  /messages        → Messages (threaded inbox)
  /api-keys        → API Key Management
  /account         → Account Settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC LANDING PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shared nav (all public pages):
  Left: "MensaHERO" wordmark (bold, monospace-flavored)
  Center: Home · About · Features · Docs · Contact
  Right: Dark mode toggle | "Open Dashboard →" button (filled, small)
  Mobile: hamburger menu

── / — HOME ──
Hero section:
  - Large headline (3–4 words, bold, ~56px): "Send SMS. Programmatically."
  - Subheadline (1–2 lines): "MensaHERO turns your Android phones into a real SMS gateway. No carrier API. No monthly contracts."
  - Two CTAs: "Open Dashboard →" (filled) and "Read the Docs" (ghost)
  - Below hero: a minimal code snippet block showing a sample API call (curl or JS), styled with syntax highlighting in a dark terminal card

Feature strip (3 columns, icon + label + 1-line description):
  - Real SIM Cards — Messages sent from actual phones, not virtual numbers
  - Multi-Key API — Isolate traffic per project with dedicated API keys
  - Delivery Tracking — Know exactly when each message is delivered or fails

Social proof bar: "Open source · Self-hostable · Android-powered"

── /about — ABOUT ──
Two-column layout:
  Left: Short mission paragraph about empowering developers with real SIM-based SMS infrastructure. A secondary paragraph about the open-source philosophy.
  Right: A simple vertical timeline (4–5 items) showing the project's conceptual milestones (idea → prototype → beta → launch)

── /features — FEATURES ──
Grid of 6 feature cards (2×3 on desktop, 1 col mobile), each with:
  - Tabler icon (24px)
  - Feature name
  - 2-sentence description
Features:
  1. Multi-SIM Support — Route messages across multiple SIM cards on a single device
  2. API Key Isolation — Separate traffic and quotas per project or client
  3. Delivery Receipts — Real-time sent and delivered status via Android broadcasts
  4. WebSocket Agents — Android phones maintain persistent live connections to the backend
  5. FCM Fallback — Firebase push wakes idle agents when a message needs sending
  6. Self-Hostable — Deploy on your own infra, own your data end-to-end

── /docs — API REFERENCE ──
Left sidebar (sticky): list of sections — Authentication, Send Message, List Messages, Webhooks, Error Codes
Main content area:
  - Clean prose-style doc layout
  - Code blocks with dark background, syntax-highlighted, copy button
  - Show example: POST /v1/messages with headers and JSON body
  - Show response object with status field
  - Use a two-column layout on wide screens: description left, code example right (like Stripe Docs)

── /contact — CONTACT ──
Two-column:
  Left: Short paragraph ("Have a question or want to contribute? Reach out.")
  Right: Minimal contact form — Name, Email, Message textarea, Send button
  Below form: GitHub link and a note that this is open source

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP LAYOUT (DASHBOARD SHELL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixed left sidebar (240px wide, full height):
  Top: "MensaHERO" wordmark + app badge ("Beta")
  Nav items (icon + label):
    - Overview (ti-layout-dashboard)
    - Messages (ti-message-2)
    - API Keys (ti-key)
    - Account (ti-user-circle)
  Bottom of sidebar:
    - Dark mode toggle
    - Demo user avatar circle (initials "AR") + name "Alex Rivera" + role "Developer"

Top bar (right of sidebar, full width):
  - Page title (dynamic, matches current route)
  - Right: notification bell icon + demo user avatar

Content area: scrollable, padding 32px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /dashboard — OVERVIEW & ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stat cards row (4 cards, responsive grid):
  1. Total Messages Sent — e.g. 14,823
  2. Delivery Success Rate — e.g. 97.4%
  3. Failed / Pending — e.g. 382
  4. Active Agents Online — e.g. 3 / 5

Below stats:

Left (2/3 width): "Messages Over Time" line chart
  - X axis: last 30 days
  - Y axis: message volume
  - Two lines: Sent (dark) and Delivered (muted green)
  - Clean axes, no grid fill, just horizontal tick lines
  - Tooltip on hover

Right (1/3 width): "Messages by API Key" bar chart or horizontal bar list
  - Each bar shows an API key name (truncated, monospace) and its message count
  - 4–5 demo keys

Below charts: "Recent Messages" table
  Columns: To (phone number), API Key, Status badge (Delivered/Failed/Pending), Sent At
  5 demo rows. Status badges: small pill, colored dot + text.
  A "View all →" link leads to /messages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /messages — THREADED MESSAGES VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three-panel layout (like a mail/messages app):

Panel 1 — API Key list (200px, left):
  - Title: "API Keys"
  - List of 4–5 demo API key names (truncated, monospace font)
  - Each item: key name + unread count badge
  - Selected state: filled background, accent text
  - "All Keys" item at top

Panel 2 — Phone number threads (260px, center):
  - Title: selected API key name or "All Threads"
  - Search bar at top
  - List of conversation threads, each showing:
    - Phone number (monospace, bold)
    - Last message preview (1 line, muted)
    - Timestamp (relative: "2h ago")
    - Status dot (green = delivered, amber = pending, red = failed)
  - Selected thread: highlighted row

Panel 3 — Message thread detail (remaining width, right):
  - Header: phone number + total message count
  - Filter tabs: All · Delivered · Pending · Failed
  - Message list (chronological, newest at bottom):
    Each message bubble / row:
      - Message text (body)
      - Sent At timestamp
      - Status badge (icon + text): Delivered ✓ / Pending ⏳ / Failed ✗
      - API Key tag (small pill, monospace, muted)
  - Messages are outbound only (no reply UI — this is a send-only gateway)

Demo data: populate with 3 API keys, 4–5 phone number threads per key, 3–6 messages per thread.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /api-keys — API KEY MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Header row: "API Keys" title + "Create New Key" button (filled, right-aligned)

Key list (card or table layout):
  Each key row/card shows:
    - Key name (e.g. "Production", "Staging", "Mobile App")
    - Key value: partially masked (sk-live-••••••••••••abcd) with a "Reveal" icon button
    - Created date
    - Last used (relative)
    - Status badge: Active / Revoked
    - Actions: Copy icon | Delete icon (with confirmation)

"Create New Key" modal/panel (shown inline or as a slide-over):
  - Input: Key name
  - Submit button
  - After creation: show full key once with a "Copy now — it won't be shown again" warning
  - Copy to clipboard button

Empty state (if no keys): centered illustration placeholder + "Create your first API key to start sending messages" + button

Demo data: 4 keys — "Production" (active), "Staging" (active), "Mobile App" (active), "Old Key" (revoked)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /account — ACCOUNT SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Two sections:

Section 1 — Profile:
  - Avatar circle (initials "AR", large, 64px)
  - Name field (editable): Alex Rivera
  - Email field (read-only in demo): alex@demo.com
  - "Save Changes" button

Section 2 — Preferences:
  - Dark mode toggle (matches global theme)
  - Timezone selector (dropdown, defaulting to UTC+8 Manila)
  - "Save Preferences" button

Demo note: Show a subtle banner at top of account page — "You are using a demo account. Sign up to save your settings." (muted, dismissible)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENTS & INTERACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- All buttons have hover states (slight bg shift, no scale)
- Sidebar nav items highlight on hover, bold + accent on active
- API key reveal: toggle visibility of the masked key
- Copy to clipboard: icon changes to checkmark for 1.5s after click
- Delete confirmation: inline "Are you sure?" text + Confirm / Cancel (no modal)
- Mobile (< 768px): sidebar collapses to bottom tab bar (4 icons), panels stack vertically
- Charts: use Recharts (already available in React environment)
- All data is static demo data — no API calls, no localStorage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- TypeScript + React 18
- React Router v6 (createBrowserRouter or BrowserRouter)
- Recharts for charts
- Tabler Icons React (@tabler/icons-react) for icons
- CSS Modules or plain CSS custom properties for theming
- No Redux — React useState/useContext only
- No backend, no API calls — all demo data hardcoded in a /src/data/demo.ts file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE HINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
  data/
    demo.ts              ← all static demo data (keys, messages, threads)
  components/
    layout/
      Sidebar.tsx
      Topbar.tsx
      LandingNav.tsx
      LandingFooter.tsx
    ui/
      Badge.tsx          ← status pill
      CodeBlock.tsx      ← syntax-highlighted block for docs/landing
      StatCard.tsx
  pages/
    landing/
      Home.tsx
      About.tsx
      Features.tsx
      Docs.tsx
      Contact.tsx
    app/
      Dashboard.tsx
      Messages.tsx
      ApiKeys.tsx
      Account.tsx
  hooks/
    useTheme.ts          ← dark/light toggle
  App.tsx
  main.tsx