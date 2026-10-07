# Cloudflare 部署指南：專用 Account Worker＋固定 Pages 入口

隊友及 AI agent 的操作入口。更新：2026-10-07。執行前仍須核對 Git、線上版本及有效權限。歷史報告不是目前配置。

## 架構

`https://physio-care.pages.dev` → owner 原 Account 的 Pages HTTPS gateway → 團隊專用 Account 的 `physiocare-demo` Worker → Next.js static export `ASSETS`。

- 日常 release 只更新新 Account Worker。Pages 不存 app snapshot；不可把 `frontend/out` 上傳到現有 Pages。
- 舊入口由 owner 管理，CI 不取得舊 Account 的 credential。兩個 Account 不能沿用 Service Binding。
- Gateway 只容許 GET/HEAD；轉送 path、query、Accept、Accept-Encoding、Range 及指定 cache validators，不轉送 Cookie／Authorization。HTTP 上游及任意用戶指定 origin 被拒絕。
- 只允許 owner 私下設定的 HTTPS workers.dev origin；同上游 redirect 改為公開入口，外站 redirect 回 502。Fetch 不跟隨 redirect。
- Binary body 串流傳遞，保留 status、cache、COOP/COEP；移除 Set-Cookie。上游錯誤回 503 no-store；其他 method 回 405。
- 回應識別：`X-PhysioCare-Gateway: worker-http-v2`。舊 `worker-service-v1` 表示仍是歷史 gateway。
- 舊 Account 仍負責入口可用性及 Pages Functions 用量；這不是完全搬離原帳戶。團隊可改公開入口顯示的內容，但不會因此取得 owner 管理 API credential。

## 狀態與未完成產品功能

- GitHub：`Brian-storm/Physio-Care-Web-Mobile`，正式分支 `main`。
- 專用 Account 的 Worker 已建立，限定 Worker 的 Token 已通過手動部署驗證。
- Repository Secrets 已設定；Token 到期日為 2027-01-06，需到期前更換並驗證 release。
- 跨帳戶 gateway／首次 Actions 的最終結果見 [遷移驗證紀錄](cloudflare-account-migration.md)；未有完成紀錄前不可宣稱正式切換完成。
- 先前成員邀請是在原 Account，不能當成已加入新 Account；本次部署不自動撤銷或轉移成員。
- Demo 使用 synthetic fixtures。FastAPI、登入、資料庫及真實病人儲存尚未接通或部署。MediaPipe 在瀏覽器運作；模型仍由 Google 下載。

## 檔案與憑證

| 檔案 | 用途 |
| --- | --- |
| `frontend/wrangler.worker.jsonc` | 新 Account 的 Worker、ASSETS 與 404 設定；沒有 Account ID |
| `frontend/worker/index.js` | ASSETS request handler |
| `frontend/gateway/wrangler.toml` | 舊 Account Pages gateway；不含 Service Binding |
| `frontend/gateway/public/_worker.js` | 固定 HTTPS proxy |
| `frontend/gateway/tests/gateway.test.mjs` | 轉接、隔離、redirect、錯誤及 method 測試 |
| `frontend/scripts/build-cloudflare.mjs` | static export 及 `deployment.json` |
| `frontend/public/_headers` | COOP/COEP 等 response headers |
| `.github/workflows/cloudflare-pages.yml` | 名稱保留 pages，實際部署 Worker 並驗證公開 gateway commit |

| 私下提供的設定 | 儲存位置 |
| --- | --- |
| 新 Account ID | GitHub Secret `CLOUDFLARE_ACCOUNT_ID`；手動部署用同名環境變數 |
| 新 Account Worker Editor Token | GitHub Secret `PHYSIOCARE_WORKER_API_TOKEN`；手動部署映射為 `CLOUDFLARE_API_TOKEN` |
| 新 Worker HTTPS origin | 舊 Pages production 和 preview 各自的 `PHYSIOCARE_ORIGIN` secret_text；僅為私隱用途，origin 不是密鑰 |
| 舊 Account ID／owner credential | 只在 owner 本機處理 gateway；不存入此 repo 的 Actions |

不得混淆兩個 Account ID。CI Token 只允許專用 Account 的 `physiocare-demo` Individual Workers Editor，不含舊 Account、Pages、DNS、帳單及成員管理。不要以擴權修復 403。限定 Worker 權限不代表該 Account 所有其他 storage binding 都經過隔離驗證；專用 Account 不應混放私人專案。

## GitHub Actions 日常更新

1. Feature branch → PR review → merge `main`。
2. `frontend/**` 或 workflow 修改觸發部署；docs-only 不觸發。亦可手動 Run workflow 選 main。
3. Node 22、`npm ci`、gateway tests、static build 通過後，Wrangler 使用新 Account Secrets 部署。
4. Workflow 經公開 Pages URL 驗證 `/deployment.json` 的 commit 等於該次 `github.sha`，且 gateway 為 `worker-http-v2`。成功才代表公開入口同步；仍不是鏡頭實機驗收。

標準 Ubuntu runner、`contents: read`、checkout 不持久保存 Git credential、15 分鐘 timeout、production 串行化。Secret 只注入 credential 檢查與部署步驟。可改 workflow 的人有機會使用或外傳 Secret，所以 repo write 權限仍須只給可信任者。公開 repo 不等於公眾能直接讀 Secret。

Repository collaborator 可設定 repository Secrets；environment 保護及原生 GitHub App 授權是另外的管理權限問題。此 Actions 路線不依賴 Cloudflare GitHub App。

## 手動 Worker release

在 repo root 先核對 `git status --short`、目標 commit 及新 Account。使用 Node 22 和 lockfile；私下以環境注入憑證，不把 Token 放 command argument、log 或前端 public variables。

```sh
cd frontend
npm ci
npm run test:gateway
npm run build:cloudflare
npx wrangler deployments list --config wrangler.worker.jsonc
npx wrangler deploy --config wrangler.worker.jsonc --dry-run
# 確認只有 ASSETS、指定新 Account 和正確 Worker 後
npx wrangler deploy --config wrangler.worker.jsonc
```

`deployment.json` 記錄 HEAD 與 UTC build 時間，不記 dirty flag；必須從乾淨、已 review 的程式建置。保存良好 Worker version UUID 作 rollback。

## Gateway 維護（owner）

僅 gateway 程式／origin 變動時需要執行；日常隊友 release 不部署 Pages。

1. 私下確認舊 Account 的 Pages production 和 preview 都設定正確 `PHYSIOCARE_ORIGIN`。不可使用舊 Worker origin，也不可回指 Pages 自己。
2. 保留良好 Pages production ID、配置及舊 Worker 作回滾；新 gateway 無需任何 service binding。
3. 測試後從 `frontend/gateway` 發 preview，再驗證、部署 main：

```sh
# frontend，使用 owner 的舊 Account 環境
npm run test:gateway
cd gateway
../node_modules/.bin/wrangler pages deploy --project-name=physio-care --branch=gateway-preview
# 完成 preview 的 HTTP/browser 檢查後
../node_modules/.bin/wrangler pages deploy --project-name=physio-care --branch=main
```

Pages CLI 從 canonical `wrangler.toml` 讀設定，不傳 custom config path。Local preview 用 gateway 目錄的 ignored `.dev.vars` 提供 `PHYSIOCARE_ORIGIN` 再執行 `npm run preview:gateway`；這會讀取遠端公開 Worker，不是同帳戶本機 Service Binding 模擬。

## 部署驗證與回滾

```sh
curl -fsSI https://physio-care.pages.dev/
curl -fsSI https://physio-care.pages.dev/patient/session/demo-session-004/live
curl -fsSI https://physio-care.pages.dev/wasm/vision_wasm_internal.wasm
curl -fsS https://physio-care.pages.dev/deployment.json
curl -sS -o /dev/null -w '%{http_code}\n' https://physio-care.pages.dev/missing-page
```

期望正常頁面 200、WASM MIME 正確、缺頁 404、gateway header v2、COOP same-origin、COEP require-corp，release commit 正確。檢查首頁→患者→結果及治療師；沒有 asset/hydration error，網址留在 Pages。相機、模型初始化及真人動作需實機另驗，不以 HTTP 成功替代。

- Worker 問題：在新 Account 用 `wrangler rollback <已核實版本UUID> --config wrangler.worker.jsonc`，然後驗證入口。
- Gateway 問題：owner 回復已知良好 Pages production。若回復舊 v1，須核對該部署 `PHYSIOCARE` binding 和舊 Worker 仍存在；v1 不會隨新 Account 更新。
- CI 成功部署但公開驗證失敗：先比較新 Worker／Pages 的 deployment.json 及 gateway header，檢查 origin；不要盲目重跑或擴權。
- 503：檢查 origin、上游可用性。502：檢查非預期 redirect。405：目前只支援 static reads；新增 API／登入需另作設計。

## 私隱及歷史

公開文件可保留 Pages URL、repo、Worker 名稱、sanitized 驗證及版本 UUID。團隊 Google Doc 連結經 owner 同意保留。不要提交 Account ID、登入電郵、owner-specific hostname、API/OAuth Token、未清理 CLI/dashboard logs、相機或病人資料。所有帳戶 metadata 私下管理；不把 Token 放入 `NEXT_PUBLIC_*`。

`.codegraph` DB 只在本機使用，見 [CodeGraph 指南](codegraph.md)。舊分支刪除不保證 GitHub PR refs／舊 commit 消失；不得宣稱已抹除歷史。

## 官方參考

- [Workers 權限及 bindings 限制](https://developers.cloudflare.com/workers/authorization/workers/)
- [Service Binding 同帳戶限制](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)
- [GitHub repository Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/)
