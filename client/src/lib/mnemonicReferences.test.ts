import { describe, expect, it } from "vitest";
import { SUBJECT_PACKS } from "./gameData";
import { getMnemonicReferences, MNEMONIC_STYLES } from "./templateData";

describe("內建口訣參考答案", () => {
  const items = SUBJECT_PACKS.flatMap((pack) => pack.items);
  const equivalentAnchors: Record<string, string[]> = {
    h1: ["1789", "一七八九"], h2: ["1969", "一九六九"], h3: ["1517", "一五一七"],
    h4: ["1929", "一九二九"], h5: ["1453", "一四五三"],
    c1: ["na", "鈉"], c2: ["he", "氦"], c3: ["fe", "鐵"], c4: ["cl", "氯"], c5: ["au", "金"],
  };

  it("完整覆蓋 75 題 × 4 模式 × 3 標籤，共 900 句", () => {
    expect(items).toHaveLength(75);
    expect(MNEMONIC_STYLES).toHaveLength(4);

    const references = items.flatMap((item) =>
      MNEMONIC_STYLES.flatMap((style) => getMnemonicReferences(item, style)),
    );

    expect(references).toHaveLength(900);
    expect(references.every((reference) => reference.trim().length > 0)).toBe(true);
  });

  it("每一組固定為簡單、荒謬、考試型三句，且內容不重複", () => {
    for (const item of items) {
      const anchors = equivalentAnchors[item.id] ?? [item.term.toLocaleLowerCase()];

      for (const style of MNEMONIC_STYLES) {
        const [simple, absurd, exam] = getMnemonicReferences(item, style);

        expect([simple, absurd, exam], `${item.id}/${style.id}`).toHaveLength(3);
        expect(new Set([simple, absurd, exam]).size, `${item.id}/${style.id}`).toBe(3);
        const normalizedExam = exam.toLocaleLowerCase();
        expect(
          anchors.some((anchor) => normalizedExam.includes(anchor)),
          `${item.id}/${style.id}/考試型缺少知識點錨點`,
        ).toBe(true);
      }
    }
  });
});
