# Cloudflare 部署指南：專用 Account Worker＋固定 Pages 入口

隊友及 AI agent 的操作入口。更新：2026-10-23。執行前仍須核對 Git、線上版本及有效權限。歷史報告不是目前配置。

## 架構

`https://physio-care.pages.dev` → owner 原 Account 的 Pages HTTPS gateway → 團隊專用 Account 的 `physiocare-demo` Worker → Next.js static export `ASSETS`。

AI 報告：瀏覽器 → 專用 Worker HTTPS origin 的 `/api/v1/report/session` → OpenRouter。API 不經只容許 GET/HEAD 的 Pages gateway。

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
- 跨帳戶 gateway 及首次 Actions 已於 2026-10-07 驗證成功；版本與 run 連結見 [遷移驗證紀錄](cloudflare-account-migration.md)。後續 docs-only commit 不部署，因此網站 manifest 不一定等於 main 最新文件 commit。
- 兩位隊友已獲邀加入專用 Account，僅限 `physiocare-demo` Editor；最後檢查為 Pending。原 Account 的兩位成員資格已移除。接受新邀請後才能使用新帳戶管理介面；GitHub Actions 不依賴邀請接受。
- Demo 使用 synthetic fixtures。完整 FastAPI、登入、資料庫及真實病人儲存尚未接通或部署；此次只部署無狀態 report API。MediaPipe 在瀏覽器運作；模型仍由 Google 下載。
- `frontend/worker/report-api.mjs` 在既有 Worker 提供 report API，沿用 Python 後端的七項數字欄位與 `{ "summary": "..." }` 回應格式。`backend/wrangler.toml` 是未完成的舊 Python 部署設定，不是此 API 的發布入口。
- GitHub Secret `PHYSIOCARE_REPORT_API_URL` 儲存私下核實的 Worker HTTPS origin，build 時映射為 `NEXT_PUBLIC_API_URL`，避免 owner-specific hostname 出現在 Actions logs 或 Git 檔案。這個 URL 仍會出現在瀏覽器 bundle，並不是認證密鑰。Workflow 保留既有同名 repository variable 的 fallback。
- OpenRouter key 只存為 Worker 的 `LLM_API_KEY` secret，沿用既有 `deepseek/deepseek-v4.1-flash` 模型；不是 Gemini。不要把模型 API key 放入前端或 GitHub public variables。

## 檔案與憑證

| 檔案 | 用途 |
| --- | --- |
| `frontend/wrangler.worker.jsonc` | 新 Account 的 Worker、ASSETS 與 404 設定；沒有 Account ID |
| `frontend/worker/index.js` | ASSETS 與 `/api/*` routing |
| `frontend/worker/report-api.mjs` | 輸入驗證、CORS、限流、OpenRouter 報告與健康檢查 |
| `frontend/worker/tests/report-api.test.mjs` | 報告 API contract 與失敗情境測試 |
| `frontend/worker/tests/report-runtime.test.mjs` | workerd 實際 runtime、限流 binding、provider fetch 及 redirect 拒絕驗證 |
| `frontend/gateway/wrangler.toml` | 舊 Account Pages gateway；不含 Service Binding |
| `frontend/gateway/public/_worker.js` | 固定 HTTPS proxy |
| `frontend/gateway/tests/gateway.test.mjs` | 轉接、隔離、redirect、錯誤及 method 測試 |
| `frontend/scripts/build-cloudflare.mjs` | static export 及 `deployment.json` |
| `frontend/scripts/verify-report-api.mjs` | 真實部署上的 synthetic report 驗證，不輸出報告內容 |
| `frontend/public/_headers` | COOP/COEP 等 response headers |
| `.github/workflows/cloudflare-pages.yml` | 名稱保留 pages，實際部署 Worker 並驗證公開 gateway commit |

| 私下提供的設定 | 儲存位置 |
| --- | --- |
| 新 Account ID | GitHub Secret `CLOUDFLARE_ACCOUNT_ID`；手動部署用同名環境變數 |
| 新 Account Worker Editor Token | GitHub Secret `PHYSIOCARE_WORKER_API_TOKEN`；手動部署映射為 `CLOUDFLARE_API_TOKEN` |
| Report API HTTPS origin | GitHub Secret `PHYSIOCARE_REPORT_API_URL`；build 時映射為 `NEXT_PUBLIC_API_URL` |
| OpenRouter API key | 專用 Worker 的 `LLM_API_KEY` secret；不匯出其值 |
| 新 Worker HTTPS origin | 舊 Pages production 和 preview 各自的 `PHYSIOCARE_ORIGIN` secret_text；僅為私隱用途，origin 不是密鑰 |
| 舊 Account ID／owner credential | 只在 owner 本機處理 gateway；不存入此 repo 的 Actions |

不得混淆兩個 Account ID。CI Token 只允許專用 Account 的 `physiocare-demo` Individual Workers Editor，不含舊 Account、Pages、DNS、帳單及成員管理。不要以擴權修復 403。限定 Worker 權限不代表該 Account 所有其他 storage binding 都經過隔離驗證；專用 Account 不應混放私人專案。

## GitHub Actions 日常更新

1. Feature branch → PR review → merge `main`。
2. `frontend/**` 或 workflow 修改觸發部署；docs-only 不觸發。亦可手動 Run workflow 選 main。
3. Node 22、`npm ci`、gateway／deployment／report tests、static build 通過後，記錄回滾版本 UUID，再由 Wrangler 使用新 Account Secrets 部署。
4. Workflow 經公開 Pages URL 驗證 `/deployment.json` 的 commit 等於該次 `github.sha`，且 gateway 為 `worker-http-v2`。再向 API 進行 health、CORS preflight 及一個純合成數字報告請求，確認供應商實際生成摘要。每次此驗證會產生一次 OpenRouter 推論用量；不啟用付費方案或更改額度。成功仍不是鏡頭實機驗收。

標準 Ubuntu runner、`contents: read`、checkout 不持久保存 Git credential、15 分鐘 timeout、production 串行化。Secret 只注入 credential 檢查與部署步驟。可改 workflow 的人有機會使用或外傳 Secret，所以 repo write 權限仍須只給可信任者。公開 repo 不等於公眾能直接讀 Secret。

Repository collaborator 可設定 repository Secrets；environment 保護及原生 GitHub App 授權是另外的管理權限問題。此 Actions 路線不依賴 Cloudflare GitHub App。

## 手動 Worker release

在 repo root 先核對 `git status --short`、目標 commit 及新 Account。使用 Node 22 和 lockfile；私下以環境注入憑證，不把 Token 放 command argument、log 或前端 public variables。

```sh
cd frontend
npm ci
npm run test:gateway
npm run test:deployment
npm run test:worker
# 私下提供已核實的 NEXT_PUBLIC_API_URL，再 build
npm run build:cloudflare
npx wrangler deployments list --config wrangler.worker.jsonc
node scripts/scoped-wrangler.mjs --dry-run
# 確認 ASSETS、兩個 report rate-limit bindings、指定新 Account 和正確 Worker 後
node scripts/scoped-wrangler.mjs
```

`deployment.json` 記錄 HEAD 與 UTC build 時間，不記 dirty flag；必須從乾淨、已 review 的程式建置。保存良好 Worker version UUID 作 rollback。

## 限定 Worker Token 的暫時相容修正（2026-10-23）

Dashboard 更新 Worker 後，Wrangler 4.148.0 會額外讀取遠端設定作比較。限定 Worker Editor Token 可能無權讀取 routes／custom domains metadata，造成 `Unable to fetch bindings, routes, or services metadata from the dashboard`，在上傳 assets 前停止。上游追蹤：[workers-sdk #16390](https://github.com/cloudflare/workers-sdk/issues/16390)。這個 workflow 使用 `wrangler.worker.jsonc`，不是 backend 或 gateway 的 `wrangler.toml`。

`scripts/scoped-wrangler.mjs` 使用已鎖定版本和 SHA-256 驗證的 Wrangler bundle，建立暫存副本執行正常 deploy，完成後刪除；不修改安裝的 CLI。只有 `physiocare-demo`、`deploy`、沒有任何 route／custom domain 設定時，兩項 routing 比較 GET 的 HTTP 403／Cloudflare code 10000 才可略過。成功讀取的 routing metadata 仍會比較；bindings、subdomain、service metadata、schedules 及其他錯誤仍會中止部署。此版本在 routes 為空時不發布 routes／custom domains，因此不會用空陣列清除遠端路由。Token 權限不變。

`npm run test:deployment` 以實際 pinned bundle 的函式驗證原始失敗、限定例外及其餘錯誤。更新 Wrangler 時必須重新檢視上游問題和 workaround；版本或 bundle 不符會停止。上游修復後可移除此 wrapper，改回標準 deploy。

Actions 在部署前將原有 Worker version UUID 寫入 log 和 job summary，供 `npx wrangler rollback <UUID> --config wrangler.worker.jsonc` 使用。Git 修正可用 `git revert <fix-commit>` 回復；回復原始 deploy 指令可能再次遇到原有失敗。這項 Wrangler 修正本身不部署 FastAPI；報告 API 由後續 Worker handler 實作。

## Report API 操作

- `GET /api/health`：key 和 rate-limit bindings 就緒時回 200；這只檢查設定存在，實際模型可用性由 synthetic POST 驗證。
- `POST /api/v1/report/session`：只接受 JSON 數字欄位 `total_reps`、`total_sets`、`avg_knee_angle`、`avg_torso_lean`、`form_score`、`flag_count`、`pain_score`。沒有患者識別、影片、圖片、自由文字 prompt 或資料庫儲存。未知欄位被拒絕。
- Request 上限 2 KiB；次數／警報 0–10000、組數 0–1000、角度 0–180、品質 0–100、疼痛 0–10。未提供疼痛時不補造分數。前端沒有分析 frame 或取消疼痛輸入時不發送請求。次數累計所有組，組數只計已完成的組；重設分析亦清除報告的累積數據。
- CORS 允許正式 Pages origin 及 API 自身 origin，拒絕其他 browser origin。這是匿名 demo API，CORS 不是身份驗證。每個 Cloudflare location 約每 IP 5 次／分鐘、整體 30 次／分鐘；計數是近似且分區的，並非全域嚴格費用上限。Provider 輸出最多 512 tokens、等待上限 30 秒，不自動重試。
- API 回應一律 `no-store`，不輸出 request、secret 或 provider 原始 response。401／402 等供應商錯誤轉為經清理的 502；連線或缺少設定回 503；本機限流回 429。
- Worker 的 provider fetch 使用 `redirect: "manual"` 並拒絕非 2xx；workerd 不支援瀏覽器的 `redirect: "error"`，會在發送前拋錯。Runtime 測試使用 Wrangler 隨附的 Miniflare 和實際 Worker 模組，只替換外部 provider，不讀取正式 key。發布後的 health／preflight 可短暫重試等待傳播，推論 POST 只執行一次。
- 可執行 `Check report API configuration` Actions，只檢查專用 Worker 的 `LLM_API_KEY` 名稱是否存在，不讀取秘密值。若需要更換 key，由有權管理此 Worker 的人透過 Cloudflare secret 設定；不要貼入 chat、log 或 Git。
- 手動驗證以私下設定的 `REPORT_API_URL` 執行 `node scripts/verify-report-api.mjs`。它會發送一份合成數字資料，並檢查 CORS 和實際摘要生成。
- 回滾 Worker 會連同該版本的前端資產一起回復；保留目前和前一版 UUID。移除 report 功能時亦需恢復相應的 CI 驗證步驟及 build URL 設定。

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
- Gateway 503：檢查 origin、上游可用性。Gateway 502：檢查非預期 redirect。Pages gateway 的 405：只支援 GET/HEAD，report POST 必須直接呼叫已設定的 Worker API origin。

## 私隱及歷史

公開文件可保留 Pages URL、repo、Worker 名稱、sanitized 驗證及版本 UUID。團隊 Google Doc 連結經 owner 同意保留。不要提交 Account ID、登入電郵、owner-specific hostname、API/OAuth Token、未清理 CLI/dashboard logs、相機或病人資料。所有帳戶 metadata 私下管理；不把 Token 放入 `NEXT_PUBLIC_*`。

`.codegraph` DB 只在本機使用，見 [CodeGraph 指南](codegraph.md)。舊分支刪除不保證 GitHub PR refs／舊 commit 消失；不得宣稱已抹除歷史。

## 官方參考

- [Workers 權限及 bindings 限制](https://developers.cloudflare.com/workers/authorization/workers/)
- [Service Binding 同帳戶限制](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)
- [GitHub repository Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/)
