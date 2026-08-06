# GitHub Pages 部署

推送到 `main` 或 `master` 後，儲存庫根目錄的 `.github/workflows/chunshin-learningops-pages.yml` 會自動檢查型別、執行測試、建置前端，並把本網站加入既有的 Pages 多網站 artifact。

## GitHub 設定

1. 到儲存庫的 **Settings → Pages**，將 **Source** 設為 **GitHub Actions**。
2. 到 **Settings → Secrets and variables → Actions → Variables**，新增：
   - `VITE_SUPABASE_URL`：Supabase Project URL
   - `VITE_MNEMONIC_API_URL`：選填；助憶 API URL
3. 到 **Settings → Secrets and variables → Actions → Secrets**，新增：
   - `VITE_SUPABASE_ANON_KEY`：Supabase anon key

## Supabase 登入回跳

在 Supabase Dashboard 的 **Authentication → URL Configuration → Redirect URLs** 加入：

```text
https://<GitHub帳號>.github.io/<儲存庫名稱>/academic-memory-lab/train/mrt/sync
```

網站網址會是：

```text
https://<GitHub帳號>.github.io/<儲存庫名稱>/academic-memory-lab/train/mrt
```

workflow 會依 `GITHUB_REPOSITORY` 自動產生正確的 Vite base path，並建立 `404.html`，因此直接開啟或重新整理子頁面也能回到 React 路由。
