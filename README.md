# KAI Security Vulnerability Dashboard

## Project overview

The KAI Security Vulnerability Dashboard is a React application for exploring large container vulnerability exports at interactive speed. It ingests a nested JSON dataset (groups, repositories, images, and CVE-level records), flattens it into a uniform row model, and exposes filtering, sorting, charts, row virtualization, pagination, and side-by-side comparison—all tuned so the main thread stays responsive while hundreds of thousands of findings load and update.

## Live demo

**URL:** [https://kai-security-dashboard-ten.vercel.app/](https://kai-security-dashboard-ten.vercel.app/)

## Tech stack

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
| Streaming JSON | oboe / @streamparser/json | — |
| Icons | lucide-react | — |
| CSV export | papaparse | — |

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

   To serve the file locally, copy `ui_demo.json` into `public/` and change `DATA_URL` to `/ui_demo.json`.

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

- **Streaming data load** — JSON is fetched and parsed in a Web Worker using `oboe` and `@streamparser/json`; rows appear progressively with a live count and download progress bar.
- **Severity & Kai analysis filters** — Filter by Critical / High / Medium / Low severity and by Kai analysis status (analysis-only, AI analysis-only, or both).
- **Smart search with suggestions** — Free-text search across CVE IDs, package names, groups, and repositories with a keyboard-navigable suggestion dropdown powered by `useDeferredValue`.
- **Sortable, virtualized table** — Columns are sortable; only visible rows are rendered via `@tanstack/react-virtual` so performance is bounded regardless of match count.
- **Pagination** — Page size options of 25 / 50 / 100 / 200 rows; current page is synced to the URL so deep links and browser navigation work correctly.
- **Column visibility & density** — Users can show/hide individual table columns and switch between comfortable and compact row density.
- **Charts** — Severity distribution, risk factor breakdown, and trend chart; all fed by memoized selectors over the current filtered set.
- **CSV export** — Exports the filtered and sorted result set to a CSV file via papaparse.
- **Comparison view** — Select up to a configurable maximum of rows, then open a side-by-side comparison table at `/compare`.
- **Vulnerability detail** — Drill into a single CVE at `/vulnerability/:id` for a full field-by-field breakdown.
- **Persisted preferences** — Theme (light / dark / system), default sort, column visibility, density, and page size are all written to `localStorage` and restored on next visit.
- **Light / dark / system theme** — Follows the OS preference by default; can be overridden via the preferences menu.

## Architecture decisions

### Web Worker + streaming JSON parse

Fetching and parsing a very large JSON payload is moved off the main thread. The worker uses `oboe` for event-driven streaming and `@streamparser/json` as a fallback, walking the nested group/repo/image structure and posting transformed vulnerability batches back to the UI so scrolling, typing, and painting are never blocked.

### Redux with `serializableCheck` disabled

The store holds a full in-memory array of vulnerability rows (on the order of hundreds of thousands). Redux Toolkit's serializable state check runs on every action and would traverse that tree repeatedly, which is prohibitively expensive. Serialization and immutability checks are both disabled so dispatches stay fast while the app still follows a predictable Redux data flow.

### Chained Reselect selectors

Selectors are built as a pipeline: Kai analysis filter mode → severity → free-text search, with sorting, pagination, and chart aggregations derived from the filtered list. Each step is memoized so a change to sort order does not re-run search logic, and chart data is computed in a single pass over the filtered set instead of re-scanning the full dataset for every widget.

### `@tanstack/react-virtual`

The primary table only renders rows that intersect the viewport (plus a small overscan). That keeps DOM node count and layout work bounded regardless of how many vulnerabilities match the current filters, which is essential once the filtered set still contains tens of thousands of rows.

### Progressive row loading

The worker does not wait until the entire file is transformed before the UI updates. It streams work in fixed-size batches into Redux as they are produced, so the loading screen shows live counts and a download progress bar, and the app converges on the full dataset without a single giant blocking commit.

### URL-synced pagination

The current page is stored as a `?page=` search param via React Router's `useSearchParams`. Changing filters or sort order resets the page to 1 automatically, so the URL always reflects a reproducible view.

### `useDeferredValue` for search

The FilterBar keeps a local input state and passes a deferred value to the selector chain. This lets the input update instantly while expensive filter recomputation is scheduled as a lower-priority render, keeping the UI responsive while the user types.

### OR logic for combined filters

The Kai analysis filter mode uses inclusive combination: choosing both "analysis" and "AI analysis" paths merges into a `both` mode that excludes rows matching either invalid status, reflecting how security analysts think about "hide these categories" rather than forcing a single exclusive bucket.

### Recharts over D3

Charts use Recharts on top of React's component model so visualizations stay declarative and consistent with the rest of the stack. The dataset size is managed by aggregated selectors feeding small summary structures into the charts, so the choice favors maintainability and integration with React state over hand-rolled D3 lifecycle and layout code.

### Flat denormalized `Vulnerability` type

Source JSON nests findings under images and repos. The app promotes group, repository, image, and synthetic identifiers to top-level fields on each row and precomputes `riskFactorList` from object keys. That flat shape makes sorting, filtering, table columns, and exports uniform without repeated tree walks in the view layer.

### `localStorage` preferences persistence

User preferences (visible columns, density mode, page size, default sort, and theme) are hydrated when the store is created and written back through Redux middleware so refreshes and return visits restore the last-used configuration without a backend.

## Component architecture

- **`App`** — Subscribes to loading and error state, shows a global error overlay with retry, and mounts routes only after data has loaded successfully.
- **`DataLoader`** — Spawns the data loader worker, dispatches batch / progress / done / error actions, and renders the full-screen loading experience with a live count and download progress bar.
- **`AppHeader`** — Shared header used across all pages; accepts a `subtitle` and an `actions` slot for page-specific controls.
- **`DashboardPage`** — Main dashboard layout: metrics, charts, filter bar, table, Export CSV button, and Compare link.
- **`MetricsSummary`** — High-level counts and KPI-style summary driven by selectors.
- **`FilterBar`** — Search (with suggestions), severity toggles, and Kai analysis filter controls wired to Redux.
- **`VulnerabilityTable`** — Virtualized, sortable, paginated grid of vulnerabilities with row interactions (detail navigation, checkbox selection for comparison).
- **`VulnerabilityField`** — Encapsulates the per-field rendering logic used in both the table row and the detail view.
- **`PaginationControls`** — Page navigation and page size selector that syncs with URL params.
- **`RiskFactorChart`**, **`SeverityChart`**, **`TrendChart`** — Recharts visualizations fed by shared aggregation selectors.
- **`VulnerabilityDetailPage`** / **`VulnerabilityDetailContent`** — Single-record drill-down for one vulnerability.
- **`ComparisonPage`** / **`ComparisonTable`** — Multi-select comparison view across chosen CVE rows.
- **`PreferencesMenu`** — Exposes persisted preferences: theme, default sort field/direction, column visibility, density mode, and page size; includes a reset-to-defaults action.
- **`ThemeToggle`** / **`ThemeRoot`** — Light/dark/system theming and document-level theme application.
- **`ErrorBoundary`** — Catches render errors in subtrees to avoid blanking the entire app.

## Performance optimizations

- Offload JSON fetch, parse, and denormalization to a Web Worker.
- Stream records into Redux in batches instead of one monolithic update; show live progress.
- Disable Redux serializable and immutability dev checks for very large state.
- Memoized selector chains so filters, sorts, pagination, and chart inputs recompute minimally.
- `useDeferredValue` in the search input to keep keystroke response instant.
- Single-pass aggregation for chart series from the filtered list.
- Virtualized table rows via `@tanstack/react-virtual`.
- Compare and detail views resolve rows from maps/selectors without duplicating large arrays.
- Responsive table layout switches between flex (≥1024 px) and fixed-width horizontal scroll.

## Known limitations

- The reference **`ui_demo.json` is on the order of ~371 MB**, so it is not practical to ship inside the repo for every clone; the intended approach is **external hosting** (CDN or object storage) with the app pointed at that URL via `DATA_URL` in `src/config.ts`.
- Serving huge binaries through **GitHub LFS** can hit **bandwidth and storage quotas** quickly for collaborators and CI; treat the dataset as an external artifact rather than something every install pulls from Git.
