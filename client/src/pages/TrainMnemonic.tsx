/**
 * 風格備忘：手帳拼貼學院 — 諧音迷因與口訣創作家
 * 亮黃便利貼 = 創作提示；玫瑰粉 = 迷因/情緒梗；teal 印章 = 完成
 * 流程：選卡包 → 逐個知識點創作口訣（選風格 + 寫口訣）→ 立即提取測驗 → 蓋章結算
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, ArrowRight, EyeOff, RotateCcw, Home as HomeIcon, Lightbulb, WandSparkles, Sparkles, Loader2, Star, Bookmark, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { type SubjectPack, type KnowledgeItem } from "@/lib/gameData";
import { MNEMONIC_STYLES, addTemplateStats, getMnemonicReferences, type MnemonicStyle } from "@/lib/templateData";
import { generateAiMnemonicReferences, mnemonicAiAvailable } from "@/lib/mnemonicAi";
import { removeMnemonicEntry, saveMnemonicEntry } from "@/lib/mnemonicLibrary";
import { downloadMnemonicShareCard } from "@/lib/shareCard";
import PackPicker from "@/components/PackPicker";
import TrainShell from "@/components/TrainShell";

const STAMP = `${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`;

type Phase = "pack" | "create" | "quiz" | "result";

interface Work {
  item: KnowledgeItem;
  style?: MnemonicStyle;
  mnemonic?: string;
  rating?: number;
  bookmarked?: boolean;
  recalled?: boolean | null;
}

const STEPS = [
  { id: "pack", label: "選卡包" },
  { id: "create", label: "創作口訣" },
  { id: "quiz", label: "提取測驗" },
  { id: "result", label: "蓋章結算" },
];

const REFERENCE_TONES = [
  {
    id: "simple", label: "簡單", emoji: "🌱", tip: "一句就懂",
    panel: "border-emerald-400 bg-emerald-50/85 dark:border-emerald-500/70 dark:bg-emerald-950/90",
    accent: "text-emerald-700 dark:text-emerald-300", text: "text-emerald-950 dark:text-emerald-50",
    apply: "border-emerald-500 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-200 dark:hover:bg-emerald-900",
    active: "border-emerald-700 bg-emerald-600 text-white shadow-sm dark:border-emerald-300 dark:bg-emerald-700",
    inactive: "border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200 dark:hover:bg-emerald-900",
    decorations: ["🌱", "✦", "✓"], decoration: "text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "absurd", label: "荒謬", emoji: "🤯", tip: "畫面最有梗",
    panel: "border-rose-400 bg-rose-50/85 dark:border-rose-500/70 dark:bg-rose-950/90",
    accent: "text-rose-700 dark:text-rose-300", text: "text-rose-950 dark:text-rose-50",
    apply: "border-rose-500 text-rose-800 hover:bg-rose-100 dark:border-rose-500 dark:bg-rose-950/70 dark:text-rose-200 dark:hover:bg-rose-900",
    active: "border-rose-700 bg-rose-600 text-white shadow-sm dark:border-rose-300 dark:bg-rose-700",
    inactive: "border-rose-300 bg-rose-50/80 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/70 dark:text-rose-200 dark:hover:bg-rose-900",
    decorations: ["💥", "😂", "!?"], decoration: "text-rose-700 dark:text-rose-300",
  },
  {
    id: "exam", label: "考試型", emoji: "🎯", tip: "緊扣得分點",
    panel: "border-teal-500 bg-teal-50/85 dark:border-teal-400/70 dark:bg-teal-950/90",
    accent: "text-teal-700 dark:text-teal-300", text: "text-teal-950 dark:text-teal-50",
    apply: "border-teal-500 text-teal-800 hover:bg-teal-100 dark:border-teal-400 dark:bg-teal-950/70 dark:text-teal-200 dark:hover:bg-teal-900",
    active: "border-teal-800 bg-teal-700 text-white shadow-sm dark:border-teal-200 dark:bg-teal-700",
    inactive: "border-teal-300 bg-teal-50/80 text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/70 dark:text-teal-200 dark:hover:bg-teal-900",
    decorations: ["🎯", "✎", "✓"], decoration: "text-teal-800 dark:text-teal-300",
  },
] as const;

const REFERENCE_TONE_KEY = "memodesk-mnemonic-reference-tone";

function loadReferenceToneIndex() {
  try {
    const savedTone = localStorage.getItem(REFERENCE_TONE_KEY);
    const savedIndex = REFERENCE_TONES.findIndex((tone) => tone.id === savedTone);
    return savedIndex >= 0 ? savedIndex : 0;
  } catch {
    return 0;
  }
}

const stepColor = (id: string) =>
  id === "create" ? "bg-[#FDE68A] text-amber-900" :
  id === "quiz" ? "bg-[#FBCFE8] text-pink-900" :
  id === "result" ? "bg-teal-100 text-teal-900" :
  "bg-[#E7D8BC] text-yellow-950";

export default function TrainMnemonic() {
  const [phase, setPhase] = useState<Phase>("pack");
  const [works, setWorks] = useState<Work[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(loadReferenceToneIndex);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const current = works[idx];

  const startPack = (p: SubjectPack) => {
    setWorks(p.items.map((item) => ({ item, recalled: null })));
    setIdx(0);
    setPhase("create");
  };

  const updateWork = (patch: Partial<Work>) => {
    setWorks((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const nextCreate = () => {
    if (idx < works.length - 1) setIdx(idx + 1);
    else { setIdx(0); setRevealed(false); setPhase("quiz"); }
  };

  const answer = (ok: boolean) => {
    updateWork({ recalled: ok });
    const c = ok ? combo + 1 : 0;
    setCombo(c);
    setBestCombo((b) => Math.max(b, c));
    setRevealed(false);
    if (idx < works.length - 1) setIdx(idx + 1);
    else {
      addTemplateStats(
        [{ label: "音韻迴路", value: 2 }, { label: "跨域連結", value: 2 }, { label: "主動回想", value: 1 }],
        "mnemonicRuns",
      );
      setPhase("result");
    }
  };

  const restart = () => {
    setPhase("pack"); setWorks([]); setIdx(0); setCombo(0); setBestCombo(0); setRevealed(false);
  };

  const correctCount = useMemo(() => works.filter((w) => w.recalled).length, [works]);
  const suggestionKey = current?.style ? `${current.item.id}:${current.style.id}` : "";
  const offlineReferences = current?.style ? getMnemonicReferences(current.item, current.style) : [];
  const references = aiSuggestions[suggestionKey] ?? offlineReferences;
  const currentReference = references[ideaIndex % Math.max(references.length, 1)];
  const currentTone = REFERENCE_TONES[ideaIndex] ?? REFERENCE_TONES[0];

  const selectReferenceTone = (referenceIndex: number) => {
    setIdeaIndex(referenceIndex);
    try {
      localStorage.setItem(REFERENCE_TONE_KEY, REFERENCE_TONES[referenceIndex]?.id ?? REFERENCE_TONES[0].id);
    } catch {
      // localStorage unavailable: keep the choice for this session only.
    }
  };

  const requestAiSuggestions = async () => {
    if (!current?.style) return;
    setAiLoading(true);
    try {
      const suggestions = await generateAiMnemonicReferences(current.item, current.style);
      setAiSuggestions((all) => ({ ...all, [suggestionKey]: suggestions }));
      toast.success("AI 已產生 3 個新靈感");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 生成失敗，已保留離線答案");
    } finally {
      setAiLoading(false);
    }
  };

  const rateCurrent = (rating: number) => {
    if (!current?.style || !current.mnemonic?.trim()) return;
    updateWork({ rating });
    saveMnemonicEntry({
      itemId: current.item.id,
      term: current.item.term,
      hint: current.item.hint,
      styleId: current.style.id,
      styleName: current.style.name,
      mnemonic: current.mnemonic.trim(),
      rating,
      bookmarked: current.bookmarked ?? false,
    });
    toast.success(`已記錄好記度 ${rating} / 5`);
  };

  const toggleBookmark = () => {
    if (!current?.style || !current.mnemonic?.trim()) return;
    const bookmarked = !current.bookmarked;
    updateWork({ bookmarked });
    saveMnemonicEntry({
      itemId: current.item.id,
      term: current.item.term,
      hint: current.item.hint,
      styleId: current.style.id,
      styleName: current.style.name,
      mnemonic: current.mnemonic.trim(),
      rating: current.rating ?? 0,
      bookmarked,
    });
    toast.success(bookmarked ? "已收藏到口訣庫" : "已取消收藏");
  };

  const discardCurrent = () => {
    if (!current?.style || !current.mnemonic?.trim()) return;
    removeMnemonicEntry(current.item.id, current.style.id, current.mnemonic.trim());
    updateWork({ mnemonic: "", rating: undefined, bookmarked: false });
    toast("已淘汰這句，挑另一個或自己重寫吧");
  };

  return (
    <TrainShell title="諧音口訣創作家" steps={STEPS} stepIndex={stepIndex} stepColor={stepColor} badge={`combo ×${combo}`}>
      {phase === "pack" && (
        <div>
          <p className="font-hand text-2xl text-primary mb-1">step 1 — pick your material 🎤</p>
          <h1 className="font-display font-extrabold text-3xl mb-2">挑一包要變成口訣的知識點</h1>
          <p className="text-muted-foreground mb-6">年份、單字、流程都行——等一下我們把它們變成順口溜、冷笑話或迷因。</p>
          <PackPicker onPick={startPack} note="荒謬程度 ∝ 記憶強度，準備好放飛 ✎" />
        </div>
      )}

      {phase === "create" && current && (
        <div>
          <p className="font-hand text-2xl text-amber-600 mb-1">step 2 — 亮黃便利貼時間 🟡</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <Mic2 className="w-7 h-7 text-amber-600" /> 給它編一句忘不掉的口訣
          </h1>
          <p className="text-muted-foreground mb-1">口訣 {idx + 1} / {works.length} 句</p>
          <p className="doodle-note text-xl mb-4">越冷的梗，黏性越強 →</p>

          <div className="sticky-note sticky-yellow-bg p-4 sm:p-6 max-w-2xl relative tilt-l2">
            <div className="washi washi-yellow" />
            <h2 className="font-display font-extrabold text-2xl text-amber-900 mb-1">{current.item.term}</h2>
            <p className="text-amber-800 mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>

            <p className="text-sm font-bold text-amber-900 mb-2">先挑一種創作風格：</p>
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {MNEMONIC_STYLES.map((st) => (
                <button key={st.id} onClick={() => updateWork({ style: st })}
                  className={`p-3 rounded-lg text-left border-2 transition-all active:scale-[0.98] ${current.style?.id === st.id ? "bg-amber-500/15 border-amber-600" : "bg-white/70 border-amber-300 hover:border-amber-500"}`}>
                  <p className="font-bold text-sm text-amber-900">{st.emoji} {st.name}</p>
                  <p className="text-xs text-amber-800">{st.tip}</p>
                </button>
              ))}
            </div>
            {current.style && (
              <div data-tone={currentTone.id}
                className={`relative mb-4 overflow-hidden rounded-xl border-2 border-dashed p-4 transition-colors duration-300 ${currentTone.panel}`}
                aria-live="polite">
                <div data-testid="reference-tone-decorations" aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 select-none opacity-[0.14] transition-colors duration-300 ${currentTone.decoration}`}>
                  <span className="absolute -right-2 top-1 rotate-12 text-4xl">{currentTone.decorations[0]}</span>
                  <span className="absolute bottom-1 left-9 -rotate-12 text-2xl font-black">{currentTone.decorations[1]}</span>
                  <span className="absolute bottom-7 right-24 rotate-6 text-xl font-black">{currentTone.decorations[2]}</span>
                </div>
                <div className="relative z-10 flex items-start gap-3">
                  <Lightbulb className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${currentTone.accent}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${currentTone.accent}`}>
                        {aiSuggestions[suggestionKey] ? "AI 參考答案" : "離線參考答案"} · {REFERENCE_TONES[ideaIndex]?.label ?? "簡單"}
                      </p>
                      <Button type="button" size="sm" variant="ghost" disabled={!mnemonicAiAvailable || aiLoading}
                        onClick={requestAiSuggestions}
                        title={mnemonicAiAvailable ? "請 AI 重新產生三個答案" : "部署 AI 端點後即可使用"}
                        className={`h-8 rounded-full font-bold disabled:opacity-60 ${currentTone.accent}`}>
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {mnemonicAiAvailable ? "AI 生成 3 個" : "AI 待連線"}
                      </Button>
                    </div>
                    <p key={`${suggestionKey}:${ideaIndex}:${aiSuggestions[suggestionKey] ? "ai" : "offline"}`}
                      className={`reference-note-swap mt-2 break-words font-hand text-xl ${currentTone.text}`}>
                      {currentReference}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button type="button" size="sm" variant="outline"
                        onClick={() => updateWork({ mnemonic: currentReference, rating: undefined, bookmarked: false })}
                        className={`w-full rounded-full bg-white/75 font-bold sm:w-auto ${currentTone.apply}`}>
                        <WandSparkles className="h-3.5 w-3.5" /> 套用這句
                      </Button>
                      <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto" aria-label="切換參考答案風格">
                        {references.map((_, referenceIndex) => {
                          const tone = REFERENCE_TONES[referenceIndex] ?? REFERENCE_TONES[0];
                          return (
                          <button key={referenceIndex} type="button" onClick={() => selectReferenceTone(referenceIndex)}
                            aria-label={`切換成${tone.label}參考答案：${tone.tip}`}
                            title={tone.tip}
                            className={`min-h-10 rounded-xl border-2 px-2 py-1 text-xs font-bold transition-all active:scale-95 sm:min-w-24 ${referenceIndex === ideaIndex ? tone.active : tone.inactive}`}>
                            <span aria-hidden="true">{tone.emoji}</span> {tone.label}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm font-bold text-amber-900 mb-2">寫下你的口訣（唸出來測試一下順不順口）：</p>
            <Textarea
              value={current.mnemonic ?? ""}
              onChange={(e) => updateWork({ mnemonic: e.target.value, rating: undefined })}
              placeholder={`例：${current.style?.example ?? "ambulance → 俺不能死"}`}
              className="bg-white/80 border-amber-300 min-h-24 text-base"
            />
            {current.mnemonic?.trim() && current.style && (
              <div className="mt-3 rounded-xl bg-white/45 p-3">
                <p className="mb-2 text-sm font-bold text-amber-900">這句好不好記？</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1" aria-label="好記度評分">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button key={rating} type="button" onClick={() => rateCurrent(rating)}
                        aria-label={`${rating} 顆星`}
                        className="rounded-full p-1.5 hover:bg-amber-100 active:scale-90">
                        <Star className={`h-5 w-5 ${rating <= (current.rating ?? 0) ? "fill-amber-500 text-amber-600" : "text-amber-500"}`} />
                      </button>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={toggleBookmark}
                    className="rounded-full border-amber-400 bg-white/70 font-bold text-amber-800">
                    <Bookmark className={`h-4 w-4 ${current.bookmarked ? "fill-amber-600" : ""}`} />
                    {current.bookmarked ? "已收藏" : "收藏"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={discardCurrent}
                    className="rounded-full font-bold text-red-700 hover:bg-red-50 hover:text-red-800">
                    <Trash2 className="h-4 w-4" /> 淘汰重寫
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-stretch sm:justify-end mt-4">
              <Button onClick={nextCreate} disabled={!current.mnemonic?.trim()}
                className="w-full font-display font-bold rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.97] transition-transform sm:w-auto">
                {idx < works.length - 1 ? "下一個知識點" : "進入提取測驗"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === "quiz" && current && (
        <div>
          <p className="font-hand text-2xl text-pink-600 mb-1">step 3 — 立即提取測驗 🩷</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <EyeOff className="w-7 h-7 text-pink-600" /> 只看口訣，想起知識點
          </h1>
          <p className="text-muted-foreground mb-6">第 {idx + 1} / {works.length} 題 · 目前連擊 <b className="text-primary">×{combo}</b></p>

          <div className="sticky-note sticky-pink-bg p-6 max-w-2xl relative tilt-r">
            <div className="washi washi-pink" />
            <p className="text-sm text-pink-900 font-bold mb-1">你剛剛寫的口訣：</p>
            <p className="font-hand text-2xl text-pink-800 mb-4">"{current.mnemonic}"</p>

            <div className="crayon-dashed p-5 text-center bg-white/50 rounded-lg">
              {!revealed ? (
                <>
                  <p className="font-display font-bold text-lg mb-1">這句口訣對應的知識點是什麼？意思是？</p>
                  <p className="text-sm text-muted-foreground mb-4">先完整說出來，再翻開檢查。</p>
                  <Button onClick={() => setRevealed(true)} variant="outline"
                    className="font-display font-bold rounded-full border-2 border-pink-600 text-pink-700 hover:bg-pink-600 hover:text-white active:scale-[0.97] transition-all">
                    翻開答案
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="font-display font-extrabold text-2xl text-pink-700 mb-1">{current.item.term}</h2>
                  <p className="mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => answer(true)}
                      className="font-display font-bold rounded-full bg-pink-600 hover:bg-pink-700 active:scale-[0.97] transition-transform">
                      ✅ 我想起來了
                    </Button>
                    <Button onClick={() => answer(false)} variant="outline"
                      className="font-display font-bold rounded-full border-2 active:scale-[0.97] transition-transform">
                      😅 想不起來
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="relative inline-block mb-4">
            <img src={STAMP} alt="任務完成印章" className="w-28 h-28 mx-auto stamp-in" />
            <span className="club-seal absolute -right-20 top-4 hidden sm:inline-flex">記憶<br/>手帳社<br/>認證</span>
          </div>
          <p className="font-hand text-3xl text-primary mb-1">mnemonic master!</p>
          <h1 className="font-display font-extrabold text-3xl mb-3">口訣創作完成，蓋章！</h1>
          <p className="text-muted-foreground mb-8">
            提取正確 <b className="text-primary">{correctCount} / {works.length}</b> · 最佳連擊 <b className="text-primary">×{bestCombo}</b>
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "音韻迴路", v: "+2", c: "bg-[#FDE68A] text-amber-900" },
              { label: "跨域連結", v: "+2", c: "bg-[#FBCFE8] text-pink-900" },
              { label: "主動回想", v: "+1", c: "bg-teal-100 text-teal-900" },
            ].map((s, i) => (
              <div key={s.label} className={`paper-card ${i % 2 ? "tilt-r" : "tilt-l2"} p-4 relative`}>
                <span className={`tape-corner ${i % 2 ? "tape-tr" : "tape-tl"}`} />
                <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${s.c}`}>{s.label}</p>
                <p className="font-display font-extrabold text-2xl text-primary">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="text-left mb-10">
            <h2 className="font-display font-bold text-xl mb-1">你的口訣手帳</h2>
            <p className="doodle-note text-xl mb-4">下次考前，唸一遍就全回來了 ✎</p>
            <div className="space-y-3">
              {works.map((w, i) => (
                <div key={w.item.id} className={`${i % 2 ? "sticky-note sticky-pink-bg tilt-r" : "sticky-note sticky-yellow-bg tilt-l2"} p-4 flex items-start gap-3`}>
                  <span className="text-2xl">{w.recalled ? "✅" : "🔁"}</span>
                  <div>
                    <p className="font-display font-bold">{w.item.term} <span className="text-muted-foreground font-normal text-sm">— {w.item.hint}</span></p>
                    <p className="font-hand text-lg text-muted-foreground">{w.style?.emoji} "{w.mnemonic}"</p>
                    {(w.rating || w.bookmarked) && (
                      <p className="mt-1 text-xs font-bold text-amber-700">
                        {w.rating ? `好記度 ${"★".repeat(w.rating)}${"☆".repeat(5 - w.rating)}` : "尚未評分"}
                        {w.bookmarked ? " · 🔖 已收藏" : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => {
              try {
                downloadMnemonicShareCard(works.map((w) => ({
                  term: w.item.term,
                  hint: w.item.hint,
                  mnemonic: w.mnemonic ?? "",
                  rating: w.rating,
                })));
                toast.success("分享卡已下載");
              } catch {
                toast.error("分享卡下載失敗，請稍後再試");
              }
            }} size="lg" variant="outline" className="font-display font-bold rounded-full px-8 border-2 active:scale-[0.97] transition-transform">
              <Download className="w-4 h-4" /> 下載成果分享卡
            </Button>
            <Button onClick={restart} size="lg" className="font-display font-bold rounded-full px-8 active:scale-[0.97] transition-transform">
              <RotateCcw className="w-4 h-4" /> 再來一輪
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="font-display font-bold rounded-full px-8 border-2 active:scale-[0.97] transition-transform">
                <HomeIcon className="w-4 h-4" /> 回首頁
              </Button>
            </Link>
          </div>
        </div>
      )}
    </TrainShell>
  );
}
