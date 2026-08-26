# 口訣專屬範例功能測試進度

## 已完成的實作
- templateData.ts：新增 MNEMONIC_EXAMPLES（e1-e5, h1-h5, c1-c5 各 4 風格範例）、fallbackMnemonicExample()、getMnemonicExample()
- TrainMnemonic.tsx：選風格後顯示該知識點專屬範例（crayon-dashed 白底框）+「直接用這個（還能再改）」一鍵套用按鈕（僅官方卡包 tailored 範例顯示）；自建卡包顯示句型套路 fallback（無套用按鈕）
- TypeScript 無錯誤

## 測試進度
- /train/mnemonic 選「英文高頻單字」→ 進入 procrastinate 創作頁 ✅
- textarea placeholder 已改為「先在上面挑一種創作風格…」✅
- 待測：點「諧音梗」→ 確認顯示專屬範例「不可拉屎、忍耐」+ 套用按鈕 → 點套用 → 確認 textarea 填入 → 下一個知識點確認範例切換 → 自建卡包 fallback

## 測試結果：全數通過 ✅
- procrastinate 選諧音梗 → 顯示專屬範例「不可拉屎、忍耐」+ 套用按鈕 ✅
- 點「直接用這個」→ textarea 正確填入範例 ✅
- 下一個知識點 ambiguous 選順口溜 → 範例正確切換為「意思霧煞煞，一句話有兩種解法」，textarea 不殘留 ✅
- 自建卡包（日文 N3 頑張る）→ 顯示句型套路 fallback（把發音拆開唸唸看…），無套用按鈕（符合設計）✅
