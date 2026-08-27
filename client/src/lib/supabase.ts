import { createClient } from "@supabase/supabase-js";
import { emptyElementGuideProgress, mergeElementGuideProgress, type ElementGuideProgress, type ElementGuideRouteKey, type ElementGuideRouteProgress } from "./elementGuideProgress";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const SNAPSHOT_KEYS = [
  "memodesk-unified-training-v1",
  "memodesk-gym-stats",
  "memodesk-template-stats",
  "memodesk-shadow-echo-progress-v1",
  "memodesk-roleplay-stamps-v1",
  "memodesk-mrt-progress-v2",
  "memodesk-memory-profile-v1",
  "memodesk-achievements-v1",
  "memodesk-mrt-personal-mnemonics",
  "memodesk-mrt-style-preferences",
  "memodesk-mrt-mnemonic-experiments",
  "memodesk-mrt-repair-history",
  "memgenius-arcade-scores",
  "memgenius-training-log",
  "memgenius-difficulty",
  "memgenius-daily-goal",
  "memgenius-achievements",
  "memgenius-rally-profile",
  "memgenius-rally-story",
  "memgenius-rally-learning",
  "memodesk-element-progress-v1",
  "memodesk-element-course-progress-v1",
  "memodesk-element-talent-progress-v1",
  "memodesk-element-activity-v1",
  "memodesk-element-guide-progress-v1",
  "memodesk-memory-topics-v1",
  "memodesk-mnemonic-library",
  "memodesk-mnemonic-daily-weakness",
  "memodesk-mnemonic-completed-days",
  "memodesk-mnemonic-profile-name",
  "memodesk-mnemonic-last-badge",
];
const UPDATED_KEY = "memodesk-local-updated-at";
export const ELEMENT_GUIDE_SNAPSHOT_KEY = "memodesk-element-guide-progress-v1";

export type CloudGuideResolution = "local" | "merge" | "cloud";

export interface ElementGuideRouteDifference {
  key: ElementGuideRouteKey;
  local?: ElementGuideRouteProgress;
  cloud?: ElementGuideRouteProgress;
  kind: "local-only" | "cloud-only" | "different";
}

export interface CloudLearningPreview {
  localSnapshot: Record<string, unknown>;
  remoteSnapshot: Record<string, unknown>;
  localUpdatedAt: string;
  remoteUpdatedAt: string | null;
  remoteExists: boolean;
  guideDifferences: ElementGuideRouteDifference[];
}

function guideProgressFromSnapshot(snapshot: Record<string, unknown>): ElementGuideProgress {
  const value = snapshot[ELEMENT_GUIDE_SNAPSHOT_KEY] as ElementGuideProgress | undefined;
  return value?.routes && typeof value.routes === "object" ? value : emptyElementGuideProgress();
}

export function compareElementGuideSnapshots(localSnapshot: Record<string, unknown>, remoteSnapshot: Record<string, unknown>) {
  const local = guideProgressFromSnapshot(localSnapshot);
  const cloud = guideProgressFromSnapshot(remoteSnapshot);
  const keys = Array.from(new Set([...Object.keys(local.routes), ...Object.keys(cloud.routes)])) as ElementGuideRouteKey[];
  return keys.flatMap<ElementGuideRouteDifference>(key => {
    const localRecord = local.routes[key];
    const cloudRecord = cloud.routes[key];
    if (localRecord && !cloudRecord) return [{ key, local: localRecord, kind: "local-only" }];
    if (!localRecord && cloudRecord) return [{ key, cloud: cloudRecord, kind: "cloud-only" }];
    if (localRecord && cloudRecord && JSON.stringify(localRecord) !== JSON.stringify(cloudRecord)) return [{ key, local: localRecord, cloud: cloudRecord, kind: "different" }];
    return [];
  });
}

export function resolveElementGuideSnapshots(localSnapshot: Record<string, unknown>, remoteSnapshot: Record<string, unknown>, resolution: CloudGuideResolution) {
  const localProgress = guideProgressFromSnapshot(localSnapshot);
  const cloudProgress = guideProgressFromSnapshot(remoteSnapshot);
  const resolvedProgress = resolution === "local" ? localProgress : resolution === "cloud" ? cloudProgress : mergeElementGuideProgress(localProgress, cloudProgress);
  return { ...remoteSnapshot, ...localSnapshot, [ELEMENT_GUIDE_SNAPSHOT_KEY]: resolvedProgress };
}

export function markLocalDataUpdated(now = new Date()) {
  try {
    localStorage.setItem(UPDATED_KEY, now.toISOString());
  } catch {
    /* ignore */
  }
}
export function collectLocalSnapshot(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  SNAPSHOT_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) result[key] = JSON.parse(raw);
    } catch {
      /* ignore malformed */
    }
  });
  return result;
}
export function restoreLocalSnapshot(snapshot: Record<string, unknown>) {
  SNAPSHOT_KEYS.forEach(key => {
    if (snapshot[key] !== undefined)
      localStorage.setItem(key, JSON.stringify(snapshot[key]));
  });
  markLocalDataUpdated();
}

async function authenticatedUserId() {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("請先登入");
  return auth.user.id;
}

async function fetchRemoteSnapshot(userId: string) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data, error } = await supabase
    .from("learning_snapshots")
    .select("snapshot,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as { snapshot: Record<string, unknown>; updated_at: string } | null;
}

export async function previewCloudLearningSync(): Promise<CloudLearningPreview> {
  const userId = await authenticatedUserId();
  const remote = await fetchRemoteSnapshot(userId);
  const localSnapshot = collectLocalSnapshot();
  const remoteSnapshot = remote?.snapshot ?? {};
  return {
    localSnapshot,
    remoteSnapshot,
    localUpdatedAt: localStorage.getItem(UPDATED_KEY) ?? "1970-01-01T00:00:00.000Z",
    remoteUpdatedAt: remote?.updated_at ?? null,
    remoteExists: Boolean(remote),
    guideDifferences: compareElementGuideSnapshots(localSnapshot, remoteSnapshot),
  };
}

export async function resolveCloudGuideConflict(preview: CloudLearningPreview, resolution: CloudGuideResolution) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const userId = await authenticatedUserId();
  const latestRemote = await fetchRemoteSnapshot(userId);
  if ((latestRemote?.updated_at ?? null) !== preview.remoteUpdatedAt) throw new Error("雲端資料剛剛已更新，請重新預覽後再選擇。");
  const snapshot = resolveElementGuideSnapshots(preview.localSnapshot, preview.remoteSnapshot, resolution);
  const now = new Date().toISOString();
  const { error } = await supabase.from("learning_snapshots").upsert(
    { user_id: userId, snapshot, updated_at: now },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  restoreLocalSnapshot(snapshot);
  localStorage.setItem(UPDATED_KEY, now);
  return snapshot;
}

export async function syncLearningData(): Promise<
  "uploaded" | "downloaded" | "unchanged"
> {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const userId = await authenticatedUserId();
  const remote = await fetchRemoteSnapshot(userId);
  const localUpdated =
    localStorage.getItem(UPDATED_KEY) ?? "1970-01-01T00:00:00.000Z";
  if (
    remote &&
    new Date(remote.updated_at).getTime() > new Date(localUpdated).getTime()
  ) {
    restoreLocalSnapshot(remote.snapshot as Record<string, unknown>);
    return "downloaded";
  }
  const snapshot = collectLocalSnapshot();
  if (remote && JSON.stringify(remote.snapshot) === JSON.stringify(snapshot))
    return "unchanged";
  const now = new Date().toISOString();
  const { error: upsertError } = await supabase
    .from("learning_snapshots")
    .upsert(
      { user_id: userId, snapshot, updated_at: now },
      { onConflict: "user_id" }
    );
  if (upsertError) throw upsertError;
  localStorage.setItem(UPDATED_KEY, now);
  return "uploaded";
}
