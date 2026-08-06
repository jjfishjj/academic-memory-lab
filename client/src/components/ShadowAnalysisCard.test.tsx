import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ShadowAnalysisCard from "./ShadowAnalysisCard";
import { assessSpeech } from "@/lib/speechAssessment";

const noop = () => undefined;

describe("ShadowAnalysisCard", () => {
  it("renders scores and word-level comparison", () => {
    const assessment = assessSpeech({ expected: "the city comes alive", transcript: "the city become alive", language: "English", confidence: .8, durationMs: 2500, targetSeconds: 2.5, energyVariation: .15 });
    const html = renderToStaticMarkup(<ShadowAnalysisCard assessment={assessment} scores={assessment.scores} totalScore={82} modeName="ECHO MODE" primaryLabel="進入回想" onClose={noop} onRetry={noop} onContinue={noop} />);
    expect(html).toContain("逐字對照"); expect(html).toContain("comes → become"); expect(html).toContain("進入回想");
  });
  it("renders actionable recognition failure", () => {
    const assessment = assessSpeech({ expected: "the city comes alive", transcript: "", language: "English", confidence: 0, durationMs: 2500, targetSeconds: 2.5, energyVariation: .1 });
    const html = renderToStaticMarkup(<ShadowAnalysisCard assessment={assessment} scores={[0, 0, 0, 0]} totalScore={0} modeName="BLIND RECALL" primaryLabel="重試" onClose={noop} onRetry={noop} onContinue={noop} />);
    expect(html).toContain("沒有取得語音逐字稿"); expect(html).toContain("Chrome 或 Edge"); expect(html).toContain("麥克風權限");
  });
});
