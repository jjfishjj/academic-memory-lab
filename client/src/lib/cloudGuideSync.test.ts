import { describe, expect, it } from "vitest";
import { compareElementGuideSnapshots, ELEMENT_GUIDE_SNAPSHOT_KEY, resolveElementGuideSnapshots } from "./supabase";

const record = (completedAt: string, completions: number, bestQuizScore: number) => ({ completedAt, completions, bestQuizScore });

describe("cloud guide sync conflicts", () => {
  const local = {
    localOnlyData: { keep: true },
    [ELEMENT_GUIDE_SNAPSHOT_KEY]: { routes: {
      "group-1": record("2026-08-20T00:00:00Z", 3, 2),
      "period-1": record("2026-08-21T00:00:00Z", 1, 2),
    } },
  };
  const cloud = {
    cloudOnlyData: { keep: true },
    [ELEMENT_GUIDE_SNAPSHOT_KEY]: { routes: {
      "group-1": record("2026-08-22T00:00:00Z", 1, 5),
      "period-2": record("2026-08-22T00:00:00Z", 2, 4),
    } },
  };

  it("previews local-only, cloud-only and changed routes", () => {
    expect(compareElementGuideSnapshots(local, cloud).map(item => [item.key, item.kind])).toEqual([
      ["group-1", "different"],
      ["period-1", "local-only"],
      ["period-2", "cloud-only"],
    ]);
  });

  it("merges route records while retaining unrelated data from both snapshots", () => {
    const resolved = resolveElementGuideSnapshots(local, cloud, "merge");
    expect(resolved).toMatchObject({ localOnlyData: { keep: true }, cloudOnlyData: { keep: true } });
    expect(resolved[ELEMENT_GUIDE_SNAPSHOT_KEY]).toMatchObject({ routes: {
      "group-1": record("2026-08-22T00:00:00Z", 3, 5),
      "period-1": record("2026-08-21T00:00:00Z", 1, 2),
      "period-2": record("2026-08-22T00:00:00Z", 2, 4),
    } });
  });

  it("can explicitly choose the cloud guide version", () => {
    const resolved = resolveElementGuideSnapshots(local, cloud, "cloud");
    expect(resolved[ELEMENT_GUIDE_SNAPSHOT_KEY]).toEqual(cloud[ELEMENT_GUIDE_SNAPSHOT_KEY]);
  });
});
