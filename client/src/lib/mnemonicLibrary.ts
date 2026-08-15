export interface MnemonicLibraryEntry {
  id: string;
  itemId: string;
  term: string;
  hint: string;
  styleId: string;
  styleName: string;
  mnemonic: string;
  rating: number;
  bookmarked: boolean;
  feedback?: "hard";
  ratingHistory?: { rating: number; at: string }[];
  note?: string;
  updatedAt: string;
}

export type MnemonicLibrarySubject = "english" | "history" | "chemistry" | "biology" | "geography" | "custom";
export type MnemonicLibrarySort = "updated" | "rating-low" | "rating-high";

export function mnemonicSubjectOf(itemId: string): MnemonicLibrarySubject {
  if (/^e\d+$/.test(itemId)) return "english";
  if (/^h\d+$/.test(itemId)) return "history";
  if (/^c\d+$/.test(itemId)) return "chemistry";
  if (/^b\d+$/.test(itemId)) return "biology";
  if (/^g\d+$/.test(itemId)) return "geography";
  return "custom";
}

export function selectWeakMnemonicEntries(entries: MnemonicLibraryEntry[]) {
  return entries
    .filter(entry => entry.feedback === "hard" || (entry.rating > 0 && entry.rating < 3))
    .sort((a, b) => Number(b.feedback === "hard") - Number(a.feedback === "hard") || a.rating - b.rating || b.updatedAt.localeCompare(a.updatedAt));
}

const DAILY_KEY = "memodesk-mnemonic-daily-weakness";
const COMPLETED_DAYS_KEY = "memodesk-mnemonic-completed-days";
export interface DailyWeaknessProgress { date: string; itemIds: string[]; completedIds: string[]; }

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function loadDailyWeaknessProgress(entries: MnemonicLibraryEntry[], date = new Date()): DailyWeaknessProgress {
  const today = localDateKey(date);
  try {
    const parsed = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "null") as DailyWeaknessProgress | null;
    if (parsed?.date === today && Array.isArray(parsed.itemIds) && Array.isArray(parsed.completedIds)) return parsed;
  } catch { /* rebuild today's task */ }
  const itemIds = Array.from(new Set(selectWeakMnemonicEntries(entries).map(entry => entry.itemId))).slice(0, 5);
  const progress = { date: today, itemIds, completedIds: [] };
  localStorage.setItem(DAILY_KEY, JSON.stringify(progress));
  return progress;
}

export function completeDailyWeaknessItem(itemId: string, entries: MnemonicLibraryEntry[], date = new Date()) {
  const progress = loadDailyWeaknessProgress(entries, date);
  if (!progress.itemIds.includes(itemId) || progress.completedIds.includes(itemId)) return progress;
  const next = { ...progress, completedIds: [...progress.completedIds, itemId] };
  localStorage.setItem(DAILY_KEY, JSON.stringify(next));
  if (next.itemIds.length > 0 && next.completedIds.length >= next.itemIds.length) {
    const days = loadCompletedWeaknessDays();
    if (!days.includes(next.date)) localStorage.setItem(COMPLETED_DAYS_KEY, JSON.stringify([...days, next.date].sort()));
  }
  return next;
}

export function loadCompletedWeaknessDays(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPLETED_DAYS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(value => typeof value === "string") : [];
  } catch { return []; }
}

export function weaknessStreak(date = new Date()) {
  const days = new Set(loadCompletedWeaknessDays());
  let cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export const STREAK_BADGES = [
  { days: 1, emoji: "🌱", name: "弱項起步" }, { days: 3, emoji: "🔥", name: "三日不斷線" },
  { days: 7, emoji: "🏅", name: "一週鍛鍊家" }, { days: 14, emoji: "🧠", name: "記憶耐力王" },
  { days: 30, emoji: "👑", name: "弱項征服者" },
] as const;

export function weeklyWeakMnemonicEntries(entries: MnemonicLibraryEntry[], date = new Date()) {
  const cutoff = new Date(date); cutoff.setDate(cutoff.getDate() - 7);
  const unique = new Map<string, MnemonicLibraryEntry>();
  selectWeakMnemonicEntries(entries).forEach(entry => {
    if (new Date(entry.updatedAt) < cutoff || unique.has(entry.itemId)) return;
    unique.set(entry.itemId, entry);
  });
  return Array.from(unique.values()).slice(0, 10);
}

export interface SubjectTrend { subject: MnemonicLibrarySubject; points: { date: string; rating: number }[]; }
export function subjectRatingTrends(entries: MnemonicLibraryEntry[], days = 30, date = new Date()): SubjectTrend[] {
  const cutoff = new Date(date); cutoff.setDate(cutoff.getDate() - days + 1); cutoff.setHours(0, 0, 0, 0);
  const buckets = new Map<string, number[]>();
  entries.forEach(entry => (entry.ratingHistory ?? []).filter(point => new Date(point.at) >= cutoff).forEach(point => {
    const key = `${mnemonicSubjectOf(entry.itemId)}:${point.at.slice(0, 10)}`;
    buckets.set(key, [...(buckets.get(key) ?? []), point.rating]);
  }));
  const subjects: MnemonicLibrarySubject[] = ["english", "history", "chemistry", "biology", "geography", "custom"];
  return subjects.map(subject => ({ subject, points: Array.from(buckets.entries())
    .filter(([key]) => key.startsWith(`${subject}:`))
    .map(([key, values]) => ({ date: key.slice(subject.length + 1), rating: values.reduce((sum, value) => sum + value, 0) / values.length }))
    .sort((a, b) => a.date.localeCompare(b.date)) })).filter(series => series.points.length > 1);
}

export interface MnemonicBackup {
  version: 1;
  exportedAt: string;
  library: MnemonicLibraryEntry[];
  dailyProgress: DailyWeaknessProgress;
  completedDays: string[];
}

export function createMnemonicBackup(entries = loadMnemonicLibrary(), date = new Date()): MnemonicBackup {
  return {
    version: 1,
    exportedAt: date.toISOString(),
    library: entries,
    dailyProgress: loadDailyWeaknessProgress(entries, date),
    completedDays: loadCompletedWeaknessDays(),
  };
}

export function ratingTrend(entry: MnemonicLibraryEntry) {
  const history = entry.ratingHistory ?? [];
  if (history.length < 2) return 0;
  return history[history.length - 1].rating - history[0].rating;
}

export function filterAndSortMnemonicEntries(entries: MnemonicLibraryEntry[], subject: "all" | MnemonicLibrarySubject, sort: MnemonicLibrarySort) {
  const filtered = subject === "all" ? entries : entries.filter(entry => mnemonicSubjectOf(entry.itemId) === subject);
  return [...filtered].sort((a, b) => {
    if (sort === "rating-low") return (a.rating || 6) - (b.rating || 6) || b.updatedAt.localeCompare(a.updatedAt);
    if (sort === "rating-high") return b.rating - a.rating || b.updatedAt.localeCompare(a.updatedAt);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

const LIBRARY_KEY = "memodesk-mnemonic-library";

export function loadMnemonicLibrary(): MnemonicLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMnemonicEntry(entry: Omit<MnemonicLibraryEntry, "id" | "updatedAt">) {
  const library = loadMnemonicLibrary();
  const id = `${entry.itemId}:${entry.styleId}:${entry.mnemonic}`;
  const previous = library.find(item => item.id === id);
  const updatedAt = new Date().toISOString();
  const ratingHistory = entry.rating > 0 && previous?.rating !== entry.rating
    ? [...(previous?.ratingHistory ?? (previous?.rating ? [{ rating: previous.rating, at: previous.updatedAt }] : [])), { rating: entry.rating, at: updatedAt }].slice(-20)
    : previous?.ratingHistory ?? entry.ratingHistory;
  const next = [{ ...previous, ...entry, ratingHistory, id, updatedAt }, ...library.filter((item) => item.id !== id)].slice(0, 100);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
}

export function updateMnemonicEntry(id: string, patch: Partial<Pick<MnemonicLibraryEntry, "bookmarked" | "feedback" | "rating" | "note">>) {
  const next = loadMnemonicLibrary().map(item => {
    if (item.id !== id) return item;
    const updatedAt = new Date().toISOString();
    const ratingHistory = patch.rating && patch.rating !== item.rating
      ? [...(item.ratingHistory ?? (item.rating ? [{ rating: item.rating, at: item.updatedAt }] : [])), { rating: patch.rating, at: updatedAt }].slice(-20)
      : item.ratingHistory;
    return { ...item, ...patch, ratingHistory, updatedAt };
  });
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
}

export function removeMnemonicEntryById(id: string) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(loadMnemonicLibrary().filter(item => item.id !== id)));
}

export function removeMnemonicEntry(itemId: string, styleId: string, mnemonic: string) {
  const id = `${itemId}:${styleId}:${mnemonic}`;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(loadMnemonicLibrary().filter((item) => item.id !== id)));
}
