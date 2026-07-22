# 這就是武林 (ThisIsWuLin)

網頁版**文字 / 回合制江湖 RPG** — 學習 / 練習作品。

核心是「狀態機 + 數值計算 + 回合結算」的單機遊戲：全前端、零後端，進度存於瀏覽器 localStorage。劇情文字透過可插拔的 `Narrator` 抽象層產生，未來可接 Claude / GPT 等 AI API，但**數值與判定永遠由遊戲程式決定，AI 只負責文字皮膚**。

## 技術棧

React + Vite + TypeScript + Zustand + Tailwind CSS（見 [ADR-001](docs/adr/ADR-001-initial-technology-stack.md)）。

## 專案結構（Phase 0）

```
src/core/               純遊戲邏輯，不依賴任何框架
├── types.ts            核心型別（Character / Attributes / Narrator …）
├── rng.ts              可注入亂數（讓結算成為可測試純函式）
├── rules.ts            數值 / 戰鬥結算純函式
├── turn.ts             回合協調（行動 → 事件 → 結算 → 敘事）
├── data/               資料表驅動（門派 / 敵人 / 事件）
└── narrator/           敘事抽象層（Template / Mock 實作）
```

## 開發

```bash
npm install
npm test          # 跑單元測試
npm run coverage  # 覆蓋率（核心模組門檻 ≥ 80%）
npm run typecheck # 型別檢查
```

## 開發階段

- **Phase 0** — 純 TS 遊戲核心 + 測試（不碰 React）。← 目前
- **Phase 1** — React + Zustand + 建角/主畫面 UI + localStorage 存檔（見 [SPEC-001](docs/spec/SPEC-001-phase1-playable-loop.md)）。
- **Phase 2** — 內容填充（門派技能、功法、裝備、更多事件）。
- **Phase 3** — 真實 AI 敘事（`ClaudeNarrator` 等，需先解 key 安全，另立 ADR/SPEC）。

## AI Key 安全鐵則

禁止將任何 AI API key 打包進前端 bundle（見 ADR-001 §決策.6）。開發階段 key 放本機 `.env`（不 commit）；上線需薄後端代理或玩家自帶 key。
