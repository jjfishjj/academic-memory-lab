import { describe, expect, it } from "vitest";
import { SUBJECT_PACKS } from "./gameData";
import { SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS, TAIWAN_ABSURD_SCENES, getScienceGeographyReferences } from "./scienceGeographyMnemonicData";
import { MNEMONIC_STYLES } from "./templateData";

describe("生物與地理離線題庫", () => {
  const reviewedItemIds = [
    "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10", "b11", "b12", "b13", "b14", "b15", "b16", "b17", "b18", "b19", "b20",
    "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11", "g12", "g13", "g14", "g15", "g16", "g17", "g18", "g19", "g20",
  ];
  it("兩科各有 20 題並拆成初進階四包", () => {
    expect(SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS.filter(item => item.subject === "biology")).toHaveLength(20);
    expect(SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS.filter(item => item.subject === "geography")).toHaveLength(20);
    expect(SUBJECT_PACKS.filter(pack => ["biology", "geography"].includes(pack.subject ?? "")).map(pack => pack.items.length)).toEqual([10, 10, 10, 10]);
  });

  it("40 題各有四模式與三標籤，共 480 句", () => {
    const references = SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS.flatMap(item => MNEMONIC_STYLES.flatMap(style =>
      getScienceGeographyReferences(item.id, style.id as "homophone" | "rhyme" | "meme" | "story-chain") ?? [],
    ));
    expect(references).toHaveLength(480);
    expect(new Set(references).size).toBe(480);
    for (const item of SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS) {
      for (const style of MNEMONIC_STYLES) {
        const [simple, absurd, exam] = getScienceGeographyReferences(item.id, style.id as "homophone" | "rhyme" | "meme" | "story-chain")!;
        expect(simple).toContain(item.term); expect(absurd).toContain(item.term);
        expect(exam).toContain(item.term); expect(exam).toContain(item.anchor);
      }
    }
  });

  it("逐題審閱清單完整，且定義、考點、語感素材沒有空白或重複", () => {
    expect(reviewedItemIds).toEqual(SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS.map(item => item.id));
    for (const item of SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS) {
      expect(item.hint.length, `${item.id} 定義太短`).toBeGreaterThanOrEqual(8);
      expect(item.extra.length, `${item.id} 補充太短`).toBeGreaterThanOrEqual(8);
      expect(item.anchor.length, `${item.id} 錨點太短`).toBeGreaterThanOrEqual(8);
      expect(item.chain.split("→")).toHaveLength(3);
      expect(new Set([item.sound, item.image, item.anchor, item.chain]).size).toBe(4);
    }
  });

  it("40 題都有逐題改寫且不重複的台灣荒謬場景", () => {
    expect(Object.keys(TAIWAN_ABSURD_SCENES)).toEqual(reviewedItemIds);
    expect(new Set(Object.values(TAIWAN_ABSURD_SCENES)).size).toBe(40);
    for (const item of SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS) {
      expect(TAIWAN_ABSURD_SCENES[item.id].length).toBeGreaterThanOrEqual(25);
      for (const style of MNEMONIC_STYLES) {
        expect(getScienceGeographyReferences(item.id, style.id as "homophone" | "rhyme" | "meme" | "story-chain")![1]).toContain(TAIWAN_ABSURD_SCENES[item.id]);
      }
    }
  });
});
