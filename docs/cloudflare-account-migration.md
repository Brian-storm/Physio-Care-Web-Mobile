# PhysioCare 專用 Cloudflare Account：遷移準備

核對日期：2026-10-07。以下為初始準備方案；執行狀態以本節為準。

## 執行紀錄

- Owner 已選擇保留 Pages URL，以 HTTPS proxy 接到專用 Account Worker。
- 新 Worker 已部署，Individual Workers Editor Token 已驗證可用，GitHub repository Secrets 已設定；Token 到期 2027-01-06。
- Gateway v2 正在 preview 驗證；PR 合併、production 切換與首次 CI 成功仍待記錄。
- 原 Account 的隊友權限未在本次遷移自動撤銷；專用 Account 成員需另行管理。

## 初始準備方案（歷史）
現行操作見 [部署指南](cloudflare-pages-deployment.md)。

## 已確認與尚未確認

- 已檢查 repo 的 Worker、Pages gateway 及 Actions 設定；開始時工作目錄乾淨。
- 現有入口 `https://physio-care.pages.dev` → Pages `PHYSIOCARE` Service Binding → `physiocare-demo` Worker → `ASSETS`。
- 官方明確要求 Service Binding 的目標在同一 Account。因此不能只換 Worker 的部署 Account ID，然後期待舊 Pages binding 跨帳戶繼續工作。
- 未找到官方文件／公開 Pages Projects API 提供跨帳戶轉移專案及保留原 pages.dev 名稱的程序。這不是已證實任何情況都不能轉移；如堅持連入口所有權也搬走，須先取得 Cloudflare Support 的明確答覆。
- 官方記載 pages.dev 子網域不能直接更名。文件沒有保證刪除專案後另一帳戶可即時取得同一名稱；不得以刪除正式專案來試驗。
- 新帳戶尚未提供，因此跨帳戶 HTTP 轉接、權限隔離及 CI 實際部署均未驗證。

## 可選路線

| 路線 | 舊網址 | 隔離及代價 |
| --- | --- | --- |
| 保留舊 Pages，改固定 HTTPS proxy 到新 Account 的 Worker | 可望維持瀏覽器原網址；待 preview 實測 | App、成員及 CI 放新 Account；舊 Account 仍負責入口運算、可用性及用量，由 owner 管理 |
| 舊 Pages 回傳 redirect 到新網址 | 舊連結仍有用，但瀏覽器網址會改 | 較簡單；新站獨立，舊入口仍有維護依賴 |
| 新 Account 使用新網址或自有網域 | 公開正式網址更換 | 可最終移除舊帳戶依賴；自有網域另有註冊／DNS 工作 |
| 請 Support 協助搬同名 Pages | 未確認 | 未獲明確可行答覆前不承諾、不刪除舊專案 |

若保持原網址是首要要求，建議先評估固定 HTTPS proxy；若要完全獨立，選新網址／團隊自有網域。proxy 為設計建議，並非已驗證遷移能力。

## 需要搬的內容

| 項目 | 操作 |
| --- | --- |
| Worker 程式與靜態資產 | 從乾淨、已 review 的 commit 重新 build／deploy 到新 Account；不可只複製本機 out 當成可追溯 release |
| Worker 設定 | 沿用 entrypoint、compatibility date、404 行為與 ASSETS；新帳戶首次建立 Worker 後再授權 CI Editor |
| 成員 | 在新 Account 重新邀請、確認接受及實際部署；不要共用登入密碼 |
| CI | 私下設定新 Account 的 `CLOUDFLARE_ACCOUNT_ID`、`PHYSIOCARE_WORKER_API_TOKEN`；Token 不含舊 Account |
| 舊 Pages gateway | owner 另外控制；團隊 Actions 只更新新 Account Worker，不提供舊 Account credentials |
| Secrets／其他資源 | repo 未配置 app secrets、D1、KV 或 R2；切換前仍須從 dashboard 重新盤點，不能以 repo 證明線上沒有新增資源 |
| FastAPI／資料庫 | 現行 Demo 未部署；此次不是後端上線或病人資料遷移 |

目前 workflow 只部署 Worker，將來可沿用；需要先完成 PR 合併、Secrets 設定及首次成功 release 驗證。GitHub App 原生整合並非此 Actions 路線的必要條件。Repository Secrets／保護規則由具有相應權限的人設定，不假設 push 權限足夠。

## 執行順序與驗收

1. 私下确认新 Account 的 owner、ID、登入與恢復方式；盤點目前 production 版本、bindings、secrets 名稱、routes 及用量。只記錄名稱，不匯出秘密值到 repo。
2. 新 Account 先部署同一個已 review commit 的 Worker；保留舊 Worker、Pages 及已知良好 production 版本作回滾。
3. 直接驗證新 Worker：首頁、patient／therapist 路由、JS/CSS/WASM、404、HEAD、COOP/COEP、`deployment.json`，及瀏覽器鏡頭／MediaPipe。
4. 若選 proxy，在獨立修訂中實作固定 HTTPS 上游；移除跨帳戶無效的 Service Binding。上游不得由 query、Host 或用戶 headers 選擇，不可持有 Cloudflare 管理 Token。先限制為目前靜態 Demo 的 GET/HEAD；未來加入登入/API 要另檢視 cookies、Authorization、redirect 及 request body。
5. Gateway preview 實測 path/query、binary body、status、cache、COOP/COEP、上游失敗及 redirect。不要自動跟隨不受控跨網域 redirect；不把它變成任意 proxy。確認新的 gateway 識別 header，更新既有測試及驗收預期。
6. 在新 Account 建立最小所需 CI Token，檢查不含舊 Account；完成 main release 並確認網站版本同步。成員有效權限及可能的其他 bindings 都需檢查。
7. owner 才切換舊 Pages production；比較新直連、舊公開入口的頁面及 asset hashes，測瀏覽器所有 Demo 流程。正式切換前的 preview 成功不等於正式成功。
8. 驗證穩定後，經 owner 授權移除舊 Account 的團隊成員／待接受邀請及停用不需要的 credentials。保留 owner 可用的回滾方法；不要過早刪除舊 Worker。

跨帳戶 proxy 保留公開 origin，因此新團隊仍可更改該 origin 顯示的 PhysioCare 內容；它不是內容安全隔離。舊 Account 不向新站授予管理權，但會继续承担入口請求用量。不得承諾零延遲、零額外費用或絕對隔離。

## 回滾

- 切換前私下記錄良好 Pages production deployment、舊 Worker version 與設定備份。
- Proxy 出錯時，由 owner 回復良好 gateway production，恢復同帳戶 `PHYSIOCARE` binding，驗證舊 Worker 仍在，重做網站檢查。
- CI 部署錯 Account 時停止 workflow、撤銷錯誤 credential，再調查；不要用擴權修復。
- 本 Demo 沒有正式資料庫搬遷；未來若有寫入資料，不能只回滾程式，須另有資料一致性方案。

## 官方依據

- [Service Binding 同帳戶限制](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Pages 已知限制，包括 pages.dev 更名](https://developers.cloudflare.com/pages/platform/known-issues/)
- [Pages Projects 公開 API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/)
- [Pages 自有網域設定](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Pages production rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/)

## 可交給 Support 的問題草稿（未發送）

Can the existing Cloudflare Pages project serving `physio-care.pages.dev` be transferred to another Cloudflare account while retaining that exact hostname? If supported, please specify the required ownership verification, downtime, and handling of deployments and bindings. If not supported, is there any guaranteed hostname reservation or reassignment process? We will not delete the existing project to test name availability. Account identifiers can be supplied privately in the authenticated support channel.
