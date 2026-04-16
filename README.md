# KAI Security Vulnerability Dashboard

A take-home assessment dashboard for Kai Cyber Inc. Visualizes 236,656 container image vulnerability records from a 371MB JSON dataset, with filtering, sorting, comparison, and CSV export.

**Stack:** Vite + React 19 + TypeScript, Redux Toolkit, @tanstack/react-virtual, Recharts, Papaparse, React Router v6, Tailwind CSS v4

---

## Running locally

```bash
npm install
# Place ui_demo.json in public/
npm run dev
```

Build:

```bash
npm run build
```

---

## Architecture Decision Record

### ADR-1: Web Worker for data loading

**Context:** The dataset is a 371MB JSON file containing 236,656 vulnerability records in a deeply nested structure (`root → groups → repos → images → vulnerabilities`).

**Decision:** Fetch and parse the JSON entirely inside a Web Worker (`src/workers/dataLoader.worker.ts`). The worker streams results back to the main thread in batches of 500 records via `postMessage`, dispatching each batch to Redux as it arrives.

**Rationale:** Parsing a 371MB JSON blob on the main thread freezes the UI for several seconds. The worker keeps the main thread free so the loading screen animates smoothly. Batched dispatch means Redux state grows incrementally, the progress bar updates in real time, and the first records are visible before the full parse completes.

**Tradeoff:** `JSON.parse` on a string that large still takes time even in a worker. A streaming JSON parser (e.g. `oboe`) would be faster to first-render but significantly more complex to integrate with the nested structure. Given the dataset is fixed-size and loads once per session, the simpler `response.text() + JSON.parse` approach was acceptable.

---

### ADR-2: Redux Toolkit with `serializableCheck` and `immutabilityCheck` disabled

**Context:** Redux Toolkit's default middleware runs a serializable-check and immutability-check on every dispatched action. With 236k records loaded in batches of 500, that means ~475 `batchReceived` actions each touching hundreds of records.

**Decision:** Both checks are disabled in `src/store/index.ts`.

**Rationale:** Each check is O(n) over the entire state tree. With 236k objects, even a fast traversal at 500 records/batch adds up to tens of seconds of overhead during the loading phase. Disabling them removes the performance penalty while keeping all the other benefits of RTK (immer mutations, action creators, devtools).

**Tradeoff:** Without immutabilityCheck, accidental state mutations won't be caught at runtime. This is mitigated by TypeScript strictness and the fact that all state writes go through the slice reducers.

---

### ADR-3: Chained memoized selectors (Reselect)

**Context:** Filtering 236k records on every Redux state change would be expensive if recomputed from scratch each time.

**Decision:** The filter pipeline is split into four independently memoized selectors in `src/store/selectors.ts`:

1. `selectFilterModeFiltered` — removes `kaiStatus`-flagged records
2. `selectSeverityFiltered` — applies severity level filter
3. `selectSearchFiltered` — text search across 5 fields
4. `selectFilteredVulnerabilities` — final sort

Each step takes the previous step's output as input. Reselect caches the output; a step only re-runs when its own inputs change.

**Rationale:** If the user changes the search query, only steps 3 and 4 re-run. Steps 1 and 2 return their cached results. For a sort-only change (column header click), only step 4 re-runs. This makes interactive filtering feel instant even at 236k records.

**Tradeoff:** The final sort step clones the entire filtered array (`[...data].sort(...)`) because sort is in-place. This is acceptable since the sort only runs when the sort field or direction changes.

---

### ADR-4: @tanstack/react-virtual for the vulnerability table

**Context:** The filtered dataset can be up to 236,656 rows.

**Decision:** Use `@tanstack/react-virtual` (`useVirtualizer`) in `src/components/VulnerabilityTable/VulnerabilityTable.tsx`. The table container is a fixed-height `div` (520px). Only the ~10 rows currently in the viewport are rendered in the DOM, plus an overscan buffer of 20.

**Rationale:** Rendering 236k DOM nodes is not viable — it causes a multi-second layout freeze on mount and excessive memory use. The virtualizer renders O(viewport) nodes regardless of dataset size.

**Tradeoff:** The virtualizer requires a known row height (52px fixed). Variable-height rows would require `measureElement` callbacks and add complexity. All rows are uniform, so fixed height is correct here.

---

### ADR-5: Fixed pixel column widths for header/body scroll sync

**Context:** The table needs a sticky header that stays in sync when the user scrolls horizontally through a 1200px+ wide table in a narrower viewport.

**Decision:** All columns have fixed pixel widths (e.g. `cve: 176px`, `cvss: 80px`). The header `div` uses `overflow: hidden; scrollbarWidth: none` and its `scrollLeft` is mirrored from the body container's `onScroll` callback.

**Rationale:** The header and body can't share a common scrollable parent (the virtualizer requires its own scroll container). Fixed widths let us replicate exact layout in both `div`s so that mirroring `scrollLeft` keeps columns perfectly aligned. CSS flexible widths (`flex: 1`) would diverge under different container sizes.

**Tradeoff:** Fixed widths don't adapt to content. Long CVE IDs or group names truncate. Column widths were tuned to the actual data distribution in the dataset.

---

### ADR-6: OR logic for combined filter mode

**Context:** Two `kaiStatus` values exist: `"invalid - norisk"` (17,046 records, manual analysis) and `"ai-invalid-norisk"` (11,959 records, AI analysis). The FilterBar has two toggle buttons.

**Decision:** When both buttons are active (`filterMode === 'both'`), records are excluded if they have *either* kaiStatus value. The combined badge shows `-28,921` (the union, not intersection).

**Rationale:** Both values represent "cleared — not a real risk" determinations. A security analyst enabling both filters wants to see only unreviewed vulnerabilities. OR logic (exclude if flagged by either) gives the most focused view. AND logic would only exclude records flagged by *both* methods simultaneously, which doesn't exist in the dataset.

**Tradeoff:** OR logic means the combined count is not always `analysis + ai-analysis` (it would be if there were overlapping records). In the current dataset there is no overlap, so `28,921 = 17,046 + 11,959`.

---

### ADR-7: Recharts over D3

**Context:** The dashboard needs three charts: a donut (severity distribution), horizontal bar (top risk factors), and area (monthly CVE trend).

**Decision:** Use Recharts (`PieChart`, `BarChart`, `AreaChart`) with its declarative React API.

**Rationale:** All three chart types are standard and well-supported by Recharts. The library handles tooltips, legends, responsive containers, and animations out of the box. D3's power — custom force layouts, geographic projections, fine-grained SVG control — is not needed here.

**Tradeoff:** Recharts is less flexible than D3 for non-standard chart types. If requirements evolve to need something like a treemap or force-directed graph, a switch to D3 or Nivo would be needed. For the current three chart types the tradeoff is clearly in Recharts' favor.

---

## Deployment notes

`public/ui_demo.json` is gitignored (371MB — exceeds Vercel's 100MB file limit). For production deployment:

1. Upload `ui_demo.json` to an object store (Cloudflare R2, AWS S3, etc.) with public read access and CORS configured to allow the app's origin.
2. Update the fetch URL in `src/workers/dataLoader.worker.ts`: change `'/ui_demo.json'` to the CDN URL.
3. Deploy the Vite build to Vercel/Netlify as normal.

The worker will fetch from the CDN and stream results to the app as before. The loading progress bar accounts for the slower network fetch naturally.

---

## Project structure

```
src/
├── workers/
│   ├── dataLoader.worker.ts   # Web Worker: fetch + parse + batch dispatch
│   └── index.ts               # createDataLoaderWorker factory (Vite ?worker import)
├── store/
│   ├── index.ts               # Redux store (serializableCheck disabled)
│   ├── vulnerabilitiesSlice.ts # State + reducers
│   ├── selectors.ts           # Chained memoized filter/sort selectors
│   └── hooks.ts               # Typed useAppDispatch / useAppSelector
├── types/
│   └── vulnerability.ts       # Vulnerability, FilterState, WorkerMessage types
├── hooks/
│   └── usePreferences.ts      # Column visibility + default sort (localStorage)
├── utils/
│   └── export.ts              # Papaparse CSV export
├── components/
│   ├── DataLoader/            # Loading screen + worker orchestration
│   ├── Dashboard/             # DashboardPage layout + MetricsSummary
│   ├── Charts/                # SeverityChart, RiskFactorChart, TrendChart
│   ├── FilterBar/             # Search, severity toggles, kaiStatus filters
│   ├── VulnerabilityTable/    # Virtualized sortable table
│   ├── DetailDrawer/          # Slide-in detail panel with compare button
│   └── ComparisonView/        # Full-screen side-by-side CVE comparison modal
└── App.tsx
```
