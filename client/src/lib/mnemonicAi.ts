import type { KnowledgeItem } from "./gameData";
import type { MnemonicStyle } from "./templateData";
import type { MrtStation } from "./mrtData";
import { offlineMrtCandidates } from "./mrtMnemonics";

const API_URL = (
  import.meta.env.VITE_MNEMONIC_API_URL as string | undefined
)?.trim();

export const mnemonicAiAvailable = Boolean(API_URL);

export async function generateAiMnemonicReferences(
  item: KnowledgeItem,
  style: MnemonicStyle
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
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      payload?.error || `AI 服務暫時無法使用（${response.status}）`
    );
  }

  const payload = (await response.json()) as { suggestions?: unknown };
  if (!Array.isArray(payload.suggestions)) throw new Error("AI 回傳格式不正確");

  const suggestions = payload.suggestions
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    )
    .map(value => value.trim())
    .slice(0, 3);

  if (suggestions.length !== 3) throw new Error("AI 沒有產生完整的三個答案");
  return suggestions;
}

export async function generateMrtMnemonicCandidates(
  station: MrtStation
): Promise<{ suggestions: string[]; source: "ai" | "offline" }> {
  if (!API_URL)
    return { suggestions: offlineMrtCandidates(station), source: "offline" };
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term: `${station.code} ${station.name}`,
        hint: "產生三個繁體中文捷運記憶聯想，依序為幽默型、故事型、名人型，需包含站碼與站名。",
        extra: station.branch ?? "台北捷運",
        style: "mrt-three-styles",
        styleName: "捷運三型聯想",
      }),
    });
    if (!response.ok) throw new Error("AI request failed");
    const payload = (await response.json()) as { suggestions?: unknown };
    const suggestions = Array.isArray(payload.suggestions)
      ? payload.suggestions
          .filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0
          )
          .slice(0, 3)
      : [];
    if (suggestions.length !== 3) throw new Error("Incomplete AI response");
    return { suggestions, source: "ai" };
  } catch {
    return { suggestions: offlineMrtCandidates(station), source: "offline" };
  }
}
