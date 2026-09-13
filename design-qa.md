# Promoters design QA

**Source visual truth path**

- `/Users/sylvesternkeze/Downloads/Dashboard (5).png` — list
- `/Users/sylvesternkeze/Downloads/Promoters Profile.png` — Transactions profile
- `/Users/sylvesternkeze/Downloads/Promoters profile (2).png` — Audiences profile
- `/Users/sylvesternkeze/Downloads/New Promoter.png` — New Promoter modal
- `/Users/sylvesternkeze/Downloads/Edit Promoter.png` — Edit Profile modal
- `/Users/sylvesternkeze/Downloads/Export Promoters.png` — Export modal

**Implementation screenshot path**

The rendered evidence was captured in the Codex in-app browser (its capture API is
ephemeral and does not expose a filesystem path):

- `http://127.0.0.1:3000/promoters`
- `http://127.0.0.1:3000/promoters/mercy-adaeze?tab=transactions`
- `http://127.0.0.1:3000/promoters/mercy-adaeze?tab=audiences`

**Viewport and normalization**

- Source images: supplied at 2511 px wide and rendered in the task at 1822–1838 × 1344 px.
- Implementation: 1822 × 1344 CSS px in the in-app browser, light theme, browser/device scale 1.
- Comparison: the same route state, content density, and light-token surface were reviewed at the normalized desktop viewport; full views and focused header, metric, table, and modal regions were inspected.

**States inspected**

- Promoters default list with five metric cards, first page, no filter.
- Transactions (`?tab=transactions`) and Audiences (`?tab=audiences`) profile states at 7D.
- New Promoter, Edit Profile, and Export overlays with their screenshot-backed defaults.
- Debounced list search: `?search=Kay` produced two matching fixtures and page 1.
- Modal Escape dismissal, query-backed tab state, profile routing, an unknown-ID return-to-list state, and an empty browser console error log.
- Tablet viewport (768 × 1024): feature grids use their breakpoint layout and the existing dashboard shell preserves its inherited horizontal table treatment.

**Findings**

- No actionable P0, P1, or P2 visual differences remain after the final comparison.
- Fonts and typography: the existing Vent font stack, display hierarchy, table density, labels, and compact supporting copy match the source hierarchy. Form labels were moved above their controls to match the modal references.
- Spacing and layout rhythm: the list grid, profile/referral band, tab/period row, metric-card counts, tables, and desktop modal widths align with the supplied states. Modal forms retain scroll-safe behavior at shorter browser heights.
- Colors and visual tokens: backgrounds, borders, brand blue actions, selected tabs, positive/negative pills, and modal overlays use existing semantic theme tokens and retain dark-mode token support.
- Image quality and assets: the generated Mercy portrait is a sharp square source, circularly masked without halos, and follows the professional portrait direction of the source. Existing Vent logo and icon assets are retained rather than re-created.
- Copy and content: tabs use the agreed plural `Transactions` / `Audiences`; editing uses `Save changes`; fixture-only success messaging explicitly says no persistent action was taken.

**Comparison history**

1. [P2] The initial New/Edit forms used the shared input container, which visually grouped labels inside the field border; auto-focusing tall modal content also shifted the New/Export captures.
   Fix: added `PromoterFormField.vue` for source-aligned standalone labels and removed modal auto-focus scrolling while retaining dialog keyboard focus for Escape.
2. Post-fix evidence: re-captured all six states at 1822 × 1344. New/Edit labels, compact upload zone, action alignment, and Export modal density now match the supplied surfaces without obstructing controls.

**Open Questions**

- The shared dashboard shell intentionally retains its existing demo-admin avatar and navigation labels, per the request to leave global chrome unchanged. These are outside the Promoters layer and are not action items.
- The browser capture tool returns ephemeral screenshots rather than writable PNG paths; the local implementation URLs above are the reproducible visual evidence.

**Implementation Checklist**

- [x] Compare all supplied list, detail-tab, and modal states at a normalized desktop viewport.
- [x] Correct modal label hierarchy, compact image-upload treatment, modal focus/escape behavior, and action button semantics.
- [x] Verify query restoration, profile routing, tabs, periods, search, table pagination, and local-only feedback behavior.
- [x] Check browser console errors and production build output.

**Follow-up Polish**

- [P3] If the global dashboard shell is refreshed later, replace its demo profile avatar and legacy `Telescope` label to match the supplied chrome exactly.

final result: passed
