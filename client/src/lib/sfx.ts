/**
 * 手帳拼貼學院 · 輕量音效引擎
 * 全部用 WebAudio 即時合成，不引入任何音檔（避免部署體積與 404 風險）。
 * 音色設計：短、乾、木質感 —— 像翻紙、蓋章、鉛筆敲桌，不用電子遊戲的尖銳音。
 * 使用者偏好存在 localStorage("memodesk.sfx")，預設開啟；尊重 prefers-reduced-motion 的使用者仍可自行關閉。
 */

const STORAGE_KEY = "memodesk.sfx";

let ctx: AudioContext | null = null;
let enabled = true;
const listeners = new Set<(on: boolean) => void>();

if (typeof window !== "undefined") {
  enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // 瀏覽器自動播放政策：首次使用者手勢後才會 running，這裡補一次 resume。
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isSfxOn() {
  return enabled;
}

export function setSfxOn(on: boolean) {
  enabled = on;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  listeners.forEach((fn) => fn(on));
}

export function toggleSfx() {
  setSfxOn(!enabled);
  if (enabled) tone({ freq: 660, dur: 0.09, type: "triangle", gain: 0.16 });
  return enabled;
}

export function subscribeSfx(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

interface ToneOptions {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  /** 終止頻率，用於滑音（例如答錯的下滑、連擊的上揚） */
  slideTo?: number;
}

/** 單顆音：ADSR 收得很快，避免疊出嗡嗡的殘響。 */
function tone({ freq, dur, type = "sine", gain = 0.2, delay = 0, slideTo }: ToneOptions) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + dur);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** 白噪音短爆點：用來做紙張摩擦與印章的「砰」。 */
function noise({ dur, gain = 0.12, delay = 0, hp = 900 }: { dur: number; gain?: number; delay?: number; hp?: number }) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(start);
}

export type SfxName =
  | "pick"      // 挑選劇本 / 卡包
  | "hint"      // 打開提示
  | "reveal"    // 翻開真相
  | "correct"   // 答對
  | "miss"      // 想不起來
  | "combo"     // 連擊達 2 以上時追加
  | "unlock"    // 過場：解鎖下一幕
  | "stamp"     // 結算蓋章
  | "type";     // 輸入達門檻的細微確認

/** 播放具名音效；未開啟或環境不支援時靜默略過。 */
export function playSfx(name: SfxName, combo = 0) {
  if (!enabled) return;
  switch (name) {
    case "pick":
      noise({ dur: 0.13, gain: 0.07, hp: 1600 });
      tone({ freq: 523.25, dur: 0.1, type: "triangle", gain: 0.14 });
      break;
    case "hint":
      tone({ freq: 880, dur: 0.09, type: "sine", gain: 0.12 });
      tone({ freq: 1174.66, dur: 0.11, type: "sine", gain: 0.09, delay: 0.06 });
      break;
    case "reveal":
      noise({ dur: 0.22, gain: 0.06, hp: 700 });
      tone({ freq: 392, dur: 0.16, type: "triangle", gain: 0.13, slideTo: 587.33 });
      break;
    case "correct":
      // 大三和弦琶音，短促明亮但不刺耳
      tone({ freq: 523.25, dur: 0.11, type: "triangle", gain: 0.16 });
      tone({ freq: 659.25, dur: 0.12, type: "triangle", gain: 0.14, delay: 0.055 });
      tone({ freq: 783.99, dur: 0.16, type: "triangle", gain: 0.13, delay: 0.11 });
      break;
    case "miss":
      tone({ freq: 330, dur: 0.2, type: "sine", gain: 0.14, slideTo: 196 });
      noise({ dur: 0.1, gain: 0.05, hp: 500 });
      break;
    case "combo": {
      // 連擊越高、疊得越高，最多到第 5 階避免刺耳
      const step = Math.min(5, Math.max(2, combo));
      tone({ freq: 659.25 * Math.pow(1.0595, (step - 2) * 3), dur: 0.13, type: "square", gain: 0.07, delay: 0.16 });
      tone({ freq: 987.77 * Math.pow(1.0595, (step - 2) * 2), dur: 0.14, type: "triangle", gain: 0.08, delay: 0.22 });
      break;
    }
    case "unlock":
      tone({ freq: 440, dur: 0.14, type: "triangle", gain: 0.13 });
      tone({ freq: 587.33, dur: 0.14, type: "triangle", gain: 0.12, delay: 0.09 });
      tone({ freq: 880, dur: 0.22, type: "sine", gain: 0.1, delay: 0.18 });
      noise({ dur: 0.18, gain: 0.05, hp: 1200, delay: 0.02 });
      break;
    case "stamp":
      // 蓋章：一記悶響 + 木頭觸底
      noise({ dur: 0.09, gain: 0.2, hp: 260 });
      tone({ freq: 150, dur: 0.16, type: "sine", gain: 0.22, slideTo: 80 });
      tone({ freq: 523.25, dur: 0.3, type: "triangle", gain: 0.1, delay: 0.14 });
      tone({ freq: 783.99, dur: 0.34, type: "triangle", gain: 0.09, delay: 0.22 });
      break;
    case "type":
      noise({ dur: 0.05, gain: 0.045, hp: 2200 });
      break;
  }
}
