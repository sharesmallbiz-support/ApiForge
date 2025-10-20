# Design Guidelines: REST API Testing Platform

## Design Approach
**Selected Approach:** Design System + Industry Reference Hybrid

Drawing inspiration from developer-focused productivity tools:
- **Postman** for familiar API testing patterns and workflow organization
- **Linear** for clean typography, efficient layouts, and command palette patterns  
- **VS Code** for code display, syntax highlighting, and dark mode aesthetics
- **Insomnia** for request/response visualization

**Core Principle:** Create an efficient, scannable interface where developers can quickly build, test, and debug API workflows without visual distractions.

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 220 15% 8% (deep slate, main canvas)
- Surface: 220 15% 12% (panels, cards)
- Surface Elevated: 220 15% 16% (modals, popovers)
- Border: 220 10% 25% (subtle dividers)
- Text Primary: 220 10% 95%
- Text Secondary: 220 8% 65%
- Accent Primary: 217 91% 60% (blue for actions, links)
- Success: 142 76% 36% (green for 2xx responses)
- Warning: 38 92% 50% (amber for 4xx responses)  
- Error: 0 84% 60% (red for 5xx responses, errors)
- Info: 199 89% 48% (cyan for info badges)

**Light Mode:**
- Background: 0 0% 100%
- Surface: 220 14% 96%
- Surface Elevated: 0 0% 100%
- Border: 220 13% 85%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 45%
- (Accent colors remain consistent with dark mode)

### B. Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN) - UI text, labels, buttons
- Code/Monospace: JetBrains Mono (via Google Fonts CDN) - JSON, URLs, responses

**Type Scale:**
- Headers (Collection/Environment names): text-lg font-semibold
- Section labels: text-sm font-medium uppercase tracking-wide
- Body text: text-sm font-normal
- Code/JSON: text-xs font-mono
- Buttons/Actions: text-sm font-medium

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-4, space-y-6
- Grid gaps: gap-4, gap-6
- Tight groupings: space-y-2, gap-2

**Layout Structure:**
- Three-panel layout: Sidebar (collections), Main (request builder), Right Panel (response viewer)
- Sidebar width: w-64 (fixed, collapsible to icon-only w-16)
- Main content: flex-1 with max-w-7xl container
- Responsive: Stack panels vertically on tablet/mobile

### D. Component Library

**Navigation & Structure:**
- Top navigation bar: h-14 with app logo, environment switcher, settings, theme toggle
- Sidebar: Scrollable collection tree with nested folders, search input at top
- Tab system: Request/Response tabs with active state indicator (border-b-2)

**Core UI Elements:**
- **Buttons:** Primary (filled accent), Secondary (outline), Ghost (transparent hover)
- **Request Builder Card:** Elevated surface with method dropdown (GET/POST/etc.), URL input, tabs for Params/Headers/Body
- **HTTP Method Pills:** Colored badges (GET: green, POST: blue, PUT: amber, DELETE: red, PATCH: purple)
- **Input Fields:** Dark surface with subtle border, focus ring in accent color
- **Dropdown Menus:** Surface elevated with shadow-lg, hover states for items

**Data Displays:**
- **JSON Viewer:** Syntax-highlighted with collapsible tree structure, line numbers
- **Key-Value Tables:** Striped rows for params/headers with inline editing
- **Response Panel:** Status code badge, timing info, size, tabs for Body/Headers/Cookies
- **Environment Variables:** Tag-style display with {{variable}} syntax highlighting

**Workflow Components:**
- **Step Cards:** Numbered sequence (1, 2, 3) with drag handles, compact display of request summary
- **Variable Extraction:** Code editor with JSONPath/Regex selector, target variable name input
- **Test Assertions:** Conditional builder (status equals, body contains, time less than) with pass/fail indicators

**Forms & Overlays:**
- **Modals:** Centered, max-w-2xl, backdrop blur
- **Import Dialog:** File upload zone with URL input alternative
- **Settings Panel:** Slide-over from right, organized sections with dividers

### E. Interaction Patterns

**Animations:** Minimal and purposeful only
- Sidebar collapse/expand: transition-all duration-200
- Tab switches: Simple opacity fade
- Success/error toasts: Slide in from top-right
- NO decorative animations, parallax, or scroll effects

**States:**
- Loading: Skeleton screens with pulse animation for request in-flight
- Empty states: Icon + descriptive text + primary action button
- Error states: Red border on inputs, inline error message below
- Success feedback: Green checkmark icon, brief toast notification

**Keyboard Shortcuts:**
- Display shortcut hints in tooltips (Cmd+K for command palette, Cmd+Enter to send request)
- Command palette: Quick search for collections, environments, actions

## Key Principles

1. **Information Density Over Whitespace:** Maximize visible data without clutter - developers need to see request details, variables, and responses simultaneously
2. **Scannable Hierarchy:** Use color-coded HTTP methods, status badges, and consistent spacing to enable quick visual parsing
3. **Familiar Developer Patterns:** Match conventions from VS Code, browser DevTools, and existing API tools
4. **Dark Mode First:** Design primarily for dark mode with light mode as alternative
5. **Responsive Efficiency:** On smaller screens, prioritize request builder and response viewer over navigation chrome

## Images & Assets

**No hero images or marketing imagery.** This is a utility application.

**Icons:** Use Heroicons (via CDN) for UI actions - outline style for inactive states, solid for active/selected states.

**Illustrations:** Optional empty state illustrations (simple line art) for first-use onboarding or no-collections view.