# TrainRoleplay 分支式劇本盤點（第 3 項優化）

檔案：`client/src/pages/TrainRoleplay.tsx`（315 行）
分支功能來自 commit `d4392d9` Add branching roleplay story progression（已在 main）。

## 狀態變數（43-52 行）
`phase` pack|script|play|recall|result、`script`、`works: Work[]`、`idx`、`revealed`、
`combo`、`bestCombo`、`hintLevel`、`interlude`

`Work = { item: KnowledgeItem; line?: string; recalled?: boolean|null; hintUsed?: number }`

## 分支判定：`ending` useMemo（58-65 行）
看前 4 幕（`works.slice(0,4)`）：
- `detailed` = 台詞長度 ≥28 且包含核心詞的幕數
- `independent` = 沒用提示的幕數
- `detailed>=3 && independent>=3` → `perfect` 🌟 完美結局 · 真相完全還原
- `detailed>=2` → `solved` ✅ 成功結案 · 關鍵線索成立
- 否則 → `twist` 🌀 意外反轉 · 線索出現矛盾
第五幕（`idx===4`）會顯示 YOUR STORY PATH 區塊（164 行）預告走向。

## 關鍵互動點（要加回饋動畫與音效的位置）
| 行 | 位置 | 現有回饋 |
| --- | --- | --- |
| 133 | 選劇本卡 `onClick` | 無，直接 setPhase("play") |
| 151 | `interlude` 過場遮罩 | 已有 unlock-in 動畫 + 850ms 停留 |
| 187 | 顯示提示 `setHintLevel` | 無音效 |
| 202 | 「下一幕」`nextPlay()` | 只有 active:scale |
| 231 | 「翻開真相」`setRevealed(true)` | 無 |
| 240+ | 「我說對了 / 還不熟」`answer(ok)` | 只更新 combo 數字，無動畫無音效 |
| 99 | `setPhase("result")` 蓋章結算 | 有 STAMP 圖 |

## 樣式資源
- `STAMP = ${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`
- 色彩：亮黃 #FDE68A（劇本設定）／玫瑰粉 #FBCFE8（劇情演出）／teal（完成）
- 既有 class：`paper-card`、`sticky-note sticky-pink-bg`、`washi washi-pink`、`tape-corner`、`crayon-dashed`、`doodle-note`、`tilt-l2`/`tilt-r`、`unlock-in`
- `TrainShell` 提供 title/steps/stepIndex/stepColor/badge

## 實作計畫
1. 新增 `client/src/lib/sfx.ts`：WebAudio 合成音效（無需外部檔案），
   含 pick/hint/reveal/correct/miss/combo/unlock/stamp，localStorage 記憶開關
2. 新增 combo 火花、答對/答錯的卡片震動與浮出動畫、分支路徑切換的高亮動畫
3. TrainShell badge 旁加靜音切換鈕
