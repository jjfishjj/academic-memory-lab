import { createClient } from "@supabase/supabase-js";

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
  "memodesk-memory-topics-v1",
  "memodesk-mnemonic-library",
  "memodesk-mnemonic-daily-weakness",
  "memodesk-mnemonic-completed-days",
  "memodesk-mnemonic-profile-name",
  "memodesk-mnemonic-last-badge",
];
const UPDATED_KEY = "memodesk-local-updated-at";

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

export async function syncLearningData(): Promise<
  "uploaded" | "downloaded" | "unchanged"
> {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("請先登入");
  const { data: remote, error } = await supabase
    .from("learning_snapshots")
    .select("snapshot,updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
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
      { user_id: auth.user.id, snapshot, updated_at: now },
      { onConflict: "user_id" }
    );
  if (upsertError) throw upsertError;
  localStorage.setItem(UPDATED_KEY, now);
  return "uploaded";
}
