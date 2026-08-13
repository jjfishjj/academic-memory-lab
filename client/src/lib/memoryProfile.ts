export type VarkType = "visual" | "auditory" | "readWrite" | "kinesthetic";
export type TalentType = "visualBuilder" | "soundMimic" | "textOrganizer" | "actionContext" | "socialOutput" | "systemAccumulator" | "creativeConnector" | "businessApplier";

export interface MemoryProfile { vark: VarkType; primaryTalent: TalentType; secondaryTalent: TalentType; updatedAt: string }

export const VARK_OPTIONS: Array<{ id: VarkType; name: string; icon: string; hint: string }> = [
  { id: "visual", name: "視覺", icon: "🖼️", hint: "先看路線、顏色和空間" },
  { id: "auditory", name: "聽覺", icon: "🎧", hint: "先聽報站與節奏" },
  { id: "readWrite", name: "讀寫", icon: "📚", hint: "先看站碼規則與文字" },
  { id: "kinesthetic", name: "動覺", icon: "🎬", hint: "先用手勢和操作排列" },
];

export const TALENT_OPTIONS: Array<{ id: TalentType; name: string; icon: string; hint: string }> = [
  { id: "visualBuilder", name: "圖像建構者", icon: "🖼️", hint: "畫面、空間、顏色" },
  { id: "soundMimic", name: "聲音模仿者", icon: "🎧", hint: "語音、節奏、語調" },
  { id: "textOrganizer", name: "文字整理者", icon: "📚", hint: "筆記、定義、分類" },
  { id: "actionContext", name: "情境行動者", icon: "🎬", hint: "操作、任務、角色扮演" },
  { id: "socialOutput", name: "社交輸出者", icon: "🤝", hint: "分享、教人、互動" },
  { id: "systemAccumulator", name: "系統累積者", icon: "📈", hint: "規律、數據、複習節奏" },
  { id: "creativeConnector", name: "創意連結者", icon: "🧠", hint: "比喻、故事、聯想" },
  { id: "businessApplier", name: "目標應用者", icon: "💼", hint: "目標、成果、限時任務" },
];

const KEY = "memodesk-memory-profile-v1";
export function loadMemoryProfile(): MemoryProfile | null { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function saveMemoryProfile(profile: Omit<MemoryProfile, "updatedAt">): MemoryProfile { const next = { ...profile, updatedAt: new Date().toISOString() }; try { localStorage.setItem(KEY, JSON.stringify(next)); localStorage.setItem("memodesk-local-updated-at", next.updatedAt); } catch { /* ignore */ } return next; }

export function flipHint(profile: MemoryProfile | null, stationName: string, stationCode: string): string {
  if (!profile) return "看清楚站碼與站名的配對";
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic") return `唸三拍：${stationCode}・${stationName}・下一站`;
  if (profile.vark === "readWrite" || profile.primaryTalent === "textOrganizer") return `寫成雙欄：${stationCode} = ${stationName}`;
  if (profile.vark === "kinesthetic" || profile.primaryTalent === "actionContext") return `手指沿線移動，停在 ${stationName}`;
  if (profile.primaryTalent === "creativeConnector") return `把「${stationName}」想成一個誇張畫面`;
  return `把 ${stationCode} 當成線色門牌，貼上「${stationName}」`;
}
