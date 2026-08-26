import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  findMemoryTopic,
  recommendedTraining,
  setPointMastery,
} from "@/lib/memoryTopics";
import { loadMemoryProfile } from "@/lib/memoryProfile";
export default function MemoryTopicTraining() {
  const [, params] = useRoute("/memory/topic/:id/train");
  const topic = useMemo(() => findMemoryTopic(params?.id || ""), [params?.id]);
  const recommendation = useMemo(
    () => recommendedTraining(loadMemoryProfile()),
    []
  );
  const [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false),
    [done, setDone] = useState(0);
  if (!topic) return <main className="p-10">找不到主題</main>;
  if (index >= topic.points.length)
    return (
      <main className="container max-w-xl py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="font-display font-extrabold text-4xl mt-4">
          完成本輪訓練
        </h1>
        <p className="mt-3">
          熟練 {done}/{topic.points.length} 個知識點
        </p>
        <Link href={`/memory/topic/${topic.id}`}>
          <Button className="mt-6">回主題詳情</Button>
        </Link>
      </main>
    );
  const point = topic.points[index];
  const answer = (mastered: boolean) => {
    setPointMastery(topic.id, point.id, mastered);
    if (mastered) setDone(v => v + 1);
    setIndex(v => v + 1);
    setRevealed(false);
  };
  return (
    <main className="container max-w-2xl py-8">
      <Link href={`/memory/topic/${topic.id}`} className="flex gap-2 font-bold">
        <ArrowLeft />
        離開訓練
      </Link>
      <div className="flex justify-between mt-10">
        <span>
          {recommendation.icon} {recommendation.name}
        </span>
        <b>
          {index + 1}/{topic.points.length}
        </b>
      </div>
      <div className="paper-card min-h-[360px] p-8 mt-4 grid place-items-center text-center">
        <div>
          <p className="text-sm text-muted-foreground">先回想，再翻面</p>
          <h1 className="font-display font-extrabold text-4xl mt-5">
            {point.prompt}
          </h1>
          {revealed && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-primary font-bold">答案</p>
              <p className="text-2xl font-bold mt-2">{point.answer}</p>
            </div>
          )}
        </div>
      </div>
      {!revealed ? (
        <Button
          className="w-full rounded-full mt-5"
          onClick={() => setRevealed(true)}
        >
          顯示答案
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => answer(false)}
          >
            <X />
            還不熟
          </Button>
          <Button className="rounded-full" onClick={() => answer(true)}>
            <Check />
            記住了
          </Button>
        </div>
      )}
    </main>
  );
}
