# PhysioCare：現有工作與 Cloudflare Demo 交接

> 後續 Pages 網址已部署：https://physio-care.pages.dev 。以下 Worker 記錄保留作首次部署紀錄；最新團隊部署流程見 [Pages deployment](cloudflare-pages-deployment.md)。

日期：2026-10-07（香港時間）。範圍：先部署隊友現有 Demo，列清未完成部分。

公開網址：https://physiocare-demo.1155234144.workers.dev

Cloudflare Worker：`physiocare-demo`。部署版本：`8d9549f3-2b0b-4366-9058-ca7456d9f341`。

## 已核對的來源

- 網頁 repo：https://github.com/Brian-storm/Physio-Care-Web-Mobile ，本次基於 `19ed91c`，部署適配現於 `deploy/cloudflare-pages` 分支準備提交。
- AI prototype：https://github.com/timhuang2006/physiocare-ai ，本次核對 `83c6e56`。
- 團隊文件：https://docs.google.com/document/d/1NkwWAKEBurSSuzuMK2TcT-d5XZW05FrWQumRMQLk90g/edit 。文件包含產品願景、分工、時程及部署建議；完成狀態以下列程式檢查及測試為準。

## 隊友已做了甚麼

| 部分 | 現有實作 | 今次上線狀態 |
| --- | --- | --- |
| Tim 的 AI prototype | `test_pose.py` 使用 Python、OpenCV、MediaPipe；開本機鏡頭、畫骨架、量左膝角度，以 >150° / 90–150° / <90° 分成站直、下蹲、深蹲 | 保留作參考；沒有把桌面 OpenCV 程式上傳至 Worker |
| Brian repo 的網頁 | Next.js 14、React、TypeScript、Tailwind；首頁、患者入口、訓練準備、即時分析、结果、治療師患者名單、患者詳情、進度頁 | 已部署 |
| 瀏覽器姿態分析 | MediaPipe Tasks Vision；`useCamera` → `usePose` → `poseService` → `SquatEngine` → Canvas/分數顯示 | 已部署；模擬鏡頭及模型初始化已驗證 |
| 深蹲分析 | 膝/髖/軀幹角度、狀態機、次數/組數、heuristic form/danger score | 保留現有邏輯；未驗證真人準確度 |
| 示範故事 | `phase1DemoData.ts` 提供一名患者、四次訓練、進度及處方示範 | 已部署；預載資料，不會因本次鏡頭測量而更新 |
| FastAPI 後端 | `/health`；`/api/v1` 患者、處方、訓練紀錄及 progress API；SQLModel 資料模型 | 已讀程式，未執行/部署；網頁沒有呼叫這些 API |
| 團隊文件 | MVP、pitch、WorkBuddy 構想、完整產品願景及 Workers/D1 部署範例 | 是規劃資料，不代表功能已完成 |

Tim 的 Python prototype 與網頁版是兩個獨立實作。現有網頁已內建 JavaScript 版 MediaPipe，因此 Demo 不需在伺服器運行攝像頭模型。

## 現在的部署架構

```text
使用者手機／電腦瀏覽器
  ├─ HTTPS → Cloudflare Workers Static Assets（HTML、CSS、JS、WASM）
  ├─ 下載 Google 官方 MediaPipe pose_landmarker_lite 模型
  ├─ 本機鏡頭 → MediaPipe → 關節角度 → 深蹲分析 → 畫面
  └─ 患者／治療師報告 → 程式內預載的 Demo fixtures
```

Worker 沒有資料庫 binding，亦沒有公開病人 API。未知路由會回 404。這次沒有建立 D1、部署 Python 後端或連接 Supabase。

## 今次部署改動

- 新增 `frontend/wrangler.jsonc`：Workers Static Assets，輸出目錄 `out`，`workers.dev` 公開網址及 404 處理。
- `next.config.js` 只在 `CLOUDFLARE_DEMO_EXPORT=1` 時啟用 static export，保留原本 Next.js 本機啟動方式。
- 四個參數化路由新增 `generateStaticParams`，預先產生四個 session 及一名患者的相關頁面；不接受任意新患者/訓練 ID。
- 新增 `public/_headers` 提供 COOP、COEP 等 headers。Next.js static-export 對 `headers()` 的提示不影響這套 Workers headers，已在線上核實。
- MediaPipe WASM 改用 `/wasm`，由 prepare script 從已安裝套件複製，解決原本套件 0.10.35 與 CDN WASM 0.10.18 不一致的情況。模型檔仍由 Google 官方網址下載。
- 新增 build、preview、deploy scripts，鎖定 Wrangler 4.148.0，忽略產生的 WASM、輸出目錄及本地 Worker 狀態。

## 驗證證據

- 原版 `npm run build` 通過。
- `npm run build:cloudflare` 通過（型別檢查、lint、靜態頁生成）。
- `npx wrangler deploy --dry-run` 通過；公開部署成功，版本如上。
- 本地與公開站 14 個 Demo HTML 路由均 HTTP 200。
- 公開 WASM JS/二進位均 HTTP 200；COOP `same-origin`、COEP `require-corp` 正確。
- `/missing-page` 與 `/api/v1/patients` 均 404。
- Chrome 公開站：`isSecureContext=true`、`crossOriginIsolated=true`、模擬鏡頭 video readyState 4、宽度 640；MediaPipe console 顯示 `Graph successfully started running`，即時分析頁沒有 console error。
- MediaPipe 有 OpenGL error checking disabled 警告，模型初始化仍成功。
- 首頁另有缺少 favicon 的 404，不影響 Demo。
- 公開站患者入口 390 × 844 viewport：document width 390，沒有水平溢出；桌面及手機尺寸截圖已檢視。
- 已測試患者入口點擊「查看訓練結果」的 client-side navigation。
- HTTP 明細：`cloudflare-demo-http-checks.json`。截圖在 workspace 的 `output/playwright/production-desktop.png` 及 `production-mobile.png`。
- 以上不代表 iPhone Safari、Android 或真人動作追蹤已驗收；需要實機開鏡頭測試。

## 尚未完成／不能當作已完成的功能

1. **前後端整合及儲存**：結束訓練只打開預載結果；本次 reps、角度、疼痛或警示不會寫入 DB。
2. **帳戶及權限**：首頁是工作區切換，沒有真正登入、患者與治療師授權隔離。現有 FastAPI endpoints 也未接上登入依賴。
3. **後端上雲與 DB 適配**：現有 SQLModel 預設本機 SQLite；不能只貼文件中的 D1 binding 就完成持久儲存。須另行設計與測試資料存取層。
4. **處方設定串接**：Demo fixture 目標是 10 次，live engine 是 12 次、3 組；目前未由同一份處方驅動。
5. **異常短片、PDF、WorkBuddy**：未發現完整錄影/上傳、PDF 匯出、WorkBuddy review agent 整合流程。
6. **安全控制與效果驗證**：現有程式有 heuristic 提示，不等於文件描述的完整臨床安全停機、專業審核或模型準確度驗證。
7. **裝置與網路可靠性**：真人骨架、光線/遮擋、Safari/Android、拒絕鏡頭權限、模型下載失敗的 UX 仍需系統測試。
8. **依賴更新**：`npm audit` 回報 16 項（2 moderate、13 high、1 critical），包含 Next.js 與 build tooling。此站只提供靜態產物，沒有運行 Next.js server；這不等於所有依賴風險已解決。升級需獨立回歸測試，今次未用 `audit fix --force` 改動主要版本。
9. **GitHub 發佈流程**：部署適配尚未 commit/push，亦未設定 GitHub 自動部署。

建議下一階段順序：先實機驗收 Demo → 統一處方與 session 契約 → 身分/權限及資料庫 → session 儲存與治療師實際讀取 → 報告、通知和 WorkBuddy。

## 如何再次部署

在此 repo 的 `frontend` 目錄：

```bash
npm ci
npx wrangler whoami
npm run deploy:cloudflare
```

本地 Workers 預覽：`npm run preview:cloudflare`。

`wrangler.jsonc` 已指定本次 Cloudflare 帳戶；若由另一位隊友的帳戶部署，先改成其 account ID，並確認 Worker 名称。CLI 登入資料不在 repo 中。

目前只有一個版本。日後更新前，可用 `npx wrangler deployments list` 記下上一版；回滾用 `npx wrangler rollback <已核實的舊版本 ID>`。未提交檔案亦應保存，否則僅有 upstream commit 不足以重建本次部署。

## 文件中的部署方案與實作差異

團隊文件建議 Pages + Python Worker + D1，但本次按使用者確認的 Demo 範圍，使用 Workers Static Assets。現有後端 health 路徑是 `/health`，不是文件範例的 `/api/health`。Google 文件中的示例程式不能直接當成本 repo 可運行的部署設定。

Cloudflare 官方參考：https://developers.cloudflare.com/workers/static-assets/ ，https://developers.cloudflare.com/workers/static-assets/headers/ 。
