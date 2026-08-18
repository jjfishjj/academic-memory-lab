/**
 * 風格備忘：手帳拼貼學院 — 遊戲頁為「攤開的書桌」場景
 * 亮黃 = 情境鉤子步驟；玫瑰粉 = 情感故事步驟；teal 印章 = 完成
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, MapPin, Heart, EyeOff, RotateCcw, Home as HomeIcon, Plus, Trash2, Sparkles } from "lucide-react";
import {
  SUBJECT_PACKS, CAMPUS_SCENES, EMOTIONS,
  createSessionItems,
  loadStats, saveStats,
  loadCustomPacks, deleteCustomPack,
  type SubjectPack, type CampusScene, type Emotion, type KnowledgeItem,
} from "@/lib/gameData";
import CustomPackBuilder from "@/components/CustomPackBuilder";

const LOGO = `${import.meta.env.BASE_URL}assets/memodesk-logo_c083e7cf.png`;
const STAMP = `${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`;
const CAMPUS = `${import.meta.env.BASE_URL}assets/scene-campus_32525752.png`;

type Phase = "pack" | "hook" | "story" | "recall" | "result";

interface ItemWork {
  item: KnowledgeItem;
  spot?: string;      // 掛鉤物件
  hookNote?: string;  // 情境畫面描述
  emotion?: Emotion;  // 情緒
  storyNote?: string; // 迷你故事
  recalled?: boolean | null; // 回想結果
}

const PHASE_STEPS: { id: Phase; label: string }[] = [
  { id: "pack", label: "選學科包" },
  { id: "hook", label: "情境掛鉤" },
  { id: "story", label: "情感故事" },
  { id: "recall", label: "遮蓋回想" },
  { id: "result", label: "蓋章結算" },
];

export default function Game() {
  const [phase, setPhase] = useState<Phase>("pack");
  const [pack, setPack] = useState<SubjectPack | null>(null);
  const [scene, setScene] = useState<CampusScene | null>(null);
  const [customPacks, setCustomPacks] = useState<SubjectPack[]>(() => loadCustomPacks());
  const [building, setBuilding] = useState(false);
  const [customSceneName, setCustomSceneName] = useState("");
  const [customSpot, setCustomSpot] = useState("");
  const [works, setWorks] = useState<ItemWork[]>([]);
  const [idx, setIdx] = useState(0); // 目前處理的知識點索引
  const [revealed, setRevealed] = useState(false); // 回想階段是否已翻開
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const phaseIndex = PHASE_STEPS.findIndex((p) => p.id === phase);
  const progress = ((phaseIndex) / (PHASE_STEPS.length - 1)) * 100;

  const startPack = (p: SubjectPack) => {
    setPack(p);
    const sessionItems = createSessionItems(p.items, p.sessionSize ?? 6);
    setWorks(sessionItems.map((item) => ({ item, recalled: null })));
    setIdx(0);
    setPhase("hook");
  };

  const current = works[idx];

  const updateWork = (patch: Partial<ItemWork>) => {
    setWorks((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const nextItemOr = (nextPhase: Phase) => {
    setCustomSpot("");
    if (idx < works.length - 1) {
      setIdx(idx + 1);
    } else {
      setIdx(0);
      setRevealed(false);
      setPhase(nextPhase);
    }
  };

  const answerRecall = (ok: boolean) => {
    updateWork({ recalled: ok });
    const newCombo = ok ? combo + 1 : 0;
    setCombo(newCombo);
    setBestCombo((b) => Math.max(b, newCombo));
    setRevealed(false);
    if (idx < works.length - 1) {
      setIdx(idx + 1);
    } else {
      finishRun(ok ? newCombo : bestCombo);
      setPhase("result");
    }
  };

  const finishRun = (finalBest: number) => {
    const s = loadStats();
    const correct = works.filter((w) => w.recalled).length + 1; // 最後一題尚未寫入 works
    s.情境編碼 += 3 + 1;
    s.故事綁定 += 3;
    s.主動回想 += 2;
    s.即時輸出 += 1 + 2;
    s.completedRuns += 1;
    s.bestCombo = Math.max(s.bestCombo, finalBest, bestCombo);
    saveStats(s);
    void correct;
  };

  const restart = () => {
    setPhase("pack"); setPack(null); setScene(null);
    setWorks([]); setIdx(0); setCombo(0); setBestCombo(0); setRevealed(false);
    setBuilding(false); setCustomSceneName(""); setCustomSpot("");
    setCustomPacks(loadCustomPacks());
  };

  const removeCustomPack = (id: string) => {
    deleteCustomPack(id);
    setCustomPacks(loadCustomPacks());
  };

  const startCustomScene = () => {
    const n = customSceneName.trim();
    if (!n) return;
    setScene({ id: `custom-${Date.now()}`, name: n, emoji: "⭐", spots: [] });
  };

  const correctCount = useMemo(() => works.filter((w) => w.recalled).length, [works]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 頂欄 */}
      <header className="sticky top-0 z-40 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> 回首頁
          </Link>
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="" className="w-6 h-6" />
            <span className="font-display font-bold text-sm">記憶手帳社 · 雙卡記憶任務</span>
          </div>
          <span className="font-hand text-lg text-primary">combo ×{combo}</span>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* 步驟指示：像貼在筆記本頁緣的索引標籤 */}
      <div className="container pt-6">
        <div className="flex flex-wrap items-end gap-1.5 text-xs font-bold">
          {PHASE_STEPS.map((s, i) => {
            const stepColor =
              s.id === "hook" ? "bg-[#FDE68A] text-amber-900" :
              s.id === "story" ? "bg-[#FBCFE8] text-pink-900" :
              s.id === "result" ? "bg-teal-100 text-teal-900" :
              "bg-[#E7D8BC] text-yellow-950";
            return (
              <span key={s.id}
                className={`px-3.5 pt-1.5 rounded-t-lg border border-b-0 border-border/70 transition-all ${stepColor} ${i === phaseIndex ? "pb-2.5 shadow-sm -translate-y-0.5" : i < phaseIndex ? "pb-1 opacity-80" : "pb-1 opacity-45"}`}
                style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)` }}>
                {i < phaseIndex ? "✓ " : ""}{s.label}
              </span>
            );
          })}
        </div>
        <div className="border-b-2 border-dashed border-border -mx-1" />
      </div>

      <main className="container flex-1 py-8 max-w-4xl notebook-lines">
        {/* Phase 0：選學科包 */}
        {phase === "pack" && (
          <div>
            <p className="font-hand text-2xl text-primary mb-1">step 1 — pick your pain 🎒</p>
            <h1 className="font-display font-extrabold text-3xl mb-2">先挑一包最讓你頭痛的</h1>
            <p className="text-muted-foreground mb-8">放心，等一下我們會一起把它們變好記。也可以把「你自己的筆記」做成卡包。</p>

            {building ? (
              <CustomPackBuilder
                onCreated={(p) => { setBuilding(false); setCustomPacks(loadCustomPacks()); startPack(p); }}
                onCancel={() => setBuilding(false)}
              />
            ) : (
            <>
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
                  <p className="text-sm text-amber-800">把你的單字表、筆記、考點貼進來，變成專屬任務卡包（會存在你的瀏覽器）</p>
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
                      <p className="text-xs font-bold text-primary mb-3">題庫 {p.items.length} 題 · 本回合隨機抽 {Math.min(p.sessionSize ?? 6, p.items.length)} 題</p>
                      <button onClick={() => startPack(p)} className="doodle-note text-xl inline-flex items-center gap-1 hover:text-primary transition-colors">
                        開始任務 <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="doodle-note text-xl mb-3">starter packs — 官方練習包 ✎</p>
            <div className="grid md:grid-cols-3 gap-6">
              {SUBJECT_PACKS.map((p, i) => (
                <button key={p.id} onClick={() => startPack(p)}
                  className={`paper-card ${i % 2 === 0 ? "tilt-l" : "tilt-r"} p-6 text-left group relative`}>
                  <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
                  <div className="text-4xl mb-3">{p.emoji}</div>
                  <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
                  <p className="text-xs font-bold text-primary mb-3">題庫 {p.items.length} 題 · 本回合隨機抽 {Math.min(p.sessionSize ?? 6, p.items.length)} 題</p>
                  <span className="doodle-note text-xl inline-flex items-center gap-1">就決定是你了 <ArrowRight className="w-4 h-4" /></span>
                </button>
              ))}
            </div>
            <p className="doodle-note text-2xl mt-10 text-center">↑ 越怕哪包，越該選哪包 ↑</p>
            </>
            )}
          </div>
        )}

        {/* Phase 1：情境掛鉤 */}
        {phase === "hook" && pack && (
          <div>
            <p className="font-hand text-2xl text-amber-600 mb-1">step 2 — 亮黃便利貼時間 🟡</p>
            <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
              <MapPin className="w-7 h-7 text-amber-600" /> 把知識掛進校園角落
            </h1>

            {!scene ? (
              <>
                <p className="text-muted-foreground mb-6">閉上眼想一個你每天都會經過的地方——等一下這 {works.length} 個知識點都會搬進去住。</p>
                <div className="paper-card tilt-r relative max-w-md mb-8 overflow-hidden hidden md:block">
                  <span className="tape-corner tape-tl" />
                  <img src={CAMPUS} alt="手繪校園地圖" className="w-full h-36 object-cover rounded-md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {CAMPUS_SCENES.map((s, i) => (
                    <button key={s.id} onClick={() => setScene(s)}
                      className={`paper-card ${i % 2 === 0 ? "tilt-l2" : "tilt-r"} p-5 text-center group relative`}>
                      <span className={`tape-corner ${i % 2 === 0 ? "tape-tr" : "tape-tl"}`} />
                      <div className="text-4xl mb-2">{s.emoji}</div>
                      <p className="font-display font-bold group-hover:text-primary transition-colors">{s.name}</p>
                    </button>
                  ))}
                </div>

                {/* 自訂場景 */}
                <div className="sticky-note sticky-yellow-bg tilt-l2 p-5 mt-6 max-w-xl relative">
                  <div className="washi washi-yellow" />
                  <p className="font-display font-bold text-amber-900 mb-1">⭐ 或者，寫一個你自己的地方</p>
                  <p className="text-sm text-amber-800 mb-3">越熟悉越好——你的房間、通勤路線、打工的店、常去的咖啡廳…</p>
                  <div className="flex gap-2">
                    <Input value={customSceneName} onChange={(e) => setCustomSceneName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") startCustomScene(); }}
                      placeholder="例：我的房間、捷運通勤路上…" className="bg-white/80 border-amber-300 flex-1" />
                    <Button onClick={startCustomScene} disabled={!customSceneName.trim()}
                      className="font-display font-bold rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.97] transition-transform shrink-0">
                      就是這裡 <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : current && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  場景：{scene.emoji} {scene.name} · 便利貼 {idx + 1} / {works.length} 張
                </p>
                <p className="doodle-note text-xl mb-4">貼得越怪，記得越牢 →</p>
                <div className="sticky-note sticky-yellow-bg p-6 max-w-2xl relative tilt-l2">
                  <div className="washi washi-yellow" />
                  <h2 className="font-display font-extrabold text-2xl text-amber-900 mb-1">{current.item.term}</h2>
                  <p className="text-amber-800 mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>

                  <p className="text-sm font-bold text-amber-900 mb-2">你想把它掛在{scene.name}的哪裡？</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {scene.spots.map((spot) => (
                      <button key={spot} onClick={() => updateWork({ spot })}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all active:scale-[0.96] ${current.spot === spot ? "bg-amber-500 text-white border-amber-600" : "bg-white/70 border-amber-300 text-amber-900 hover:border-amber-500"}`}>
                        {spot}
                      </button>
                    ))}
                  </div>

                  {/* 自訂掛鉤位置 */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={current.spot && !scene.spots.includes(current.spot) ? current.spot : customSpot}
                      onChange={(e) => { setCustomSpot(e.target.value); updateWork({ spot: e.target.value.trim() || undefined }); }}
                      placeholder={scene.spots.length > 0 ? "或自己寫一個位置：例如窗台、書桌抽屜…" : "寫一個這裡的具體位置：例如門把、書桌、鏡子前…"}
                      className="bg-white/80 border-amber-300 border-dashed flex-1"
                    />
                  </div>

                  <p className="text-sm font-bold text-amber-900 mb-2">用一句話描述你腦中的畫面（越具體、越誇張越好）：</p>
                  <Textarea
                    value={current.hookNote ?? ""}
                    onChange={(e) => updateWork({ hookNote: e.target.value })}
                    placeholder={`例：${current.spot || scene.spots[0] || scene.name}上貼著一張寫著「${current.item.term}」的紙條，每次經過都會看到…`}
                    className="bg-white/80 border-amber-300 min-h-20"
                  />
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => nextItemOr("story")} disabled={!current.spot}
                      className="font-display font-bold rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.97] transition-transform">
                      {idx < works.length - 1 ? "下一個知識點" : "進入情感故事"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 2：情感故事 */}
        {phase === "story" && current && scene && (
          <div>
            <p className="font-hand text-2xl text-pink-600 mb-1">step 3 — 玫瑰粉便利貼時間 🩷</p>
            <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
              <Heart className="w-7 h-7 text-pink-600" /> 給它一段有情緒的故事
            </h1>
            <p className="text-muted-foreground mb-1">便利貼 {idx + 1} / {works.length} 張 · 已掛在：{scene.emoji} {scene.name} 的「{current.spot}」</p>
            <p className="doodle-note text-xl mb-5">情緒是大腦的螢光筆 ✎</p>

            <div className="sticky-note sticky-pink-bg p-6 max-w-2xl relative tilt-r">
              <div className="washi washi-pink" />
              <h2 className="font-display font-extrabold text-2xl text-pink-900 mb-1">{current.item.term}</h2>
              <p className="text-pink-800 mb-4">{current.item.hint}</p>

              <p className="text-sm font-bold text-pink-900 mb-2">選一種情緒當記憶螢光筆：</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EMOTIONS.map((em) => (
                  <button key={em.id} onClick={() => updateWork({ emotion: em })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all active:scale-[0.96] ${current.emotion?.id === em.id ? "bg-pink-500 text-white border-pink-600" : "bg-white/70 border-pink-300 text-pink-900 hover:border-pink-500"}`}>
                    {em.emoji} {em.name}
                  </button>
                ))}
              </div>

              <p className="text-sm font-bold text-pink-900 mb-2">接著故事開頭，編一句迷你故事（把「{current.spot}」寫進去更好）：</p>
              {current.emotion && (
                <p className="font-hand text-xl text-pink-700 mb-2">"{current.emotion.storyStarter}…"</p>
              )}
              <Textarea
                value={current.storyNote ?? ""}
                onChange={(e) => updateWork({ storyNote: e.target.value })}
                placeholder={`例：${current.emotion?.storyStarter ?? "我萬萬沒想到，"}${current.spot ?? "那個角落"}竟然和「${current.item.term}」扯上了關係…`}
                className="bg-white/80 border-pink-300 min-h-20"
              />
              <div className="flex justify-end mt-4">
                <Button onClick={() => nextItemOr("recall")} disabled={!current.emotion}
                  className="font-display font-bold rounded-full bg-pink-600 hover:bg-pink-700 active:scale-[0.97] transition-transform">
                  {idx < works.length - 1 ? "下一個知識點" : "進入遮蓋回想"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3：遮蓋回想 */}
        {phase === "recall" && current && scene && (
          <div>
            <p className="font-hand text-2xl text-primary mb-1">step 4 — 蓋上課本的時刻 🙈</p>
            <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
              <EyeOff className="w-7 h-7 text-primary" /> 關掉提示，只靠線索回想
            </h1>
            <p className="text-muted-foreground mb-6">
              第 {idx + 1} / {works.length} 題 · 目前連擊 <b className="text-primary">×{combo}</b>
            </p>

            <div className="paper-card tilt-l2 p-6 max-w-2xl relative">
              <div className="washi" />
              <span className="tape-corner tape-tr" />
              <p className="text-sm text-muted-foreground mb-1">你的線索：</p>
              <p className="text-lg mb-1">📍 {scene.emoji} {scene.name} · <b>{current.spot}</b></p>
              {current.emotion && <p className="text-lg mb-1">💗 情緒：{current.emotion.emoji} {current.emotion.name}</p>}
              {current.storyNote && <p className="font-hand text-xl text-muted-foreground mb-1">"{current.storyNote}"</p>}

              <div className="crayon-dashed mt-5 p-5 text-center">
                {!revealed ? (
                  <>
                    <p className="font-display font-bold text-lg mb-1">掛在這裡的知識點是什麼？它的意思是？</p>
                    <p className="text-sm text-muted-foreground mb-4">先在心裡（或出聲）完整說出來，再翻開檢查。</p>
                    <Button onClick={() => setRevealed(true)} variant="outline"
                      className="font-display font-bold rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.97] transition-all">
                      翻開答案
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="font-display font-extrabold text-2xl text-primary mb-1">{current.item.term}</h2>
                    <p className="mb-4">{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</p>
                    <p className="text-sm text-muted-foreground mb-3">剛才回想得如何？誠實面對，錯了才是練到。</p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => answerRecall(true)}
                        className="font-display font-bold rounded-full bg-primary active:scale-[0.97] transition-transform">
                        ✅ 我想起來了
                      </Button>
                      <Button onClick={() => answerRecall(false)} variant="outline"
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

        {/* Phase 4：結算 */}
        {phase === "result" && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="relative inline-block mb-4">
              <img src={STAMP} alt="任務完成印章" className="w-28 h-28 mx-auto stamp-in" />
              <span className="club-seal absolute -right-20 top-4 hidden sm:inline-flex">記憶<br/>手帳社<br/>認證</span>
            </div>
            <p className="font-hand text-3xl text-primary mb-1">mission complete!</p>
            <h1 className="font-display font-extrabold text-3xl mb-3">這頁手帳，完成蓋章！</h1>
            <p className="text-muted-foreground mb-8">
              回想正確 <b className="text-primary">{correctCount} / {works.length}</b> · 最佳連擊 <b className="text-primary">×{bestCombo}</b>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "情境編碼", v: "+4", c: "bg-[#FDE68A] text-amber-900" },
                { label: "故事綁定", v: "+3", c: "bg-[#FBCFE8] text-pink-900" },
                { label: "主動回想", v: "+2", c: "bg-teal-100 text-teal-900" },
                { label: "即時輸出", v: "+3", c: "bg-orange-100 text-orange-900" },
              ].map((s, i) => (
                <div key={s.label} className={`paper-card ${i % 2 ? "tilt-r" : "tilt-l2"} p-4 relative`}>
                  <span className={`tape-corner ${i % 2 ? "tape-tr" : "tape-tl"}`} />
                  <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${s.c}`}>{s.label}</p>
                  <p className="font-display font-extrabold text-2xl text-primary">{s.v}</p>
                </div>
              ))}
            </div>

            {/* 成果手帳回顧 */}
            <div className="text-left mb-10">
              <h2 className="font-display font-bold text-xl mb-1">你的記憶手帳</h2>
              <p className="doodle-note text-xl mb-4">這一頁是你親手做出來的，捨不得忘 ✎</p>
              <div className="space-y-3">
                {works.map((w, i) => (
                  <div key={w.item.id} className={`${i % 2 ? "sticky-note sticky-pink-bg tilt-r" : "sticky-note sticky-yellow-bg tilt-l2"} p-4 flex items-start gap-3`}>
                    <span className="text-2xl">{w.recalled ? "✅" : "🔁"}</span>
                    <div>
                      <p className="font-display font-bold">{w.item.term} <span className="text-muted-foreground font-normal text-sm">— {w.item.hint}</span></p>
                      <p className="text-sm text-muted-foreground">📍 {scene?.name} · {w.spot} {w.emotion ? `· ${w.emotion.emoji} ${w.emotion.name}` : ""}</p>
                      {w.storyNote && <p className="font-hand text-lg text-muted-foreground">"{w.storyNote}"</p>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">💡 建議：明天路過「{scene?.name}」時，試著在原地再回想一次——間隔重複 × 場景重現，效果加倍。</p>
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
      </main>
    </div>
  );
}
