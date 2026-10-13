# Build Identity

Release source: release.json, preserving the tested 0.1.0 First Light development milestone. Migration does not advance the release or change version 1 worksheet JSON compatibility.

The builder captures UTC once, records the full Git SHA and build-input SHA-256, and distinguishes dirty source. The full ID appears in its console, enclosing build directory, immutable manifest, generated report, persistent UI footer, and PDF Creator metadata.

The local allocator uses an exclusive directory lock and counter in .git/teacher-builds/ledger.json, with a durable per-checkout local-teacher scope. Failed reservations are retained. Concurrent invocations cannot share an ordinal. Reopening or testing an artifact does not mint a new identity.

Local builds do not claim a PR ordinal: the remote shared PR ledger is not configured in this initial import. Future CI must reserve PR/main ordinals atomically from durable shared state before building, retain failed reservations, and deploy the exact tested artifact. Never substitute a global workflow number or relabel local artifacts.

| Surface | Location | State |
| --- | --- | --- |
| Release | release.json | Authoritative |
| Local Counter | .git/teacher-builds/ledger.json | Exclusive-lock allocation |
| Builder / Console | teacher/build.mjs | Full ID on start/success/failure |
| Output | builds/<full-id>/ | Generated, ignored |
| Manifest | Output build-manifest.json | Immutable |
| Visible UI | #build-identity footer | Same ID |
| PDF | Creator metadata | Same ID |
| Current Pointer | builds/teacher-latest.json | Local generated pointer |
| Report | Output BUILD-REPORT.md | Same identity/source |
| Local Launch | teacher/serve.mjs | Logs and serves identified output |
| Tests | teacher/tests.mjs, teacher/identity-test.mjs | Reuse and concurrent allocation |
| Current Review | docs/MIGRATION.md and PR description | Exact verification record |
| Contributor Guidance | AGENTS.md and PR template | Linked contract |
| CI / Pages / IDE | None in initial import | Pending Pages assessment |

Do not commit generated timestamps merely to rebuild again. Record review evidence separately from the source commit used by the artifact.
