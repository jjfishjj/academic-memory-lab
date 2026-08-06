import { describe, expect, it } from "vitest";
import { ALL_MRT_STATIONS } from "./mrtData";
import { getMrtMnemonic, getMrtSegmentMovie } from "./mrtMnemonics";

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
});
