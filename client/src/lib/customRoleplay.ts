/**
 * 風格備忘：手帳拼貼學院 — 使用者自訂劇本資料層。
 * 僅根據使用者明示的核心詞、提示與場景組合五幕，不虛構任何外部知識事實。
 */
import type { KnowledgeItem } from "./gameData";
import type { RoleplayScript } from "./templateData";
import { markLocalDataUpdated } from "./supabase";

export type CustomRoleplay = { script: RoleplayScript; items: KnowledgeItem[]; createdAt: string };

export type RoleplayTemplate = { id: string; name: string; note: string; title: string; scene: string; coreLines: string; label: string };

export const ROLEPLAY_TEMPLATE_LIBRARY: RoleplayTemplate[] = [
  { id: "research", name: "研究室遺失筆記", label: "學術推理", note: "適合定義、理論與研究方法", title: "研究室的遺失筆記", scene: "深夜研究室的白板上留下五張缺角便條，實驗紀錄必須在晨會前復原。", coreLines: "變項｜會影響研究結果、可被觀察或控制的因素\n假設｜在研究前提出、可被檢驗的預測\n樣本｜從母群體抽出、用來研究的一部分對象\n相關｜兩個現象一起變動，但不必然表示因果\n結論｜根據證據整理出的合理判斷" },
  { id: "timeline", name: "校史館時序任務", label: "事件脈絡", note: "適合歷史事件、流程與時間線", title: "校史館的時序密令", scene: "校史館的展櫃被打亂，五件文物必須依照事件脈絡重新說明才能開啟密室。", coreLines: "背景｜事件發生前已存在的條件與脈絡\n轉折｜讓情勢開始改變的重要時刻\n決策｜在限制下選擇一個行動方向\n影響｜事件對人、制度或環境造成的後續結果\n反思｜回看事件並找出可帶走的理解" },
  { id: "language", name: "國際交換生求救訊", label: "語言任務", note: "適合單字、片語與表達練習", title: "交換生的求救訊", scene: "深夜校園收到五封不同語言的求救訊，你必須用正確詞義回覆並協助對方找到集合點。", coreLines: "clarify｜把模糊的內容說得更清楚\nreliable｜值得信賴且能持續依靠的\nnegotiate｜透過討論協調出雙方可接受的安排\nconsequence｜一個行動或事件後產生的結果\nperspective｜看待事情的角度或立場" },
];

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

export type RoleplayExportBundle = { version: 1; type: "memodesk-custom-roleplay"; exportedAt: string; entry: CustomRoleplay };

export function serializeCustomRoleplay(entry: CustomRoleplay): string {
  const bundle: RoleplayExportBundle = { version: 1, type: "memodesk-custom-roleplay", exportedAt: new Date().toISOString(), entry };
  return JSON.stringify(bundle, null, 2);
}

function isRoleplayScript(value: unknown): value is RoleplayScript {
  if (!value || typeof value !== "object") return false;
  const script = value as Partial<RoleplayScript>;
  return typeof script.name === "string" && typeof script.emoji === "string" && typeof script.setting === "string" && typeof script.mission === "string" && typeof script.role === "string" && typeof script.stampLabel === "string" && Array.isArray(script.scenes) && script.scenes.length === 5 && script.scenes.every((scene) => Boolean(scene?.title && scene?.setting && scene?.objective && scene?.sentenceLead));
}

function isKnowledgeItems(value: unknown): value is KnowledgeItem[] {
  return Array.isArray(value) && value.length === 5 && value.every((item) => Boolean(item?.term && item?.hint));
}

/** 將分享檔還原為新案卷；重新給予 ID，故絕不覆寫讀者既有劇本。 */
export function parseImportedCustomRoleplay(raw: string): CustomRoleplay {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("這不是有效的 JSON 劇本檔。 "); }
  if (!parsed || typeof parsed !== "object") throw new Error("劇本檔格式不完整。 ");
  const bundle = parsed as Partial<RoleplayExportBundle>;
  if (bundle.version !== 1 || bundle.type !== "memodesk-custom-roleplay" || !bundle.entry || !isRoleplayScript(bundle.entry.script) || !isKnowledgeItems(bundle.entry.items)) throw new Error("這份檔案不是 MemoDesk 可匯入的五幕劇本。 ");
  const importedAt = Date.now();
  const script: RoleplayScript = { ...bundle.entry.script, id: `custom-${importedAt}`, name: `${bundle.entry.script.name.slice(0, 23)}（好友案卷）`, stampLabel: bundle.entry.script.stampLabel || "好友挑戰章" };
  const items = bundle.entry.items.map((item, index) => ({ ...item, id: `custom-import-${importedAt}-${index}`, term: item.term.slice(0, 80), hint: item.hint.slice(0, 240), extra: item.extra?.slice(0, 180) }));
  return { script, items, createdAt: new Date().toISOString() };
}
