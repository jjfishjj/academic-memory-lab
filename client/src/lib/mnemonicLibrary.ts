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
  const next = [{ ...entry, id, updatedAt: new Date().toISOString() }, ...library.filter((item) => item.id !== id)].slice(0, 100);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
}

export function removeMnemonicEntry(itemId: string, styleId: string, mnemonic: string) {
  const id = `${itemId}:${styleId}:${mnemonic}`;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(loadMnemonicLibrary().filter((item) => item.id !== id)));
}
