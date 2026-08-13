import { useMemo, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, MessageCircleWarning, Trash2 } from "lucide-react";
import { loadMnemonicLibrary, removeMnemonicEntryById, updateMnemonicEntry } from "@/lib/mnemonicLibrary";
import type { MnemonicLibraryEntry } from "@/lib/mnemonicLibrary";

interface Props { onTrainEntries: (entries: MnemonicLibraryEntry[], label: string) => void; }

export default function MnemonicLibraryPanel({ onTrainEntries }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(loadMnemonicLibrary);
  const favorites = useMemo(() => entries.filter(entry => entry.bookmarked).length, [entries]);
  const hard = useMemo(() => entries.filter(entry => entry.feedback === "hard").length, [entries]);

  const refresh = () => setEntries(loadMnemonicLibrary());
  const toggleFavorite = (id: string, bookmarked: boolean) => {
    updateMnemonicEntry(id, { bookmarked: !bookmarked }); refresh();
  };
  const toggleHard = (id: string, reported: boolean) => {
    updateMnemonicEntry(id, { feedback: reported ? undefined : "hard", ...(reported ? {} : { rating: 1 }) }); refresh();
  };
  const discard = (id: string) => { removeMnemonicEntryById(id); refresh(); };

  return (
    <section className="paper-card mb-8 overflow-hidden" aria-labelledby="mnemonic-library-title">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
        <span className="text-3xl">📒</span><span className="min-w-0 flex-1">
          <strong id="mnemonic-library-title" className="block font-display text-lg">我的口訣庫</strong>
          <span className="text-sm text-muted-foreground">{entries.length} 句 · {favorites} 個收藏 · {hard} 句待改善</span>
        </span>{open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && (
        <div className="border-t border-dashed border-amber-300 p-4 sm:p-5">
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!favorites} onClick={() => onTrainEntries(entries.filter(entry => entry.bookmarked), "只練收藏")}
              className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-left font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-950/50 dark:text-amber-100">
              🔖 只練收藏 <span className="block text-xs font-normal">{favorites ? `${favorites} 句已收藏口訣` : "先收藏一條口訣即可開始"}</span>
            </button>
            <button type="button" disabled={!hard} onClick={() => onTrainEntries(entries.filter(entry => entry.feedback === "hard"), "只練不好記")}
              className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-left font-bold text-rose-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-rose-950/50 dark:text-rose-100">
              🧠 只練不好記 <span className="block text-xs font-normal">{hard ? `${hard} 句待改善口訣` : "標記不好記後會出現在這裡"}</span>
            </button>
          </div>
          {entries.length === 0 ? <p className="rounded-xl bg-amber-50 p-5 text-center text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">完成口訣並評分或收藏後，會保存在這裡。</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {entries.map(entry => <article key={entry.id} className="rounded-xl border-2 border-amber-200 bg-white/70 p-4 dark:border-amber-900 dark:bg-slate-900/60">
                <div className="flex items-start justify-between gap-2"><div><p className="font-display font-bold">{entry.term}</p><p className="text-xs text-muted-foreground">{entry.styleName} · {entry.rating ? `${entry.rating}/5 星` : "未評分"}</p></div>{entry.feedback === "hard" && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">待改善</span>}</div>
                <p className="my-3 font-hand text-lg">「{entry.mnemonic}」</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => toggleFavorite(entry.id, entry.bookmarked)} aria-pressed={entry.bookmarked} className="rounded-lg border p-2 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950"><Bookmark className={`mx-auto mb-1 h-4 w-4 ${entry.bookmarked ? "fill-amber-500 text-amber-600" : ""}`} />{entry.bookmarked ? "已收藏" : "收藏"}</button>
                  <button type="button" onClick={() => toggleHard(entry.id, entry.feedback === "hard")} aria-pressed={entry.feedback === "hard"} className="rounded-lg border p-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950"><MessageCircleWarning className="mx-auto mb-1 h-4 w-4" />{entry.feedback === "hard" ? "取消回報" : "不好記"}</button>
                  <button type="button" onClick={() => discard(entry.id)} className="rounded-lg border p-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="mx-auto mb-1 h-4 w-4" />淘汰</button>
                </div>
              </article>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
