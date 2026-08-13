import { useMemo, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Eye, MessageCircleWarning, Trash2, X } from "lucide-react";
import { filterAndSortMnemonicEntries, loadMnemonicLibrary, mnemonicSubjectOf, removeMnemonicEntryById, selectWeakMnemonicEntries, updateMnemonicEntry } from "@/lib/mnemonicLibrary";
import type { MnemonicLibraryEntry, MnemonicLibrarySort, MnemonicLibrarySubject } from "@/lib/mnemonicLibrary";
import { SUBJECT_PACKS } from "@/lib/gameData";
import { getMnemonicReferences, MNEMONIC_STYLES } from "@/lib/templateData";
import { loadDailyWeaknessProgress, ratingTrend, saveMnemonicEntry } from "@/lib/mnemonicLibrary";
import { toast } from "sonner";

interface Props { onTrainEntries: (entries: MnemonicLibraryEntry[], label: string, daily?: boolean) => void; }

export default function MnemonicLibraryPanel({ onTrainEntries }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(loadMnemonicLibrary);
  const [subject, setSubject] = useState<"all" | MnemonicLibrarySubject>("all");
  const [sort, setSort] = useState<MnemonicLibrarySort>("updated");
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const favorites = useMemo(() => entries.filter(entry => entry.bookmarked).length, [entries]);
  const hard = useMemo(() => entries.filter(entry => entry.feedback === "hard").length, [entries]);
  const lowRated = useMemo(() => entries.filter(entry => entry.rating > 0 && entry.rating < 3).length, [entries]);
  const weakEntries = useMemo(() => selectWeakMnemonicEntries(entries), [entries]);
  const daily = useMemo(() => loadDailyWeaknessProgress(entries), [entries]);
  const dailyEntries = useMemo(() => daily.itemIds.flatMap(itemId => {
    const entry = weakEntries.find(candidate => candidate.itemId === itemId);
    return entry ? [entry] : [];
  }), [daily.itemIds, weakEntries]);
  const visibleEntries = useMemo(() => filterAndSortMnemonicEntries(entries, subject, sort), [entries, sort, subject]);
  const detailItem = useMemo(() => SUBJECT_PACKS.flatMap(pack => pack.items).find(item => item.id === detailItemId), [detailItemId]);

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
          <span className="text-sm text-muted-foreground">{entries.length} 句 · {favorites} 個收藏 · {hard} 句待改善 · {lowRated} 句低於 3 星</span>
        </span>{open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && (
        <div className="border-t border-dashed border-amber-300 p-4 sm:p-5">
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={!favorites} onClick={() => onTrainEntries(entries.filter(entry => entry.bookmarked), "只練收藏")}
              className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-left font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-950/50 dark:text-amber-100">
              🔖 只練收藏 <span className="block text-xs font-normal">{favorites ? `${favorites} 句已收藏口訣` : "先收藏一條口訣即可開始"}</span>
            </button>
            <button type="button" disabled={!hard} onClick={() => onTrainEntries(entries.filter(entry => entry.feedback === "hard"), "只練不好記")}
              className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-left font-bold text-rose-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-rose-950/50 dark:text-rose-100">
              🧠 只練不好記 <span className="block text-xs font-normal">{hard ? `${hard} 句待改善口訣` : "標記不好記後會出現在這裡"}</span>
            </button>
            <button type="button" disabled={!weakEntries.length} onClick={() => onTrainEntries(weakEntries, "自動弱項複習")}
              className="rounded-xl border-2 border-violet-300 bg-violet-50 p-3 text-left font-bold text-violet-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-violet-950/50 dark:text-violet-100">
              ⚡ 自動弱項複習 <span className="block text-xs font-normal">{weakEntries.length ? `${weakEntries.length} 句：不好記優先，再練 1–2 星` : "目前沒有弱項，繼續保持！"}</span>
            </button>
          </div>
          <div className="mb-4 rounded-xl border-2 border-teal-300 bg-teal-50 p-4 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><b>📅 今日弱項任務</b><p className="text-xs">已完成 {daily.completedIds.length} / {daily.itemIds.length} 題</p></div>
              <button type="button" disabled={!dailyEntries.length || daily.completedIds.length >= daily.itemIds.length} onClick={() => onTrainEntries(dailyEntries.filter(entry => !daily.completedIds.includes(entry.itemId)), "今日弱項任務", true)} className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-45">{daily.itemIds.length && daily.completedIds.length >= daily.itemIds.length ? "今天完成了 ✓" : "開始今日任務"}</button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${daily.itemIds.length ? daily.completedIds.length / daily.itemIds.length * 100 : 0}%` }} /></div>
            {!daily.itemIds.length && <p className="mt-2 text-xs">目前沒有低於 3 星或不好記的項目，今天可以放心休息。</p>}
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted-foreground">科目
              <select value={subject} onChange={event => setSubject(event.target.value as "all" | MnemonicLibrarySubject)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                <option value="all">全部科目</option><option value="english">英文</option><option value="history">歷史</option><option value="chemistry">化學</option><option value="biology">生物</option><option value="geography">地理</option><option value="custom">自訂</option>
              </select>
            </label>
            <label className="text-xs font-bold text-muted-foreground">排序
              <select value={sort} onChange={event => setSort(event.target.value as MnemonicLibrarySort)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                <option value="updated">最近更新</option><option value="rating-low">評分低到高</option><option value="rating-high">評分高到低</option>
              </select>
            </label>
          </div>
          {entries.length === 0 ? <p className="rounded-xl bg-amber-50 p-5 text-center text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">完成口訣並評分或收藏後，會保存在這裡。</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleEntries.map(entry => <article key={entry.id} className="rounded-xl border-2 border-amber-200 bg-white/70 p-4 dark:border-amber-900 dark:bg-slate-900/60">
                <div className="flex items-start justify-between gap-2"><div><p className="font-display font-bold">{entry.term}</p><p className="text-xs text-muted-foreground">{{english:"英文",history:"歷史",chemistry:"化學",biology:"生物",geography:"地理",custom:"自訂"}[mnemonicSubjectOf(entry.itemId)]} · {entry.styleName} · {entry.rating ? `${entry.rating}/5 星` : "未評分"}</p>{entry.ratingHistory && entry.ratingHistory.length > 1 && <p className={`mt-1 text-xs font-bold ${ratingTrend(entry) > 0 ? "text-emerald-700" : ratingTrend(entry) < 0 ? "text-rose-700" : "text-muted-foreground"}`}>趨勢 {ratingTrend(entry) > 0 ? `↑ +${ratingTrend(entry)}` : ratingTrend(entry) < 0 ? `↓ ${ratingTrend(entry)}` : "持平"} · {entry.ratingHistory.map(point => point.rating).join(" → ")} 星</p>}</div>{entry.feedback === "hard" && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">待改善</span>}</div>
                <p className="my-3 font-hand text-lg">「{entry.mnemonic}」</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button type="button" disabled={mnemonicSubjectOf(entry.itemId) === "custom"} onClick={() => setDetailItemId(entry.itemId)} className="rounded-lg border p-2 text-xs font-bold hover:bg-teal-50 disabled:opacity-40 dark:hover:bg-teal-950"><Eye className="mx-auto mb-1 h-4 w-4" />12 句詳情</button>
                  <button type="button" onClick={() => toggleFavorite(entry.id, entry.bookmarked)} aria-pressed={entry.bookmarked} className="rounded-lg border p-2 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950"><Bookmark className={`mx-auto mb-1 h-4 w-4 ${entry.bookmarked ? "fill-amber-500 text-amber-600" : ""}`} />{entry.bookmarked ? "已收藏" : "收藏"}</button>
                  <button type="button" onClick={() => toggleHard(entry.id, entry.feedback === "hard")} aria-pressed={entry.feedback === "hard"} className="rounded-lg border p-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950"><MessageCircleWarning className="mx-auto mb-1 h-4 w-4" />{entry.feedback === "hard" ? "取消回報" : "不好記"}</button>
                  <button type="button" onClick={() => discard(entry.id)} className="rounded-lg border p-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="mx-auto mb-1 h-4 w-4" />淘汰</button>
                </div>
              </article>)}
            </div>
          )}
          {entries.length > 0 && visibleEntries.length === 0 && <p className="rounded-xl bg-muted p-5 text-center text-sm">這個科目還沒有保存的口訣。</p>}
          {detailItem && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="mnemonic-detail-title">
            <div className="mx-auto max-w-4xl rounded-2xl bg-background p-5 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">完整參考答案 · 4 模式 × 3 風格</p><h2 id="mnemonic-detail-title" className="font-display text-2xl font-extrabold">{detailItem.term}</h2><p className="text-sm text-muted-foreground">{detailItem.hint}{detailItem.extra ? ` — ${detailItem.extra}` : ""}</p></div><button type="button" onClick={() => setDetailItemId(null)} aria-label="關閉題目詳情" className="rounded-full border p-2"><X /></button></div>
              <div className="grid gap-4 md:grid-cols-2">{MNEMONIC_STYLES.map(style => <section key={style.id} className="rounded-xl border-2 border-amber-200 p-4"><h3 className="mb-3 font-display font-bold">{style.emoji} {style.name}</h3>{getMnemonicReferences(detailItem, style).map((reference, index) => <div key={reference} className="mb-2 rounded-lg bg-muted/70 p-3 text-sm"><div className="flex items-center justify-between gap-2"><b>{{0:"🌱 簡單",1:"🤯 荒謬",2:"🎯 考試型"}[index as 0|1|2]}</b><button type="button" onClick={() => { saveMnemonicEntry({ itemId: detailItem.id, term: detailItem.term, hint: detailItem.hint, styleId: style.id, styleName: style.name, mnemonic: reference, rating: 0, bookmarked: true }); refresh(); toast.success("已收藏這句參考答案"); }} className="rounded-full border border-amber-300 bg-background px-2 py-1 text-xs font-bold text-amber-800 dark:text-amber-200"><Bookmark className="mr-1 inline h-3 w-3" />收藏</button></div><p className="mt-1">{reference}</p></div>)}</section>)}</div>
            </div>
          </div>}
        </div>
      )}
    </section>
  );
}
