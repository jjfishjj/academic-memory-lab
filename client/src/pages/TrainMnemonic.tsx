/**
 * 風格備忘：手帳拼貼學院 — 諧音迷因與口訣創作家
 * 亮黃便利貼 = 創作提示；玫瑰粉 = 迷因/情緒梗；teal 印章 = 完成
 * 流程：選卡包 → 逐個知識點創作口訣（選風格 + 寫口訣）→ 立即提取測驗 → 蓋章結算
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, ArrowRight, EyeOff, RotateCcw, Home as HomeIcon, Lightbulb, RefreshCw, WandSparkles } from "lucide-react";
import { type SubjectPack, type KnowledgeItem } from "@/lib/gameData";
import { MNEMONIC_STYLES, addTemplateStats, getMnemonicReferences, type MnemonicStyle } from "@/lib/templateData";
import PackPicker from "@/components/PackPicker";
import TrainShell from "@/components/TrainShell";

const STAMP = `${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`;

type Phase = "pack" | "create" | "quiz" | "result";

interface Work {
  item: KnowledgeItem;
  style?: MnemonicStyle;
  mnemonic?: string;
  recalled?: boolean | null;
}

const STEPS = [
  { id: "pack", label: "選卡包" },
  { id: "create", label: "創作口訣" },
  { id: "quiz", label: "提取測驗" },
  { id: "result", label: "蓋章結算" },
];

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
  const [ideaIndex, setIdeaIndex] = useState(0);

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
    setIdeaIndex(0);
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
  const references = current?.style ? getMnemonicReferences(current.item, current.style) : [];
  const currentReference = references[ideaIndex % Math.max(references.length, 1)];

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

          <div className="sticky-note sticky-yellow-bg p-6 max-w-2xl relative tilt-l2">
            <div className="washi washi-yellow" />
            <h2 className="font-display font-extrabold text-2xl text-amber-900 mb-1">{current.item.term}</h2>
            <p className="text-amber-800 mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>

            <p className="text-sm font-bold text-amber-900 mb-2">先挑一種創作風格：</p>
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {MNEMONIC_STYLES.map((st) => (
                <button key={st.id} onClick={() => { updateWork({ style: st }); setIdeaIndex(0); }}
                  className={`p-3 rounded-lg text-left border-2 transition-all active:scale-[0.98] ${current.style?.id === st.id ? "bg-amber-500/15 border-amber-600" : "bg-white/70 border-amber-300 hover:border-amber-500"}`}>
                  <p className="font-bold text-sm text-amber-900">{st.emoji} {st.name}</p>
                  <p className="text-xs text-amber-800">{st.tip}</p>
                </button>
              ))}
            </div>
            {current.style && (
              <div className="mb-4 rounded-xl border-2 border-dashed border-amber-500 bg-white/55 p-4" aria-live="polite">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">參考答案 · 可以直接用，也可以改成你的版本</p>
                    <p className="mt-1 font-hand text-xl text-amber-900">{currentReference}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline"
                        onClick={() => updateWork({ mnemonic: currentReference })}
                        className="rounded-full border-amber-500 bg-white/70 font-bold text-amber-800 hover:bg-amber-100">
                        <WandSparkles className="h-3.5 w-3.5" /> 套用這句
                      </Button>
                      {references.length > 1 && (
                        <Button type="button" size="sm" variant="ghost"
                          onClick={() => setIdeaIndex((i) => (i + 1) % references.length)}
                          className="rounded-full font-bold text-amber-800 hover:bg-amber-100">
                          <RefreshCw className="h-3.5 w-3.5" /> 換一個靈感
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm font-bold text-amber-900 mb-2">寫下你的口訣（唸出來測試一下順不順口）：</p>
            <Textarea
              value={current.mnemonic ?? ""}
              onChange={(e) => updateWork({ mnemonic: e.target.value })}
              placeholder={`例：${current.style?.example ?? "ambulance → 俺不能死"}`}
              className="bg-white/80 border-amber-300 min-h-20"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={nextCreate} disabled={!current.mnemonic?.trim()}
                className="font-display font-bold rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.97] transition-transform">
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
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
