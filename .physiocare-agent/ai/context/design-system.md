# 設計系統（Design System）

由 Epic 0「專案設置」的「UI 設計系統」User Story 分五階段（框架 → 風格 → design token → 元件庫 → 版面）逐步填寫。**這份文件是後續所有功能 Epic 做 UI 時的單一事實來源**：任何前端任務開工前都要先讀它，能用既有 token／元件就必須用；缺的元件要照既有風格補做並登記回這裡（見 `ai/skills/project-kickoff.md` 步驟 6 與 `ai/skills/ui-mockup-gate.md`）。

狀態：S1–S5 設計系統階段已核准；Phase 1 頁面 mockup 已選定。

## S1 底層框架

- UI 框架：Next.js 14 App Router + React 18 + TypeScript
- 元件庫策略：自建精簡的 Tailwind 原生元件（Button、Card、Badge、ScoreBar、Nav 等）；不新增第三方 UI 元件庫
- 樣式方案：Tailwind CSS v3；所有實際視覺值須來自後續核准的 design token
- 選定理由：延用現有技術棧與依賴，符合最小依賴原則；保留一致的產品風格，並以語意化 HTML、鍵盤操作與清楚焦點狀態補足必要的可及性
- 人工核准：使用者於 2026-10-05 核准 Tailwind 原生元件策略

## S2 風格方向

- 選定的 style tile：A — Kinetic Atlas（以「Calm Clinical」方向重製；用動作路徑呈現居家復健測量）
- 色彩情緒：粉白底色、深常綠文字與動態綠；琥珀只表示注意事項。即時鏡頭可用低亮度礦物深綠工作區，入口頁維持淺色。
- 字體個性：單一清楚的人文無襯線系統字體；`Aptos` 優先，含 `PingFang TC`、`Microsoft JhengHei` 中文 fallback；數值使用等寬數字，不使用整體 monospace 字體。
- 圓角／陰影傾向：主要內容區以平面分區和留白建立層次；操作控制使用小圓角；陰影只用於需要浮起的單一主要工作區。
- 密度：舒適；頁面留白從 24px 起，資料表與指標用較緊湊的行距。
- 亮／暗模式：入口及患者／治療師工作區以亮色為主；即時鏡頭的深色工作區需在 S5 mockup 再確認。
- 參考產品：shadcn/ui Dashboard（資訊層級）、shadcn-admin（導覽與響應式模式）、TailAdmin（Tailwind 資料區塊）；本設計另以人體姿勢路徑作產品專屬主視覺。
- 人工核准：使用者於 2026-10-05 選定 A；依新 frontend-design skill 重製後再次確認方向。

## S3 Design Token 清單

### Primitive Token

| 類別 | Token | 值 | 備註 |
|---|---|---|---|
| 色彩 | `neutral` | 50 `#F7F9F6`, 100 `#EDF2EE`, 200 `#DCE5DF`, 300 `#C5D2C9`, 400 `#91A499`, 500 `#6B8175`, 600 `#53695D`, 700 `#3B5147`, 800 `#263D33`, 900 `#183E35` | 中性階帶微綠，作為頁面、文字與分隔基底 |
| 色彩 | `primary` | 50 `#F1F8F3`, 100 `#E2EFE6`, 200 `#C5E0CF`, 300 `#9AC9AE`, 400 `#6AA989`, 500 `#3A8B66`, 600 `#327451`, 700 `#285C43`, 800 `#214936`, 900 `#183E35` | 主色階，用於主要操作及姿勢路徑 |
| 色彩 | `success` | 50 `#EFF8F1`, 100 `#DDF0E1`, 200 `#BDE2C6`, 300 `#91CFA2`, 400 `#63B77C`, 500 `#41995D`, 600 `#327A4A`, 700 `#29613D`, 800 `#234D33`, 900 `#1D3F2B` | 成功狀態，與 primary 綠色階分開維護 |
| 色彩 | `warning` | 50 `#FCF6EA`, 100 `#F6EACB`, 200 `#EED59C`, 300 `#E3BC6C`, 400 `#D29D45`, 500 `#B97F32`, 600 `#9A6429`, 700 `#7C4F25`, 800 `#664124`, 900 `#553721` | 注意與待檢視訊號；不可單靠色彩傳達狀態 |
| 色彩 | `danger` | 50 `#FCF1F0`, 100 `#F8DEDC`, 200 `#F0BCB8`, 300 `#E4938D`, 400 `#D36C67`, 500 `#BC4F4B`, 600 `#9D3E3D`, 700 `#7E3435`, 800 `#682D2E`, 900 `#562729` | 危險與停止提示 |
| 色彩 | `info` | 50 `#EFF6F8`, 100 `#DCECF0`, 200 `#B9D9E1`, 300 `#8BBFCF`, 400 `#5FA1B7`, 500 `#43859D`, 600 `#356B81`, 700 `#2D5668`, 800 `#284755`, 900 `#243C49` | 一般資訊提示 |
| 字級 | `type.scale` | 11, 12, 13, 14, 16, 18, 20, 24, 30, 36, 48px | 中文 UI 使用此 scale；數值資料搭配 tabular numerals |
| 字重／行高 | `type.weight` | 400, 500, 600, 700；標題 1.25，內文 1.6 | 中英文共用一致層級；中文 letter-spacing 0 |
| 字體 | `font.sans` | `Aptos`, `PingFang TC`, `Microsoft JhengHei`, `system-ui`, `sans-serif` | 本機系統字體，不加遠端字體相依 |
| 間距 | `space` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px | 僅用 4 的倍數；頁面外距 desktop 40px / mobile 24px |
| 圓角 | `radius` | 4, 8, 12, 16, 24px, full | 主要區塊平面；小圓角用於控制項，避免所有元素同圓角 |
| 陰影 | `shadow` | `panel: 0 18px 40px rgb(24 62 53 / 9%)` | 只用於單一浮起的主要工作區；避免與硬邊框疊加 |
| z-index | `z` | base 0, sticky 10, overlay 20, modal 30, toast 40 | 清楚的層級序列 |
| 動效 | `motion` | 120ms quick, 200ms standard, 320ms emphasis; ease-out `cubic-bezier(0.2,0.8,0.2,1)` | 只回應使用者操作；支援 reduced motion |

### Semantic Token

| Token | 對應 primitive | 用途 |
|---|---|---|
| color.primary | `primary.700` | 主要操作、活動導覽及動作路徑 |
| color.surface | `neutral.50` / `#FFFFFF` | 頁面底色與內容平面 |
| color.text | `neutral.900` / `neutral.600` | 主要文字與輔助文字 |
| color.warning | `warning.700` | 需要注意／人工檢視的訊號 |
| color.danger | `danger.700` | 停止或錯誤訊號 |
| color.info | `info.700` | 說明及一般資訊 |
| space.page | 24px / 40px | 手機／桌面頁面外距 |

### 實際 token 檔位置

- 專案內真實 token 檔路徑：`frontend/src/styles/tokens.css`（CSS custom properties）；`frontend/tailwind.config.js`（Tailwind semantic color mapping）
- 人工核准：使用者於 2026-10-05 核准 Kinetic Atlas token 草案及 Tailwind 對照

## S4 元件庫 Inventory

每做一個核心元件就登記一列。後續 Epic 缺元件、照風格補做後也要回來補登。

| 元件 | 狀態 | 涵蓋狀態 | 用到的 token | 檔案位置 | 截圖 | 來源階段 |
|---|---|---|---|---|---|---|
| Button | 已核准 | 預設/hover/focus/停用/載入 | primary/neutral/info/radius-sm/motion | `frontend/src/components/ui/Button.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Input | 已核准 | 預設/focus/停用/錯誤 | surface/line/text/info/danger/space | `frontend/src/components/ui/FormFields.tsx` (`TextField`) | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Select | 已核准 | 預設/focus/停用/錯誤/placeholder | surface/line/text/info/danger/space | `frontend/src/components/ui/FormFields.tsx` (`SelectField`) | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Checkbox/Radio | 已核准 | 預設/focus/停用/已選 | primary/info/text/space | `frontend/src/components/ui/ChoiceFields.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Card | 已核准 | plain/subtle/raised surface | surface/neutral/space/shadow | `frontend/src/components/ui/Card.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Badge | 已核准 | neutral/primary/success/warning/danger/info | semantic color/type | `frontend/src/components/ui/Badge.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Nav | 已核准 | 預設/hover/focus/current | primary/neutral/info/space | `frontend/src/components/ui/NavLink.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Modal/Dialog | Phase 1 不需要 | 不納入本階段 | — | — | — | 延後 |
| Table | 已核准 | header/body/responsive overflow | surface/line/text/space | `frontend/src/components/ui/Table.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Form | 已核准 | help/error/disabled/keyboard focus | surface/line/text/info/danger | `frontend/src/components/ui/FormFields.tsx`、`ChoiceFields.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| Toast/Alert | Alert 已核准；Toast 延後 | info/success/warning/danger inline state | semantic color/type/space | `frontend/src/components/ui/Alert.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |
| ScoreBar | 已核准 | 0–100/semantic tone/accessible value | primary/success/warning/danger | `frontend/src/components/ui/ScoreBar.tsx` | [元件預覽](../artifacts/Foundation/mockups/s4-component-library-preview.html)；無瀏覽器截圖工具 | S4 |

（「來源階段」記錄這個元件是 S4 初建，還是後續某個功能 Epic 補做並回登的。S4 元件預覽：`.physiocare-agent/ai/artifacts/Foundation/mockups/s4-component-library-preview.html`。使用者於 2026-10-05 核准 Phase 1 元件集；Modal/Dialog 與 Toast 延後。）

## S5 各介面版面

| 介面／使用者端 | 選定版型 | Mockup 決策紀錄 | 人工核准 |
|---|---|---|---|
| 患者流程（入口／入口網站／訓練／結果） | A — Kinetic Atlas / movement-first | `.physiocare-agent/ai/artifacts/Foundation/mockup-decision-phase1-patient-flow.md` | User · 2026-10-05 |
| 治療師工作區（患者檢視／進度報告） | A — Review first | `.physiocare-agent/ai/artifacts/Foundation/mockup-decision-phase1-therapist-workspace.md` | User · 2026-10-05 |
