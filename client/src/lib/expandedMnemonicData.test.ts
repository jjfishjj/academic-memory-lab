import { describe, expect, it } from "vitest";
import { EXPANDED_MNEMONIC_ITEMS, getExpandedMnemonicReferences } from "./expandedMnemonicData";
import { MNEMONIC_STYLES } from "./templateData";
import { SUBJECT_PACKS } from "./gameData";

describe("第二批離線口訣題庫", () => {
  it("英文、歷史、化學各新增 20 題", () => {
    for (const subject of ["english", "history", "chemistry"]) {
      expect(EXPANDED_MNEMONIC_ITEMS.filter(item => item.subject === subject)).toHaveLength(20);
    }
  });

  it("拆成三科初階與進階六包，每輪最多 15 題", () => {
    expect(SUBJECT_PACKS).toHaveLength(10);
    expect(SUBJECT_PACKS.map(pack => pack.items.length)).toEqual([15, 15, 15, 10, 10, 10, 10, 10, 10, 10]);
    expect(new Set(SUBJECT_PACKS.flatMap(pack => pack.items.map(item => item.id))).size).toBe(115);
  });

  it("60 題各有四模式與三標籤，共 720 句", () => {
    const references = EXPANDED_MNEMONIC_ITEMS.flatMap(item =>
      MNEMONIC_STYLES.flatMap(style =>
        getExpandedMnemonicReferences(item.id, style.id as "homophone" | "rhyme" | "meme" | "story-chain") ?? [],
      ),
    );

    expect(references).toHaveLength(720);
    expect(new Set(references).size).toBe(720);
    expect(references.every(reference => reference.trim().length >= 18)).toBe(true);
  });

  it("每一組順序固定為簡單、荒謬、考試型，考試型保留題目與錨點", () => {
    for (const item of EXPANDED_MNEMONIC_ITEMS) {
      for (const style of MNEMONIC_STYLES) {
        const references = getExpandedMnemonicReferences(
          item.id,
          style.id as "homophone" | "rhyme" | "meme" | "story-chain",
        );
        expect(references).toBeDefined();
        const [simple, absurd, exam] = references!;
        expect(new Set([simple, absurd, exam]).size).toBe(3);
        expect(simple).toContain(item.term);
        expect(absurd).toContain(item.term);
        expect(exam).toContain(item.term);
        expect(exam).toContain(item.anchor);
        expect(simple).not.toMatch(/AI|待連線/);
        expect(absurd).not.toMatch(/AI|待連線/);
      }
    }
  });
});
