# MemGeniusArcade 報告區塊盤點（第 2 項優化）

## 現有可用資料（已在 component 內計算好）
| 變數 | 內容 |
| --- | --- |
| `logs: TrainingLog[]` | `{ game, correct, responseMs, difficulty, round, at }`，最多保留 200 筆，新的在前 |
| `trend` | 7 天陣列 `{ label "M/D", count, accuracy 0-100 }`（第 140-145 行） |
| `accuracy` | 整體正確率 0-100 |
| `averageSeconds` | 平均反應秒數字串 |
| `todayCount` / `dailyGoal` | 今日局數 / 目標 |
| `weakestGame` | 最弱玩法（含 `rate`、`attempts`、`talent`、`color`） |
| `achievements` | 4 個 `{ icon, label, unlocked }` |
| `scores` | 各玩法最高 XP |
| `games` | 5 玩法 `{ id, icon, title, source, talent, description, color }` |
| `difficultyConfig` | easy/normal/hard 的 label、seconds、xp、hint |
| `adaptiveTargetMs` | easy 6500 / normal 4500 / hard 3200（自適應目標反應時間） |
| `recommendedDifficulty()` | 近 5 局：正確率≥.8 且平均≤目標→升級；≤.4→降級 |

## 現有呈現（都很弱，需視覺化）
- `mg-summary`（222 行）：三個純數字（今日完成／整體正確率／平均反應）
- `mg-report`（224 行）：`mg-chart` 已有 7 天長條（純 CSS height %），`mg-weakness` 純文字，`mg-badges` 成就
- `mg-records`（225 行）：最近 5 筆列表

## 優化方向
1. 七日趨勢升級為雙軸：正確率折線 + 局數長條（目前只有正確率長條）
2. 五玩法能力視覺化：用 recharts RadarChart 或自繪 SVG 雷達圖（依 logs 各 game 正確率）
3. 反應時間 vs 自適應目標的對比條
4. 弱項熱區：五玩法色塊按正確率深淺標示
5. 難度分布（easy/normal/hard 各佔比）

## 注意
- 專案已裝 `recharts` ^2.15.2
- 樣式在 `client/src/index.css`，MemGenius 區塊 class 前綴 `mg-`，淺色手帳風（#fff 卡片、#ddd8ce 邊框、圓角 18px）
- 五玩法主色：palace #ef8b6c / trail #efb94f / bounce #9d79d6 / grid #55aa83 / maze #4c91d8
