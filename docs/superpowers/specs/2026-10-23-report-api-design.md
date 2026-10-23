# Cloudflare report API

The user chose to deploy the report API first so the existing frontend summary button works. Patient storage, authentication, and the database-backed FastAPI routes are outside this release.

## Approach

Run the stateless report endpoint in the existing `physiocare-demo` JavaScript Worker, using its scoped deployment token and existing OpenRouter contract. A separate Python Worker would need another deployment credential and Python packaging; the full FastAPI app additionally needs a persistent database. Those alternatives add work unrelated to the requested summary flow.

The frontend sends only seven numeric exercise metrics to `POST /api/v1/report/session` at the Worker's HTTPS origin. The API returns `{ "summary": "..." }`. The existing Pages gateway remains a static GET/HEAD proxy. Supply the API origin through the masked GitHub secret `PHYSIOCARE_REPORT_API_URL`, injected as `NEXT_PUBLIC_API_URL` during the frontend build; it is public browser configuration, not an API credential. Do not commit the owner-specific origin.

## Runtime contract

- Use OpenRouter with server-side `LLM_API_KEY` and the existing `deepseek/deepseek-v4.1-flash` model. Never log keys, request bodies, or provider response bodies.
- Allow browser requests from `https://physio-care.pages.dev`; CORS is not authentication. Keep the anonymous demo endpoint limited to numeric metrics, a 2 KiB body, and bounded inference output/time.
- Use Cloudflare rate-limit bindings for per-IP and overall request bursts. These are approximate per-location controls, not a strict billing cap. Do not enable a paid plan or change provider spend limits.
- Validate integer counts, finite angles, form score 0–100, and optional pain score 0–10. Reject unknown fields; no patient identifiers, images, or arbitrary prompts.
- Generate a concise Traditional Chinese observation grounded in the submitted metrics, without diagnosis or prescriptions. Handle missing data honestly.
- Return sanitized JSON errors with CORS and `Cache-Control: no-store`. Preserve static assets, isolation headers, gateway behavior, and existing 404s.
- `/api/health` reports service readiness without disclosing secret values. A successful live synthetic report is required before claiming the summary flow works.

## Release and recovery

Check secret presence in Actions, test validation/CORS/provider failures and real Worker routing, build the frontend, and review the change. Commit and push to main under the user's existing authorization. Save the preceding Worker version for rollback; verify the deployed commit, health, a synthetic report, and public assets. If the provider key is missing or invalid, ask the owner to configure it through Cloudflare; never request the value in chat.
