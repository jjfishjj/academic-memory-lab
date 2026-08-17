/**
 * 風格備忘：夜自習語音手帳 — Shadow Echo 真實跨週週記 PDF。
 * 不仰賴伺服器或外部檔案；先以 Canvas 排版，再以單頁 JPEG 嵌入標準 PDF。
 */
import type { TrainingSession, UnifiedReport } from "./unifiedStats";

const PAGE = { width: 1240, height: 1754 };
const PDF_PAGE = { width: 595, height: 842 };

function wrap(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(text)) {
    const next = line + character;
    if (line && context.measureText(next).width > width) { lines.push(line); line = character; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines = 4) {
  const lines = wrap(context, text, width).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function isoDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function bytesFromString(value: string) { return new TextEncoder().encode(value); }
function joinBytes(parts: Uint8Array[]) { const size = parts.reduce((sum, part) => sum + part.length, 0); const result = new Uint8Array(size); let offset = 0; parts.forEach((part) => { result.set(part, offset); offset += part.length; }); return result; }

function jpegToPdf(jpeg: Uint8Array) {
  const objects: Uint8Array[] = [];
  const add = (content: Uint8Array | string) => { objects.push(typeof content === "string" ? bytesFromString(content) : content); };
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  add("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  add("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${PAGE.width} /Height ${PAGE.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg);
  add("\nendstream\nendobj\n");
  const content = "q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n";
  add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
  const header = bytesFromString("%PDF-1.4\n%âãÏÓ\n");
  const positions: number[] = [];
  let offset = header.length;
  objects.forEach((object) => { positions.push(offset); offset += object.length; });
  const xref = `xref\n0 6\n0000000000 65535 f \n${positions.map((position) => `${String(position).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  return new Blob([joinBytes([header, ...objects, bytesFromString(xref)])], { type: "application/pdf" });
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("無法繪製週記 PDF")), "image/jpeg", 0.93));
}

export async function downloadShadowEchoWeeklyPdf(report: UnifiedReport) {
  await document.fonts?.ready;
  const attempts = report.sessions.filter((session) => session.module === "shadow-echo");
  const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / attempts.length) : 0;
  const canvas = document.createElement("canvas");
  canvas.width = PAGE.width; canvas.height = PAGE.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("目前瀏覽器無法建立週記畫布");

  context.fillStyle = "#FAF6EE"; context.fillRect(0, 0, PAGE.width, PAGE.height);
  context.fillStyle = "#0F766E"; context.fillRect(0, 0, PAGE.width, 34);
  context.strokeStyle = "#d7c7ad"; context.lineWidth = 2;
  for (let x = 72; x < PAGE.width; x += 56) for (let y = 84; y < PAGE.height; y += 56) { context.beginPath(); context.arc(x, y, 1.1, 0, Math.PI * 2); context.stroke(); }
  context.fillStyle = "#FDE68A"; context.save(); context.translate(89, 86); context.rotate(-0.055); context.fillRect(0, 0, 330, 49); context.restore();
  context.fillStyle = "#674c1c"; context.font = "700 22px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("MemoDesk · 夜自習語音手帳", 110, 118);
  context.fillStyle = "#17443d"; context.font = "900 54px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("Shadow Echo 跨週週記", 82, 205);
  context.fillStyle = "#8b6b5c"; context.font = "400 24px 'Noto Sans TC', sans-serif"; context.fillText("只收錄此裝置實際完成的跟讀紀錄 · 下載於 " + isoDate(new Date().toISOString()), 84, 246);

  const sticky = (x: number, color: string, number: string, label: string) => { context.fillStyle = color; context.fillRect(x, 300, 320, 166); context.fillStyle = "#21453f"; context.font = "900 50px 'M PLUS Rounded 1c', sans-serif"; context.fillText(number, x + 27, 373); context.font = "700 21px 'Noto Sans TC', sans-serif"; context.fillText(label, x + 27, 421); context.fillStyle = "#ffffffaa"; context.fillRect(x + 220, 286, 78, 24); };
  sticky(84, "#FDE68A", String(attempts.length), "次真實跟讀完成"); sticky(460, "#FBCFE8", attempts.length ? `${average}%` : "—", "平均音準與節奏評分"); sticky(836, "#D6F0E8", `${attempts.filter((attempt) => new Date(attempt.at) >= new Date(Date.now() - 7 * 86400000)).length}`, "本週跟讀章");

  context.fillStyle = "#fffdf7"; context.fillRect(84, 526, 1072, 370); context.strokeStyle = "#dfcbae"; context.strokeRect(84, 526, 1072, 370);
  context.fillStyle = "#0F766E"; context.font = "900 28px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("最近六週 · 跟讀節奏", 116, 575);
  const today = new Date(); const weeks = Array.from({ length: 6 }, (_, index) => { const end = new Date(today); end.setDate(today.getDate() - (5 - index) * 7); const start = new Date(end); start.setDate(end.getDate() - 6); const count = attempts.filter((attempt) => new Date(attempt.at) >= start && new Date(attempt.at) <= end).length; return { start, count }; });
  const max = Math.max(1, ...weeks.map((week) => week.count));
  weeks.forEach((week, index) => { const x = 160 + index * 158; const height = Math.max(10, (week.count / max) * 190); context.fillStyle = "#0F766E"; context.fillRect(x, 800 - height, 64, height); context.fillStyle = "#E7BD54"; context.fillRect(x + 10, 800 - height - 9, 44, 9); context.fillStyle = "#0F766E"; context.font = "900 19px 'M PLUS Rounded 1c', sans-serif"; context.fillText(String(week.count), x + 24, 826 - height); context.fillStyle = "#7c6b5d"; context.font = "700 16px 'Noto Sans TC', sans-serif"; context.fillText(`${week.start.getMonth() + 1}/${week.start.getDate()}`, x - 5, 836); });

  context.fillStyle = "#fffdf7"; context.fillRect(84, 938, 1072, 664); context.strokeStyle = "#dfcbae"; context.strokeRect(84, 938, 1072, 664);
  context.fillStyle = "#c76f8a"; context.font = "700 24px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("VOICE PRACTICE ARCHIVE", 118, 986);
  context.fillStyle = "#17443d"; context.font = "900 31px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("跟讀完成章與下一頁提示", 118, 1027);
  let y = 1080;
  if (attempts.length) attempts.slice(0, 5).forEach((attempt: TrainingSession, index) => { context.fillStyle = index % 2 ? "#fff5dc" : "#e8f6f0"; context.fillRect(117, y - 30, 1008, 72); context.fillStyle = "#0F766E"; context.font = "900 19px 'Noto Sans TC', sans-serif"; context.fillText(`${index + 1}. Shadow Echo 跟讀`, 140, y); context.fillStyle = "#75675b"; context.font = "400 17px 'Noto Sans TC', sans-serif"; context.fillText(isoDate(attempt.at), 430, y); context.fillStyle = "#c26f89"; context.font = "900 22px 'M PLUS Rounded 1c', sans-serif"; context.fillText(`${attempt.score ?? "—"}%`, 1035, y); y += 88; });
  else { context.fillStyle = "#75675b"; context.font = "400 22px 'Noto Sans TC', sans-serif"; drawLines(context, "目前還沒有可匯出的 Shadow Echo 跟讀完成紀錄。完成一次朗讀任務後，這一頁會自動生成第一筆真實週記。", 122, y, 950, 34); y += 126; }
  context.fillStyle = "#FDE68A"; context.fillRect(117, y + 10, 1008, 140); context.fillStyle = "#5b4826"; context.font = "900 22px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("下次夜自習的手帳提醒", 142, y + 52); context.font = "400 19px 'Noto Sans TC', sans-serif"; const tip = attempts.length ? `你已留下 ${attempts.length} 次跟讀章。下一次可先聽一句、跟讀一句，再遮稿複述；把分數當作線索，不把它當作評價。` : "第一筆跟讀完成章會從這裡開始；先用一小段音檔建立自己的朗讀節奏。"; drawLines(context, tip, 142, y + 88, 940, 30, 2);
  context.fillStyle = "#0F766E"; context.font = "700 17px 'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"; context.fillText("記憶手帳社 MemoDesk · 僅含本機已保存的 Shadow Echo 練習資料", 84, 1694);

  const jpeg = new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer());
  const blob = jpegToPdf(jpeg);
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `memodesk-shadow-echo-weekly-${new Date().toISOString().slice(0, 10)}.pdf`; link.rel = "noopener"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
