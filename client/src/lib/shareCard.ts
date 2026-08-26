interface ShareCardItem {
  itemId?: string;
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
  const profileName = localStorage.getItem("memodesk-mnemonic-profile-name")?.trim() || "記憶旅人";
  const labels: Record<string, string> = { e: "英文", h: "歷史", c: "化學", b: "生物", g: "地理" };
  const counts = items.reduce<Record<string, number>>((result, item) => { const label = labels[item.itemId?.charAt(0) ?? ""] ?? "自訂"; result[label] = (result[label] ?? 0) + 1; return result; }, {});
  const subjectSummary = Object.entries(counts).map(([label, count]) => `${label} ${count}`).join(" · ");
  context.fillText(`${profileName} · 我的口訣卡`, 72, 105);
  context.fillStyle = "#0f766e";
  context.font = "32px sans-serif";
  context.fillText(subjectSummary || "把難記的知識，變成唸得出口的記憶。", 72, 158);

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

export async function shareStreakBadge(badge: { emoji: string; name: string; days: number }, streak: number): Promise<ShareCardResult> {
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080;
  const context = canvas.getContext("2d"); if (!context) throw new Error("無法建立勳章分享卡");
  const gradient = context.createLinearGradient(0, 0, 1080, 1080); gradient.addColorStop(0, "#fff7ed"); gradient.addColorStop(1, "#fde68a");
  context.fillStyle = gradient; context.fillRect(0, 0, 1080, 1080);
  context.strokeStyle = "#ea580c"; context.lineWidth = 18; context.strokeRect(38, 38, 1004, 1004);
  context.textAlign = "center"; context.fillStyle = "#7c2d12";
  context.font = "160px sans-serif"; context.fillText(badge.emoji, 540, 350);
  context.font = "700 68px sans-serif"; context.fillText("記憶手帳社 · 勳章解鎖", 540, 480);
  context.font = "700 86px sans-serif"; context.fillText(badge.name, 540, 615);
  context.font = "700 52px sans-serif"; context.fillText(`連續完成 ${streak} 天弱項訓練`, 540, 730);
  context.font = "32px sans-serif"; context.fillText("每天攻克一點，記憶就多長一點。", 540, 815);
  context.font = "26px sans-serif"; context.fillText("MemoDesk · Academic Memory Lab", 540, 975);
  const blob = await canvasToBlob(canvas);
  const filename = `memodesk-badge-${badge.days}-days.png`;
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title: `勳章解鎖：${badge.name}`, text: `我已連續完成 ${streak} 天弱項訓練！`, files: [file] }); return "shared"; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return "cancelled"; }
  }
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.download = filename; link.href = url; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000); return "downloaded";
}
