/**
 * 風格備忘：手帳拼貼學院 — 情境式 AI 劇本殺
 * 亮黃 = 情境/劇本設定；玫瑰粉 = 劇情演出；teal 印章 = 完成
 * 流程：選卡包 → 選劇本 → 5 個核心詞逐個觸發劇情（角色扮演演出）→ 結案回想 → 蓋章結算
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drama, ArrowRight, EyeOff, HelpCircle, Lightbulb, RotateCcw, Home as HomeIcon, Volume2, VolumeX, Award, Sparkles, PenLine, WandSparkles, Share2, Link2, Download, LibraryBig, FileUp, FileDown } from "lucide-react";
import { type SubjectPack, type KnowledgeItem } from "@/lib/gameData";
import { ROLEPLAY_SCRIPTS, addTemplateStats, takeItems, type RoleplayScript } from "@/lib/templateData";
import PackPicker from "@/components/PackPicker";
import TrainShell from "@/components/TrainShell";
import { playSfx, startAmbientSoundscape, stopAmbientSoundscape } from "@/lib/sfx";
import { recordTrainingSession } from "@/lib/unifiedStats";
import { assessRoleplayStamp, collectRoleplayStamp, getStampRarity, loadRoleplayStamps, newlyUnlockedMilestones, ROLEPLAY_MILESTONES, STAMP_RARITY_META, type RoleplayMilestone, type RoleplayStamp } from "@/lib/roleplayStamps";
import { createCustomRoleplay, loadCustomRoleplays, parseImportedCustomRoleplay, ROLEPLAY_TEMPLATE_LIBRARY, saveCustomRoleplay, serializeCustomRoleplay, type CustomRoleplay, type RoleplayTemplate } from "@/lib/customRoleplay";
import { buildRoleplayChallengeLink, parseRoleplayChallenge, shareRoleplayStampCard, type RoleplayChallengePayload } from "@/lib/roleplayShare";

const STAMP = `${import.meta.env.BASE_URL}assets/stamp-success_0e7612b4.png`;
const RARITY_CARD_STYLE = {
  common: "border-stone-400 bg-stone-50",
  rare: "border-teal-500 bg-teal-50",
  epic: "border-pink-500 bg-pink-50",
  legendary: "border-amber-500 bg-amber-50",
} as const;

type Phase = "pack" | "script" | "play" | "recall" | "result";

interface Work {
  item: KnowledgeItem;
  line?: string; // 玩家的劇情演出台詞
  recalled?: boolean | null;
  hintUsed?: number;
}

type StoryEnding = { id: "perfect" | "solved" | "twist"; icon: string; title: string; description: string };

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
  const [hintLevel, setHintLevel] = useState(0);
  const [interlude, setInterlude] = useState(false);
  /** 答對/答錯的即時回饋動畫：卡片抖動、浮出徽章、連擊火花 */
  const [feedback, setFeedback] = useState<{ ok: boolean; combo: number; seq: number } | null>(null);
  /** 選劇本時的按下回饋（卡片壓一下再進場） */
  const [pickedScript, setPickedScript] = useState<string | null>(null);
  /** 分支路徑改變時讓 STORY PATH 區塊閃一下，讓玩家發現走向被自己改寫了 */
  const [pathPulse, setPathPulse] = useState(false);
  /** 音景需由使用者明確開啟，避免干擾專注與瀏覽器自動播放限制。 */
  const [ambientOn, setAmbientOn] = useState(false);
  const [stamps, setStamps] = useState<RoleplayStamp[]>(() => loadRoleplayStamps());
  /** 僅在跨過真實收藏門檻時顯示，不用假資料預覽解鎖。 */
  const [milestone, setMilestone] = useState<RoleplayMilestone | null>(null);
  const [customScripts, setCustomScripts] = useState<CustomRoleplay[]>(() => loadCustomRoleplays());
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customScene, setCustomScene] = useState("");
  const [customLines, setCustomLines] = useState("");
  const [customError, setCustomError] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [incomingChallenge, setIncomingChallenge] = useState<RoleplayChallengePayload | null>(null);
  const seqRef = useRef(0);
  const prevEnding = useRef<StoryEnding["id"] | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const current = works[idx];
  const scene = script?.scenes[idx];
  const availableScripts = useMemo(() => [...customScripts.map((entry) => entry.script), ...ROLEPLAY_SCRIPTS], [customScripts]);
  const activeStamp = useMemo(() => script ? stamps.find((stamp) => stamp.scriptId === script.id) ?? null : null, [script, stamps]);

  const ending = useMemo<StoryEnding>(() => {
    const evidence = works.slice(0, 4);
    const detailed = evidence.filter((work) => (work.line?.trim().length ?? 0) >= 28 && work.line?.includes(work.item.term)).length;
    const independent = evidence.filter((work) => !work.hintUsed).length;
    if (detailed >= 3 && independent >= 3) return { id: "perfect", icon: "🌟", title: "完美結局 · 真相完全還原", description: "你幾乎不靠提示，就把線索與詞義完整串起來；第五幕將揭露真正的幕後安排。" };
    if (detailed >= 2) return { id: "solved", icon: "✅", title: "成功結案 · 關鍵線索成立", description: "你的推理足以解開主要事件，第五幕將驗證最後一項證據。" };
    return { id: "twist", icon: "🌀", title: "意外反轉 · 線索出現矛盾", description: "前四幕仍有詞義沒有說完整，第五幕將出現新的證人，讓你重新修正推理。" };
  }, [works]);

  const startPack = (p: SubjectPack) => {
    playSfx("pick");
    setWorks(takeItems(p.items, 5).map((item) => ({ item, recalled: null })));
    setIdx(0);
    setPhase("script");
  };

  const createScript = () => {
    try {
      const entry = createCustomRoleplay({ scene: customScene, title: customTitle, coreLines: customLines });
      const next = saveCustomRoleplay(entry);
      setCustomScripts(next);
      setWorks(entry.items.map((item) => ({ item, recalled: null })));
      setCustomError("");
      setCustomOpen(false);
      setPhase("script");
      playSfx("unlock");
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "目前無法產生自訂劇本，請重新檢查輸入。");
      playSfx("miss");
    }
  };

  const applyTemplate = (template: RoleplayTemplate) => {
    setCustomTitle(template.title); setCustomScene(template.scene); setCustomLines(template.coreLines);
    setCustomError(""); setCustomOpen(true); playSfx("pick");
  };

  const exportScript = (entry: CustomRoleplay) => {
    const blob = new Blob([serializeCustomRoleplay(entry)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    const safeName = entry.script.name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 36) || "custom-roleplay";
    link.href = url; link.download = `memodesk-${safeName}.json`; link.rel = "noopener";
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setCustomError(""); setShareNote(`「${entry.script.name}」已匯出為可分享的 JSON 案卷檔。`); playSfx("unlock");
  };

  const importScript = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 180_000) throw new Error("劇本檔過大；請選擇小於 180 KB 的 MemoDesk JSON 檔。 ");
      const entry = parseImportedCustomRoleplay(await file.text());
      const next = saveCustomRoleplay(entry); setCustomScripts(next); setCustomError(""); setCustomOpen(true);
      setShareNote(`已收進「${entry.script.name}」；它會另存為新的好友案卷。`); playSfx("unlock");
    } catch (error) { setCustomError(error instanceof Error ? error.message : "劇本匯入失敗，請確認檔案格式。 "); playSfx("miss"); }
    finally { event.target.value = ""; }
  };

  const chooseScript = (sc: RoleplayScript) => {
    setPickedScript(sc.id);
    playSfx("pick");
    // 讓卡片先完成壓下動畫，再切換場景，避免「點了就跳走」的突兀感
    window.setTimeout(() => { setScript(sc); setPhase("play"); setPickedScript(null); }, 220);
  };

  const updateWork = (patch: Partial<Work>) => {
    setWorks((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const nextPlay = () => {
    updateWork({ hintUsed: hintLevel });
    setHintLevel(0);
    if (idx < works.length - 1) {
      setInterlude(true);
      playSfx("unlock");
      window.setTimeout(() => { setIdx((value) => value + 1); setInterlude(false); }, 850);
    }
    else { playSfx("reveal"); setIdx(0); setRevealed(false); setPhase("recall"); }
  };

  const answer = (ok: boolean) => {
    updateWork({ recalled: ok });
    const c = ok ? combo + 1 : 0;
    setCombo(c);
    setBestCombo((b) => Math.max(b, c));
    setRevealed(false);
    seqRef.current += 1;
    setFeedback({ ok, combo: c, seq: seqRef.current });
    playSfx(ok ? "correct" : "miss");
    if (ok && c >= 2) playSfx("combo", c);
    if (idx < works.length - 1) setIdx(idx + 1);
    else {
      addTemplateStats(
        [{ label: "情境編碼", value: 3 }, { label: "即時輸出", value: 2 }, { label: "故事綁定", value: 1 }],
        "roleplayRuns",
      );
      const correct = works.filter((work) => work.recalled).length + (ok ? 1 : 0);
      recordTrainingSession({ module: "roleplay", label: "情境式分支劇本", score: Math.round((correct / Math.max(1, works.length)) * 100), abilities: { "情境編碼": 3, "即時輸出": 2, "故事綁定": 1 } });
      if (script) {
        const score = Math.round((correct / Math.max(1, works.length)) * 100);
        const hintCount = works.reduce((sum, work) => sum + (work.hintUsed ?? 0), 0);
        const assessment = assessRoleplayStamp({ ending: ending.id, score, bestCombo, hintCount });
        const previous = loadRoleplayStamps();
        const next = collectRoleplayStamp({ scriptId: script.id, scriptName: script.name, emoji: script.emoji, label: script.stampLabel, ending: ending.id, score, collectedAt: new Date().toISOString(), rarity: assessment.rarity, condition: assessment.condition, bestCombo, hintCount });
        setStamps(next);
        const unlocked = newlyUnlockedMilestones(previous, next);
        if (unlocked[0]) { window.setTimeout(() => { setMilestone(unlocked[0]); playSfx("unlock"); }, 720); }
      }
      window.setTimeout(() => playSfx("stamp"), 260);
      setPhase("result");
    }
  };

  const restart = () => {
    setPhase("pack"); setScript(null); setWorks([]); setIdx(0);
    setCombo(0); setBestCombo(0); setRevealed(false);
    setHintLevel(0);
    setInterlude(false);
    setFeedback(null);
    setPickedScript(null);
    setMilestone(null);
  };

  const correctCount = useMemo(() => works.filter((w) => w.recalled).length, [works]);

  const toggleAmbient = () => {
    if (ambientOn) { stopAmbientSoundscape(); setAmbientOn(false); return; }
    if (!script) return;
    setAmbientOn(startAmbientSoundscape(script.soundscape));
  };

  const shareStamp = async () => {
    if (!activeStamp) return;
    try {
      const result = await shareRoleplayStampCard(activeStamp);
      if (result !== "cancelled") setShareNote(result === "shared" ? "章戳分享卡已開啟分享面板。" : "章戳分享卡已下載到你的裝置。");
    } catch (error) { setShareNote(error instanceof Error ? error.message : "暫時無法建立分享卡。"); }
  };

  const copyChallengeLink = async () => {
    if (!script || works.length !== 5) return;
    try {
      const link = buildRoleplayChallengeLink(script, works.map((work) => work.item));
      await navigator.clipboard.writeText(link);
      setShareNote("好友挑戰連結已複製；對方開啟後可收進自己的案卷。 ");
    } catch { setShareNote("瀏覽器未允許自動複製，請改用章戳分享卡邀請好友。 "); }
  };

  const clearChallengeQuery = () => {
    const cleanPath = `${import.meta.env.BASE_URL}train/roleplay`;
    window.history.replaceState({}, "", cleanPath);
  };

  const acceptChallenge = () => {
    if (!incomingChallenge) return;
    const receivedAt = Date.now();
    const entry: CustomRoleplay = {
      script: { ...incomingChallenge.script, id: `custom-challenge-${receivedAt}`, name: `${incomingChallenge.script.name.slice(0, 22)}（好友挑戰）`, stampLabel: "好友挑戰章" },
      items: incomingChallenge.items.map((item, index) => ({ id: `challenge-${receivedAt}-${index}`, term: item.term.slice(0, 80), hint: item.hint.slice(0, 240), extra: item.extra?.slice(0, 180) })),
      createdAt: new Date().toISOString(),
    };
    setCustomScripts(saveCustomRoleplay(entry));
    setWorks(entry.items.map((item) => ({ item, recalled: null })));
    setScript(entry.script); setIdx(0); setPhase("play"); setIncomingChallenge(null); clearChallengeQuery();
    playSfx("unlock");
  };

  const dismissChallenge = () => { setIncomingChallenge(null); clearChallengeQuery(); };

  // 回饋徽章 900ms 後自動收起（用 seq 當 key，連續答題不會互相取消）
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 900);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // 分支走向改變時提示玩家：閃光 + 一聲輕音
  useEffect(() => {
    if (phase !== "play") { prevEnding.current = ending.id; return; }
    if (prevEnding.current && prevEnding.current !== ending.id) {
      setPathPulse(true);
      playSfx("hint");
      const timer = window.setTimeout(() => setPathPulse(false), 900);
      prevEnding.current = ending.id;
      return () => window.clearTimeout(timer);
    }
    prevEnding.current = ending.id;
  }, [ending.id, phase]);

  useEffect(() => {
    if (phase === "play" && script && ambientOn) startAmbientSoundscape(script.soundscape);
    else stopAmbientSoundscape();
    return () => stopAmbientSoundscape();
  }, [ambientOn, phase, script?.id]);

  useEffect(() => {
    const payload = parseRoleplayChallenge(new URLSearchParams(window.location.search).get("challenge"));
    if (payload) setIncomingChallenge(payload);
  }, []);

  return (
    <TrainShell title="情境式劇本殺" steps={STEPS} stepIndex={stepIndex} stepColor={stepColor} badge={`combo ×${combo}`}
      headerControl={<button type="button" onClick={toggleAmbient} disabled={!script} aria-label={ambientOn ? "關閉劇本音景" : "開啟劇本音景"} title={!script ? "選擇劇本後可開啟音景" : ambientOn ? "音景：開（點一下關閉）" : "音景：關（點一下開啟）"} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{ambientOn ? <Volume2 className="h-4 w-4 text-pink-600" /> : <VolumeX className="h-4 w-4 opacity-60" />}</button>}>
      {phase === "pack" && (
        <div className="rp-case-desk">
          <div className="rp-case-intro"><span className="rp-clip-mark" aria-hidden="true" /><div><p className="font-hand text-xl text-pink-600 mb-0">記憶手帳社 MemoDesk · 社團夜間開案</p><span className="rp-case-tag">情境劇本活動</span></div><span className="rp-brand-card"><i>MD</i><b>MemoDesk</b><small>記憶手帳社</small></span><span className="club-seal rp-case-seal">社團<br />案卷<br />認證</span></div>
          <p className="font-hand text-2xl text-primary mb-1">step 1 — gather the clues</p>
          <h1 className="font-display font-extrabold text-3xl mb-2">挑一包知識點，當今晚的核心詞</h1>
          <p className="text-muted-foreground mb-6">從案卷中挑五份證物；每個核心詞都會在劇情裡觸發一段戲。</p>
          <div className="rp-case-ritual mb-6"><span className="rp-context-slip">情境線索 · 把詞先放進一個看得見的校園現場</span><span className="rp-story-slip">劇本演出 · 再讓角色的情緒替它留在腦中</span></div>
          {incomingChallenge && <section className="rp-share-desk mb-6" aria-live="polite"><p className="font-hand text-xl text-pink-700">friend challenge received!</p><h2 className="font-display text-2xl font-extrabold">好友送來一份「{incomingChallenge.script.name}」案卷</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">五個核心詞與五幕劇情已附在這張邀請裡。接受後會另存成你的「好友挑戰」案卷，再由你親自解案。</p><div className="mt-4 flex flex-wrap gap-3"><Button type="button" onClick={acceptChallenge} className="rounded-full bg-teal-700 font-display font-bold hover:bg-teal-800"><Sparkles className="h-4 w-4" />收下挑戰並開案</Button><Button type="button" variant="outline" onClick={dismissChallenge} className="rounded-full border-pink-300 bg-white text-pink-900 hover:bg-pink-50">先不要，回到我的案卷</Button></div></section>}
          <PackPicker onPick={startPack} note="把線索收好，再讓它們在故事裡現身 ✎" variant="casefile" />
          <section className="rp-writer-desk mt-8 max-w-4xl border-2 border-dashed border-pink-300 bg-[#fff9ef] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-hand text-xl text-pink-600">build your own case</p><h2 className="font-display text-xl font-extrabold">用自己的核心詞，生成專屬五幕劇本</h2><p className="mt-1 text-sm text-muted-foreground">不必先選卡包；輸入一個場景與五組「核心詞｜一句意思」，就能保存在此裝置並直接開演。</p></div><Button type="button" variant="outline" onClick={() => setCustomOpen((open) => !open)} className="rounded-full border-pink-400 bg-white font-display font-bold text-pink-800"><PenLine className="h-4 w-4" />{customOpen ? "收起編劇台" : "打開編劇台"}</Button></div>
            <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importScript} />
            <section className="rp-template-library mt-5" aria-label="劇本模板庫"><div className="flex flex-wrap items-center justify-between gap-2"><p className="inline-flex items-center gap-1.5 font-hand text-xl text-teal-700"><LibraryBig className="h-4 w-4" />編劇模板庫</p><Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} className="rounded-full border-teal-300 bg-white text-xs font-bold text-teal-800 hover:bg-teal-50"><FileUp className="h-3.5 w-3.5" />匯入朋友案卷</Button></div><p className="mt-1 text-xs text-muted-foreground">先套用範本再改成自己的核心詞，或匯入朋友匯出的 JSON；每份案卷都會另存，不會覆寫原稿。</p><div className="mt-3 grid gap-2 md:grid-cols-3">{ROLEPLAY_TEMPLATE_LIBRARY.map((template) => <button key={template.id} type="button" onClick={() => applyTemplate(template)} className="rp-template-slip text-left"><span>{template.label}</span><b>{template.name}</b><small>{template.note}</small></button>)}</div></section>
            {customScripts.length > 0 && <section className="mt-4 border-t border-dashed border-pink-200 pt-4" aria-label="已保存自訂案卷"><p className="text-xs font-bold text-pink-900">我的可分享案卷 · {customScripts.length} 份</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{customScripts.map((entry) => <div key={entry.script.id} className="flex items-center justify-between gap-2 border border-dashed border-amber-300 bg-amber-50/70 px-3 py-2"><span className="min-w-0"><b className="block truncate text-sm">{entry.script.name}</b><small className="block truncate text-[10px] text-amber-800">五幕／五個核心詞 · 可帶給好友</small></span><Button type="button" size="sm" variant="outline" onClick={() => exportScript(entry)} className="shrink-0 rounded-full border-amber-400 bg-white text-xs text-amber-900 hover:bg-amber-100"><FileDown className="h-3.5 w-3.5" />匯出</Button></div>)}</div></section>}
            {customOpen && <div className="mt-5 grid gap-4 border-t border-dashed border-pink-200 pt-5"><label className="grid gap-1 text-sm font-bold text-pink-950">劇本名稱（選填）<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength={28} placeholder="例：期中考前的圖書館密令" className="h-10 border border-pink-200 bg-white px-3 font-normal outline-none focus:border-pink-500" /></label><label className="grid gap-1 text-sm font-bold text-pink-950">故事場景</label><Textarea value={customScene} onChange={(event) => setCustomScene(event.target.value)} maxLength={120} placeholder="例：午夜的校史館，五張遺失的研究筆記散落在展櫃之間。" className="min-h-20 border-pink-200 bg-white" /><label className="grid gap-1 text-sm font-bold text-pink-950">五組核心詞與意思<small className="font-normal text-muted-foreground">每行一組，格式：核心詞｜一句意思；必須剛好五行。</small></label><Textarea value={customLines} onChange={(event) => setCustomLines(event.target.value)} placeholder={"光合作用｜植物利用光能製造養分\n葉綠體｜進行光合作用的細胞構造\n…"} className="min-h-40 border-pink-200 bg-white" />{customError && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700" role="alert">{customError}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">你輸入的內容只會保存於這個瀏覽器，不會送往外部服務。</p><Button type="button" onClick={createScript} className="rounded-full bg-pink-600 font-display font-bold hover:bg-pink-700"><WandSparkles className="h-4 w-4" />生成我的五幕劇本</Button></div></div>}
          </section>
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
            {availableScripts.map((sc, i) => (
              <button key={sc.id} onClick={() => chooseScript(sc)} disabled={pickedScript !== null}
                className={`paper-card ${i % 2 === 0 ? "tilt-l2" : "tilt-r"} p-6 text-left group relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${pickedScript === sc.id ? "rp-picked" : pickedScript ? "opacity-40" : ""}`}>
                <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
                {pickedScript === sc.id && <span className="rp-picked-flag font-hand">開演！</span>}
                <div className="rp-file-mark mb-3">{sc.id.startsWith("custom-") ? "自" : "案"}</div>
                <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">{sc.name}</h3>
                <p className="text-sm mb-1"><b>你的角色：</b>{sc.role}</p>
                <p className="text-sm text-muted-foreground mb-2">{sc.setting}</p>
                <p className="font-hand text-lg text-amber-700">{sc.mission}</p>
                <p className="mt-2 text-xs font-bold text-primary">全劇共 5 幕，每幕都有不同場景與任務</p>
                <span className="doodle-note text-xl inline-flex items-center gap-1 mt-2">開演 <ArrowRight className="w-4 h-4" /></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "play" && current && script && (
        <div>
          {interlude && <div className="fixed inset-0 z-50 grid place-items-center bg-[#251b2b]/80 p-6 backdrop-blur-sm" role="status" aria-live="polite"><div className="unlock-in max-w-md rounded-3xl border-2 border-pink-200 bg-[#fffaf0] p-8 text-center shadow-2xl"><span className="text-5xl">{script.emoji}</span><p className="mt-3 font-hand text-2xl text-pink-600">clue unlocked!</p><h2 className="font-display text-2xl font-extrabold">第 {idx + 1} 幕完成</h2><p className="mt-2 text-muted-foreground">下一站：{script.scenes[idx + 1]?.title}</p><div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-pink-100"><span className="block h-full w-full origin-left animate-pulse bg-pink-500" /></div></div></div>}
          <p className="font-hand text-2xl text-pink-600 mb-1">step 3 — 玫瑰粉便利貼時間 🩷</p>
          <h1 className="font-display font-extrabold text-3xl mb-2 flex items-center gap-2">
            {script.emoji} 第 {idx + 1} 幕 · {scene?.title ?? "核心詞觸發"}
          </h1>
          {ambientOn && <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-800"><Volume2 className="h-3.5 w-3.5" /> 音景播放中 · {script.name}</p>}
          <p className="text-muted-foreground mb-1">{script.role} · 核心詞 {idx + 1} / {works.length}</p>
          <p className="doodle-note text-xl mb-4">你不是在猜答案：請把核心詞的意思演成一句角色台詞 →</p>

          <nav className="mb-6 max-w-3xl rounded-2xl border border-stone-200 bg-white/90 p-4" aria-label="五幕劇情進度地圖">
            <div className="mb-3 flex items-center justify-between"><b className="font-display text-sm">🗺️ 劇情進度地圖</b><span className="text-xs text-muted-foreground">第 {idx + 1} / {works.length} 幕</span></div>
            <ol className="grid grid-cols-5 gap-1">{script.scenes.map((item, sceneIndex) => <li key={item.title} className="relative text-center"><span className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-black ${sceneIndex < idx ? "border-teal-600 bg-teal-500 text-white" : sceneIndex === idx ? "border-pink-700 bg-pink-500 text-white ring-4 ring-pink-100" : "border-stone-300 bg-[#fffaf0] text-stone-400"}`}>{sceneIndex < idx ? "✓" : sceneIndex + 1}</span><small className={`mt-2 block truncate text-[9px] ${sceneIndex === idx ? "font-bold text-pink-800" : "text-muted-foreground"}`}>{item.title}</small>{sceneIndex < 4 && <i className={`absolute left-[60%] right-[-40%] top-4 h-0.5 ${sceneIndex < idx ? "bg-teal-500" : "bg-stone-200"}`} />}</li>)}</ol>
          </nav>

          {idx === 4 && <section className={`mb-6 max-w-3xl rounded-2xl border-2 p-5 transition-all duration-300 ${pathPulse ? "rp-path-pulse" : ""} ${ending.id === "perfect" ? "border-amber-300 bg-amber-50" : ending.id === "solved" ? "border-teal-300 bg-teal-50" : "border-violet-300 bg-violet-50"}`} aria-label="第五幕故事走向" aria-live="polite"><p className="text-xs font-bold tracking-widest text-muted-foreground">YOUR STORY PATH{pathPulse && <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-primary">走向已改寫</span>}</p><h2 className="mt-1 font-display text-xl font-extrabold">{ending.icon} {ending.title}</h2><p className="mt-1 text-sm text-muted-foreground">{ending.description}</p></section>}

          <section className="mb-6 max-w-3xl rounded-2xl border-2 border-pink-200 bg-white/85 p-5 shadow-sm" aria-label="本關操作說明">
            <div className="flex items-start gap-3 mb-4">
              <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-pink-100 text-pink-700"><HelpCircle className="w-5 h-5" /></span>
              <div><h2 className="font-display font-extrabold text-lg">這一幕要怎麼玩？</h2><p className="text-sm text-muted-foreground">目標是用自己的話解釋核心詞，不需要寫很長，一句完整台詞就能過關。</p></div>
            </div>
            <ol className="grid sm:grid-cols-3 gap-3 text-sm">
              <li className="rounded-xl bg-pink-50 p-3"><b className="block text-pink-800 mb-1">1｜看劇情與核心詞</b>先理解自己扮演誰，以及這一幕出現哪個詞。</li>
              <li className="rounded-xl bg-amber-50 p-3"><b className="block text-amber-800 mb-1">2｜想起詞的意思</b>忘記時可按「顯示提示」，系統會逐步協助。</li>
              <li className="rounded-xl bg-teal-50 p-3"><b className="block text-teal-800 mb-1">3｜寫完並大聲唸</b>台詞要包含核心詞和它的意思，再按下一幕。</li>
            </ol>
          </section>

          <div className="sticky-note sticky-pink-bg p-6 max-w-2xl relative tilt-r">
            <div className="washi washi-pink" />
            <p className="text-sm text-pink-900 font-bold mb-1">第 {idx + 1} 幕劇情：</p>
            <p className="text-pink-800 mb-2">{scene?.setting ?? script.setting}。</p>
            <p className="mb-4 rounded-lg bg-white/55 p-3 text-sm text-pink-950"><b>本幕任務：</b>{scene?.objective ?? (script.mission.split("——")[1] ?? script.mission)}；核心詞是 <b className="font-display text-lg">「{current.item.term}」</b>。</p>

            <div className="mb-4 max-w-xl rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-bold text-amber-950">💡 卡住了嗎？逐步打開提示</p><p className="text-xs text-amber-800">先自己回想；提示不影響過關，但少看一次記得更牢。</p></div>
                {hintLevel < 2 && <Button type="button" variant="outline" onClick={() => { playSfx("hint"); setHintLevel((level) => { const next = level + 1; updateWork({ hintUsed: next }); return next; }); }} className="rounded-full border-amber-500 bg-white text-amber-900 font-bold hover:bg-amber-100 active:scale-[0.97] transition-transform"><Lightbulb className="w-4 h-4" />{hintLevel === 0 ? "顯示提示" : "再給我句型"}</Button>}
              </div>
              {hintLevel >= 1 && <div className="mt-3 rounded-lg bg-yellow-200/70 p-3 text-sm text-amber-950" aria-live="polite"><b>提示 1｜詞義：</b>{current.item.hint}{current.item.extra ? ` — ${current.item.extra}` : ""}</div>}
              {hintLevel >= 2 && <div className="mt-2 rounded-lg bg-white p-3 text-sm text-pink-900" aria-live="polite"><b>提示 2｜本幕角色句型：</b>「{scene?.sentenceLead ?? "各位，我發現關鍵是"} <strong>{current.item.term}</strong>，它的意思是＿＿＿＿，所以＿＿＿＿。」</div>}
            </div>

            <p className="text-sm font-bold text-pink-900 mb-2">以「{script.role.replace("你是", "")}」的身分，說一段包含「{current.item.term}」和它意義的台詞：</p>
            <Textarea
              value={current.line ?? ""}
              onChange={(e) => updateWork({ line: e.target.value })}
              placeholder={`例：各位，這個「${current.item.term}」正是關鍵——它其實是${current.item.hint}，所以…`}
              className="bg-white/80 border-pink-300 min-h-24"
            />
            <div className="flex justify-end mt-4">
              {!current.line?.trim() && <p className="mr-auto self-center text-xs font-bold text-pink-800">請先寫一句台詞，填入文字後「下一幕」才會亮起。</p>}
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

          <div className={`paper-card tilt-l2 p-6 max-w-2xl relative ${feedback ? (feedback.ok ? "rp-hit" : "rp-shake") : ""}`}>
            {feedback && (
              <div key={feedback.seq} className="pointer-events-none absolute inset-0 z-20 grid place-items-center" role="status" aria-live="polite">
                <div className={`rp-badge ${feedback.ok ? "is-ok" : "is-miss"}`}>
                  <span className="rp-badge-icon">{feedback.ok ? "✅" : "🔁"}</span>
                  <b>{feedback.ok ? "線索成立！" : "先記著，等等再來"}</b>
                  {feedback.ok && feedback.combo >= 2 && <em>連擊 ×{feedback.combo}</em>}
                </div>
                {feedback.ok && feedback.combo >= 2 && (
                  <div className="rp-sparks" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, sparkIndex) => (
                      <i key={sparkIndex} style={{ ["--a" as string]: `${sparkIndex * 45}deg`, ["--d" as string]: `${sparkIndex * 26}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="washi" />
            <span className="tape-corner tape-tr" />
            <p className="text-sm text-muted-foreground mb-1">你的線索：</p>
            <p className="text-lg mb-1">{script.emoji} 第 {idx + 1} 幕 · {scene?.title} · 核心詞 <b>「{current.item.term}」</b></p>
            {current.line && <p className="font-hand text-xl text-muted-foreground mb-1">你當時說："{current.line}"</p>}

            <div className="crayon-dashed mt-5 p-5 text-center">
              {!revealed ? (
                <>
                  <p className="font-display font-bold text-lg mb-1">「{current.item.term}」的意義是什麼？</p>
                  <p className="text-sm text-muted-foreground mb-4">不看備忘，像做結案陳詞一樣完整說出來。</p>
                  <Button onClick={() => { playSfx("reveal"); setRevealed(true); }} variant="outline"
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
          {milestone && <div className="fixed inset-0 z-50 grid place-items-center bg-[#213832]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="roleplay-milestone-title"><section className="rp-milestone-pop relative w-full max-w-sm border-2 border-amber-300 bg-[#fffaf0] p-7 text-center shadow-2xl"><span className="absolute -top-4 left-1/2 -translate-x-1/2 rotate-[-3deg] bg-[#FDE68A] px-4 py-1 font-hand text-lg text-amber-950 shadow-sm">achievement unlocked!</span><div className="mt-3 text-6xl">{milestone.emoji}</div><p className="mt-3 font-hand text-2xl text-pink-600">MemoDesk 社團章</p><h2 id="roleplay-milestone-title" className="font-display text-2xl font-extrabold text-primary">{milestone.name}</h2><p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p><p className="mt-4 inline-flex items-center gap-1 border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800"><Award className="h-3.5 w-3.5" /> 已蒐集 {stamps.length} 枚劇本章戳</p><Button type="button" onClick={() => setMilestone(null)} className="mt-6 w-full rounded-full font-display font-bold">收進我的手帳</Button></section></div>}
          <div className="relative inline-block mb-4">
            <img src={STAMP} alt="任務完成印章" className="w-28 h-28 mx-auto stamp-in" />
            <span className="club-seal absolute -right-20 top-4 hidden sm:inline-flex">記憶<br/>手帳社<br/>認證</span>
          </div>
          <p className="font-hand text-3xl text-primary mb-1">case closed!</p>
          <h1 className="font-display font-extrabold text-3xl mb-3">劇本殺結案，蓋章！</h1>
          <p className="text-muted-foreground mb-8">
            真相還原 <b className="text-primary">{correctCount} / {works.length}</b> · 最佳連擊 <b className="text-primary">×{bestCombo}</b>
          </p>

          <div className={`paper-card mb-8 p-6 ${ending.id === "perfect" ? "bg-amber-50" : ending.id === "solved" ? "bg-teal-50" : "bg-violet-50"}`}><span className="text-4xl">{ending.icon}</span><h2 className="mt-2 font-display text-2xl font-extrabold">{ending.title}</h2><p className="mt-2 text-muted-foreground">{ending.description}</p></div>

          <section className="mb-10 text-left paper-card p-5 relative overflow-hidden">
            <span className="tape-corner tape-tl" />
            <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="font-hand text-2xl text-pink-600">scenario stamp book</p><h2 className="font-display text-xl font-extrabold">劇本章戳收藏 · {stamps.length} / {availableScripts.length}</h2></div><p className="text-xs text-muted-foreground">同一劇本會保留更佳結局與稀有度</p></div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {availableScripts.map((item) => {
                const stamp = stamps.find((saved) => saved.scriptId === item.id);
                const rarity = stamp ? getStampRarity(stamp) : "common";
                const rarityMeta = STAMP_RARITY_META[rarity];
                return <div key={item.id} className={`border-2 border-dashed p-3 text-center transition-transform ${stamp ? `${RARITY_CARD_STYLE[rarity]} rotate-[-1deg]` : "border-stone-200 bg-stone-50 text-stone-400"}`}><span className="block text-2xl">{item.emoji}</span><b className="mt-1 block text-xs">{stamp ? item.stampLabel : "尚未取得"}</b><span className={`mx-auto mt-1 inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-black ${stamp ? "bg-white/80" : "bg-stone-100"}`}>{stamp ? <Sparkles className="h-3 w-3" /> : "○"}{stamp ? rarityMeta.label : "完成條件"}</span><small className="mt-1 block text-[10px] leading-4">{stamp ? `${stamp.ending === "perfect" ? "完美" : stamp.ending === "solved" ? "結案" : "反轉"} · ${stamp.score}%` : "完成五幕並進行結案回想"}</small>{stamp && <small className="mt-1 block text-[9px] text-muted-foreground">{stamp.condition ?? rarityMeta.description}</small>}</div>;
              })}
            </div>
            <div className="mt-5 grid gap-2 border-t border-dashed border-stone-200 pt-4 sm:grid-cols-2"><p className="sm:col-span-2 text-xs font-bold text-primary">里程碑索引 · 蒐集不同劇本章戳即可解鎖</p>{ROLEPLAY_MILESTONES.map((item) => { const unlocked = stamps.length >= item.count; return <div key={item.id} className={`flex items-center gap-2 px-2 py-1.5 text-xs ${unlocked ? "bg-amber-50 text-amber-950" : "text-stone-400"}`}><span>{item.emoji}</span><span><b>{item.name}</b> · {item.description}</span><em className="ml-auto shrink-0 font-bold not-italic">{unlocked ? "已解鎖" : `${item.count} 枚`}</em></div>; })}</div>
          </section>

          {activeStamp && <section className="rp-share-desk mb-10 text-left" aria-label="章戳分享與好友挑戰"><span className="tape-corner tape-tr" /><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-hand text-2xl text-pink-600">pass the case file</p><h2 className="font-display text-xl font-extrabold">把這枚章戳送上朋友的手帳桌</h2><p className="mt-1 text-sm text-muted-foreground">分享卡保留這次真實完成表現；挑戰連結則帶著這五個核心詞與劇本，讓好友親自開案。</p></div><span className="club-seal hidden sm:inline-flex">友情<br/>挑戰<br/>已備妥</span></div><div className="mt-4 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={shareStamp} className="rounded-full border-pink-300 bg-white font-display font-bold text-pink-800 hover:bg-pink-50"><Share2 className="h-4 w-4" />分享章戳卡</Button><Button type="button" onClick={copyChallengeLink} className="rounded-full font-display font-bold"><Link2 className="h-4 w-4" />複製好友挑戰連結</Button></div>{shareNote && <p className="mt-3 inline-flex items-center gap-1.5 border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-900" role="status"><Download className="h-3.5 w-3.5" />{shareNote}</p>}</section>}

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
