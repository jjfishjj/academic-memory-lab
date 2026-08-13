/**
 * 風格備忘：手帳拼貼學院 — 共用知識點卡包選擇器
 * 官方練習包 + 我的卡包 + 自建卡包入口，供三個訓練模板重用
 */
import { useMemo, useState } from "react";
import { ArrowRight, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import {
  SUBJECT_PACKS, loadCustomPacks, deleteCustomPack, type SubjectPack,
} from "@/lib/gameData";
import CustomPackBuilder from "@/components/CustomPackBuilder";

interface Props {
  onPick: (pack: SubjectPack) => void;
  /** 額外說明，例如「劇本殺會取前 5 個知識點當核心詞」 */
  note?: string;
}

export default function PackPicker({ onPick, note }: Props) {
  const [customPacks, setCustomPacks] = useState<SubjectPack[]>(() => loadCustomPacks());
  const [building, setBuilding] = useState(false);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const filteredPacks = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-Hant");
    return SUBJECT_PACKS
      .filter(pack => subject === "all" || pack.subject === subject)
      .filter(pack => difficulty === "all" || pack.difficulty === difficulty)
      .map(pack => {
        if (!keyword) return pack;
        const packMatch = `${pack.name} ${pack.desc}`.toLocaleLowerCase("zh-Hant").includes(keyword);
        const items = packMatch ? pack.items : pack.items.filter(item =>
          `${item.term} ${item.hint} ${item.extra ?? ""}`.toLocaleLowerCase("zh-Hant").includes(keyword),
        );
        return { ...pack, items };
      })
      .filter(pack => pack.items.length > 0);
  }, [difficulty, query, subject]);

  const removeCustomPack = (id: string) => {
    deleteCustomPack(id);
    setCustomPacks(loadCustomPacks());
  };

  if (building) {
    return (
      <CustomPackBuilder
        onCreated={(p) => { setBuilding(false); setCustomPacks(loadCustomPacks()); onPick(p); }}
        onCancel={() => setBuilding(false)}
      />
    );
  }

  return (
    <div>
      {note && <p className="doodle-note text-xl mb-4">{note}</p>}

      {/* 自建卡包入口 */}
      <button onClick={() => setBuilding(true)}
        className="sticky-note sticky-yellow-bg tilt-r p-5 mb-8 w-full max-w-2xl text-left group relative block">
        <div className="washi washi-yellow" />
        <div className="flex items-center gap-4">
          <span className="text-4xl">✂️</span>
          <div className="flex-1">
            <h3 className="font-display font-bold text-xl text-amber-900 group-hover:underline decoration-wavy underline-offset-4">
              <Sparkles className="w-4 h-4 inline -mt-1" /> 做一包自己的知識點
            </h3>
            <p className="text-sm text-amber-800">單字、年份、事件、流程都可以——貼進來變成你的專屬訓練材料</p>
          </div>
          <Plus className="w-6 h-6 text-amber-700 shrink-0" />
        </div>
      </button>

      {/* 我的卡包 */}
      {customPacks.length > 0 && (
        <div className="mb-8">
          <p className="doodle-note text-xl mb-3">my packs — 我做過的卡包 ✎</p>
          <div className="grid md:grid-cols-3 gap-6">
            {customPacks.map((p, i) => (
              <div key={p.id} className={`paper-card ${i % 2 === 0 ? "tilt-l2" : "tilt-r"} p-6 relative group`}>
                <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
                <button onClick={() => removeCustomPack(p.id)} aria-label="刪除卡包"
                  className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="font-display font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
                <button onClick={() => onPick(p)} className="doodle-note text-xl inline-flex items-center gap-1 hover:text-primary transition-colors">
                  用這包訓練 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="doodle-note text-xl mb-3">starter packs — 官方練習包 ✎</p>
      <div className="paper-card mb-5 grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_160px_160px]" aria-label="題庫篩選器">
        <label className="relative block">
          <span className="sr-only">搜尋題目</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={event => setQuery(event.target.value)}
            placeholder="搜尋題目、解釋或關鍵字…"
            className="h-11 w-full rounded-xl border-2 border-amber-200 bg-white/80 pl-9 pr-3 text-sm outline-none focus:border-primary dark:bg-slate-900/80" />
        </label>
        <label>
          <span className="sr-only">科目</span>
          <select value={subject} onChange={event => setSubject(event.target.value)}
            className="h-11 w-full rounded-xl border-2 border-amber-200 bg-white/80 px-3 text-sm font-bold dark:bg-slate-900/80">
            <option value="all">全部科目</option><option value="english">英文</option><option value="history">歷史</option>
            <option value="chemistry">化學</option><option value="biology">生物</option><option value="geography">地理</option>
          </select>
        </label>
        <label>
          <span className="sr-only">難度</span>
          <select value={difficulty} onChange={event => setDifficulty(event.target.value)}
            className="h-11 w-full rounded-xl border-2 border-amber-200 bg-white/80 px-3 text-sm font-bold dark:bg-slate-900/80">
            <option value="all">全部難度</option><option value="basic">初階</option><option value="advanced">進階</option>
          </select>
        </label>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {filteredPacks.map((p, i) => (
          <button key={p.id} onClick={() => onPick(p)}
            className={`paper-card ${i % 2 === 0 ? "tilt-l" : "tilt-r"} p-6 text-left group relative`}>
            <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
            <div className="text-4xl mb-3">{p.emoji}</div>
            <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
            <span className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              本輪 {p.items.length} 題
            </span>
            <br />
            <span className="doodle-note text-xl inline-flex items-center gap-1">就決定是你了 <ArrowRight className="w-4 h-4" /></span>
          </button>
        ))}
      </div>
      {filteredPacks.length === 0 && (
        <div className="paper-card p-8 text-center" role="status">
          <p className="text-3xl">🔎</p><p className="mt-2 font-display text-lg font-bold">找不到符合條件的題庫</p>
          <p className="text-sm text-muted-foreground">換個關鍵字，或把科目與難度改回「全部」。</p>
          <button type="button" onClick={() => { setQuery(""); setSubject("all"); setDifficulty("all"); }} className="mt-3 font-bold text-primary hover:underline">清除篩選</button>
        </div>
      )}
    </div>
  );
}
