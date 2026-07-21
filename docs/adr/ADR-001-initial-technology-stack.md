# [ADR-001]: 初始技術棧選型與敘事層抽象

| 欄位 | 內容 |
|------|------|
| **狀態** | `FIRM` |
| **日期** | 2026-07-21 |
| **決策者** | ZedTseng（人類確認升 FIRM，2026-07-21）|

> **狀態說明：** `Draft`（初稿，禁止實作）→ `FIRM`（POC 驗證，允許 commit，需附驗證證據）→ `Accepted`（人類審核通過）

---

## 背景（Context）

本專案「這就是江湖」(ThisIsWuLin) 為**網頁版文字/回合制江湖 RPG**，定位為**學習/練習作品**（能跑、學技術優先於商業化）。

關鍵約束與需求：

1. **開發者背景**：會寫程式，但前端需現學 → 需最主流、教學資源最多、AI 支援最好的技術棧。
2. **遊戲本質**：核心是「狀態機 + 數值計算 + 回合結算」，**非實時系統**，不需要後端也能完整運作。
3. **AI 敘事需求**：希望劇情/文字**未來能接其他 AI API**（Claude / GPT 等）來潤色敘事，但這不能成為開發阻塞，也不能綁死單一供應商。
4. **安全邊界**：AI API key **絕不可放在純前端**（F12 即洩漏，會被盜刷）。
5. **治理**：ASP `autonomous` 級 + `system` 型，改碼前需 ADR / SPEC。

因此需要一次性決定：(A) 前端技術棧，(B) 資料/存檔策略，(C) AI 敘事層的抽象方式與 key 安全策略。

---

## 評估選項（Options Considered）

### 選項 A：React + Vite + TypeScript + Zustand + Tailwind + localStorage（本次選定）

- **優點**：
  - React 是資源/教學/AI 輔助最多的框架，對前端新手最友善。
  - Vite 啟動快、設定少；TypeScript 讓數值系統有型別保護（對後端背景的人是加分）。
  - Zustand 狀態管理極簡（一個 store 裝整個遊戲狀態），內建 `persist` middleware 直接對接 localStorage，天生適合存檔。
  - 全單機、零後端 → 把「學前端」與「顧後端/帳號/同步」兩件難事拆開，先攻其一。
- **缺點**：純前端無法安全放 AI key（需靠後續薄後端代理或玩家自帶 key 解決）。
- **風險**：localStorage 有容量上限(~5MB)且可被使用者清除 → 需設計匯出/匯入存檔。

### 選項 B：純 Vanilla JS + HTML（無框架）

- **優點**：零建置、零依賴，最貼近瀏覽器原理。
- **缺點**：狀態多、UI 更新頻繁時手動 DOM 操作易出錯；學到的技能遷移性低；社群範例多為玩具級。
- **風險**：專案一旦長大，缺乏結構會迅速失控。未選。

### 選項 C：全端框架（Next.js + 資料庫 + 帳號系統）

- **優點**：一開始就有後端，AI key 天生可安全存放，未來上線省事。
- **缺點**：與「先不碰後端、先學前端」的定位直接衝突；學習曲線陡峭，複雜度翻倍。
- **風險**：新手容易卡在部署/DB/認證，遲遲玩不到遊戲本身，打擊動力。未選（但保留為未來上線時的升級路徑）。

---

## 決策（Decision）

我們選擇 **選項 A**：

1. **前端框架**：React + Vite + TypeScript。
2. **樣式**：Tailwind CSS。
3. **狀態管理 / 存檔**：Zustand + `persist` middleware → localStorage；提供存檔匯出/匯入 (JSON) 以對抗 localStorage 遺失。
4. **遊戲資料**：門派、功法、裝備、事件等以**資料表 (TS/JSON) 驅動**，改數值不動邏輯程式碼。
5. **敘事層抽象（核心架構決策）**：定義一個 `Narrator` 介面，遊戲邏輯只依賴介面、不依賴任何 AI 供應商：

   ```typescript
   interface Narrator {
     narrate(context: SceneContext): Promise<string>;
   }
   ```

   實作可自由替換：`TemplateNarrator`（純模板、離線、零成本，Phase 1 預設）、`ClaudeNarrator`、`OpenAINarrator`、`MockNarrator`（測試用）。**數值與判定永遠由遊戲程式決定，AI 僅負責文字皮膚**，AI 亂講不影響遊戲平衡。任一 Narrator 失敗（無 key / API error）→ 自動降級回 `TemplateNarrator`。

6. **AI Key 安全策略（鐵則）**：
   - 開發階段：key 放本機 `.env`，不 commit、不上線。
   - 未來上線：以極薄 serverless 代理藏 key（屬選項 C 的局部引入，延後）。
   - 過渡替代：允許「玩家自帶 key」存於其自己瀏覽器。
   - **禁止**將任何內建 key 打包進前端 bundle。

---

## 後果（Consequences）

**正面影響：**
- 遊戲核心邏輯與畫面、AI 完全解耦，可獨立測試（Phase 0 純 TS 邏輯 + 單元測試）。
- Phase 1 用 `TemplateNarrator` 即可完整可玩，AI 之後隨插隨用，不阻塞。
- 換 AI 供應商只需替換一個 Narrator 實作。

**負面影響 / 技術債：**
- 純前端無法安全託管 AI key；一旦要公開上線給人玩，必須補一層後端代理（已知的單向門，列入未來 ADR）。
- localStorage 為單機存檔，跨裝置不同步（本專案定位可接受）。

**後續追蹤：**
- [ ] Phase 1 SPEC（見 SPEC-001）落地並通過 Done When。
- [ ] **Phase 3 引入「極薄後端代理」**（已確認需求：使用者計畫公開給人玩且使用 AI 敘事）。範圍限定：serverless function（Vercel / Cloudflare Workers），**無資料庫、無帳號、無伺服器維運**，唯一職責是藏 AI key 並轉發請求。屆時另立 ADR。Phase 1/2 不需後端。
- [ ] `narratorConfig` 可設定化：遊戲讀設定決定用哪個 Narrator，Phase 1 固定 `TemplateNarrator`，Phase 3 改指 `ClaudeNarrator`（endpoint 指向代理）即可，遊戲邏輯零改動。
- [ ] 存檔 schema 版本化策略（資料結構改版時的遷移）。

> **後端邊界決策（本 ADR 明確結論）**：Phase 1/2 為純前端單機，**確定不需要後端**；後端僅在 Phase 3「公開上線 + AI 敘事」同時成立時，以極薄代理形式引入，且不擴張為傳統全端（那屬選項 C，非本專案當前路徑）。

---

## 成功指標（Success Metrics）

| 指標 | 目標值（二元/可量化）| 驗證方式 | 檢查時間 |
|------|--------|----------|----------|
| Phase 1 可玩迴圈 | SPEC-001「Done When」9 項全部勾選為真 | 逐項核對 + `npm test` exit 0 | Phase 1 完成時 |
| 核心邏輯測試通過率 | 100% pass、無 skip | `npm test` exit code == 0 | 每次 commit |
| 核心邏輯行覆蓋率 | 戰鬥/結算模組 line coverage ≥ 80% | `npm run coverage` 報表門檻 | Phase 0 完成時 |
| Narrator 可插拔（自動化）| 以 `MockNarrator` 注入固定回傳，斷言遊戲邏輯輸出與 Narrator 實作無關（測試 assert 通過）| 專屬單元測試（抽換實作、assert 相同判定結果）| Narrator 實作完成時 |
| 前端 bundle 不含 key | `grep -rIE '(sk-\|api[_-]?key)' dist/` 命中數 == 0 | 建置後靜態掃描腳本 | 每次 build / 上線前 |

> 重新評估條件：若 localStorage 容量不敷、或需求轉向多人/跨裝置同步 → 重新評估是否引入後端（升級選項 C）。

---

## 關聯（Relations）

- 取代：（無）
- 被取代：（無）
- 參考：SPEC-001（Phase 1 最小可玩迴圈）

---

## Verification Evidence（升級至 FIRM 時必填）

> 填寫後由人類將狀態改為 `FIRM`，允許對應生產代碼 commit（audit-health 輸出 YELLOW FLAG）。

| 欄位 | 內容 |
|------|------|
| **POC 分支 / 測試結果** | 分支 `spike/phase0-core`。`npm test` → **32/32 passed**（rules 21 + turn 11）；`npm run typecheck` → exit 0；`npm run coverage` → 核心 line coverage **94.96%**（門檻 80%，`rules.ts` 100%）。 |
| **驗證日期** | 2026-07-21 |
| **驗證者** | ZedTseng（2026-07-21 確認升 FIRM）|
| **驗證摘要** | Phase 0 純 TS 核心（型別 / 資料表 / 數值戰鬥結算 / Narrator 抽象）已可獨立運作並通過測試；已用 `MockNarrator` 驗證「切換 Narrator 實作，遊戲數值判定結果不變」（turn.test.ts），證實 ADR 的敘事層可插拔決策成立。技術棧選型（React 生態、Zustand、資料驅動、Narrator 介面）POC 驗證通過，可升 FIRM。 |
