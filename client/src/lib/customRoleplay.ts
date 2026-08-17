/**
 * 風格備忘：手帳拼貼學院 — 使用者自訂劇本資料層。
 * 僅根據使用者明示的核心詞、提示與場景組合五幕，不虛構任何外部知識事實。
 */
import type { KnowledgeItem } from "./gameData";
import type { RoleplayScript } from "./templateData";
import { markLocalDataUpdated } from "./supabase";

export type CustomRoleplay = { script: RoleplayScript; items: KnowledgeItem[]; createdAt: string };

const STORAGE_KEY = "memodesk-custom-roleplays-v1";
const SCENE_BEATS = [
  { title: "封存便條出現", objective: "以自己的話解釋第一個核心詞，確認任務的起點", lead: "我先確認，這個詞在本案中代表" },
  { title: "走廊上的交叉線索", objective: "解釋第二個核心詞，讓兩條線索接起來", lead: "把線索放在一起看，這個詞說明" },
  { title: "備忘錄的缺頁", objective: "說清第三個核心詞，補回被遮住的關鍵脈絡", lead: "缺掉的那一頁其實在提醒我們" },
  { title: "窗邊的決策時刻", objective: "解釋第四個核心詞，做出有理由的判斷", lead: "現在應該這樣判斷，因為這個詞是" },
  { title: "手帳社的結案頁", objective: "完整解釋最後一個核心詞，完成你自己的結案陳詞", lead: "我把這份自訂任務結案，因為最後的關鍵是" },
];

export function loadCustomRoleplays(): CustomRoleplay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is CustomRoleplay => Boolean(entry?.script?.id && Array.isArray(entry?.items))) : [];
  } catch { return []; }
}

function parseCoreLines(raw: string): KnowledgeItem[] {
  return raw.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 5).map((line, index) => {
    const [termPart, ...definitionParts] = line.split(/[｜|]/);
    const term = termPart?.trim();
    const hint = definitionParts.join("｜").trim();
    if (!term || !hint) throw new Error(`第 ${index + 1} 行請以「核心詞｜一句意思」填寫。`);
    return { id: `custom-roleplay-${Date.now()}-${index}`, term, hint, extra: "由你的自訂劇本手帳保存" };
  });
}

export function createCustomRoleplay(input: { scene: string; title?: string; coreLines: string }): CustomRoleplay {
  const scene = input.scene.trim();
  const items = parseCoreLines(input.coreLines);
  if (scene.length < 2) throw new Error("請先寫下至少兩個字的故事場景。 ");
  if (items.length !== 5) throw new Error("自訂劇本需要剛好 5 組核心詞，才能生成完整五幕。 ");
  const id = `custom-${Date.now()}`;
  const title = input.title?.trim() || `${scene.slice(0, 12)}任務檔案`;
  const script: RoleplayScript = {
    id,
    name: title,
    emoji: "📝",
    soundscape: "night",
    stampLabel: "自訂任務章",
    role: "你是親手編排這份任務的知識偵查員",
    setting: `你的專屬場景：${scene}`,
    mission: "五個核心詞由你親自指定——說清每個詞的意思，才能讓自訂劇情一路推進。",
    scenes: SCENE_BEATS.map((beat, index) => ({
      title: beat.title,
      setting: `${scene}。第 ${index + 1} 張便利貼浮出「${items[index].term}」，等著你把它放回正確脈絡。`,
      objective: beat.objective,
      sentenceLead: beat.lead,
    })),
  };
  return { script, items, createdAt: new Date().toISOString() };
}

export function saveCustomRoleplay(entry: CustomRoleplay): CustomRoleplay[] {
  const next = [entry, ...loadCustomRoleplays().filter((saved) => saved.script.id !== entry.script.id)].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  markLocalDataUpdated();
  return next;
}
