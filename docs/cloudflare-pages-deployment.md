# PhysioCare Pages deployment

Production: https://physio-care.pages.dev

## Team workflow

1. Create a feature branch in `Brian-storm/Physio-Care-Web-Mobile`.
2. Open a PR and review the changes.
3. Merge into `main`. Frontend or deployment-workflow changes trigger `.github/workflows/cloudflare-pages.yml`.
4. GitHub Actions runs `npm ci`, `npm run build:cloudflare`, and uploads `frontend/out` to the `physio-care` Cloudflare Pages project.
5. Check the Actions run before considering the website updated. The previous site remains available if a build fails.

The workflow can also be run manually from Actions on `main`. Other branches and PRs cannot publish production. It uses a standard Ubuntu runner, read-only GitHub contents permission, a 15-minute limit, no persistent build artifact/cache uploads, and serializes production deployments. Only the deploy step receives the Cloudflare token.

## Activation still required

The dedicated Cloudflare API token has NOT been created or uploaded. Until the `CLOUDFLARE_API_TOKEN` repository secret is installed, automatic deployment will fail at the explicit credential check. The workflow must also be merged into `main` before push triggers are active.

Required token: **Account / Cloudflare Pages / Edit**, limited to Cloudflare account `ec8010aae582c44feffb276276eda6ce`. This is an account-wide Pages permission: it also covers the DSE Pages projects in that account, not only PhysioCare. Approval is pending for sharing this scope with this repository's Actions. GitHub users who can change workflows can potentially use the deployment secret. The existing Wrangler OAuth token must never be copied into GitHub secrets.

Create a dedicated token after approval, and store it as repository Actions secret `CLOUDFLARE_API_TOKEN`. The account ID is public configuration already in the workflow. Use a separate Cloudflare account for stronger isolation if required. No Cloudflare password or personal Wrangler credential is needed by teammates.

After merging and installing the secret, run the workflow once and verify both its success and the deployment commit on Cloudflare. The manual first deployment does not prove CI is working.

## Why GitHub Actions

Cloudflare native Git integration returned error 8000011 (Git installation issue). GitHub Actions with Pages Direct Upload avoids depending on that installation. The Pages project is Direct Upload; switching it to native Git integration later requires recreation, so retain Actions as the deployment mechanism.

## Local commands

From `frontend`:

```sh
npm ci
npm run build:cloudflare
npm run preview:cloudflare
npm run deploy:cloudflare
```

The legacy Worker is retained at https://physiocare-demo.1155234144.workers.dev . Its config is `wrangler.worker.jsonc`; only `npm run deploy:worker` targets it. Future Pages deployments do not update the legacy Worker.

## Verification (2026-10-07)

- Next.js static build, lint and type checks passed.
- Initial Pages upload completed: https://c80127d7.physio-care.pages.dev .
- HTTP/header checks saved in `cloudflare-pages-http-checks.json`.
- Automatic GitHub deployment remains pending token approval, secret installation and merge.

Demo scope is unchanged: patient/result/progress pages use synthetic fixtures; camera analysis is browser-side; no backend/database/auth deployment.
