import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, GitBranch, Lightbulb, LockKeyhole, Medal, Route, Sparkles, TrainFront, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrainShell from "@/components/TrainShell";
import { ALL_MRT_STATIONS, MRT_LINES, neighborsFor, type MrtLine, type MrtStation } from "@/lib/mrtData";
import { branchChallengeForLine, dailyRecommendation, orderedRoutesForLine, segmentsForLine, stationsForSegment, validateMrtSegments, type BranchChallenge, type MrtSegment } from "@/lib/mrtCourse";
import { loadMrtProgress, recordMrtAnswer, saveBranchResult, saveLineExamResult, saveSegmentResult, type MrtProgress } from "@/lib/mrtProgress";
import { flipHint, loadMemoryProfile, type MemoryProfile } from "@/lib/memoryProfile";

const STEPS = [
  { id: "line", label: "今日任務" }, { id: "segment", label: "分段解鎖" },
  { id: "learn", label: "翻牌＋提取" }, { id: "result", label: "路線驗收" },
];
type Stage = "line" | "segment" | "flip" | "quiz" | "branch" | "order" | "result";
type Direction = "forward" | "reverse";
type ResultKind = "segment" | "branch" | "exam";
type OrderQuestion = { station: MrtStation; answerStation: MrtStation; prompt: string; options: MrtStation[] };

const EMPTY_PROGRESS: MrtProgress = { lines: {}, stations: {}, segments: {}, lineExams: {}, branches: {} };
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

function orderQuestions(line: MrtLine, stations: MrtStation[], direction: Direction, keepRouteOrder = false): OrderQuestion[] {
  const allowed = new Set(stations.map((station) => station.code));
  const result = stations.flatMap((station) => {
    const neighbors = neighborsFor(line, line.stations.findIndex((item) => item.code === station.code));
    const target = direction === "forward" ? neighbors.next : neighbors.previous;
    if (!target || !allowed.has(target.code)) return [];
    const distractors = shuffle(stations.filter((item) => item.code !== target.code && item.code !== station.code)).slice(0, 3);
    return [{ station, answerStation: target, prompt: `${station.code} ${station.name} 的${direction === "forward" ? "下一" : "上一"}站？`, options: shuffle([target, ...distractors]) }];
  });
  return keepRouteOrder ? result : shuffle(result);
}

function RouteBand({ line, stations, activeCode, revealed = true }: { line: MrtLine; stations: MrtStation[]; activeCode?: string; revealed?: boolean }) {
  return <div className="route-band" style={{ "--route-color": line.color } as React.CSSProperties}>
    {stations.map((station) => <div key={station.code} className={`route-stop ${station.code === activeCode ? "route-stop-active" : ""}`}>
      <span className="route-dot" /><span className="route-code">{station.code}</span><span className="route-name">{revealed ? station.name : "？"}</span>
    </div>)}
  </div>;
}

export default function MrtCourse() {
  const [stage, setStage] = useState<Stage>("line");
  const [line, setLine] = useState<MrtLine | null>(null);
  const [segment, setSegment] = useState<MrtSegment | null>(null);
  const [progress, setProgress] = useState<MrtProgress>(EMPTY_PROGRESS);
  const [profile, setProfile] = useState<MemoryProfile | null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState<Direction>("forward");
  const [questions, setQuestions] = useState<OrderQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [forwardScore, setForwardScore] = useState(0);
  const [resultScore, setResultScore] = useState(0);
  const [resultKind, setResultKind] = useState<ResultKind>("segment");
  const [challenge, setChallenge] = useState<BranchChallenge | null>(null);
  const [branchIndex, setBranchIndex] = useState(0);
  const [branchCorrect, setBranchCorrect] = useState(0);
  const [orderRoutes, setOrderRoutes] = useState<string[][]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [orderedCodes, setOrderedCodes] = useState<string[]>([]);
  const [orderMistakes, setOrderMistakes] = useState(0);
  const [wrongOrderCode, setWrongOrderCode] = useState<string | null>(null);
  const errors = useMemo(() => validateMrtSegments(), []);

  useEffect(() => { setProgress(loadMrtProgress()); setProfile(loadMemoryProfile()); }, []);
  const recommendation = useMemo(() => dailyRecommendation(progress), [progress]);
  const lineSegments = line ? segmentsForLine(line.id) : [];
  const allSegmentsPassed = lineSegments.length > 0 && lineSegments.every((item) => progress.segments[item.id]?.passed);
  const lineChallenge = line ? branchChallengeForLine(line.id) : undefined;
  const branchPassed = !lineChallenge || progress.branches[lineChallenge.id]?.passed;

  const startSegment = (selectedLine: MrtLine, selectedSegment: MrtSegment) => {
    setLine(selectedLine); setSegment(selectedSegment); setFlipped(new Set()); setStage("flip");
  };

  const startRecommended = () => {
    const selectedLine = MRT_LINES.find((item) => item.id === recommendation.lineId)!;
    const selectedSegment = segmentsForLine(selectedLine.id).find((item) => item.id === recommendation.segmentId)!;
    startSegment(selectedLine, selectedSegment);
  };

  const startQuiz = (nextDirection: Direction) => {
    if (!line || !segment) return;
    const soundFirst = profile?.vark === "auditory" || profile?.primaryTalent === "soundMimic";
    setQuestions(orderQuestions(line, stationsForSegment(segment), nextDirection, soundFirst));
    setDirection(nextDirection); setQuestionIndex(0); setSelected(null); setCorrect(0); setStage("quiz");
  };

  const answerQuiz = (code: string) => {
    if (selected) return;
    const current = questions[questionIndex]; const isCorrect = code === current.answerStation.code;
    setSelected(code); if (isCorrect) setCorrect((value) => value + 1);
    setProgress(recordMrtAnswer(current.answerStation, isCorrect));
  };

  const finishQuiz = () => {
    if (!line || !segment) return;
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    if (direction === "forward") { setForwardScore(score); startQuiz("reverse"); return; }
    setResultScore(score); setResultKind("segment"); setProgress(saveSegmentResult(segment.id, forwardScore, score)); setStage("result");
  };

  const nextQuiz = () => {
    if (questionIndex < questions.length - 1) { setQuestionIndex((value) => value + 1); setSelected(null); }
    else finishQuiz();
  };

  const startBranch = (selectedChallenge: BranchChallenge) => {
    setChallenge(selectedChallenge); setBranchIndex(0); setBranchCorrect(0); setSelected(null); setStage("branch");
  };

  const answerBranch = (code: string) => {
    if (selected || !challenge) return;
    const item = challenge.questions[branchIndex]; const isCorrect = code === item.answerCode;
    setSelected(code); if (isCorrect) setBranchCorrect((value) => value + 1);
    const station = ALL_MRT_STATIONS.find((candidate) => candidate.code === item.answerCode);
    if (station) setProgress(recordMrtAnswer(station, isCorrect));
  };

  const nextBranch = () => {
    if (!challenge) return;
    if (branchIndex < challenge.questions.length - 1) { setBranchIndex((value) => value + 1); setSelected(null); return; }
    const score = Math.round((branchCorrect / challenge.questions.length) * 100);
    setResultScore(score); setResultKind("branch"); setProgress(saveBranchResult(challenge.id, score)); setStage("result");
  };

  const startOrderExam = () => {
    if (!line) return;
    setOrderRoutes(orderedRoutesForLine(line.id)); setRouteIndex(0); setOrderedCodes([]); setOrderMistakes(0); setWrongOrderCode(null); setStage("order");
  };

  const chooseOrderedStation = (code: string) => {
    if (!line || wrongOrderCode) return;
    const expected = orderRoutes[routeIndex][orderedCodes.length];
    const station = line.stations.find((item) => item.code === expected)!;
    if (code !== expected) {
      setOrderMistakes((value) => value + 1); setWrongOrderCode(code); setProgress(recordMrtAnswer(station, false)); return;
    }
    const nextCodes = [...orderedCodes, code]; setOrderedCodes(nextCodes); setProgress(recordMrtAnswer(station, true));
    if (nextCodes.length === orderRoutes[routeIndex].length) {
      if (routeIndex < orderRoutes.length - 1) { setRouteIndex((value) => value + 1); setOrderedCodes([]); }
      else {
        const total = orderRoutes.reduce((sum, route) => sum + route.length, 0);
        const score = Math.max(0, Math.round(((total - orderMistakes) / total) * 100));
        setResultScore(score); setResultKind("exam"); setProgress(saveLineExamResult(line.id, score)); setStage("result");
      }
    }
  };

  const currentQuestion = questions[questionIndex];
  const currentBranchQuestion = challenge?.questions[branchIndex];
  const currentRoute = orderRoutes[routeIndex] ?? [];
  const orderPool = line ? currentRoute.filter((code) => !orderedCodes.includes(code)).map((code) => line.stations.find((station) => station.code === code)!).filter(Boolean).sort((a, b) => a.code.localeCompare(b.code)) : [];
  const stepIndex = stage === "line" ? 0 : stage === "segment" ? 1 : stage === "result" ? 3 : 2;

  return <TrainShell title="捷運完整路線課程" steps={STEPS} stepIndex={stepIndex}
    stepColor={(id) => id === "learn" ? "bg-blue-100" : id === "result" ? "bg-emerald-100" : "bg-white"} badge={line ? line.id : "route course"}>

    {stage === "line" && <section>
      <p className="font-hand text-2xl text-primary">today's route mission ✎</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">今天從最值得的一段開始</h1>{profile && <p className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold mt-3">個人模式：{profile.vark} · {profile.primaryTalent}</p>}
      <div className="paper-card unlock-in p-6 sm:p-8 mt-6 border-amber-300 bg-amber-50/70"><div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center"><span className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center"><Lightbulb className="w-7 h-7 text-amber-800" /></span><div className="flex-1"><p className="text-xs font-black text-amber-800">今日推薦 · {recommendation.lineId}</p><h2 className="font-display font-bold text-2xl mt-1">{segmentsForLine(recommendation.lineId).find((item) => item.id === recommendation.segmentId)?.name}</h2><p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p></div><Button onClick={startRecommended} className="rounded-full font-bold"><Sparkles className="w-4 h-4" />開始今日任務</Button></div></div>
      {errors.length > 0 && <div role="alert" className="paper-card bg-red-50 text-red-800 p-4 mt-6">課程資料錯誤：{errors.join("、")}</div>}
      <h2 className="font-display font-bold text-xl mt-9 mb-4">或自己選一條線</h2><div className="grid sm:grid-cols-2 gap-5">{MRT_LINES.map((item, index) => { const parts = segmentsForLine(item.id); const passed = parts.filter((part) => progress.segments[part.id]?.passed).length; return <button key={item.id} onClick={() => { setLine(item); setStage("segment"); }} className={`paper-card ${index % 2 ? "tilt-r" : "tilt-l"} p-5 text-left`}><span className="flex gap-4 items-center"><span className="w-12 h-12 rounded-full flex items-center justify-center font-black" style={{ background: item.color, color: item.textColor }}>{item.id}</span><span className="flex-1"><strong className="font-display text-xl block">{item.name}</strong><span className="text-sm text-muted-foreground">完成 {passed}/{parts.length} 段</span></span><ArrowRight className="w-5 h-5" /></span></button>; })}</div>
    </section>}

    {stage === "segment" && line && <section>
      <button onClick={() => setStage("line")} className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-5"><ChevronLeft className="w-4 h-4" />回今日任務</button><h1 className="font-display font-extrabold text-3xl">{line.name}學習路線</h1><p className="text-muted-foreground mt-2 mb-6">沿路線帶依序解鎖；通過時會蓋章並點亮下一段。</p>
      <RouteBand line={line} stations={line.stations.filter((station) => !station.preview)} />
      <div className="space-y-4 mt-7">{lineSegments.map((item, itemIndex) => { const saved = progress.segments[item.id]; const unlocked = itemIndex === 0 || progress.segments[lineSegments[itemIndex - 1].id]?.passed; return <div key={item.id} className={`paper-card p-5 ${saved?.passed ? "border-emerald-300" : ""} ${!unlocked ? "opacity-55" : "unlock-in"}`}><div className="flex flex-col sm:flex-row sm:items-center gap-4"><span className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${saved?.passed ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>{saved?.passed ? <Check className="w-5 h-5" /> : itemIndex + 1}</span><div className="flex-1"><h2 className="font-display font-bold text-lg">{item.name}</h2><p className="text-sm text-muted-foreground">{item.stationCodes.join(" · ")}</p>{saved && <p className="text-xs font-bold mt-2">順背 {saved.bestForward}% · 逆背 {saved.bestReverse}%</p>}</div><Button disabled={!unlocked} onClick={() => startSegment(line, item)} variant={saved?.passed ? "outline" : "default"} className="rounded-full font-bold">{!unlocked ? <LockKeyhole className="w-4 h-4" /> : <TrainFront className="w-4 h-4" />}{saved?.passed ? "再次練習" : unlocked ? "開始本段" : "尚未解鎖"}</Button></div></div>; })}</div>
      {lineChallenge && <div className={`paper-card p-6 mt-6 ${allSegmentsPassed ? "unlock-in border-orange-300" : "opacity-55"}`}><div className="flex flex-col sm:flex-row items-center gap-4"><GitBranch className="w-10 h-10 text-orange-600" /><div className="flex-1"><h2 className="font-display font-bold text-xl">分支專項 · {lineChallenge.title}</h2><p className="text-sm text-muted-foreground">{lineChallenge.description}</p>{progress.branches[lineChallenge.id] && <p className="text-xs font-bold mt-2">最佳 {progress.branches[lineChallenge.id].bestAccuracy}%</p>}</div><Button disabled={!allSegmentsPassed} onClick={() => startBranch(lineChallenge)} className="rounded-full">{progress.branches[lineChallenge.id]?.passed ? "再次挑戰" : "開始分支關卡"}</Button></div></div>}
      <div className={`paper-card p-6 mt-6 ${allSegmentsPassed && branchPassed ? "unlock-in border-amber-400" : "opacity-55"}`}><div className="flex flex-col sm:flex-row items-center gap-4"><Medal className="w-10 h-10 text-amber-600" /><div className="flex-1"><h2 className="font-display font-bold text-xl">正式整線背誦</h2><p className="text-sm text-muted-foreground">不再選相鄰站；請從起點開始，依序排出整條線。</p></div><Button disabled={!allSegmentsPassed || !branchPassed} onClick={startOrderExam} className="rounded-full font-bold">{allSegmentsPassed && branchPassed ? "開始整線排序" : "完成小段與分支後解鎖"}</Button></div></div>
    </section>}

    {stage === "flip" && line && segment && <section><div className="flex justify-between items-center mb-5"><div><p className="text-sm font-bold text-primary">學習階段</p><h1 className="font-display font-extrabold text-2xl">先把每個站點翻開一次</h1></div><span className="text-sm font-bold">{flipped.size}/{segment.stationCodes.length}</span></div><RouteBand line={line} stations={stationsForSegment(segment)} revealed={false} /><div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-7">{stationsForSegment(segment).map((station) => { const isFlipped = flipped.has(station.code); return <button key={station.code} onClick={() => setFlipped((current) => new Set(current).add(station.code))} className={`station-flip-card ${isFlipped ? "station-flipped" : ""}`} aria-label={`翻開 ${station.code}`}><span className="station-flip-inner"><span className="station-flip-front" style={{ borderColor: line.color }}>{station.code}<small>點一下翻牌</small></span><span className="station-flip-back" style={{ background: line.color, color: line.textColor }}><strong>{station.name}</strong><small>{flipHint(profile, station.name, station.code)}</small></span></span></button>; })}</div><Button disabled={flipped.size < segment.stationCodes.length} onClick={() => startQuiz("forward")} className="rounded-full mt-7 w-full sm:w-auto">全部翻過，開始順背 <ArrowRight className="w-4 h-4" /></Button></section>}

    {stage === "quiz" && currentQuestion && line && segment && <section className="max-w-2xl mx-auto"><div className="flex justify-between text-sm font-bold mb-4"><span>{direction === "forward" ? "順背" : "逆背"}</span><span>{questionIndex + 1}/{questions.length}</span></div><RouteBand line={line} stations={stationsForSegment(segment)} activeCode={currentQuestion.station.code} revealed={Boolean(selected)} /><div className="paper-card p-7 sm:p-9 text-center mt-6"><h1 className="font-display font-black text-2xl sm:text-3xl mb-7">{currentQuestion.prompt}</h1><div className="grid sm:grid-cols-2 gap-3">{currentQuestion.options.map((option) => { const isAnswer = option.code === currentQuestion.answerStation.code; const isPicked = option.code === selected; return <button key={option.code} disabled={Boolean(selected)} onClick={() => answerQuiz(option.code)} className={`border-2 rounded-xl p-4 font-bold ${selected ? isAnswer ? "border-emerald-500 bg-emerald-50" : isPicked ? "border-red-400 bg-red-50" : "opacity-50" : "hover:border-primary"}`}>{selected && isAnswer && <Check className="w-4 h-4 inline mr-1" />}{selected && isPicked && !isAnswer && <X className="w-4 h-4 inline mr-1" />}{option.code} {option.name}</button>; })}</div>{selected && <Button onClick={nextQuiz} className="rounded-full mt-6">{questionIndex === questions.length - 1 ? "完成本輪" : "下一題"}<ArrowRight className="w-4 h-4" /></Button>}</div></section>}

    {stage === "branch" && currentBranchQuestion && challenge && line && <section className="max-w-2xl mx-auto"><p className="text-sm font-bold text-orange-700">分支專項 · {challenge.title}</p><h1 className="font-display font-extrabold text-3xl mt-2 mb-7">{currentBranchQuestion.prompt}</h1><div className="paper-card p-6 grid gap-3">{currentBranchQuestion.optionCodes.map((code) => { const station = ALL_MRT_STATIONS.find((item) => item.code === code)!; const isAnswer = code === currentBranchQuestion.answerCode; const isPicked = code === selected; return <button key={code} disabled={Boolean(selected)} onClick={() => answerBranch(code)} className={`border-2 rounded-xl p-4 font-bold ${selected ? isAnswer ? "border-emerald-500 bg-emerald-50" : isPicked ? "border-red-400 bg-red-50" : "opacity-50" : "hover:border-orange-400"}`}>{code} {station.name}</button>; })}{selected && <Button onClick={nextBranch} className="rounded-full mt-3">{branchIndex === challenge.questions.length - 1 ? "完成分支關卡" : "下一題"}</Button>}</div></section>}

    {stage === "order" && line && <section><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><p className="text-sm font-bold text-amber-700">正式整線背誦 · 路徑 {routeIndex + 1}/{orderRoutes.length}</p><h1 className="font-display font-extrabold text-3xl mt-1">從起點開始，依序排出車站</h1></div><span className="text-sm font-bold">已排 {orderedCodes.length}/{currentRoute.length} · 失誤 {orderMistakes}</span></div><div className="paper-card p-5 mt-6 overflow-x-auto"><div className="flex gap-2 min-w-max">{currentRoute.map((code, index) => { const station = line.stations.find((item) => item.code === code)!; const filled = orderedCodes[index] === code; return <div key={`${code}-${index}`} className={`w-24 rounded-lg border-2 p-2 text-center ${filled ? "bg-emerald-50 border-emerald-400 order-pop" : "border-dashed"}`}><strong className="block text-xs">{filled ? code : index + 1}</strong><span className="text-sm">{filled ? station.name : "？"}</span></div>; })}</div></div><p className="text-sm text-muted-foreground mt-5">選擇下一個站；答錯不會前進，請修正後繼續。</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">{orderPool.map((station) => <button key={station.code} onClick={() => chooseOrderedStation(station.code)} className={`paper-card p-3 font-bold ${wrongOrderCode === station.code ? "border-red-400 bg-red-50" : ""}`}>{station.code}<span className="block text-sm mt-1">{station.name}</span></button>)}</div>{wrongOrderCode && <div className="mt-5 bg-red-50 text-red-800 rounded-xl p-4"><p className="font-bold">順序不對，再看看上一個站。</p><Button variant="outline" onClick={() => setWrongOrderCode(null)} className="rounded-full mt-3">再試一次</Button></div>}</section>}

    {stage === "result" && line && <section className="max-w-xl mx-auto text-center"><div className="paper-card unlock-in p-9"><Medal className="w-16 h-16 mx-auto text-amber-600" /><h1 className="font-display font-extrabold text-3xl mt-4">{resultKind === "segment" ? `${segment?.name}完成` : resultKind === "branch" ? `${challenge?.title}完成` : "整線背誦完成"}</h1>{resultKind === "segment" ? <p className="mt-5">順背 <strong>{forwardScore}%</strong> · 逆背 <strong>{resultScore}%</strong></p> : <p className="text-5xl font-black mt-5">{resultScore}%</p>}<p className="text-muted-foreground mt-3">{resultKind === "segment" ? forwardScore >= 80 && resultScore >= 80 ? "本段通過，下一段已解鎖！" : "順背與逆背都需達 80%。" : resultKind === "branch" ? resultScore >= 80 ? "分支辨識通過！" : "再練一次，把岔路記牢。" : resultScore >= 85 ? "整條路線已通過驗收！" : "尚未達 85%，回到弱段再練。"}</p><Button onClick={() => setStage("segment")} className="rounded-full mt-7">返回路線任務板</Button></div></section>}
  </TrainShell>;
}
