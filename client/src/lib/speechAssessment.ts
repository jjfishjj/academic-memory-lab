export type SpeechAssessment = {
  transcript: string;
  scores: [number, number, number, number];
  matchedPercent: number;
  feedback: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalize(text: string) {
  return text.toLocaleLowerCase().replace(/[\s.,!?;:'"，。！？、；：「」『』（）-]/g, "");
}

function units(text: string, language: string) {
  if (language === "English") return text.toLocaleLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
  return Array.from(normalize(text));
}

function editDistance(a: string[], b: string[]) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous + 1, row[j] + 1, row[j - 1] + 1);
      previous = current;
    }
  }
  return row[b.length];
}

export function assessSpeech(input: { expected: string; transcript: string; language: string; confidence: number; durationMs: number; targetSeconds: number; energyVariation: number }): SpeechAssessment {
  const expectedUnits = units(input.expected, input.language);
  const actualUnits = units(input.transcript, input.language);
  const maxLength = Math.max(expectedUnits.length, actualUnits.length, 1);
  const similarity = 1 - editDistance(expectedUnits, actualUnits) / maxLength;
  const completeness = Math.min(1, actualUnits.length / Math.max(1, expectedUnits.length));
  const durationRatio = input.durationMs / 1000 / Math.max(0.8, input.targetSeconds);
  const tempoFit = Math.max(0, 1 - Math.abs(1 - durationRatio) * 0.72);
  const pronunciation = clamp((similarity * 0.72 + input.confidence * 0.28) * 100);
  const accuracy = clamp((similarity * 0.8 + completeness * 0.2) * 100);
  const fluency = clamp((tempoFit * 0.68 + completeness * 0.32) * 100);
  const rhythm = clamp((tempoFit * 0.58 + Math.min(1, input.energyVariation * 4.2) * 0.22 + similarity * 0.2) * 100);
  const scores: [number, number, number, number] = [rhythm, pronunciation, fluency, accuracy];
  const weakest = scores.indexOf(Math.min(...scores));
  const feedbacks = ["節奏可以再貼近示範速度，注意三個語塊的停頓。", "有些音被辨識成其他詞，請放慢並把關鍵音說完整。", "語速或停頓不夠穩定，試著一口氣完成每個語塊。", "句子有遺漏或順序不同，遮稿前再聽一次完整句。"];
  return { transcript: input.transcript, scores, matchedPercent: accuracy, feedback: feedbacks[weakest] };
}
