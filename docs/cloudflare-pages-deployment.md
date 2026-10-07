# PhysioCare: fixed Pages URL, team-managed Worker

Public URL: https://physio-care.pages.dev

```text
Visitor → physio-care.pages.dev (owner-managed Pages Function)
        → PHYSIOCARE service binding → physiocare-demo Worker + static assets
```

The Pages project forwards every path to the Worker without redirecting the browser. The Pages deployment contains only the gateway; it does not contain a stale copy of the application. Team website deployments target the existing `physiocare-demo` Worker. The gateway uses a fixed binding, never a caller-supplied origin or an account API token.

## Current status

- Production Pages gateway deployed; normal pages and WASM are forwarded.
- Worker deployment and gateway unit tests passed; production evidence is in `cloudflare-gateway-verification.json`.
- A subsequent Worker-only deployment is checked through `/deployment.json`, while the Pages production deployment remains unchanged.
- No account-wide Pages token was created or shared.
- Teammate invitations are deferred until the owner supplies confirmed Cloudflare login emails.
- GitHub Actions has been changed to Worker deployment, but the PR is unmerged and the scoped deployment secret is not installed. Automatic deployment is NOT yet active.

## Team permissions to configure later

Invite confirmed Cloudflare accounts with **Individual Workers → physiocare-demo → Editor**, rather than account-wide Developer Platform, Pages or Workers Admin roles. Check the effective policy has no other resource scope. The current application Worker only has its own ASSETS binding; no DSE database, storage, service or secret bindings are configured.

Granular Wrangler access requires a suitable scoped API token; `wrangler login` OAuth does not currently support granular authorization. For CI, create a dedicated token scoped only to this existing Worker and store it as repository secret **PHYSIOCARE_WORKER_API_TOKEN**. Do not use the previously proposed account-wide `CLOUDFLARE_API_TOKEN` with Pages Edit, or copy a personal Wrangler OAuth token into GitHub.

The per-Worker role and token still need a real teammate/scoped-credential deployment test when access is configured. Creating new Workers or managing custom domains may require additional owner actions; do not broaden permissions as a workaround.

## Team update workflow

1. Develop on a branch and open a PR.
2. Review and merge frontend changes into `main`.
3. Once activated, `.github/workflows/cloudflare-pages.yml` builds and deploys only `physiocare-demo`. Its filename is retained, but the workflow name and command target the Worker.
4. The unchanged Pages gateway immediately serves the current Worker deployment. Confirm the Actions result and `/deployment.json`.

The workflow uses the free standard Ubuntu runner for this public repository, read-only GitHub contents permission, a 15-minute timeout and serialized deployment. No persistent build artifacts/cache are uploaded. The Worker token is provided only to credential-check and deployment steps, not dependency installation or build scripts. Deployment code is still repository-controlled, so collaborator write access should remain limited to trusted teammates.

From `frontend`, an authorized deployer can run:

```sh
npm ci
npm run test:gateway
npm run deploy:worker
```

`npm run deploy:cloudflare` is an alias for the same Worker deployment.

## Owner-only gateway maintenance

Only the owner uses `npm run deploy:gateway`. The config is `frontend/gateway/wrangler.toml`; it binds PHYSIOCARE to physiocare-demo. Teammates do not need Pages Edit to update the app.

For a local combined preview, build once then run `npm run preview:gateway`. It explicitly supplies both Wrangler config paths because implicit Pages discovery did not expose the service binding in the tested CLI invocation.

Do not deploy `frontend/out` directly to Pages after this setup: that would replace the gateway with a static snapshot.

## Verification and limits

- Four gateway tests verify request/body/header preservation, binary assets, 404/HEAD and uncacheable 503 failure handling.
- Static Next.js build, lint and type checks pass.
- Production HTTP checks compare the Pages responses with the Worker and confirm the gateway and cross-origin-isolation headers.
- Browser navigation is verified on the fixed URL. Human camera/physical exercise accuracy is not newly validated by these routing tests.
- Pages Function invocations use Workers request quota; this gateway is not purely free static-asset traffic.
- The site's patient/results/progress fixtures remain synthetic. No backend/database/login integration is added.

## Rollback

Previous static Pages production deployment: `c80127d7-7215-4ee8-862f-f2287703a803`. The owner can select it under Pages deployments and roll back if the gateway fails. This restores a static snapshot and will stop reflecting Worker updates.

Worker version before the gateway work: `8d9549f3-2b0b-4366-9058-ca7456d9f341`. Verify versions with `wrangler versions list --config wrangler.worker.jsonc` before choosing a rollback. Retain the gateway-compatible Worker when possible.

References:
- https://developers.cloudflare.com/pages/functions/bindings/#service-bindings
- https://developers.cloudflare.com/workers/authorization/workers/
- https://developers.cloudflare.com/pages/functions/pricing/
