export type DiffStatus = "correct" | "substitute" | "missing" | "extra";
export type SpeechDiffToken = { expected?: string; actual?: string; status: DiffStatus };
export type RecognitionFailure = { code: "no-transcript"; title: string; detail: string; fixes: string[] };
export type SpeechAssessment = {
  transcript: string;
  scores: [number, number, number, number];
  matchedPercent: number;
  feedback: string;
  diff: SpeechDiffToken[];
  failure?: RecognitionFailure;
};

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
function normalize(text: string) { return text.toLocaleLowerCase().replace(/[\s.,!?;:'"，。！？、；：「」『』（）-]/g, ""); }
export function speechUnits(text: string, language: string) {
  if (language === "English") return text.toLocaleLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
  return Array.from(normalize(text));
}

export function alignSpeech(expected: string, actual: string, language: string): SpeechDiffToken[] {
  const a = speechUnits(expected, language); const b = speechUnits(actual, language);
  const costs = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) costs[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) costs[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) costs[i][j] = a[i - 1] === b[j - 1] ? costs[i - 1][j - 1] : Math.min(costs[i - 1][j - 1], costs[i - 1][j], costs[i][j - 1]) + 1;
  const aligned: SpeechDiffToken[] = []; let i = a.length; let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { aligned.unshift({ expected: a[i - 1], actual: b[j - 1], status: "correct" }); i -= 1; j -= 1; }
    else if (i > 0 && j > 0 && costs[i][j] === costs[i - 1][j - 1] + 1) { aligned.unshift({ expected: a[i - 1], actual: b[j - 1], status: "substitute" }); i -= 1; j -= 1; }
    else if (i > 0 && costs[i][j] === costs[i - 1][j] + 1) { aligned.unshift({ expected: a[i - 1], status: "missing" }); i -= 1; }
    else { aligned.unshift({ actual: b[j - 1], status: "extra" }); j -= 1; }
  }
  return aligned;
}

export function assessSpeech(input: { expected: string; transcript: string; language: string; confidence: number; durationMs: number; targetSeconds: number; energyVariation: number }): SpeechAssessment {
  const diff = alignSpeech(input.expected, input.transcript, input.language);
  const expectedCount = Math.max(1, speechUnits(input.expected, input.language).length);
  const errors = diff.filter((token) => token.status !== "correct").length;
  const similarity = Math.max(0, 1 - errors / Math.max(expectedCount, speechUnits(input.transcript, input.language).length, 1));
  const completeness = diff.filter((token) => token.status === "correct" || token.status === "substitute").length / expectedCount;
  const durationRatio = input.durationMs / 1000 / Math.max(0.8, input.targetSeconds);
  const tempoFit = Math.max(0, 1 - Math.abs(1 - durationRatio) * 0.72);
  const pronunciation = clamp((similarity * 0.72 + input.confidence * 0.28) * 100);
  const accuracy = clamp((similarity * 0.8 + Math.min(1, completeness) * 0.2) * 100);
  const fluency = clamp((tempoFit * 0.68 + Math.min(1, completeness) * 0.32) * 100);
  const rhythm = clamp((tempoFit * 0.58 + Math.min(1, input.energyVariation * 4.2) * 0.22 + similarity * 0.2) * 100);
  const scores: [number, number, number, number] = [rhythm, pronunciation, fluency, accuracy];
  const weakest = scores.indexOf(Math.min(...scores));
  const feedbacks = ["節奏可以再貼近示範速度，注意語塊之間的停頓。", "黃色詞可能有錯音，請放慢並把關鍵音說完整。", "語速或停頓不夠穩定，試著一口氣完成每個語塊。", "紅色詞有遺漏或多說，請依順序再說一次完整句。"];
  const failure = input.transcript.trim() ? undefined : { code: "no-transcript" as const, title: "沒有取得語音逐字稿", detail: "錄音音量或時間資料已收到，但瀏覽器語音服務沒有回傳文字，因此發音與內容無法可靠評分。", fixes: ["使用最新版 Chrome 或 Edge", "確認網址列的麥克風權限為允許", "靠近麥克風，播放示範結束後再開始說", "避免無痕模式或阻擋語音服務的擴充功能"] };
  return { transcript: input.transcript, scores, matchedPercent: accuracy, feedback: failure ? "完成設定後重新錄製，系統才會顯示逐字分析。" : feedbacks[weakest], diff, failure };
}
