# Shadow Echo 專業發音評分

前端將錄音轉為 16 kHz mono WAV，再送到 `VITE_PRONUNCIATION_API_URL`。API 代理會使用 Azure Speech Pronunciation Assessment，回傳音素、發音、流暢度、完整度與英語語調分數。

## 環境變數

前端建置：

```text
VITE_PRONUNCIATION_API_URL=https://your-api.example.com/api/pronunciation
```

API 部署環境：

```text
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus
```

若前端沒有設定 API URL，或服務暫時無法使用，介面會自動使用瀏覽器語音辨識備援，並在分析卡標示評分來源。Azure 的 Prosody 評分目前只適用 `en-US`；其他語言仍會取得字詞與音素準確度。
