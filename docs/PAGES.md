# Pages Hosting And Verification

## Public Site

**[Open Multiview Worksheet Studio](https://abbyusesaithatcodes.github.io/MultiviewWorksheetStudio/)**

The owner explicitly approved public GitHub Pages hosting on October 13, 2026. The repository was already public; its visibility was not changed. Pages uses GitHub Actions with HTTPS enforced. The classroom Multiview Mystery site and repository were not changed by this publication.

## Published Build

| Item | Verified Value |
| --- | --- |
| Version | 0.1.0 |
| Codename | First Light |
| Scope / Ordinal | main / 002 |
| Built At | 2026-10-13T22:41:33Z |
| Source Revision | 396abd396a363cea041670494f9b4c5abddf7e12 |
| Source State | Clean |
| Full Identity | 0.1.0_First-Light_main_build-002_20261013T224133Z_g396abd396a36_teacher |

The [public manifest](https://abbyusesaithatcodes.github.io/MultiviewWorksheetStudio/build-manifest.json), visible UI footer, and both downloaded PDFs' Creator metadata agree. This document records the published artifact; later documentation-only commits do not rebuild or silently change it.

## Integration And Publication Evidence

- [PR #3](https://github.com/AbbyUsesAIThatCodes/MultiviewWorksheetStudio/pull/3) brought the already-reviewed hosting changes into main after the earlier stacked PR merged into the import branch.
- [Validation Run](https://github.com/AbbyUsesAIThatCodes/MultiviewWorksheetStudio/actions/runs/38479156978): succeeded on the source above with publish=false; deployment was skipped. Reserved main build 001 at 22:39:14 UTC.
- [Publication Run](https://github.com/AbbyUsesAIThatCodes/MultiviewWorksheetStudio/actions/runs/38479413468): build, tests, and deployment succeeded with publish=true. Reserved main build 002 and deployed its exact tested static artifact without rebuilding.
- Both Linux runs passed the 2,189-assertion geometry/browser/PDF suite and all 11 project-subpath/CI checks. The workflow retains the identified site artifact and synthetic verification evidence in its run artifacts.
- A fresh browser against the actual public URL passed 31 additional checks: HTTP 200, clean expected source, matching identity, both real PDF-button downloads, embedded PDF identity, US Letter dimensions, one page, edited title, appropriate student/key contents, no model attachment, asymmetric projection orientation, omitted coplanar seams, local autosave, phone layout, font loading, and no failed assets or browser errors.
- The downloaded public PDFs and desktop screenshot were visually inspected. Student orthographic panels are blank grids; the teacher key supplies the aligned top/front/right views. The actual key raster also passed independent hand-calculated asymmetric edge checks.

The public sample student PDF was 23,420 bytes and the key was 24,045 bytes. Verification used synthetic generic fields only. PDF creation may include fresh metadata, so these sizes are evidence for that run, not a required future byte-for-byte result.

## Data And Offline Behavior

The app is a roughly 2.4 MB static build with relative HTML, script, stylesheet, manifest, and font paths. It needs no backend, webcam, credentials, analytics, CDN, external font service, or runtime npm service. Only the generated build directory is published; repository source, tests, node_modules, browser storage, and generated worksheets are excluded.

The site and its bundled generic example are publicly accessible. PDFs and model JSON are created in the browser and downloaded locally. Title/Name/Date/Bell fields and cubes are autosaved only in that browser's localStorage; they are not sent to this app's server. Browser storage does not sync between devices. Use Save Model/Open Model to transfer a model. Other apps under the same github.io origin share the browser origin, as normal for project Pages sites.

Initial site and font loading requires network access; there is no service worker or installable offline cache. Once loaded and PDF fonts have been used, editing/export in that open tab works offline. The separately served local build works without Internet access. Hosting does not add a login wall. GitHub may log visit metadata as described in its hosting documentation.

## Publication Controls

The workflow in .github/workflows/pages.yml is manual-only, with no push, PR, or schedule trigger. Its default publish=false run builds and tests without deployment. It pins official actions to verified commit SHAs.

The build reserves a durable main-scoped ordinal, builds once, runs the full suite, and uploads that exact static artifact and synthetic test evidence. Deployment retrieves the same artifact without rebuilding. It requires main, manual publish=true, and repository variable PAGES_PUBLICATION_APPROVED=true. The configure-pages step sets enablement=false; it cannot create Pages itself. Pages was enabled explicitly for this owner-approved publication.

For an authorized future release, run validation with publish=false, inspect its tests, then run with publish=true. Verify the actual deployed URL, manifest, visible identity, fonts, and both PDF downloads. A dispatched workflow alone is not evidence of successful publication.

## Official References

- [GitHub Pages Static Hosting And Project URLs](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Custom Workflows, Artifacts, And Permissions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Configure Pages Enablement Default](https://github.com/actions/configure-pages/blob/v5/action.yml)

Publication and verification recorded October 13, 2026.
