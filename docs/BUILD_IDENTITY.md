# Build Identity

Release source: release.json, preserving the tested 0.1.0 First Light development milestone. Migration does not advance the release or change version 1 worksheet JSON compatibility.

The builder captures UTC once, records the full Git SHA and build-input SHA-256, and distinguishes dirty source. The full ID appears in its console, enclosing build directory, immutable manifest, generated report, persistent UI footer, and PDF Creator metadata.

The local allocator uses an exclusive directory lock and counter in .git/teacher-builds/ledger.json, with a durable per-checkout local-teacher scope. Failed reservations are retained. Concurrent invocations cannot share an ordinal. Reopening or testing an artifact does not mint a new identity.

Local builds retain their explicit local scope. The CI builder reserves PR/main ordinals by atomically creating append-only Git refs under tags/teacher-build-ledger/<scope>/<ordinal>; duplicate creation retries from current shared state. Failed reservations remain. PR events retain both built SHA and PR head, and a new PR has its own counter starting at one. Non-PR CI builds are accepted only on main. The workflow is serialized; atomic ref creation is the collision guard. The built-in token needs contents:write only for the build job. The approved October 13 publication reserved main ordinal 001 for validation and 002 for publication; see [Pages Hosting And Verification](PAGES.md).

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
| CI Counter | teacher/reserve-ci.mjs and Git teacher-build-ledger tags | Active; main 001 and 002 reserved; mocked conflict tests pass |
| CI Summary | GITHUB_STEP_SUMMARY from teacher/build.mjs | Same ID/source |
| Manual CI | .github/workflows/pages.yml | Validation and publication runs passed |
| Publication | Deploy job downloads exact tested site artifact | Gated; no rebuild |
| Published Record | docs/PAGES.md | Exact live identity, source, and workflow links |
| Readiness | docs/PAGES.md, teacher/pages-test.mjs | Subpath/runtime checks |
| IDE | None | Inapplicable |

Do not commit generated timestamps merely to rebuild again. Record review evidence separately from the source commit used by the artifact.
