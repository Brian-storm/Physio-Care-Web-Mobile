# Cloudflare Report API Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation and one final independent review.

**Goal:** Deploy the selected report API and connect the frontend summary button.

**Architecture:** An API handler in the existing Worker serves report and health paths, while ASSETS serves the website. The browser calls the Worker directly with the existing JSON contract and the existing OpenRouter provider.

**Tech Stack:** Workers JavaScript, native fetch, Cloudflare rate-limit bindings, Next.js static export, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-23-report-api-design.md`.

## Global constraints

Use only the dedicated Worker and scoped CI token; never modify the owner Pages gateway or broaden credentials. Keep secrets and owner-specific URLs out of committed files/logs. No patient data storage, full FastAPI migration, paid-plan changes, or provider switching.

## Review focus

Malformed/chunked oversized input must stop before inference. Missing or rejected credentials must retain CORS without leaking upstream details. Rate limits must fail closed when unavailable. Static assets and 404s must keep working. Successful JSON with empty/truncated provider output must not look like a completed report.

### Task 1: Worker report API and deployment configuration

**Files:** `frontend/worker/index.js`, `frontend/worker/report-api.mjs`, `frontend/worker/tests/report-api.test.mjs`, `frontend/wrangler.worker.jsonc`, `frontend/package.json`.

**Interface:** `handleReportApi(request, env)` returns a Response for `/api/*`; static requests keep using `env.ASSETS.fetch`.

- [x] Write tests against the existing Worker for valid numeric metrics, CORS preflight, bad origins/methods, input bounds and oversized streamed bodies, limits, absent key, provider 401/402/429/5xx/network errors, malformed/empty/truncated output, and static forwarding.
- [x] Run the tests and observe missing API behavior fail.
- [x] Implement bounded JSON reading, numeric validation, OpenRouter request/response handling, sanitized failures, readiness and rate limits; configure selective Worker-first API routing.
- [x] Run Worker tests plus existing deployment/gateway suites and a local Wrangler runtime smoke test.

### Task 2: Frontend connection and release

**Files:** `.github/workflows/cloudflare-pages.yml`, `.github/workflows/report-api-readiness.yml`, `frontend/scripts/verify-report-api.mjs`, `frontend/src/components/session/LiveExerciseAnalysis.tsx`, `docs/cloudflare-pages-deployment.md`.

**Interface:** The build receives `NEXT_PUBLIC_API_URL` from masked repository configuration; report POST retains the current seven metric names and summary response.

- [x] Check the deployed Worker's `LLM_API_KEY` secret name without reading its value.
- [x] Privately validate the configured origin against the known deployed manifest before storing `PHYSIOCARE_REPORT_API_URL`.
- [x] Add Worker tests to CI and a synthetic report verification after deployment. Keep rollback version capture and gateway release verification.
- [x] Keep frontend errors user-facing; avoid sending fabricated metrics before any analyzed frames or when pain input is cancelled.
- [x] Update the operational runbook with API behavior, credentials, limits and rollback.
- [x] Build/type-check, dry-run the Worker and resolve the independent review findings.

## Execution notes

- User explicitly selected report API first. Existing local Cloudflare OAuth points to a different account; deployments use only the repository's dedicated-account CI secrets.
- Pre-flight: the frontend and Worker share the existing `/api/v1/report/session` JSON contract. No database interface is needed.

- Configuration check succeeded in [Actions run 39920610162](https://github.com/Brian-storm/Physio-Care-Web-Mobile/actions/runs/39920610162): the dedicated Worker already has `LLM_API_KEY`. Its value was not read. The verified API origin is now stored in `PHYSIOCARE_REPORT_API_URL`.
- Pre-release verification: all 41 Worker/client/deployment/gateway tests pass; the production build (types, lint, static export) and Wrangler dry-run pass. The local Worker runtime served static assets and 404s, returned CORS preflight, rejected invalid metrics, and failed closed without a local key.
- Independent review found per-set counters being sent as cumulative/completed totals. Regression tests reproduced the mismatch; the fix now covers 0/12/13/36 repetitions. Reset also clears report measurements; cancellation and empty sessions do not send invented metrics.

## Release verification

Push the reviewed commit to main under the user's authorization. The deployment workflow records the previous Worker version, checks the public gateway's manifest, and verifies health, CORS and actual synthetic inference. The Actions run and final task report record the live result; local checks alone are not deployment evidence. Camera accuracy still requires physical-device testing.

- First release [39922379897](https://github.com/Brian-storm/Physio-Care-Web-Mobile/actions/runs/39922379897) deployed the Worker and public frontend but did not pass live API verification. Follow-up checks reproduced an immediate provider-call 503: Workers rejects `redirect: "error"` before making the request. A test using the actual workerd runtime reproduced the 503, then passed with `manual` redirect handling; redirects remain rejected without forwarding the key. All 42 tests and the corrective Worker dry-run pass. Preflight initially failed immediately after release and passed on subsequent checks, so verification now waits briefly for read/preflight readiness without retrying inference.
- The prior known static-site version remains `267da685-536e-4c0d-9463-a1246f1c091b`; the first report release version is `1fbde0ce-c786-4c7a-b9d3-c9f598c00f10`. Only a subsequent successful live inference establishes report availability.
