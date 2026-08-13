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
  updatedAt: string;
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
  const next = [{ ...previous, ...entry, id, updatedAt: new Date().toISOString() }, ...library.filter((item) => item.id !== id)].slice(0, 100);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
}

export function updateMnemonicEntry(id: string, patch: Partial<Pick<MnemonicLibraryEntry, "bookmarked" | "feedback" | "rating">>) {
  const next = loadMnemonicLibrary().map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
}

export function removeMnemonicEntryById(id: string) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(loadMnemonicLibrary().filter(item => item.id !== id)));
}

export function removeMnemonicEntry(itemId: string, styleId: string, mnemonic: string) {
  const id = `${itemId}:${styleId}:${mnemonic}`;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(loadMnemonicLibrary().filter((item) => item.id !== id)));
}
