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
  return next;
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

export function updateMnemonicEntry(id: string, patch: Partial<Pick<MnemonicLibraryEntry, "bookmarked" | "feedback" | "rating">>) {
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
