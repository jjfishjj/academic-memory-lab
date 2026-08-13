interface ShareCardItem {
  term: string;
  hint: string;
  mnemonic: string;
  rating?: number;
}

export type ShareCardResult = "shared" | "downloaded" | "cancelled";

function wrapLine(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const char of chars) {
    const next = line + char;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("無法建立分享卡圖片"));
    }, "image/png");
  });
}

export async function shareMnemonicCard(items: ShareCardItem[]): Promise<ShareCardResult> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("無法建立分享卡");

  context.fillStyle = "#faf6ee";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0f766e";
  context.fillRect(0, 0, canvas.width, 28);
  context.fillStyle = "#382f28";
  context.font = "700 54px sans-serif";
  context.fillText("記憶手帳社 · 我的口訣卡", 72, 105);
  context.fillStyle = "#0f766e";
  context.font = "32px sans-serif";
  context.fillText("把難記的知識，變成唸得出口的記憶。", 72, 158);

  let y = 220;
  items.slice(0, 5).forEach((item, index) => {
    context.save();
    context.translate(58, y);
    context.rotate((index % 2 ? 0.006 : -0.006));
    context.fillStyle = index % 2 ? "#fbcfe8" : "#fde68a";
    context.fillRect(0, 0, 964, 188);
    context.fillStyle = "#563112";
    context.font = "700 30px sans-serif";
    context.fillText(`${index + 1}. ${item.term} — ${item.hint}`, 28, 48);
    context.font = "700 32px sans-serif";
    const lines = wrapLine(context, `「${item.mnemonic}」`, 895).slice(0, 2);
    lines.forEach((line, lineIndex) => context.fillText(line, 28, 102 + lineIndex * 42));
    if (item.rating) {
      context.font = "24px sans-serif";
      context.fillText(`好記度 ${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}`, 650, 166);
    }
    context.restore();
    y += 208;
  });

  context.fillStyle = "#6b5c4f";
  context.font = "24px sans-serif";
  context.fillText("MemoDesk · jjfishjj.github.io/academic-memory-lab", 72, 1310);

  const filename = `memodesk-mnemonics-${new Date().toISOString().slice(0, 10)}.png`;
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "記憶手帳社 · 我的口訣卡",
        text: "把難記的知識，變成唸得出口的記憶。",
        files: [file],
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // 分享面板失敗時仍保留圖片下載，避免使用者成果遺失。
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = objectUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  return "downloaded";
}
