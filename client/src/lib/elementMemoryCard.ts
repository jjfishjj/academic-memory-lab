import { CATEGORY_STYLE, type ElementCategory, type ElementItem } from "./elementData";
import { getElementMemoryScene, type ElementMemoryScene } from "./elementMemoryScenes";
import type { ElementMemoryTip } from "./elementMemoryTips";

export interface ElementMemoryCardContext {
  learnerName: string;
  routeLabel: string;
  quizScore: number;
  quizTotal: number;
}

export interface ElementMemoryCardTheme {
  background: string;
  accent: string;
  accentDark: string;
  soft: string;
}

const CARD_THEMES: Record<ElementCategory, ElementMemoryCardTheme> = {
  alkali: { background: "#fff4f1", accent: "#e76f51", accentDark: "#8f3522", soft: "#ffd9cf" },
  alkaline: { background: "#fff8eb", accent: "#e99a35", accentDark: "#8b5315", soft: "#ffe5b5" },
  transition: { background: "#fff9e8", accent: "#c99022", accentDark: "#76520f", soft: "#f8dfa1" },
  post: { background: "#f4f7fa", accent: "#607d8b", accentDark: "#344a54", soft: "#dbe5ea" },
  metalloid: { background: "#f6fae9", accent: "#7d9b37", accentDark: "#40551a", soft: "#deebaf" },
  nonmetal: { background: "#eefaf4", accent: "#248b67", accentDark: "#14543e", soft: "#c9eedf" },
  halogen: { background: "#edfafa", accent: "#178f9a", accentDark: "#0d535a", soft: "#c6eef0" },
  noble: { background: "#f7f1ff", accent: "#8065b7", accentDark: "#49346f", soft: "#e3d7fa" },
  lanthanide: { background: "#fff1f7", accent: "#bc5d86", accentDark: "#70344f", soft: "#f5cfe0" },
  actinide: { background: "#fbf0fb", accent: "#9854a0", accentDark: "#5d2e63", soft: "#ebcdeb" },
};

export function elementMemoryCardTheme(element: ElementItem) {
  return CARD_THEMES[element.category];
}

export function elementMemoryIllustration(tip: ElementMemoryTip) {
  return tip.image.trim().split(/\s+/)[0] || "⚛️";
}

export function elementMemoryCardFilename(element: ElementItem) {
  return `memodesk-element-${String(element.number).padStart(2, "0")}-${element.symbol}.png`;
}

export function elementMemoryCardMetadata(context: ElementMemoryCardContext) {
  const learnerName = context.learnerName.trim().slice(0, 30) || "記憶手帳學員";
  const routeLabel = context.routeLabel.trim().slice(0, 40) || "自由探索";
  const quizTotal = Math.max(0, Math.floor(context.quizTotal));
  const quizScore = Math.min(Math.max(0, Math.floor(context.quizScore)), quizTotal);
  return {
    learnerName,
    routeLabel,
    quizLabel: quizTotal > 0 ? `最佳測驗 ${quizScore} / ${quizTotal}` : "尚未進行路線測驗",
  };
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = "";
  chars.forEach(char => {
    const candidate = line + char;
    if (context.measureText(candidate).width > maxWidth && line) { lines.push(line); line = char; } else line = candidate;
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((entry, index) => context.fillText(entry, x, y + index * lineHeight));
}

function drawSceneBackdrop(context: CanvasRenderingContext2D, scene: ElementMemoryScene, theme: ElementMemoryCardTheme) {
  const gradient = context.createLinearGradient(60, 215, 360, 400);
  gradient.addColorStop(0, theme.soft);
  gradient.addColorStop(1, theme.background);
  context.fillStyle = gradient;
  roundedRect(context, 60, 215, 300, 185, 38);
  context.save();
  context.beginPath();
  context.roundRect(60, 215, 300, 185, 38);
  context.clip();
  context.globalAlpha = .24;
  context.fillStyle = theme.accent;
  if (scene.backdrop === "sky" || scene.backdrop === "space") {
    for (let index = 0; index < 9; index += 1) context.fillRect(85 + (index * 53) % 250, 238 + (index * 31) % 95, scene.backdrop === "space" ? 5 : 18, scene.backdrop === "space" ? 5 : 7);
  } else if (scene.backdrop === "city" || scene.backdrop === "factory") {
    [72, 118, 170, 225, 278, 322].forEach((x, index) => context.fillRect(x, 310 - (index % 3) * 26, 32, 90 + (index % 3) * 26));
  } else if (scene.backdrop === "nature") {
    context.beginPath(); context.arc(105, 260, 32, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(60, 360); context.quadraticCurveTo(155, 285, 235, 360); context.quadraticCurveTo(300, 310, 360, 355); context.lineTo(360, 400); context.lineTo(60, 400); context.fill();
  } else if (scene.backdrop === "water") {
    for (let index = 0; index < 5; index += 1) { context.beginPath(); context.arc(92 + index * 57, 250 + (index % 2) * 32, 8 + index, 0, Math.PI * 2); context.strokeStyle = theme.accent; context.stroke(); }
    context.fillRect(60, 345, 300, 55);
  } else if (scene.backdrop === "clinic" || scene.backdrop === "lab") {
    context.fillRect(90, 250, 240, 118);
    context.clearRect(113, 274, 194, 70);
    context.fillRect(196, 248, 28, 122);
  } else {
    context.beginPath(); context.ellipse(210, 365, 132, 28, 0, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

function drawElementIllustration(context: CanvasRenderingContext2D, element: ElementItem, tip: ElementMemoryTip, theme: ElementMemoryCardTheme) {
  const scene = getElementMemoryScene(element.number) ?? { backdrop: "stage", actors: [elementMemoryIllustration(tip), "⚛️", "✨"], action: tip.image };
  context.save();
  drawSceneBackdrop(context, scene, theme);
  context.strokeStyle = theme.accent;
  context.lineWidth = 5;
  context.strokeRect(78, 231, 264, 151);
  context.font = "76px Apple Color Emoji, sans-serif";
  context.textAlign = "center";
  context.fillText(scene.actors[0], 205, 332);
  context.font = "43px Apple Color Emoji, sans-serif";
  context.fillText(scene.actors[1], 112, 283);
  context.fillText(scene.actors[2], 306, 278);
  context.fillStyle = "rgba(255,255,255,.88)";
  roundedRect(context, 86, 345, 248, 35, 17);
  context.fillStyle = theme.accentDark;
  context.font = "800 17px sans-serif";
  context.fillText(scene.action, 210, 369);
  context.textAlign = "left";
  context.restore();
}

export function renderElementMemoryCard(element: ElementItem, tip: ElementMemoryTip, cardContext: ElementMemoryCardContext) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法建立圖像卡");

  const theme = elementMemoryCardTheme(element);
  context.fillStyle = theme.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = theme.accent;
  context.fillRect(0, 0, canvas.width, 180);
  context.fillStyle = "#ffffff";
  context.font = "700 38px sans-serif";
  context.fillText("記憶手帳社 · 元素圖像卡", 70, 82);
  context.font = "28px sans-serif";
  context.fillText("諧音 × 圖像 × 用途 × 易混淆", 70, 132);

  drawElementIllustration(context, element, tip, theme);
  context.fillStyle = "#3f3028";
  context.font = "800 56px sans-serif";
  context.fillText(`${element.number} · ${element.nameZh}`, 410, 285);
  context.font = "32px sans-serif";
  context.fillStyle = "#79665b";
  context.fillText(element.nameEn, 410, 335);
  context.fillStyle = theme.soft;
  roundedRect(context, 410, 355, 220, 42, 21);
  context.fillStyle = theme.accentDark;
  context.font = "700 22px sans-serif";
  context.fillText(CATEGORY_STYLE[element.category].label, 435, 384);

  const metadata = elementMemoryCardMetadata(cardContext);
  context.fillStyle = theme.soft;
  roundedRect(context, 60, 410, 960, 78, 22);
  context.fillStyle = theme.accentDark;
  context.font = "700 22px sans-serif";
  context.fillText(`學員｜${metadata.learnerName}`, 90, 445);
  context.font = "21px sans-serif";
  context.fillText(`路線｜${metadata.routeLabel}`, 90, 474);
  context.font = "700 22px sans-serif";
  context.textAlign = "right";
  context.fillText(metadata.quizLabel, 990, 458);
  context.textAlign = "left";

  const cards = [
    { title: "✨ 諧音口訣", text: tip.rhyme, color: "#fff1a8" },
    { title: "🖼 腦中圖像", text: tip.image, color: "#dff3ff" },
    { title: "🧪 實際用途", text: tip.use, color: "#def5df" },
    { title: "⚠ 易混淆提醒", text: tip.confusion, color: "#ffe0df" },
  ];
  cards.forEach((card, index) => {
    const y = 515 + index * 185;
    context.fillStyle = card.color;
    roundedRect(context, 60, y, 960, 155, 28);
    context.fillStyle = "#47382f";
    context.font = "800 30px sans-serif";
    context.fillText(card.title, 95, y + 46);
    context.font = "27px sans-serif";
    drawWrappedText(context, card.text, 95, y + 86, 880, 34, 2);
  });
  context.fillStyle = theme.accentDark;
  context.font = "700 24px sans-serif";
  context.fillText("MemoDesk · 把元素貼進腦海裡", 70, 1300);

  return canvas;
}

export function elementMemoryCardBlob(element: ElementItem, tip: ElementMemoryTip, cardContext: ElementMemoryCardContext) {
  const canvas = renderElementMemoryCard(element, tip, cardContext);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("圖像卡輸出失敗")), "image/png"));
}

export async function downloadElementMemoryCard(element: ElementItem, tip: ElementMemoryTip, cardContext: ElementMemoryCardContext) {
  const blob = await elementMemoryCardBlob(element, tip, cardContext);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = elementMemoryCardFilename(element);
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
