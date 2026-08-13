import { describe, expect, it } from "vitest";
import { SUBJECT_PACKS } from "./gameData";
import { MNEMONIC_STYLES, getMnemonicReferences } from "./templateData";

const reviewedReferences = SUBJECT_PACKS.flatMap(pack =>
  pack.items.filter(item =>
    /^[hc][1-5]$/.test(item.id),
  ).flatMap(item =>
    MNEMONIC_STYLES.flatMap(style => getMnemonicReferences(item, style)),
  ),
);

describe("history and chemistry mnemonic accuracy review", () => {
  it("keeps the reviewed scope at exactly 120 references", () => {
    expect(reviewedReferences).toHaveLength(120);
  });

  it("does not teach the corrected factual shortcuts", () => {
    const corpus = reviewedReferences.join("\n");

    expect(corpus).not.toMatch(/1789[^\n]*(推翻波旁|波旁王朝倒|王位已停止)/);
    expect(corpus).not.toContain("聲音頻率會升高");
    expect(corpus).not.toMatch(/氯[^\n]*游泳池的味道/);
  });

  it("retains the corrected exam anchors", () => {
    const corpus = reviewedReferences.join("\n");

    expect(corpus).toContain("1792 年才廢除君主制");
    expect(corpus).toContain("批判贖罪券的濫用");
    expect(corpus).toContain("氯胺");
    expect(corpus).toContain("非聲帶基頻升高");
  });
});
