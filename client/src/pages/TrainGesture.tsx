/**
 * 風格備忘：手帳拼貼學院 — 微動作記憶法指南
 * 亮黃 = 動作設計提示；玫瑰粉 = 卡住提示；teal 印章 = 完成
 * 流程：選卡包 → 5 個知識點逐個綁定身體動作錨點 + 卡住提示 → 身體回想測驗 → 蓋章結算
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonStanding, ArrowRight, EyeOff, RotateCcw, Home as HomeIcon } from "lucide-react";
import { type SubjectPack, type KnowledgeItem } from "@/lib/gameData";
import { GESTURE_IDEAS, addTemplateStats, takeItems, type GestureIdea } from "@/lib/templateData";
import PackPicker from "@/components/PackPicker";
import TrainShell from "@/components/TrainShell";
import { recordTrainingSession } from "@/lib/unifiedStats";

const STAMP = `${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`;

type Phase = "pack" | "anchor" | "quiz" | "result";

interface Work {
  item: KnowledgeItem;
  ideaId?: string;    // 動作類型
  action?: string;    // 動作描述
  stuckHint?: string; // 卡住提示
  recalled?: boolean | null;
}

const STEPS = [
  { id: "pack", label: "選卡包" },
  { id: "anchor", label: "綁定動作錨點" },
  { id: "quiz", label: "身體回想" },
  { id: "result", label: "蓋章結算" },
];

const stepColor = (id: string) =>
  id === "anchor" ? "bg-[#FDE68A] text-amber-900" :
  id === "quiz" ? "bg-[#FBCFE8] text-pink-900" :
  id === "result" ? "bg-teal-100 text-teal-900" :
  "bg-[#E7D8BC] text-yellow-950";

export default function TrainGesture() {
  const [phase, setPhase] = useState<Phase>("pack");
  const [works, setWorks] = useState<Work[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const current = works[idx];
  const currentIdea: GestureIdea | undefined = GESTURE_IDEAS.find((g) => g.id === current?.ideaId);

  const startPack = (p: SubjectPack) => {
    setWorks(takeItems(p.items, 5).map((item) => ({ item, recalled: null })));
    setIdx(0);
    setPhase("anchor");
  };

  const updateWork = (patch: Partial<Work>) => {
    setWorks((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const nextAnchor = () => {
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
        [{ label: "情境編碼", value: 1 }, { label: "即時輸出", value: 2 }, { label: "主動回想", value: 2 }],
        "gestureRuns",
      );
      const correct = works.filter((work) => work.recalled).length + (ok ? 1 : 0);
      recordTrainingSession({ module: "gesture", label: "微動作記憶錨點", score: Math.round((correct / Math.max(1, works.length)) * 100), abilities: { "情境編碼": 1, "即時輸出": 2, "主動回想": 2 } });
      setPhase("result");
    }
  };

  const restart = () => {
    setPhase("pack"); setWorks([]); setIdx(0); setCombo(0); setBestCombo(0); setRevealed(false);
  };

  const correctCount = useMemo(() => works.filter((w) => w.recalled).length, [works]);

  return (
    <TrainShell title="微動作記憶法" steps={STEPS} stepIndex={stepIndex} stepColor={stepColor} badge={`combo ×${combo}`}>
      {phase === "pack" && (
        <div>
          <p className="font-hand text-2xl text-primary mb-1">step 1 — warm up 🤸</p>
          <h1 className="font-display font-extrabold text-3xl mb-2">挑一包要「綁在身上」的知識點</h1>
          <p className="text-muted-foreground mb-6">會取卡包的前 5 個知識點，各綁一個手勢、姿勢或小道具動作——身體記得比腦子牢。</p>
          <PackPicker onPick={startPack} note="真的把動作做出來，不要只用想的 ✎" />
        </div>
      )}

      {phase === "anchor" && current && (
        <div>
          <p className="font-hand text-2xl text-amber-600 mb-1">step 2 — 亮黃便利貼時間 🟡</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <PersonStanding className="w-7 h-7 text-amber-600" /> 給它綁一個動作錨點
          </h1>
          <p className="text-muted-foreground mb-1">錨點 {idx + 1} / {works.length} 個</p>
          <p className="doodle-note text-xl mb-4">邊做動作邊唸出知識點，做 3 次 →</p>

          <div className="sticky-note sticky-yellow-bg p-6 max-w-2xl relative tilt-l2">
            <div className="washi washi-yellow" />
            <h2 className="font-display font-extrabold text-2xl text-amber-900 mb-1">{current.item.term}</h2>
            <p className="text-amber-800 mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>

            <p className="text-sm font-bold text-amber-900 mb-2">先挑一種動作類型：</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {GESTURE_IDEAS.map((g) => (
                <button key={g.id} onClick={() => updateWork({ ideaId: g.id })}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all active:scale-[0.96] ${current.ideaId === g.id ? "bg-amber-500/20 border-amber-600 text-amber-900" : "bg-white/70 border-amber-300 hover:border-amber-500 text-amber-800"}`}>
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
            {currentIdea && <p className="font-hand text-xl text-amber-700 mb-3">{currentIdea.desc}</p>}

            <p className="text-sm font-bold text-amber-900 mb-1.5">描述你的動作（現在就做一次！）：</p>
            <Input value={current.action ?? ""} onChange={(e) => updateWork({ action: e.target.value })}
              placeholder="例：右手比出閃電形狀往下劈 = 鈉遇水爆炸"
              className="bg-white/80 border-amber-300 mb-4" />

            <div className="sticky-note sticky-pink-bg p-3 tilt-r max-w-md mb-2">
              <p className="text-xs font-bold text-pink-900 mb-1">🩷 卡住提示（考場上想不起來時，給自己的第一句暗號）</p>
              <Input value={current.stuckHint ?? ""} onChange={(e) => updateWork({ stuckHint: e.target.value })}
                placeholder="例：想想那個往下劈的手勢…和水有關…"
                className="bg-white/80 border-pink-300" />
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={nextAnchor} disabled={!current.action?.trim()}
                className="font-display font-bold rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.97] transition-transform">
                {idx < works.length - 1 ? "下一個錨點" : "進入身體回想"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === "quiz" && current && (
        <div>
          <p className="font-hand text-2xl text-pink-600 mb-1">step 3 — 身體回想測驗 🩷</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <EyeOff className="w-7 h-7 text-pink-600" /> 做出動作，想起知識點
          </h1>
          <p className="text-muted-foreground mb-6">第 {idx + 1} / {works.length} 題 · 目前連擊 <b className="text-primary">×{combo}</b></p>

          <div className="sticky-note sticky-pink-bg p-6 max-w-2xl relative tilt-r">
            <div className="washi washi-pink" />
            <p className="text-sm text-pink-900 font-bold mb-1">你設計的動作：</p>
            <p className="font-hand text-2xl text-pink-800 mb-2">🤸 "{current.action}"</p>
            {current.stuckHint && (
              <p className="text-sm text-pink-800 mb-3">卡住的話，唸出你的暗號：<i>"{current.stuckHint}"</i></p>
            )}

            <div className="crayon-dashed p-5 text-center bg-white/50 rounded-lg">
              {!revealed ? (
                <>
                  <p className="font-display font-bold text-lg mb-1">現在，真的把動作做一次——它綁的是哪個知識點？</p>
                  <p className="text-sm text-muted-foreground mb-4">連意思一起說出來，再翻開檢查。</p>
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
                      ✅ 身體記得！
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
          <p className="font-hand text-3xl text-primary mb-1">body remembers!</p>
          <h1 className="font-display font-extrabold text-3xl mb-3">動作錨點建立完成，蓋章！</h1>
          <p className="text-muted-foreground mb-8">
            身體回想成功 <b className="text-primary">{correctCount} / {works.length}</b> · 最佳連擊 <b className="text-primary">×{bestCombo}</b>
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "情境編碼", v: "+1", c: "bg-[#FDE68A] text-amber-900" },
              { label: "即時輸出", v: "+2", c: "bg-orange-100 text-orange-900" },
              { label: "主動回想", v: "+2", c: "bg-teal-100 text-teal-900" },
            ].map((s, i) => (
              <div key={s.label} className={`paper-card ${i % 2 ? "tilt-r" : "tilt-l2"} p-4 relative`}>
                <span className={`tape-corner ${i % 2 ? "tape-tr" : "tape-tl"}`} />
                <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${s.c}`}>{s.label}</p>
                <p className="font-display font-extrabold text-2xl text-primary">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="text-left mb-10">
            <h2 className="font-display font-bold text-xl mb-1">你的動作錨點手帳</h2>
            <p className="doodle-note text-xl mb-4">明天再把 5 個動作連做一遍，錨點會更深 ✎</p>
            <div className="space-y-3">
              {works.map((w, i) => (
                <div key={w.item.id} className={`${i % 2 ? "sticky-note sticky-pink-bg tilt-r" : "sticky-note sticky-yellow-bg tilt-l2"} p-4 flex items-start gap-3`}>
                  <span className="text-2xl">{w.recalled ? "✅" : "🔁"}</span>
                  <div>
                    <p className="font-display font-bold">{w.item.term} <span className="text-muted-foreground font-normal text-sm">— {w.item.hint}</span></p>
                    <p className="font-hand text-lg text-muted-foreground">🤸 "{w.action}"{w.stuckHint ? ` ｜卡住暗號："${w.stuckHint}"` : ""}</p>
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
