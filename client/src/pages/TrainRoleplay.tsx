/**
 * 風格備忘：手帳拼貼學院 — 情境式 AI 劇本殺
 * 亮黃 = 情境/劇本設定；玫瑰粉 = 劇情演出；teal 印章 = 完成
 * 流程：選卡包 → 選劇本 → 5 個核心詞逐個觸發劇情（角色扮演演出）→ 結案回想 → 蓋章結算
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drama, ArrowRight, EyeOff, RotateCcw, Home as HomeIcon } from "lucide-react";
import { type SubjectPack, type KnowledgeItem } from "@/lib/gameData";
import { ROLEPLAY_SCRIPTS, addTemplateStats, takeItems, type RoleplayScript } from "@/lib/templateData";
import PackPicker from "@/components/PackPicker";
import TrainShell from "@/components/TrainShell";

const STAMP = "/manus-storage/stamp-success_0e7612b4.png";

type Phase = "pack" | "script" | "play" | "recall" | "result";

interface Work {
  item: KnowledgeItem;
  line?: string; // 玩家的劇情演出台詞
  recalled?: boolean | null;
}

const STEPS = [
  { id: "pack", label: "選卡包" },
  { id: "script", label: "選劇本" },
  { id: "play", label: "劇情演出" },
  { id: "recall", label: "結案回想" },
  { id: "result", label: "蓋章結算" },
];

const stepColor = (id: string) =>
  id === "script" ? "bg-[#FDE68A] text-amber-900" :
  id === "play" ? "bg-[#FBCFE8] text-pink-900" :
  id === "result" ? "bg-teal-100 text-teal-900" :
  "bg-[#E7D8BC] text-yellow-950";

export default function TrainRoleplay() {
  const [phase, setPhase] = useState<Phase>("pack");
  const [script, setScript] = useState<RoleplayScript | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const current = works[idx];

  const startPack = (p: SubjectPack) => {
    setWorks(takeItems(p.items, 5).map((item) => ({ item, recalled: null })));
    setIdx(0);
    setPhase("script");
  };

  const updateWork = (patch: Partial<Work>) => {
    setWorks((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const nextPlay = () => {
    if (idx < works.length - 1) setIdx(idx + 1);
    else { setIdx(0); setRevealed(false); setPhase("recall"); }
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
        [{ label: "情境編碼", value: 3 }, { label: "即時輸出", value: 2 }, { label: "故事綁定", value: 1 }],
        "roleplayRuns",
      );
      setPhase("result");
    }
  };

  const restart = () => {
    setPhase("pack"); setScript(null); setWorks([]); setIdx(0);
    setCombo(0); setBestCombo(0); setRevealed(false);
  };

  const correctCount = useMemo(() => works.filter((w) => w.recalled).length, [works]);

  return (
    <TrainShell title="情境式劇本殺" steps={STEPS} stepIndex={stepIndex} stepColor={stepColor} badge={`combo ×${combo}`}>
      {phase === "pack" && (
        <div>
          <p className="font-hand text-2xl text-primary mb-1">step 1 — gather the clues 🎭</p>
          <h1 className="font-display font-extrabold text-3xl mb-2">挑一包知識點，當今晚的核心詞</h1>
          <p className="text-muted-foreground mb-6">會取卡包的前 5 個知識點做成 5 個核心詞——每個都會在劇情裡觸發一段戲。</p>
          <PackPicker onPick={startPack} note="入戲越深，記得越牢 ✎" />
        </div>
      )}

      {phase === "script" && (
        <div>
          <p className="font-hand text-2xl text-amber-600 mb-1">step 2 — 亮黃便利貼時間 🟡</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <Drama className="w-7 h-7 text-amber-600" /> 選一個今晚的劇本
          </h1>
          <p className="text-muted-foreground mb-6">你的 {works.length} 個核心詞：{works.map((w) => `「${w.item.term}」`).join("、")}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {ROLEPLAY_SCRIPTS.map((sc, i) => (
              <button key={sc.id} onClick={() => { setScript(sc); setPhase("play"); }}
                className={`paper-card ${i % 2 === 0 ? "tilt-l2" : "tilt-r"} p-6 text-left group relative`}>
                <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
                <div className="text-4xl mb-3">{sc.emoji}</div>
                <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">{sc.name}</h3>
                <p className="text-sm mb-1"><b>你的角色：</b>{sc.role}</p>
                <p className="text-sm text-muted-foreground mb-2">{sc.setting}</p>
                <p className="font-hand text-lg text-amber-700">{sc.mission}</p>
                <span className="doodle-note text-xl inline-flex items-center gap-1 mt-2">開演 <ArrowRight className="w-4 h-4" /></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "play" && current && script && (
        <div>
          <p className="font-hand text-2xl text-pink-600 mb-1">step 3 — 玫瑰粉便利貼時間 🩷</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            {script.emoji} 第 {idx + 1} 幕 · 核心詞觸發！
          </h1>
          <p className="text-muted-foreground mb-1">{script.role} · 核心詞 {idx + 1} / {works.length}</p>
          <p className="doodle-note text-xl mb-4">大聲唸出你的台詞，效果翻倍 →</p>

          <div className="sticky-note sticky-pink-bg p-6 max-w-2xl relative tilt-r">
            <div className="washi washi-pink" />
            <p className="text-sm text-pink-900 font-bold mb-1">劇情：</p>
            <p className="text-pink-800 mb-4">{script.setting}。此刻，核心詞 <b className="font-display text-lg">「{current.item.term}」</b> 出現了——{script.mission.split("——")[1] ?? script.mission}</p>

            <div className="sticky-note sticky-yellow-bg p-3 mb-4 tilt-l2 max-w-md">
              <p className="text-xs font-bold text-amber-900 mb-0.5">📎 線索備忘（演完就會收走）</p>
              <p className="text-sm text-amber-800">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>
            </div>

            <p className="text-sm font-bold text-pink-900 mb-2">以「{script.role.replace("你是", "")}」的身分，說一段包含「{current.item.term}」和它意義的台詞：</p>
            <Textarea
              value={current.line ?? ""}
              onChange={(e) => updateWork({ line: e.target.value })}
              placeholder={`例：各位，這個「${current.item.term}」正是關鍵——它其實是${current.item.hint}，所以…`}
              className="bg-white/80 border-pink-300 min-h-24"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={nextPlay} disabled={!current.line?.trim()}
                className="font-display font-bold rounded-full bg-pink-600 hover:bg-pink-700 active:scale-[0.97] transition-transform">
                {idx < works.length - 1 ? "下一幕" : "進入結案回想"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === "recall" && current && script && (
        <div>
          <p className="font-hand text-2xl text-primary mb-1">step 4 — 結案時刻 🔍</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            <EyeOff className="w-7 h-7 text-primary" /> 回顧劇情，說出每個核心詞的真相
          </h1>
          <p className="text-muted-foreground mb-6">第 {idx + 1} / {works.length} 個核心詞 · 目前連擊 <b className="text-primary">×{combo}</b></p>

          <div className="paper-card tilt-l2 p-6 max-w-2xl relative">
            <div className="washi" />
            <span className="tape-corner tape-tr" />
            <p className="text-sm text-muted-foreground mb-1">你的線索：</p>
            <p className="text-lg mb-1">{script.emoji} 第 {idx + 1} 幕 · 核心詞 <b>「{current.item.term}」</b></p>
            {current.line && <p className="font-hand text-xl text-muted-foreground mb-1">你當時說："{current.line}"</p>}

            <div className="crayon-dashed mt-5 p-5 text-center">
              {!revealed ? (
                <>
                  <p className="font-display font-bold text-lg mb-1">「{current.item.term}」的意義是什麼？</p>
                  <p className="text-sm text-muted-foreground mb-4">不看備忘，像做結案陳詞一樣完整說出來。</p>
                  <Button onClick={() => setRevealed(true)} variant="outline"
                    className="font-display font-bold rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.97] transition-all">
                    翻開真相
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="font-display font-extrabold text-2xl text-primary mb-1">{current.item.term}</h2>
                  <p className="mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => answer(true)}
                      className="font-display font-bold rounded-full bg-primary active:scale-[0.97] transition-transform">
                      ✅ 我說對了
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

      {phase === "result" && script && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="relative inline-block mb-4">
            <img src={STAMP} alt="任務完成印章" className="w-28 h-28 mx-auto stamp-in" />
            <span className="club-seal absolute -right-20 top-4 hidden sm:inline-flex">記憶<br/>手帳社<br/>認證</span>
          </div>
          <p className="font-hand text-3xl text-primary mb-1">case closed!</p>
          <h1 className="font-display font-extrabold text-3xl mb-3">劇本殺結案，蓋章！</h1>
          <p className="text-muted-foreground mb-8">
            真相還原 <b className="text-primary">{correctCount} / {works.length}</b> · 最佳連擊 <b className="text-primary">×{bestCombo}</b>
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "情境編碼", v: "+3", c: "bg-[#FDE68A] text-amber-900" },
              { label: "即時輸出", v: "+2", c: "bg-orange-100 text-orange-900" },
              { label: "故事綁定", v: "+1", c: "bg-[#FBCFE8] text-pink-900" },
            ].map((s, i) => (
              <div key={s.label} className={`paper-card ${i % 2 ? "tilt-r" : "tilt-l2"} p-4 relative`}>
                <span className={`tape-corner ${i % 2 ? "tape-tr" : "tape-tl"}`} />
                <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${s.c}`}>{s.label}</p>
                <p className="font-display font-extrabold text-2xl text-primary">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="text-left mb-10">
            <h2 className="font-display font-bold text-xl mb-1">你的劇本手帳 · {script.emoji} {script.name}</h2>
            <p className="doodle-note text-xl mb-4">重看一遍自己的台詞，記憶再加固一層 ✎</p>
            <div className="space-y-3">
              {works.map((w, i) => (
                <div key={w.item.id} className={`${i % 2 ? "sticky-note sticky-pink-bg tilt-r" : "sticky-note sticky-yellow-bg tilt-l2"} p-4 flex items-start gap-3`}>
                  <span className="text-2xl">{w.recalled ? "✅" : "🔁"}</span>
                  <div>
                    <p className="font-display font-bold">第 {i + 1} 幕 · {w.item.term} <span className="text-muted-foreground font-normal text-sm">— {w.item.hint}</span></p>
                    {w.line && <p className="font-hand text-lg text-muted-foreground">"{w.line}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={restart} size="lg" className="font-display font-bold rounded-full px-8 active:scale-[0.97] transition-transform">
              <RotateCcw className="w-4 h-4" /> 換個劇本再來
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
