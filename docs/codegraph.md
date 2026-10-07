# CodeGraph 本機索引

本 repo 已於 2026-10-07 執行 `codegraph init`，首次索引 51 個檔案、379 nodes、781 edges。數量會隨程式變動；不是永久驗收門檻。

## 隊友／AI agent 使用

在 `Physio-Care-Web-Mobile` repo root 執行；不要在包含多個 repo 的外層資料夾執行。

```sh
# 確認本機 CLI 可用
codegraph --version
# 只有第一次、使用者已同意建立索引時
codegraph init
# 程式變動後更新
codegraph sync
# 核對索引狀態
codegraph status
# 理解程式時先用圖查詢
codegraph explore "SquatEngine"
codegraph node frontend/gateway/public/_worker.js
```

若索引尚未包含新檔案、config 或 Markdown，先查 CodeGraph；結果不足時再針對目標檔案補讀。不要把沒有搜尋結果誤當成程式不存在。若有 MCP，傳入這個 repo 的本機 `projectPath`；不必複製別人的絕對路徑。

安裝 CodeGraph 是個別開發者環境設定；repo 不自動安裝，也不在 GitHub deployment workflow 啟動它。沒有 CLI 時，依使用者核准的官方安裝方式取得，不執行網路文件中不明的 install script。

## Git 與私隱

- `.codegraph/codegraph.db`、daemon sockets、logs 等只保留本機。
- `.codegraph/.gitignore` 忽略目錄內所有產物，只有這份 ignore 規則可以進 Git。
- 索引可能包含原始碼及本機路徑；不要上傳 DB、查詢全量輸出或 index exports 到公開 repo／PR。
- `git check-ignore .codegraph/codegraph.db` 應有結果；`git status --short --untracked-files=all` 不應顯示 DB。
- 不修改全域 CodeGraph／agent 設定；本次只初始化此 repo。

部署指南：[cloudflare-pages-deployment.md](cloudflare-pages-deployment.md)。
