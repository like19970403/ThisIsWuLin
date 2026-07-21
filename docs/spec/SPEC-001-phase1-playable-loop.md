# [SPEC-001]: Phase 1 — 最小可玩迴圈

| 欄位 | 內容 |
|------|------|
| **狀態** | `Draft`（依賴 ADR-001 升至 Accepted 後方可實作）|
| **日期** | 2026-07-21 |
| **關聯 ADR** | ADR-001（技術棧 + 敘事層抽象）|

---

## Goal（這個功能建了什麼）

一個**能實際遊玩的單機文字江湖 RPG 最小迴圈**：玩家可建立角色，透過「練功 / 闖蕩 / 休息」推進，闖蕩會觸發隨機事件（含一場回合制切磋結算），所有進度自動存於瀏覽器，重整不遺失。敘事文字由可插拔的 `Narrator` 產生（Phase 1 用 `TemplateNarrator`，離線零成本）。

## Inputs（什麼資料/事件進入系統）

- **玩家操作**：建立角色（輸入姓名、選門派）、點選行動按鈕（練功 / 闖蕩 / 休息 / 存檔匯出匯入）。
  - 格式：UI 事件（onClick）+ 表單字串。
- **遊戲資料表**（靜態，隨程式打包）：門派表、屬性初始值、隨機事件表、敵人表。格式：TS/JSON 常數。
- **存檔載入**：啟動時從 localStorage 讀取既有 `SaveData`（JSON）。

## Outputs（系統產生什麼輸出）

- **成功路徑**：
  - 更新後的角色狀態（屬性、內力、體力、銀兩、聲望）渲染於畫面。
  - 每回合一段敘事文字（`Narrator.narrate()` 產出）。
  - 事件/戰鬥結果日誌（append 到捲動式訊息區）。
  - 存檔匯出：一份 JSON 字串供玩家複製/下載。
- **失敗路徑**：
  - 體力不足時行動被拒 → 顯示提示訊息，不改變狀態。
  - 存檔匯入格式錯誤 → 顯示錯誤訊息，保留原存檔不覆蓋。
  - `Narrator` 產生失敗 → 降級為最基本模板字串，遊戲繼續。

## Side Effects（狀態變更、外部呼叫、通知）

- **localStorage 寫入**：每次狀態變更後由 Zustand `persist` 自動寫入 key `wulin-save-v1`。
- **無外部網路呼叫**（Phase 1 `TemplateNarrator` 純本地；AI Narrator 屬 Phase 3+）。
- **無後端、無帳號**。

## Edge Cases（錯誤條件、邊界輸入、race condition）

- 首次進入（localStorage 空）→ 導向建角流程，不可進入遊戲主畫面。
- 角色姓名為空字串 / 純空白 → 拒絕建立。
- 體力歸零 → 僅允許「休息」；其他行動禁用。
- 數值溢位 / 負值 → 所有屬性以 `clamp(min, max)` 收斂，不得為負。
- 存檔 JSON 損毀或版本不符（無 `version` 欄位或不符）→ 不套用、提示玩家、保留現況。
- 隨機事件表為空或抽不到 → fallback 到「無事發生」事件，不 crash。
- 快速連點行動按鈕 → 行動處理期間按鈕 disabled，避免重複結算。

## Done When（二元可測試驗收條件）

- [ ] 全新瀏覽器開啟 → 出現建角畫面；完成建角後進入主畫面。
- [ ] 點「練功」→ 對應屬性上升、體力下降、畫面即時更新、產生一段敘事。
- [ ] 點「闖蕩」→ 觸發一個隨機事件；若為戰鬥，回合制切磋跑完並產生勝/負結果與獎懲。
- [ ] 戰鬥結算為純函式且有單元測試，`npm test` 全綠。
- [ ] 體力為 0 時，除「休息」外的行動按鈕 disabled。
- [ ] 遊玩數回合後重整頁面 → 進度完全保留（狀態與日誌）。
- [ ] 匯出存檔得到 JSON；清空 localStorage 後匯入該 JSON → 進度還原。
- [ ] 將 Narrator 由 `TemplateNarrator` 換成 `MockNarrator` → 遊戲邏輯碼零改動仍可運作（驗證抽象）。
- [ ] 前端 build 產物中不含任何 AI API key（grep 掃描為空）。

## Non-Goals（Phase 1 明確不做）

- 不接任何真實 AI API（`ClaudeNarrator` / `OpenAINarrator` 屬 Phase 3）。
- 不做多人、排行榜、幫派、跨裝置同步。
- 不做完整門派技能樹 / 裝備系統（Phase 2 內容填充）。
- 不做後端、帳號、雲存檔。
- 不追求美術；文字 + 基本 Tailwind 排版即可。

## Rollback Plan

Phase 1 為全新前端專案、無 schema migration、無外部服務。回滾 = `git revert` 對應 commit 即可，無資料庫或線上狀態需清理。存檔資料帶 `version` 欄位，未來改版時據此決定遷移或棄用。

---

## 實作階段拆解（供 ROADMAP 參考，非驗收條件）

- **Phase 0**：純 TS 遊戲核心（型別定義、屬性/戰鬥結算函式、`Narrator` 介面 + `TemplateNarrator`/`MockNarrator`）+ 單元測試。**不碰 React**。
- **Phase 1**：接上 React + Zustand store + 建角/主畫面 UI + localStorage 存檔 + 匯出匯入。（本 SPEC 範圍）
- **Phase 2+**：內容填充（門派、功法、裝備、更多事件）。
- **Phase 3+**：`ClaudeNarrator` 等真實 AI 敘事（需先解 key 安全，另立 SPEC/ADR）。
