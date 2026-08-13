import { useMemo, useState } from "react";
import { ChevronLeft, Mic2, Play, RotateCcw, Volume2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MRT_LINES, type MrtLine } from "@/lib/mrtData";
import { recordMrtAnswer } from "@/lib/mrtProgress";

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - .5);
export default function MrtAudio() {
  const [line, setLine] = useState<MrtLine>(MRT_LINES[0]); const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const [message, setMessage] = useState("");
  const active = line.stations.filter((station) => !station.preview); const station = active[index % active.length];
  const options = useMemo(() => shuffle([station, ...shuffle(active.filter((item) => item.code !== station.code)).slice(0, 3)]), [line, index]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const speak = (withAnswer = true) => { if (!supported) { setMessage("此瀏覽器不支援語音合成，請改用文字節奏跟讀。"); return; } window.speechSynthesis.cancel(); const text = withAnswer ? `下一站，${station.name}，站號，${station.code}` : `下一站，請選出正確車站`; const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "zh-TW"; utterance.rate = .82; window.speechSynthesis.speak(utterance); setMessage("播放中：跟著三拍節奏唸一次"); };
  const answer = (code: string) => { const correct = code === station.code; recordMrtAnswer(station, correct); setRevealed(true); setMessage(correct ? "聽對了！再跟讀一次站名與站號。" : `正確答案是 ${station.code} ${station.name}`); };
  const next = () => { setIndex((value) => (value + 1) % active.length); setRevealed(false); setMessage(""); };
  return <main className="container max-w-4xl py-8"><Link href="/train/mrt" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="w-4 h-4" />捷運任務板</Link><p className="font-hand text-2xl text-primary mt-7">listen, shadow, recall ✎</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">報站音訊模式</h1>
    <div className="flex gap-2 overflow-x-auto mt-6 pb-2">{MRT_LINES.map((item) => <button key={item.id} onClick={() => { setLine(item); setIndex(0); setRevealed(false); }} className={`rounded-full px-4 py-2 font-bold border ${line.id === item.id ? "text-white" : "bg-white"}`} style={line.id === item.id ? { background: item.color } : undefined}>{item.id}</button>)}</div>
    <div className="paper-card p-7 sm:p-10 text-center mt-5"><span className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center"><Volume2 className="w-8 h-8" /></span><h2 className="font-display font-bold text-2xl mt-5">先閉眼聽，再選答案</h2><div className="flex flex-wrap justify-center gap-3 mt-5"><Button onClick={() => speak(true)} className="rounded-full"><Play className="w-4 h-4" />播放報站</Button><Button onClick={() => speak(true)} variant="outline" className="rounded-full"><Mic2 className="w-4 h-4" />跟讀一次</Button></div>
      <div className="grid sm:grid-cols-2 gap-3 mt-7">{options.map((option) => <button key={option.code} disabled={revealed} onClick={() => answer(option.code)} className={`border-2 rounded-xl p-4 font-bold ${revealed ? option.code === station.code ? "border-emerald-500 bg-emerald-50" : "opacity-50" : "hover:border-primary"}`}>{option.code} {option.name}</button>)}</div>{message && <p className="mt-5 font-bold text-primary" aria-live="polite">{message}</p>}{revealed && <Button onClick={next} className="rounded-full mt-5"><RotateCcw className="w-4 h-4" />下一個報站</Button>}
      {!supported && <p className="text-xs text-amber-700 mt-5">語音不可用時仍可使用「站名－站號－下一站」三拍文字跟讀。</p>}
    </div>
  </main>;
}
