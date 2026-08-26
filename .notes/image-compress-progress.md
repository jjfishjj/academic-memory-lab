# 圖片壓縮處理進度

## 背景
遠端 main 為支援 GitHub Pages，把 5 張圖片放進 `client/public/assets/`，用 `import.meta.env.BASE_URL` 引用（見 Home.tsx / Game.tsx / TrainShell.tsx / Train*.tsx / index.html favicon）。
`story-emotion_cd8d15ee.png` 為 1.2MB，超過 Manus checkpoint 的 1MB 上限。

## 處理策略
就地壓縮，維持原檔名與路徑（GitHub Pages 與 Manus 兩邊都可正常讀取）。
原檔已備份至 `/home/ubuntu/webdev-static-assets/story-emotion_public_backup.png`。

## 進度：已完成
第一次嘗試因迴圈每次覆寫同檔導致來源被改動，結果仍為 1.2MB。
改為固定從備份檔讀取 + 色彩量化（MEDIANCUT + Floyd-Steinberg dither）後成功：
`1920x1920 / 1.2MB` → `1100x1100 / 789KB`（160 色）。
目視檢查：手帳拼貼插畫（心臟／大腦／便利貼／紙膠帶）細節與色彩保留良好，紙張紋理仍清楚。

## 其他 4 張檔案大小（皆 <1MB，無需處理）
hero-desk 547K、memodesk-logo 639K、scene-campus 746K、stamp-success 697K
