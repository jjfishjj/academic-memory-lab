/**
 * MemoDesk 跨週訓練資料層：只讀取使用者實際保存的 localStorage 紀錄，
 * 並從本版起把每次完成事件寫入可按週彙整的時間線。
 */
import { loadStats } from "@/lib/gameData";
import { loadShadowProgress } from "@/lib/shadowEchoProgress";
import { markLocalDataUpdated } from "@/lib/supabase";
import { loadTemplateStats } from "@/lib/templateData";

export const ABILITIES = ["情境編碼", "故事綁定", "主動回想", "即時輸出", "音韻迴路", "跨域連結", "結構化", "空間視覺", "原理解釋", "錯誤修正"] as const;
export type Ability = (typeof ABILITIES)[number];
export type TrainingModule = "dual-card" | "mnemonic" | "roleplay" | "gesture" | "memgenius" | "shadow-echo";

export type TrainingSession = {
  id: string;
  at: string;
  module: TrainingModule;
  label: string;
  score?: number;
  abilities: Partial<Record<Ability, number>>;
};

export type WeeklyActivity = { key: string; label: string; count: number; minutes: number };
export type UnifiedReport = {
  sessions: TrainingSession[];
  weeks: WeeklyActivity[];
  abilityTotals: Record<Ability, number>;
  abilityThisWeek: Record<Ability, number>;
  weakest?: Ability;
  lifetimeRuns: number;
  sources: TrainingModule[];
};

const STORAGE_KEY = "memodesk-unified-training-v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const emptyAbilityMap = (): Record<Ability, number> => Object.fromEntries(ABILITIES.map((ability) => [ability, 0])) as Record<Ability, number>;

function parse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

function validDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function weekStart(value: Date) {
  const date = new Date(value);
  const offset = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
}

function weekKey(value: Date) { return weekStart(value).toISOString().slice(0, 10); }
function weekLabel(value: Date) { return `${value.getMonth() + 1}/${value.getDate()}`; }

export function recordTrainingSession(input: Omit<TrainingSession, "id" | "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const session: TrainingSession = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: input.at ?? new Date().toISOString(),
  };
  const previous = parse<TrainingSession[]>(STORAGE_KEY, []);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...previous, session].slice(-360)));
  markLocalDataUpdated();
}

function legacyMemGenius(): TrainingSession[] {
  const logs = parse<Array<{ game: string; correct: boolean; responseMs: number; at: string }>>("memgenius-training-log", []);
  const abilityByGame: Record<string, Ability> = { sequence: "主動回想", spatial: "空間視覺", pattern: "結構化", word: "音韻迴路", reflex: "即時輸出" };
  return logs.flatMap((log, index) => {
    const ability = abilityByGame[log.game];
    if (!ability || !validDate(log.at)) return [];
    return [{ id: `legacy-mg-${index}-${log.at}`, at: log.at, module: "memgenius" as const, label: "MemGenius 微訓練", score: log.correct ? 100 : 0, abilities: { [ability]: log.correct ? 2 : 0.5 } }];
  });
}

function legacyShadowEcho(): TrainingSession[] {
  return loadShadowProgress().attempts.flatMap((attempt, index) => {
    if (!validDate(attempt.at)) return [];
    const average = attempt.scores.reduce((sum, score) => sum + score, 0) / Math.max(1, attempt.scores.length);
    return [{ id: `legacy-se-${index}-${attempt.at}`, at: attempt.at, module: "shadow-echo" as const, label: "Shadow Echo 跟讀", score: Math.round(average), abilities: { "音韻迴路": average / 50, "主動回想": average / 100 } }];
  });
}

function uniqueSessions(sessions: TrainingSession[]) {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    const key = `${session.module}-${session.at}-${session.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter((session) => validDate(session.at));
}

export function loadUnifiedReport(): UnifiedReport {
  const recorded = parse<TrainingSession[]>(STORAGE_KEY, []);
  const sessions = uniqueSessions([...recorded, ...legacyMemGenius(), ...legacyShadowEcho()]).sort((a, b) => b.at.localeCompare(a.at));
  const now = new Date();
  const startThisWeek = weekStart(now).getTime();
  const abilityTotals = emptyAbilityMap();
  const abilityThisWeek = emptyAbilityMap();
  sessions.forEach((session) => {
    const occurred = validDate(session.at)!;
    ABILITIES.forEach((ability) => {
      const amount = session.abilities[ability] ?? 0;
      abilityTotals[ability] += amount;
      if (occurred.getTime() >= startThisWeek) abilityThisWeek[ability] += amount;
    });
  });

  // 舊版累積能力值沒有日期；保留在能力總覽中，絕不虛構跨週日期。
  const gym = loadStats();
  const template = loadTemplateStats() as Record<string, number>;
  const gymValues = gym as unknown as Record<string, number>;
  ABILITIES.forEach((ability) => { abilityTotals[ability] += gymValues[ability] ?? 0; abilityTotals[ability] += template[ability] ?? 0; });

  const currentWeek = weekStart(now);
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(currentWeek.getTime() - (5 - index) * WEEK_MS);
    const next = new Date(start.getTime() + WEEK_MS);
    const weekSessions = sessions.filter((session) => {
      const occurred = validDate(session.at)!;
      return occurred >= start && occurred < next;
    });
    return { key: weekKey(start), label: weekLabel(start), count: weekSessions.length, minutes: Math.max(0, Math.round(weekSessions.length * 6)) };
  });
  const covered = ABILITIES.filter((ability) => abilityTotals[ability] > 0);
  const weakest = covered.sort((a, b) => abilityTotals[a] - abilityTotals[b])[0];
  const lifetimeRuns = gym.completedRuns + (template.mnemonicRuns ?? 0) + (template.roleplayRuns ?? 0) + (template.gestureRuns ?? 0);
  const sources = Array.from(new Set(sessions.map((session) => session.module)));
  return { sessions, weeks, abilityTotals, abilityThisWeek, weakest, lifetimeRuns, sources };
}

export const WEAKNESS_ACTIONS: Record<Ability, { route: string; title: string; detail: string }> = {
  "情境編碼": { route: "/game", title: "做一輪情境鉤子卡", detail: "把抽象知識先掛進真實校園場景，再關提示回想。" },
  "故事綁定": { route: "/game", title: "補一段情感故事", detail: "為每個知識點安排人物、情緒與結果，讓它更容易被喚回。" },
  "主動回想": { route: "/game", title: "開啟遮蓋回想", detail: "少看一次提示，多做一次提取，才能找出真正的空白。" },
  "即時輸出": { route: "/train/roleplay", title: "進入情境式劇本殺", detail: "在壓力較低的角色任務裡，用自己的話把關鍵概念說出來。" },
  "音韻迴路": { route: "/shadow-echo", title: "做一次 Shadow Echo 跟讀", detail: "以節奏、重音與遮稿複述，為聲音線索建立回憶路徑。" },
  "跨域連結": { route: "/train/mnemonic", title: "做一張諧音或類比口訣", detail: "把新概念連到熟悉字詞或畫面，增加可提取的線索。" },
  "結構化": { route: "/memgenius", title: "玩一局圖樣排列", detail: "先找規律和分類，再記順序；結構會減少硬背負擔。" },
  "空間視覺": { route: "/memgenius", title: "玩一局空間定位", detail: "讓位置與路徑替內容多加一個可辨識的索引。" },
  "原理解釋": { route: "/train/roleplay", title: "用角色對話解釋概念", detail: "把概念講給故事裡的人聽，檢查自己是否只會背、不會解釋。" },
  "錯誤修正": { route: "/train/mnemonic", title: "完成一輪口訣回想", detail: "先寫下原本答案，再比對修正，將錯誤轉成下一次的提示。" },
};
