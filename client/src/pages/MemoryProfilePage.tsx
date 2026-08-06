import { useState } from "react";
import { ChevronLeft, Check, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { loadMemoryProfile, saveMemoryProfile, TALENT_OPTIONS, VARK_OPTIONS, type TalentType, type VarkType } from "@/lib/memoryProfile";

export default function MemoryProfilePage() {
  const current = loadMemoryProfile();
  const [vark, setVark] = useState<VarkType>(current?.vark ?? "visual");
  const [primary, setPrimary] = useState<TalentType>(current?.primaryTalent ?? "visualBuilder");
  const [secondary, setSecondary] = useState<TalentType>(current?.secondaryTalent ?? "systemAccumulator");
  const [saved, setSaved] = useState(false);
  return <main className="container max-w-4xl py-8"><Link href="/train/mrt" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="w-4 h-4" />捷運任務板</Link>
    <p className="font-hand text-2xl text-primary mt-7">your memory route ✎</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">設定 VARK＋八大記憶天賦</h1><p className="text-muted-foreground mt-3">若你已做過完整量表，選擇報告中的主要結果；之後可隨時修改。</p>
    <Link href="/train/mrt/quiz" className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-800 px-4 py-2 font-bold text-sm mt-5">還不知道結果？做完整 12 題量表 <Sparkles className="w-4 h-4" /></Link>
    <section className="mt-8"><h2 className="font-display font-bold text-xl">1. VARK 主要入口</h2><div className="grid sm:grid-cols-4 gap-3 mt-4">{VARK_OPTIONS.map((item) => <button key={item.id} onClick={() => setVark(item.id)} className={`paper-card p-4 text-left ${vark === item.id ? "border-primary bg-primary/5" : ""}`}><span className="text-2xl">{item.icon}</span><strong className="block mt-2">{item.name}</strong><small className="text-muted-foreground">{item.hint}</small></button>)}</div></section>
    <section className="mt-8"><h2 className="font-display font-bold text-xl">2. 主天賦</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{TALENT_OPTIONS.map((item) => <button key={item.id} onClick={() => { setPrimary(item.id); if (secondary === item.id) setSecondary(item.id === "systemAccumulator" ? "creativeConnector" : "systemAccumulator"); }} className={`paper-card p-4 text-left ${primary === item.id ? "border-primary bg-primary/5" : ""}`}><span>{item.icon}</span><strong className="block mt-1">{item.name}</strong><small className="text-muted-foreground">{item.hint}</small></button>)}</div></section>
    <section className="mt-8"><h2 className="font-display font-bold text-xl">3. 副天賦</h2><div className="flex flex-wrap gap-2 mt-4">{TALENT_OPTIONS.filter((item) => item.id !== primary).map((item) => <button key={item.id} onClick={() => setSecondary(item.id)} className={`rounded-full px-4 py-2 border font-bold text-sm ${secondary === item.id ? "bg-primary text-primary-foreground" : "bg-white"}`}>{item.icon} {item.name}</button>)}</div></section>
    <div className="paper-card sticky-note sticky-yellow-bg p-6 mt-9 flex flex-col sm:flex-row items-center gap-4"><Sparkles className="w-8 h-8 text-amber-700" /><p className="flex-1 text-sm">課程會依此調整翻牌提示；聽覺／聲音型會優先推薦報站模式，系統累積型會優先顯示到期複習。</p><Button onClick={() => { saveMemoryProfile({ vark, primaryTalent: primary, secondaryTalent: secondary }); setSaved(true); }} className="rounded-full">{saved ? <Check className="w-4 h-4" /> : null}{saved ? "已保存" : "保存個人設定"}</Button></div>
  </main>;
}
