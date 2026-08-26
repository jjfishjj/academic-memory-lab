import { alignSpeech, type SpeechAssessment } from "./speechAssessment";

export type PhonemeScore = { phoneme: string; score: number };
export type WordPronunciation = { word: string; score: number; errorType?: string; phonemes: PhonemeScore[] };
export type ProfessionalAssessment = {
  provider: "azure";
  transcript: string;
  pronunciation: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody?: number;
  words: WordPronunciation[];
};

const API_URL = (import.meta.env.VITE_PRONUNCIATION_API_URL as string | undefined)?.trim();

export async function requestProfessionalAssessment(input: { audio: Blob; expected: string; locale: string }): Promise<ProfessionalAssessment | null> {
  if (!API_URL || !input.audio.size) return null;
  const body = new FormData();
  body.append("audio", input.audio, "shadow-echo.wav");
  body.append("referenceText", input.expected);
  body.append("locale", input.locale);
  const response = await fetch(API_URL, { method: "POST", body });
  if (!response.ok) throw new Error(`pronunciation-service-${response.status}`);
  return response.json() as Promise<ProfessionalAssessment>;
}

export function mergeProfessionalAssessment(local: SpeechAssessment, remote: ProfessionalAssessment, expected?: string, language = "English"): SpeechAssessment {
  const rhythm = remote.prosody ?? local.scores[0];
  return {
    ...local,
    transcript: remote.transcript || local.transcript,
    diff: expected ? alignSpeech(expected, remote.transcript || local.transcript, language) : local.diff,
    scores: [Math.round(rhythm), Math.round(remote.pronunciation), Math.round(remote.fluency), Math.round(remote.accuracy)],
    matchedPercent: Math.round(remote.completeness),
    feedback: remote.words.some((word) => word.score < 60)
      ? "音素分析已完成。請優先重練下方低於 60 分的發音。"
      : "音素、重音與語調都很穩定，可以進入下一句。",
    provider: "azure",
    phonemeWords: remote.words,
    failure: undefined,
  };
}

export async function audioBlobToWav(blob: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const rate = 16_000;
    const length = Math.ceil(decoded.duration * rate);
    const offline = new OfflineAudioContext(1, length, rate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const write = (offset: number, value: string) => Array.from(value).forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); write(8, "WAVE"); write(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, index) => view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 0x8000 : 0x7fff), true));
    return new Blob([buffer], { type: "audio/wav" });
  } finally { void context.close(); }
}
