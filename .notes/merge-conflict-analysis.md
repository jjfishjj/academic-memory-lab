# 合併衝突分析（user_github/main commit 6a083b8f）

## 結論：遠端版本是我的功能的超集，應採用遠端版（theirs）

遠端 `main` 已經獨立實作了同一個需求，而且做得更完整：

| 面向 | 我的本地版（HEAD） | 遠端版（user_github/main） |
| --- | --- | --- |
| 範例資料 | `MNEMONIC_EXAMPLES`：每知識點 × 4 風格，各 1 句 | `MNEMONIC_REFERENCES`：每知識點 × 4 風格 × 3 種語氣（簡單／荒謬／考試型） |
| 套用按鈕 | 「直接用這個（還能再改）」 | 「套用這句」＋ 三種語氣切換鈕 |
| AI 生成 | 無 | `mnemonicAi.ts`：可呼叫 AI 重新生成 3 個答案，含離線題庫 fallback |
| 附加功能 | 無 | 口訣收藏庫、分享卡、評分、`expandedMnemonicData` 擴充題庫、測試檔 |

遠端還新增了大量其他頁面（MRT 課程、ShadowEcho、成就、天賦測驗、Supabase 同步等）。

## 合併結果（已完成）
- merge commit `b6e6403`，兩個衝突檔案採用 theirs，無殘留衝突標記
- `pnpm install` 補齊遠端新依賴（@react-three/fiber、three、@types/three、@supabase/supabase-js）
- `tsc --noEmit` 零錯誤
- 實測 /train/mnemonic：卡包擴充為 6 包（初階 15 題 / 進階 10 題）、諧音梗選取後顯示「離線參考答案 · 簡單」面板、三語氣切換鈕（🌱簡單 / 🤯荒謬 / 🎯考試型）與「套用這句」皆正常填入 textarea
- 首頁新增 3 個入口（元素週期表特訓、MemGenius 五感遊戲館、Shadow Echo 3D 跟讀）與深色模式切換

## 解法
兩個衝突檔案（`templateData.ts`、`TrainMnemonic.tsx`）皆採用 `--theirs`，
捨棄我本地重複實作的 `MNEMONIC_EXAMPLES` / `getMnemonicExample`，
避免功能重複與型別衝突。其餘非衝突檔案的本地變更（若有）保留。
