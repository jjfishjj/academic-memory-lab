import type { KnowledgeItem } from "./gameData";
import type { MnemonicStyle } from "./templateData";

const API_URL = (import.meta.env.VITE_MNEMONIC_API_URL as string | undefined)?.trim();

export const mnemonicAiAvailable = Boolean(API_URL);

export async function generateAiMnemonicReferences(
  item: KnowledgeItem,
  style: MnemonicStyle,
): Promise<string[]> {
  if (!API_URL) throw new Error("AI 服務尚未設定，先使用離線參考答案");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      term: item.term,
      hint: item.hint,
      extra: item.extra ?? "",
      style: style.id,
      styleName: style.name,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `AI 服務暫時無法使用（${response.status}）`);
  }

  const payload = await response.json() as { suggestions?: unknown };
  if (!Array.isArray(payload.suggestions)) throw new Error("AI 回傳格式不正確");

  const suggestions = payload.suggestions
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .slice(0, 3);

  if (suggestions.length !== 3) throw new Error("AI 沒有產生完整的三個答案");
  return suggestions;
}
