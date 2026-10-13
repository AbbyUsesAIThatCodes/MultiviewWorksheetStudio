# Working On Multiview Worksheet Studio

Keep this teacher-facing tool focused on quick cube construction and paper worksheet generation. Do not add classroom game modes or claim an approved curricular-goal audit.

Preserve the fixed front/top/right convention, accessible mutually exclusive Add/Remove tools, drag-to-orbit without edits, offline runtime assets, and visible ambiguity warning. Student and key PDFs must derive from the same model; blank student grids must contain no answer geometry or model attachments.

Use Title Case for authored interface and document headings. Prefer Comic Sans system fonts with the bundled licensed Comic Neue fallback; PDFs embed Comic Neue.

Follow [Build Identity](docs/BUILD_IDENTITY.md) and [Provenance](docs/PROVENANCE.md). The vendor directory contains pinned unchanged upstream assets; explain and test any later fork. Preserve font licenses. Run npm run build, npm test, and syntax checks for changed modules. Inspect actual PDF renderings plus desktop and phone screenshots for interaction or drawing changes.

Use review branches and meaningful commits. Do not merge, change repository visibility, enable Pages, or deploy without explicit owner direction. Never commit browser saves, student identifiers, credentials, generated private worksheets, or local machine data.
