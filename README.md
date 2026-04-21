# KAI Security Vulnerability Dashboard

## Project Overview

The KAI Security Vulnerability Dashboard is a React application for exploring large container vulnerability exports at interactive speed. It ingests a nested JSON dataset (groups, repositories, images, and CVE-level records), flattens it into a uniform row model, and exposes filtering, sorting, search with live suggestions, charts, paginated virtualized rows, and side-by-side comparison — all tuned so the main thread stays responsive while hundreds of thousands of findings load and update in real time.

## Live Demo

**URL:** [https://kai-security-dashboard-ten.vercel.app/](https://kai-security-dashboard-ten.vercel.app/)

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI framework | React | 19 |
| Build tool | Vite | 8 |
| Language | TypeScript | 6 |
| Styling | Tailwind CSS | 4 |
| State management | Redux Toolkit | 2 |
| Charts | Recharts | 3 |
| Row virtualization | @tanstack/react-virtual | 3 |
| Routing | React Router | 7 |
| Streaming JSON | @streamparser/json | 0.0.22 |
| Icons | lucide-react | — |
| CSV export | Custom (native Blob + URL.createObjectURL) | — |

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kai-security-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure the dataset URL** *(optional)*

   By default `src/config.ts` points at the hosted dataset:

   ```ts
   export const DATA_URL = 'https://media.githubusercontent.com/...';
   ```

   To serve the file locally, copy `ui_demo.json` into `public/` and set `DATA_URL` to `/ui_demo.json`. You can also override the URL at build time by setting the `VITE_DATA_URL` environment variable.

4. **Run the dev server**

   ```bash
   npm run dev
   # or
   npm start
   ```

   | Script | Action |
   |---|---|
   | `npm run dev` / `npm start` | Vite dev server |
   | `npm run build` | TypeScript check + Vite production build |
   | `npm run preview` | Preview the production build locally |
   | `npm run lint` | ESLint |

## Features

- **Streaming data load** — JSON is fetched and parsed in a Web Worker using `@streamparser/json`. Download and parse run in parallel: records appear progressively with a live count and a two-phase progress bar (download % then records loaded).
- **KAI analysis filters** — Dedicated Analysis and AI Analysis toggle buttons filter out `invalid - norisk` and `ai-invalid-norisk` records respectively, with live impact counts on each button. Both active simultaneously uses OR logic and shows a combined count.
- **Severity filters** — Multi-select toggles for Critical, High, Medium, and Low. Combines with all other active filters.
- **Smart search with suggestions** — Free-text search across CVE IDs, package names, groups, and repositories with a keyboard-navigable ARIA combobox dropdown powered by `useDeferredValue`.
- **Sortable, virtualized table** — Columns are sortable; only visible rows are rendered via `@tanstack/react-virtual` so performance is bounded regardless of match count.
- **Pagination with URL sync** — Page size options of 25 / 50 / 100 / 200 rows. Current page syncs to `?page=N` in the URL so deep links and browser back/forward work correctly.
- **Column visibility and density** — Users can show/hide individual table columns and switch between comfortable (52 px) and compact (36 px) row density.
- **Charts** — Severity distribution (donut), risk factor breakdown (horizontal bar, top 8), and vulnerability trend (area chart, 2015–2025). All fed by a single-pass memoized aggregation selector over the current filtered set.
- **CSV export** — Exports the filtered and sorted result set as a CSV file using a custom native implementation (no third-party CSV library).
- **Comparison view** — Select up to 5 rows via checkboxes, then open a side-by-side comparison table at `/compare`.
- **Vulnerability detail** — Drill into a single CVE at `/vulnerability/:id` for a full field breakdown with an NVD reference link.
- **Persisted preferences** — Theme (light / dark / system), default sort, column visibility, density, and page size are all written to `localStorage` and restored on the next visit.
- **Light / dark / system theme** — Follows the OS preference by default; overridable via the preferences menu. Flash prevention script in `index.html` reads `localStorage` before first paint.

## Architecture Decisions

### Streaming JSON parse with `@streamparser/json`

The dataset is a 371 MB JSON file nested four levels deep. Rather than waiting for the full download before parsing, the Worker feeds each response body chunk directly into a streaming JSON parser as it arrives from the network. Download and parse therefore run in parallel: the first batch of records reaches Redux within a few seconds, and the loading screen shows live record counts throughout. This eliminates the multi-second sequential parse that a naive `response.json()` approach would produce.

### Web Worker

All network I/O, JSON parsing, and data denormalization run in a dedicated Web Worker so the main thread is never blocked. The Worker posts typed batches of 500 flattened `Vulnerability` records back to the UI via `postMessage`. Download progress (as a byte percentage derived from the `Content-Length` header) and record progress are tracked separately and reported as distinct `PROGRESS` message variants, allowing the loading screen to show a two-phase indicator.

### Redux Toolkit with `serializableCheck` disabled

The store holds the full in-memory array of vulnerability rows (236,656 records). Redux Toolkit's serializable state check traverses the entire state tree on every action — at this scale that adds hundreds of milliseconds per batch dispatch. Both `serializableCheck` and `immutabilityCheck` are disabled so dispatches stay fast while the app still follows a predictable Redux data flow.

### Chained Reselect selectors

Selectors are built as a pipeline: KAI filter mode → severity → free-text search, with sort, pagination, and chart aggregations derived from the filtered list. Each step is memoized independently so changing the sort order does not re-run the search step. Field-level selector inputs (`selectFilterMode`, `selectSeverityFilter`, `selectSearchQuery`, `selectSortField`, `selectSortDirection`) prevent Immer's structural sharing from triggering downstream recomputation when unrelated state fields change. Chart data is computed in a single pass over the filtered list shared across all three chart components.

### `useDeferredValue` for search responsiveness

The search input maintains a local string state that updates on every keystroke. `useDeferredValue` produces a low-priority copy passed to the suggestion builder, so typing never blocks the UI even as suggestions are computed across 236k records. The Redux search dispatch fires only on explicit submit (Enter key or suggestion click), keeping filter recomputation decoupled from keystroke frequency.

### `@tanstack/react-virtual`

The primary table only renders rows that intersect the viewport plus a small overscan. That keeps DOM node count and layout work bounded regardless of how many vulnerabilities match the current filters. Virtualization is combined with pagination so the virtualizer manages one page of records at a time rather than the full filtered array.

### Pagination with URL sync

Page state lives in the URL query string (`?page=N`) via React Router's `useSearchParams`. Changing filters or sort order resets the page to 1 automatically by comparing a serialized filter signature across renders. Page size is a user preference persisted to `localStorage`.

### OR logic for combined KAI filters

The KAI filter mode uses inclusive combination: activating both Analysis and AI Analysis merges into a `both` mode that excludes rows matching either status. This reflects how security analysts think about "hide these categories" rather than forcing mutually exclusive selection. Toggle semantics apply — clicking an active filter deactivates it, and clicking the inactive filter while the other is active combines to `both`.

### Recharts over D3

Charts use Recharts on top of React's component model so visualizations stay declarative and consistent with the rest of the stack. D3's direct DOM ownership conflicts with React's reconciler for interactive charts. Recharts is sufficient for these three chart types and integrates cleanly with the memoized Redux selectors that feed it.

### Flat denormalized `Vulnerability` type

Source JSON nests findings under images and repos. The Worker promotes group name, repo name, image name, image version, and a synthetic composite ID (`groupName__repoName__imageVersion__cve`) to top-level fields on every row. It also pre-computes `riskFactorList` from the `riskFactors` object keys. This flat shape makes sorting, filtering, table columns, detail views, comparison, and CSV export uniform without any nested tree traversal in the view layer.

### `localStorage` preferences persistence

User preferences (visible columns, row density, default sort, page size, and theme) are hydrated when the Redux store is created and written back through two custom Redux middlewares: `createPreferencesPersistMiddleware` (writes on every preference action) and `createSortSyncMiddleware` (keeps sort preferences in sync with the filter slice whenever `sortChanged` fires).

## Component Architecture

- **`App`** — Subscribes to loading and error state, shows a global error overlay with retry, and mounts routes only after data has loaded successfully.
- **`DataLoader`** — Spawns the Web Worker, dispatches batch / progress / done / error actions, and renders the full-screen loading experience with a two-phase progress bar.
- **`AppHeader`** — Shared sticky header used across all pages; accepts a `subtitle` and an `actions` slot for page-specific controls.
- **`DashboardPage`** — Main dashboard layout: metrics summary, three charts, filter bar, table, Export CSV button, and Compare link.
- **`MetricsSummary`** — Four KPI cards: Total CVEs (236,656), Visible After Filters, Manual Analysis count (17,046), AI Analysis count (11,959).
- **`FilterBar`** — Search with keyboard-navigable ARIA combobox suggestions, severity multi-select toggles, and KAI Analysis / AI Analysis filter buttons. Uses `useDeferredValue` for suggestion rendering.
- **`VulnerabilityTable`** — Virtualized, sortable, paginated grid with URL-synced page state, column visibility driven by preferences, compare checkboxes (up to 5), and density mode support.
- **`VulnerabilityField`** — Unified per-field renderer shared between the table row and the detail view, switching rendering logic by `field` key and `layout` prop.
- **`PaginationControls`** — Smart page number rendering with ellipsis gaps, row range display, and page size selector.
- **`SeverityChart`**, **`RiskFactorChart`**, **`TrendChart`** — Recharts visualizations fed by a shared single-pass aggregation selector.
- **`VulnerabilityDetailPage`** / **`VulnerabilityDetailContent`** — Full CVE detail at `/vulnerability/:id` with all fields, reference link resolution (dataset URL or NVD fallback), and add-to-compare action.
- **`ComparisonPage`** / **`ComparisonTable`** — Side-by-side comparison table at `/compare` for up to 5 selected CVEs with sticky field labels and horizontal scroll.
- **`PreferencesMenu`** — Popover panel for theme, column visibility, row density, and page size. Persists all changes to `localStorage` immediately.
- **`ThemeToggle`** / **`ThemeRoot`** — Quick theme toggle button and document-level theme application via `useLayoutEffect` to avoid flash of wrong theme.
- **`ErrorBoundary`** — Catches render errors in subtrees and provides a "Try again" button without blanking the entire app.

## Performance Optimizations

- Overlap JSON fetch and parse using `@streamparser/json` streaming in a Web Worker.
- Dispatch records to Redux in batches of 500 rather than one monolithic update.
- Disable Redux `serializableCheck` and `immutabilityCheck` for large state arrays.
- Field-level selector inputs prevent spurious Reselect invalidations when unrelated filter fields change.
- Single-pass chart aggregation: severity distribution, risk factor frequencies, and monthly trend all computed in one loop over the filtered list.
- `useDeferredValue` for search suggestion computation keeps keystroke latency near zero.
- `@tanstack/react-virtual` limits rendered DOM nodes to the visible viewport regardless of filtered set size.
- Pagination ensures the virtualizer manages one page of records at a time, not the full filtered array.
- `React.memo` on `VulnRow` prevents re-renders for rows unaffected by state changes.
- Header horizontal scroll synced to body scroll via a ref + `onScroll` callback (no second scrollable container).
- Flash-prevention inline script in `index.html` reads `localStorage` before first paint so the correct theme is applied without a FOUC.

## Known Limitations

- The reference `ui_demo.json` is approximately 371 MB and is not committed to the repository. The default `DATA_URL` in `src/config.ts` points at the GitHub LFS raw endpoint. GitHub LFS has monthly bandwidth quotas; for sustained use the file should be hosted on a CDN or object storage bucket with `VITE_DATA_URL` set as a Vercel environment variable.
- Initial load takes approximately 5–7 seconds over a typical connection. The streaming architecture means the UI shows live progress throughout rather than a frozen blank screen, but first-visit latency is inherent to the file size. In a production system the dataset would be paginated server-side so the browser never needs to download the full file.
- The total of 236,656 used in `progressUpdated` to compute the loading percentage is derived from the provided dataset. A different dataset would require updating this constant or computing the total dynamically from the `DONE` message.