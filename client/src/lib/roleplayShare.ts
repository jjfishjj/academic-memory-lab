/**
 * 風格備忘：手帳拼貼學院 — 劇本章戳的無後端分享工具。
 * 分享卡只呈現玩家已完成的真實章戳；挑戰連結使用 URL 內的可驗證資料，
 * 收件人可選擇保存成自己的本機案卷，絕不會直接覆寫其既有劇本。
 */
import type { KnowledgeItem } from "./gameData";
import type { RoleplayStamp } from "./roleplayStamps";
import { STAMP_RARITY_META, getStampRarity } from "./roleplayStamps";
import type { RoleplayScript } from "./templateData";

export type RoleplayChallengePayload = {
  version: 1;
  type: "memodesk-roleplay-challenge";
  sentAt: string;
  script: RoleplayScript;
  items: Pick<KnowledgeItem, "id" | "term" | "hint" | "extra">[];
};

export type ShareCardResult = "shared" | "downloaded" | "cancelled";

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("無法建立章戳分享卡")), "image/png"));
}

function drawWrapped(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, limit = 2) {
  const lines: string[] = [];
  let current = "";
  for (const character of Array.from(text)) {
    if (context.measureText(current + character).width > width && current) { lines.push(current); current = character; }
    else current += character;
  }
  if (current) lines.push(current);
  lines.slice(0, limit).forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

export async function shareRoleplayStampCard(stamp: RoleplayStamp): Promise<ShareCardResult> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("無法建立章戳分享卡");

  const rarity = getStampRarity(stamp);
  const meta = STAMP_RARITY_META[rarity];
  const rarityColor = { common: "#78716c", rare: "#0f766e", epic: "#db2777", legendary: "#d97706" }[rarity];
  context.fillStyle = "#faf6ee"; context.fillRect(0, 0, 1080, 1350);
  context.fillStyle = "#0f766e"; context.fillRect(0, 0, 1080, 26);
  context.fillStyle = "#efe2c8"; context.fillRect(68, 80, 944, 1134);
  context.save(); context.translate(84, 92); context.rotate(-0.018); context.fillStyle = "#fffdf8"; context.fillRect(0, 0, 912, 1112); context.restore();
  context.fillStyle = "#fde68a"; context.fillRect(746, 130, 210, 74);
  context.fillStyle = "#563112"; context.font = "700 32px sans-serif"; context.fillText("記憶手帳社 MemoDesk", 120, 160);
  context.font = "26px sans-serif"; context.fillStyle = "#0f766e"; context.fillText("SCENARIO STAMP · 結案成就卡", 120, 210);
  context.fillStyle = rarityColor; context.font = "800 38px sans-serif"; context.fillText(meta.label.toUpperCase(), 774, 178);
  context.save(); context.translate(540, 470); context.rotate(-0.08); context.fillStyle = rarityColor; context.beginPath(); context.arc(0, 0, 185, 0, Math.PI * 2); context.fill(); context.strokeStyle = "#fffaf0"; context.lineWidth = 16; context.stroke(); context.fillStyle = "#fffaf0"; context.textAlign = "center"; context.font = "150px sans-serif"; context.fillText(stamp.emoji, 0, 48); context.font = "800 28px sans-serif"; context.fillText("MEMODESK CASE CLOSED", 0, 116); context.restore();
  context.textAlign = "left"; context.fillStyle = "#382f28"; context.font = "800 52px sans-serif"; drawWrapped(context, stamp.scriptName, 140, 760, 800, 64, 2);
  context.font = "700 28px sans-serif"; context.fillStyle = rarityColor; context.fillText(`${stamp.label} · ${meta.label}章`, 140, 905);
  context.fillStyle = "#6b5c4f"; context.font = "30px sans-serif"; drawWrapped(context, stamp.condition ?? meta.description, 140, 970, 760, 44, 2);
  context.fillStyle = "#fbcfe8"; context.fillRect(140, 1080, 800, 72); context.fillStyle = "#831843"; context.font = "700 27px sans-serif"; context.fillText(`完成表現：${stamp.score}% 回想 · 連擊 ×${stamp.bestCombo ?? 0} · ${stamp.hintCount ?? 0} 次提示`, 170, 1127);
  context.fillStyle = "#6b5c4f"; context.font = "24px sans-serif"; context.fillText(`已收進手帳 · ${new Date(stamp.collectedAt).toLocaleDateString("zh-TW")}`, 140, 1260); context.fillText("把五個核心詞演成故事，讓記憶留下印記。", 140, 1305);

  const blob = await canvasToBlob(canvas);
  const filename = `memodesk-stamp-${stamp.scriptId}-${new Date().toISOString().slice(0, 10)}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title: `MemoDesk 章戳：${stamp.label}`, text: `我收下了「${stamp.scriptName}」的${meta.label}章！`, files: [file] }); return "shared"; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return "cancelled"; }
  }
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.rel = "noopener"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return "downloaded";
}

function encodePayload(payload: RoleplayChallengePayload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodePayload(encoded: string) {
  const padded = encoded.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
  return JSON.parse(decodeURIComponent(escape(atob(padded)))) as unknown;
}

export function buildRoleplayChallengeLink(script: RoleplayScript, items: KnowledgeItem[]) {
  const payload: RoleplayChallengePayload = { version: 1, type: "memodesk-roleplay-challenge", sentAt: new Date().toISOString(), script, items: items.slice(0, 5).map(({ id, term, hint, extra }) => ({ id, term, hint, extra })) };
  const base = `${window.location.origin}${import.meta.env.BASE_URL}train/roleplay`;
  return `${base}?challenge=${encodeURIComponent(encodePayload(payload))}`;
}

export function parseRoleplayChallenge(raw: string | null): RoleplayChallengePayload | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const value = decodePayload(raw) as Partial<RoleplayChallengePayload>;
    const scenes = value.script?.scenes;
    const validScenes = Array.isArray(scenes) && scenes.length === 5 && scenes.every((scene) => Boolean(scene?.title && scene?.setting && scene?.objective && scene?.sentenceLead));
    const validItems = Array.isArray(value.items) && value.items.length === 5 && value.items.every((item) => Boolean(item?.id && item?.term && item?.hint));
    if (value.version !== 1 || value.type !== "memodesk-roleplay-challenge" || !value.script?.id || !value.script?.name || !validScenes || !validItems) return null;
    return value as RoleplayChallengePayload;
  } catch { return null; }
}
