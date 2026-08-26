# 三項優化 — 檔案盤點筆記

## 1. Shadow Echo 3D
- 頁面 `client/src/pages/ShadowEcho.tsx`（206 行）
- 3D 元件 `client/src/components/ShadowCoach3D.tsx`（47 行）
  - 用 `@react-three/fiber` 的 `<Canvas>`，內含 `Coach`（球體頭+capsule身體+pointLight）與 `Rings`（3 個 torus）
  - **全部是程序化幾何，沒有外部模型/貼圖** → 沒有 `useLoader`，`useProgress` 無法取得真實資產進度
  - 已有 WebGL 偵測 fallback：`canUseWebGL` false 時回退 CSS 版 `.se-coach`
  - props 僅 `{ active: boolean }`
- 載入延遲的真正來源：**`ShadowEcho` chunk 1,067KB（three.js）的 JS 下載+解析**，非資產載入
- 因此進度條應反映：chunk 載入 → WebGL context 建立 → 首帧 rendered（用 `<Canvas onCreated>` + `useFrame` 首帧回報）
- 頁面關鍵 class：`se-lab / se-topbar / se-layout / se-sidebar / se-stage / se-scene-title`
- 3D 掛在 `se-stage` 區段內

## 2. MemGeniusArcade（自適應訓練報告）
- `client/src/pages/MemGeniusArcade.tsx`（248 行）
- 五種玩法、XP、每日挑戰、難度三檔（初/中/高級）
- 畫面現有：今日完成局數、整體正確率、平均反應（純數字，**無圖表**）
- 需加：趨勢圖、分項能力視覺化、弱項熱區

## 3. TrainRoleplay（分支式劇本）
- `client/src/pages/TrainRoleplay.tsx`（315 行）
- 步驟：選卡包 → 選劇本 → 劇情演出 → 結案回想 → 蓋章結算
- 需加：選擇後回饋動畫 + Web Audio 音效 + 音效開關

## 專案現況
- `client/src/lib/` **沒有** audio/sound/sfx 工具檔 → 需自建
- 已有依賴：`recharts`（可用於圖表）、`framer-motion`、`three`、`@react-three/fiber`
- 樣式集中在 `client/src/index.css`（手帳拼貼風 + se-* 深色 Shadow Echo 專屬區塊）
