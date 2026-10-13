# Multiview Worksheet Studio

Build a unit-cube model, choose which views students receive, and export paper practice with a complete teacher key. This is the independent teacher companion to [Multiview Mystery](https://github.com/AbbyUsesAIThatCodes/MultiviewMystery).

**[Open Multiview Worksheet Studio](https://abbyusesaithatcodes.github.io/MultiviewWorksheetStudio/)**

## Run Locally

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Build output is self-contained static HTML, JavaScript, CSS, and fonts. No account, webcam, backend, API key, or external runtime service is needed.

## Make A Worksheet

1. Add or remove cubes. Drag to orbit with either tool; the gold edge always identifies Front. Coordinate Controls provide keyboard editing. Use Undo to recover an edit or Clear.
2. Choose Isometric → Three Views, Three Views → Isometric, or Missing Orthographic View. Checkboxes let you choose any combination of populated panels.
3. Edit Title, Name, Date, and Bell if wanted, then download Student PDF and Teacher Key PDF. Print on US Letter at 100% / Actual Size.

The key always includes all four views of the same model. Unchecked student panels contain only blank drawing grids and orientation labels. Save Model and Open Model preserve cubes, fields, and view choices; the latest worksheet also stays in this browser's local storage.

## Drawing Convention

Models occupy a 4 × 4 × 4 grid and must be supported and face-connected. Top is above Front with matching X coordinates. Right Side is beside Front with matching heights; its front is at the left. The isometric view uses a fixed 30-degree lattice. Rotating the editor never changes these directions.

Drawings show silhouettes and visible depth-change edges. Hidden lines and coplanar cube seams are omitted. Selected evidence may admit more than one valid model or missing view. The warning remains visible; the key represents the authored model, not proof of uniqueness. A limited alternative-model search catches some ambiguities but is not a uniqueness solver.

## Verify And Contribute

```sh
npx playwright install chromium
npm test
```

Tests use the already-built artifact. Set CHROMIUM_EXECUTABLE to use an existing Chromium installation. The suite covers editing, mouse/touch orbiting, undo, save/reload, view choices, actual PDF downloads, independent expected projections, blank-panel leakage, full-space bounds, and phone layout.

See [Agent Guidance](AGENTS.md), [Build Identity](docs/BUILD_IDENTITY.md), [Migration Verification](docs/MIGRATION.md), [Provenance](docs/PROVENANCE.md), and [Third-Party Notices](THIRD_PARTY_NOTICES.md).

## Hosting Status

The owner-approved public site is live on GitHub Pages. Publication remains manual and gated; ordinary pushes do not deploy. See [Pages Hosting And Verification](docs/PAGES.md) for the exact published build and verification record. The companion remains separate from the live classroom game. Generated worksheets and browser saves are not uploaded by the app.
