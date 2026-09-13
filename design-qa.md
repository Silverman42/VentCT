# Campaign Export Modal Design QA

## Comparison Target

- Source visual truth: `/Users/sylvesternkeze/Downloads/Export campaign.jpg`
- Implementation: `http://127.0.0.1:3000/campaigns` → Export campaign data
- Implementation screenshot: in-app browser capture (ephemeral capture; no filesystem path exposed by the browser adapter)
- Desktop viewport: 1674 × 1114 CSS px, matching the source image dimensions; browser capture was reviewed at the same viewport without density normalization.
- State: light theme, export modal open, XLSX selected, email delivery selected, first and fifth campaign fixtures selected, “All” report type, and both dates set to `2026-02-15`.

## Evidence And Interaction Coverage

Full-view comparison confirmed the 580px modal width, centered lower-screen placement, white surface, rounded corners, subdued backdrop, two-option format and delivery controls, campaign selector, form fields, and two-button footer match the supplied reference composition.

Focused comparison covered the format controls, selected campaign rows, record-count summary, report-type control, dates, delivery controls, and close button. Existing Vent icons and semantic theme tokens are used; no substitute image or custom SVG artwork was introduced.

Browser checks completed:

- New Campaign opens with a blank form, blocks invalid submission, focuses the name field, and acknowledges a valid local-only submission.
- Export resets to the reference-backed defaults, supports select-all/clear-all and search-backed selection, validates empty campaign selection, and exposes its format, report, date, and delivery controls.
- The export modal remains usable at 390 × 844: its content scrolls to reveal delivery and footer actions.
- Dark and light themes were inspected. Browser console error check returned no errors.

## Required Fidelity Surfaces

- **Fonts and typography:** Uses the application’s existing body font, weights, hierarchy, and compact labels; matches the reference’s campaign-admin visual language.
- **Spacing and layout rhythm:** The modal is 580px wide on desktop and has a reference-aligned lower-centered placement, 20px content inset, scrollable campaign list, and responsive single-column mobile layout.
- **Colors and visual tokens:** Uses existing dashboard, border, text, brand, and selected-state tokens in both themes.
- **Image and asset fidelity:** The target contains only existing brand/UI imagery; the implementation reuses the registered `vent:` icon collection rather than adding placeholder artwork.
- **Copy and content:** The prescribed headings, labels, actions, reference date, and local-only behavior are present. Record totals intentionally derive from the fixture `target` values, per the approved plan.

## Findings

No actionable P0, P1, or P2 mismatches remain.

### Follow-up Polish

- [P3] Native date inputs render in the browser locale (`15/02/2026`) rather than the source image’s ISO display. The underlying value remains `2026-02-15`; use a custom date-display control only if exact visual formatting becomes a product requirement.
- [P3] Fixture-derived record totals differ from the reference’s sample totals by design.

## Comparison History

1. Initial desktop capture showed the export dialog vertically too tall and centered too high because the shared modal’s close row consumed layout space.
2. Updated `CampaignExportModal.vue` with scoped spacing/close-control overrides and a desktop positioning adjustment.
3. Re-captured at 1674 × 1114: modal dimensions and placement now align with the reference; no P0/P1/P2 findings remain.

final result: passed
