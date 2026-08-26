# 三項優化 — 進度

## 1. Shadow Echo 3D 載入（已完成）
新增 `client/src/components/ShadowBootScreen.tsx`：4 階段真實進度（chunk 0.4 / webgl 0.25 / voice 0.15 / frame 0.2）、
階段清單狀態燈、5 則跟讀提示每 3.6s 輪播 + 進度圓點、sheen 掃光動畫。
改造 `ShadowCoach3D.tsx`：新增 `onContextReady`（Canvas onCreated）與 `onFirstFrame`（FirstFrameReporter 第 2 帧），
WebGL 不可用時 useEffect 立刻回報兩者避免卡住。
`ShadowEcho.tsx` 接入 bootDone 狀態機，就緒後 560ms 淡出再卸載。
`index.css` 加 `.se-boot*` 樣式（深色霓虹、respects prefers-reduced-motion）。
截圖驗證：載入完成後正常淡出，3D 教練與頁面渲染正常，tsc 0 錯誤。

## 待辦
- [x] MemGeniusArcade 視覺化圖表 —— 已完成
- [x] TrainRoleplay 回饋動畫 + 音效 —— 已完成

## 3. 分支式劇本回饋動畫與音效（已完成）
新增 `client/src/lib/sfx.ts`：WebAudio 即時合成，無音檔依賴。
9 種音效 pick/hint/reveal/correct/miss/combo/unlock/stamp/type，
木質乾淨音色；開關存 localStorage("memodesk.sfx")，預設開。
`TrainShell.tsx` 頂欄加 Volume2/VolumeX 切換鈕（所有訓練模板共用）。
`TrainRoleplay.tsx`：
- 選劇本：卡片壓下 .rp-picked + 「開演！」手寫標籤 + 220ms 後才切場景，其他卡淡出
- 答對：卡片 .rp-hit 微放大 + ✅「線索成立！」徽章 + 三和弦琶音
- 答錯：卡片 .rp-shake 左右抖 + 🔁「先記著，等等再來」+ 下滑音
- 連擊 ≥2：8 道放射火花 .rp-sparks + 追加上揚音（隨連擊升 pitch，上限第 5 階）
- 分支走向改變：STORY PATH 區塊 .rp-path-pulse 金色光暈 + 「走向已改寫」標籤 + 提示音
- 過場解鎖 unlock 音、翻開真相 reveal 音、結算蓋章 stamp 悶響
全部動畫在 prefers-reduced-motion 下停用。
tsc 0 錯誤、49 項測試全通過。

## 瀏覽器實測進度（/train/roleplay）
- 音效開關鈕已出現在頂欄（aria-label「關閉音效提示」= 目前開啟）✓
- 選歷史包 → 選劇本卡 → 已成功進入 play 階段（h1「🕵️ 第 1 幕 · 圖書館的午夜鈴聲」）✓
  （rp-picked 為 220ms 短暫狀態，同步腳本抓取時已淡出屬正常）
- 劇情進度地圖、五幕節點、提示按鈕、台詞 textarea 皆正常渲染 ✓
- 五幕演出推進正常，第 5 幕 STORY PATH 區塊正確出現 ✓
- 結案回想「我說對了」→ 頁面文字出現「✅ 線索成立！」徽章、combo ×0 → ×1 ✓
  （徽章為 900ms 動畫，截圖時機常已淡出，但 DOM 文字已確認渲染）
- MutationObserver 捕捉到答對回饋（連擊 ×3）：
  badge="✅線索成立！連擊 ×3"、badgeClass="rp-badge is-ok"、sparks=8、rp-hit=true ✓
- 實測「想不起來」：badge="🔁先記著，等等再來"、class="rp-badge is-miss"、rp-shake=true ✓
- 完成其餘回想題目：進入 h1「劇本殺結案，蓋章！」、有結算內容與 stamp 節點 ✓
- 劇本殺所有選擇回饋、連擊、答錯、分支走向與結算互動皆驗證通過。
- 部署網域已配置：acadmemory-tysvkxyr.manus.space

## 2. 自適應訓練報告視覺化（已完成）
新增 `client/src/components/AdaptiveReport.tsx`（純 SVG 自繪，未引入 recharts 以免增加 bundle）：
- 五玩法能力雷達圖：4 圈參考環 + 五軸輻線 + 各玩法主色頂點 + 圖示標籤 + 下方色條 legend
- 七日雙軸圖：局數長條（#e8dfc6）+ 正確率折線（#0f766e）+ 漸層面積 + 0/50/100 刻度
- 反應速度 vs 自適應目標：目標線標記（依難度 6.5/4.5/3.2s），達標綠、未達標橘紅
- 難度分布堆疊條 + 無資料時斜紋 placeholder
- 底部 insight：最穩／最需補的能力對比
`MemGeniusArcade.tsx` 標題改為「自適應訓練報告」，取代原本的單一 `mg-chart` 長條。
`index.css` 加 `.mg-viz*` 樣式（淺色紙感、respects prefers-reduced-motion）。
截圖驗證：無資料狀態下雷達圖顯示虛線骨架、圖表刻度與 legend 正常，tsc 0 錯誤。
