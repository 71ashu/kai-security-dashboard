# KAI Security Vulnerability Dashboard

## Project overview

The KAI Security Vulnerability Dashboard is a React application for exploring large container vulnerability exports at interactive speed. It ingests a nested JSON dataset (groups, repositories, images, and CVE-level records), flattens it into a uniform row model, and exposes filtering, sorting, charts, row virtualization, and side-by-side comparison—all tuned so the main thread stays responsive while hundreds of thousands of findings load and update.

## Live demo

**URL:** [https://kai-security-dashboard-ten.vercel.app/](https://kai-security-dashboard-ten.vercel.app/)

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

3. **Provide the dataset**

   Copy `ui_demo.json` into the `public/` directory. For local loading, set `DATA_URL` in `src/config.ts` to `/ui_demo.json` (the default in-repo value may point at a hosted URL for convenience).

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   The app also exposes `npm start` as an alias for the Vite dev server.

## Architecture decisions

### Web Worker

Parsing and denormalizing a very large JSON payload is moved off the main thread. A dedicated worker fetches the file, parses it, walks the nested group/repo/image structure, and posts transformed vulnerability batches back to the UI so scrolling, typing, and painting are not blocked by one long synchronous parse on the main thread.

### Redux with `serializableCheck` disabled

The store holds a full in-memory array of vulnerability rows (on the order of hundreds of thousands). Redux Toolkit’s serializable state check runs on every action and would traverse that tree repeatedly, which is prohibitively expensive here. Serialization checks are turned off (along with the immutability check for the same scale reason) so dispatches stay fast while the app still follows a predictable Redux data flow.

### Chained Reselect selectors

Selectors are built as a pipeline: Kai analysis filter mode, then severity, then free-text search, with sorting and chart aggregations derived from the filtered list. Each step is memoized so a change to sort order does not re-run search logic, and chart data is computed in a single pass over the filtered set instead of re-scanning the full dataset for every widget.

### `@tanstack/react-virtual`

The primary table only renders rows that intersect the viewport (plus a small overscan). That keeps DOM node count and layout work bounded regardless of how many vulnerabilities match the current filters, which is essential once the filtered set still contains tens of thousands of rows.

### Progressive row loading

The worker does not wait until the entire file is transformed before the UI updates. It streams work in fixed-size batches into Redux as they are produced, so the loading screen shows live counts and the app can converge on the full dataset without a single giant blocking commit.

### OR logic for combined filters

The Kai analysis filter mode uses inclusive combination: choosing both “analysis” and “AI analysis” paths merges into a `both` mode that excludes rows matching either invalid status, reflecting how security analysts think about “hide these categories” rather than forcing a single exclusive bucket.

### Recharts over D3

Charts use Recharts on top of React’s component model so visualizations stay declarative and consistent with the rest of the stack. The dataset size is managed by aggregated selectors feeding small summary structures into the charts, so the choice favors maintainability and integration with React state over hand-rolled D3 lifecycle and layout code.

### Flat denormalized `Vulnerability` type

Source JSON nests findings under images and repos. The app promotes group, repository, image, and synthetic identifiers to top-level fields on each row and precomputes `riskFactorList` from object keys. That flat shape makes sorting, filtering, table columns, and exports uniform without repeated tree walks in the view layer.

### `localStorage` preferences persistence

User preferences (including default sort aligned with the vulnerability filter slice) are hydrated when the store is created and written back through middleware so refreshes and return visits keep theme-related and sorting defaults without a backend.

## Component architecture

- **`App`** — Subscribes to loading and error state, shows a global error overlay with retry, and mounts routes only after data has loaded successfully.
- **`DataLoader`** — Spawns the data loader worker, dispatches batch/progress/done/error actions, and renders the full-screen loading experience with progress.
- **`DashboardPage`** — Main dashboard layout: metrics, filters, charts, and the vulnerability table.
- **`MetricsSummary`** — High-level counts and KPI-style summary driven by selectors.
- **`FilterBar`** — Search, severity, and Kai analysis filter controls wired to Redux.
- **`VulnerabilityTable`** — Virtualized, sortable grid of vulnerabilities with row interactions (navigation, selection for comparison).
- **`RiskFactorChart`**, **`SeverityChart`**, **`TrendChart`** — Recharts visualizations fed by shared aggregation selectors.
- **`VulnerabilityDetailPage`** / **`VulnerabilityDetailContent`** — Single-record drill-down for one vulnerability.
- **`ComparisonPage`** / **`ComparisonTable`** — Multi-select comparison view across chosen CVE rows.
- **`PreferencesMenu`** — Exposes persisted preferences (sort defaults and related options).
- **`ThemeToggle`** / **`ThemeRoot`** — Light/dark theming and document-level theme application.
- **`ErrorBoundary`** — Catches render errors in subtrees to avoid blanking the entire app.

## Performance optimizations

- Offload JSON fetch, parse, and denormalization to a Web Worker.
- Stream records into Redux in batches instead of one monolithic update.
- Disable Redux serializable and immutability dev checks for very large state.
- Memoized selector chains so filters, sorts, and chart inputs recompute minimally.
- Single-pass aggregation for chart series from the filtered list.
- Virtualized table rows via `@tanstack/react-virtual`.
- Compare and detail views resolve rows from maps/selectors without duplicating large arrays.

## Known limitations

- The reference **`ui_demo.json` is on the order of ~371MB**, so it is not practical to ship inside the repo for every clone; the intended approach is **external hosting** (CDN or object storage) with the app pointed at that URL.
- Serving huge binaries through **GitHub LFS** can hit **bandwidth and storage quotas** quickly for collaborators and CI; treat the dataset as an external artifact rather than something every install pulls from Git.
