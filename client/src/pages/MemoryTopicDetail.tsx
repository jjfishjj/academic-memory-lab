import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, CheckCircle2, Cloud, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  findMemoryTopic,
  recommendedTraining,
  setPointMastery,
} from "@/lib/memoryTopics";
import { loadMemoryProfile } from "@/lib/memoryProfile";
export default function MemoryTopicDetail() {
  const [, params] = useRoute("/memory/topic/:id");
  const [version, setVersion] = useState(0);
  const topic = useMemo(
    () => findMemoryTopic(params?.id || ""),
    [params?.id, version]
  );
  const recommendation = useMemo(
    () => recommendedTraining(loadMemoryProfile()),
    []
  );
  if (!topic)
    return (
      <main className="container max-w-2xl py-16 text-center">
        <h1 className="font-display text-3xl font-bold">找不到這個主題</h1>
        <Link href="/memory">
          <Button className="mt-5">回到記憶庫</Button>
        </Link>
      </main>
    );
  const mastered = topic.points.filter(p => p.mastered).length;
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/memory" className="font-bold flex gap-2">
            <ArrowLeft />
            記憶庫
          </Link>
          <b>主題詳情</b>
          <Link href="/train/mrt/sync">
            <Cloud />
          </Link>
        </div>
      </header>
      <main className="container max-w-5xl pt-8">
        <section className="paper-card p-6 sm:p-8 bg-[linear-gradient(135deg,#ecfdf5,#fff7d6)]">
          <span className="text-5xl">{topic.emoji}</span>
          <p className="text-sm font-bold text-primary mt-4">
            {topic.category} · {topic.points.length} 個知識點
          </p>
          <h1 className="font-display font-extrabold text-4xl mt-1">
            {topic.title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            已熟練 {mastered}/{topic.points.length}
          </p>
        </section>
        <section className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
          <div>
            <h2 className="font-display font-extrabold text-2xl mb-3">
              要記住的內容
            </h2>
            <div className="space-y-2">
              {topic.points.map((point, i) => (
                <article
                  key={point.id}
                  className={`paper-card p-4 flex items-center gap-4 ${point.mastered ? "bg-emerald-50" : "bg-white"}`}
                >
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <b>{point.prompt}</b>
                    {point.answer !== point.prompt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {point.answer}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label={
                      point.mastered ? "標示為未熟練" : "標示為已熟練"
                    }
                    onClick={() => {
                      setPointMastery(topic.id, point.id, !point.mastered);
                      setVersion(v => v + 1);
                    }}
                  >
                    <CheckCircle2
                      className={
                        point.mastered
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    />
                  </button>
                </article>
              ))}
            </div>
          </div>
          <aside>
            <div className="paper-card p-5 border-2 border-primary/30 sticky top-5">
              <Sparkles className="text-primary" />
              <p className="text-xs font-bold text-primary mt-3">
                依你的 VARK＋主天賦推薦
              </p>
              <h2 className="font-display font-extrabold text-2xl mt-1">
                {recommendation.icon} {recommendation.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {recommendation.reason}
              </p>
              <Link href={`/memory/topic/${topic.id}/train`}>
                <Button className="w-full rounded-full mt-5">
                  <Play />
                  開始推薦訓練
                </Button>
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
