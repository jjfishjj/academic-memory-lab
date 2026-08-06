import { describe, expect, it } from "vitest";
import { ALL_MRT_STATIONS } from "./mrtData";
import {
  getMrtMnemonic,
  getMrtSegmentMovie,
  mnemonicStyleOf,
  offlineMrtCandidates,
  sortMrtSuggestionsByPreference,
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
});
