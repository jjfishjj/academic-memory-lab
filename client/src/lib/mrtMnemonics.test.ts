import { describe, expect, it } from "vitest";
import { ALL_MRT_STATIONS } from "./mrtData";
import {
  getMrtMnemonic,
  getMrtSegmentMovie,
  mnemonicStyleOf,
  offlineMrtCandidates,
  parseMrtMnemonicImport,
  previewMrtMnemonicImport,
  applyMrtMnemonicImport,
  applyReadyMrtExperimentWinners,
  mrtExperimentConfidence,
  experimentDueDay,
  qualityAdjustedPreferences,
  sortMrtSuggestionsByPreference,
  summarizeMrtExperiments,
  winningMrtExperimentVariant,
  type MrtMnemonicExperiment,
} from "./mrtMnemonics";

describe("MRT mnemonic engine", () => {
  it("creates sound, scene, action and code hooks for every station", () => {
    ALL_MRT_STATIONS.forEach(station => {
      const mnemonic = getMrtMnemonic(station);
      expect(mnemonic.sound.length).toBeGreaterThan(1);
      expect(mnemonic.scene).toContain(station.code);
      expect(mnemonic.action).toContain(station.name);
      expect(mnemonic.codeHook).toContain(station.code);
    });
  });

  it("previews import conflicts before applying a chosen strategy", () => {
    const incoming = parseMrtMnemonicImport({
      mnemonics: {
        BR01: { sound: "新版", favorite: false },
        BR02: { sound: "新增", favorite: true },
        XX99: { sound: "無效", favorite: false },
      },
    });
    const preview = previewMrtMnemonicImport(
      incoming,
      { BR01: { sound: "舊版", favorite: true } },
      new Set(["BR01", "BR02"]),
      "skip"
    );
    expect(preview.added).toEqual(["BR02"]);
    expect(preview.skipped).toEqual(["BR01"]);
    expect(preview.invalid).toEqual(["XX99"]);
    expect(
      applyMrtMnemonicImport(preview, {
        BR01: { sound: "舊版", favorite: true },
      }).BR01.sound
    ).toBe("舊版");
  });

  it("schedules A/B recall checks on days 1, 3 and 7", () => {
    const experiment: MrtMnemonicExperiment = {
      id: "e1",
      stationCode: "BR01",
      variants: ["A", "B"] as [string, string],
      startedAt: "2026-01-01T00:00:00.000Z",
      checks: [],
    };
    expect(
      experimentDueDay(experiment, new Date("2026-01-02T00:00:00.000Z"))
    ).toBe(1);
    experiment.checks.push({
      day: 1,
      variant: 0,
      remembered: true,
      answeredAt: "2026-01-02T00:00:00.000Z",
    });
    expect(
      experimentDueDay(experiment, new Date("2026-01-04T00:00:00.000Z"))
    ).toBe(1);
    experiment.checks.push({
      day: 1,
      variant: 1,
      remembered: false,
      answeredAt: "2026-01-02T00:00:00.000Z",
    });
    expect(
      experimentDueDay(experiment, new Date("2026-01-04T00:00:00.000Z"))
    ).toBe(3);
  });

  it("summarizes day retention and selects a winning mnemonic", () => {
    const [summary] = summarizeMrtExperiments([
      {
        id: "e1",
        stationCode: "BR01",
        variants: ["幽默型：A", "故事型：B"],
        startedAt: "2026-01-01T00:00:00Z",
        checks: [
          {
            day: 1,
            variant: 0,
            remembered: true,
            answeredAt: "2026-01-02T00:00:00Z",
          },
          {
            day: 1,
            variant: 1,
            remembered: false,
            answeredAt: "2026-01-02T00:00:00Z",
          },
        ],
      },
    ]);
    expect(summary.retention[0].rate).toBe(50);
    expect(summary.variants[0].style).toBe("humor");
    expect(summary.winner).toBe(0);
  });

  it("waits for three samples per variant before applying a winner", () => {
    const experiment = {
      id: "e7",
      stationCode: "BR01",
      variants: ["幽默型：勝出", "故事型：淘汰"] as [string, string],
      startedAt: "2026-01-01T00:00:00Z",
      checks: [
        {
          day: 1 as const,
          variant: 0 as const,
          remembered: true,
          answeredAt: "2026-01-02T00:00:00Z",
        },
        {
          day: 1 as const,
          variant: 1 as const,
          remembered: false,
          answeredAt: "2026-01-02T00:00:00Z",
        },
        {
          day: 3 as const,
          variant: 0 as const,
          remembered: true,
          answeredAt: "2026-01-04T00:00:00Z",
        },
        {
          day: 3 as const,
          variant: 1 as const,
          remembered: true,
          answeredAt: "2026-01-04T00:00:00Z",
        },
        {
          day: 7 as const,
          variant: 0 as const,
          remembered: true,
          answeredAt: "2026-01-08T00:00:00Z",
        },
        {
          day: 7 as const,
          variant: 1 as const,
          remembered: false,
          answeredAt: "2026-01-08T00:00:00Z",
        },
      ],
    };
    expect(mrtExperimentConfidence(experiment).ready).toBe(true);
    expect(winningMrtExperimentVariant(experiment)).toBe(0);
    const settled = applyReadyMrtExperimentWinners(
      [experiment],
      { BR01: { sound: "舊聯想", favorite: true, quality: "okay" } },
      new Date("2026-01-09T00:00:00Z")
    );
    expect(settled.mnemonics.BR01).toEqual({
      sound: "幽默型：勝出",
      favorite: true,
      quality: "okay",
    });
    expect(settled.experiments[0].appliedWinner).toBe(0);
  });

  it("does not eliminate a variant from a single day-seven result", () => {
    const experiment = {
      id: "too-small",
      stationCode: "BR01",
      variants: ["幽默型：A", "故事型：B"] as [string, string],
      startedAt: "2026-01-01T00:00:00Z",
      checks: [
        {
          day: 7 as const,
          variant: 0 as const,
          remembered: true,
          answeredAt: "2026-01-08T00:00:00Z",
        },
        {
          day: 7 as const,
          variant: 1 as const,
          remembered: false,
          answeredAt: "2026-01-08T00:00:00Z",
        },
      ],
    };
    expect(mrtExperimentConfidence(experiment).ready).toBe(false);
    expect(winningMrtExperimentVariant(experiment)).toBeNull();
    expect(
      applyReadyMrtExperimentWinners(
        [experiment],
        {},
        new Date("2026-01-09T00:00:00Z")
      ).applied
    ).toEqual([]);
  });

  it("opens a day-fourteen tiebreaker and applies its winner", () => {
    const experiment: MrtMnemonicExperiment = {
      id: "tiebreak",
      stationCode: "BR01",
      variants: ["幽默型：A", "故事型：B"] as [string, string],
      startedAt: "2026-01-01T00:00:00Z",
      checks: ([1, 3, 7] as const).flatMap(day => [
        {
          day,
          variant: 0 as const,
          remembered: day !== 3,
          answeredAt: `2026-01-${String(day + 1).padStart(2, "0")}T00:00:00Z`,
        },
        {
          day,
          variant: 1 as const,
          remembered: day !== 7,
          answeredAt: `2026-01-${String(day + 1).padStart(2, "0")}T00:00:00Z`,
        },
      ]),
    };
    expect(mrtExperimentConfidence(experiment).winner).toBeNull();
    expect(experimentDueDay(experiment, new Date("2026-01-15T00:00:00Z"))).toBe(
      14
    );
    experiment.checks.push(
      {
        day: 14,
        variant: 0,
        remembered: true,
        answeredAt: "2026-01-15T00:00:00Z",
      },
      {
        day: 14,
        variant: 1,
        remembered: false,
        answeredAt: "2026-01-15T00:00:00Z",
      }
    );
    expect(winningMrtExperimentVariant(experiment)).toBe(0);
    expect(
      applyReadyMrtExperimentWinners(
        [experiment],
        {},
        new Date("2026-01-16T00:00:00Z")
      ).experiments[0].appliedWinner
    ).toBe(0);
  });

  it("uses a dedicated story for major and branch stations", () => {
    const station = ALL_MRT_STATIONS.find(item => item.code === "R22A")!;
    expect(getMrtMnemonic(station).scene).toContain("新北投支線");
    expect(
      getMrtMnemonic(
        ALL_MRT_STATIONS.find(item => item.name === "台北101／世貿")!
      ).sound
    ).toContain("獅帽");
  });

  it("uses personal wording and connects a segment into one movie", () => {
    const stations = ALL_MRT_STATIONS.slice(0, 5);
    const personal = {
      [stations[0].code]: { sound: "我的動物園口訣", favorite: true },
    };
    expect(getMrtMnemonic(stations[0], personal).sound).toBe("我的動物園口訣");
    const movie = getMrtSegmentMovie(stations, personal);
    stations.forEach(station => expect(movie).toContain(station.name));
    expect(movie).toContain("我的動物園口訣");
  });

  it("provides humorous, story and celebrity candidates offline", () => {
    const station = ALL_MRT_STATIONS[0];
    const suggestions = offlineMrtCandidates(station);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toContain("幽默型");
    expect(suggestions[1]).toContain("故事型");
    expect(suggestions[2]).toContain("名人型");
    suggestions.forEach(item => expect(item).toContain(station.code));
  });

  it("ranks the preferred candidate style first", () => {
    const suggestions = ["幽默型：笑話", "故事型：冒險", "名人型：明星"];
    expect(mnemonicStyleOf(suggestions[2])).toBe("celebrity");
    expect(
      sortMrtSuggestionsByPreference(suggestions, {
        humor: 1,
        story: 2,
        celebrity: 5,
      })[0]
    ).toBe(suggestions[2]);
  });

  it("imports exported mnemonics and uses quality to adjust ranking", () => {
    const parsed = parseMrtMnemonicImport({
      mnemonics: {
        BR01: { sound: "故事型：動物園冒險", favorite: true, quality: "good" },
      },
      preferences: { story: 2 },
    });
    expect(parsed.mnemonics.BR01.quality).toBe("good");
    expect(
      qualityAdjustedPreferences(parsed.mnemonics, {
        humor: 1,
        story: 2,
        celebrity: 0,
      }).story
    ).toBe(5);
    expect(() =>
      parseMrtMnemonicImport({
        mnemonics: { BR01: { sound: "", quality: "bad" } },
      })
    ).toThrow();
  });
});
