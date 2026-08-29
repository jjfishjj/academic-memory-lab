import { useMemo, useState } from "react";
import { ArrowLeft, ArrowLeftRight, Trash2, Wrench } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ALL_MRT_STATIONS } from "@/lib/mrtData";
import {
  clearMrtRepairConfusion,
  loadMrtRepairConfusions,
  summarizeMrtRepairConfusions,
} from "@/lib/mrtRepair";

export default function MrtConfusions() {
  const [confusions, setConfusions] = useState(() => loadMrtRepairConfusions());
  const rows = useMemo(
    () => summarizeMrtRepairConfusions(confusions, ALL_MRT_STATIONS),
    [confusions]
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <main className="container max-w-4xl py-8">
      <Link
        href="/train/mrt"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        捷運任務板
      </Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-hand text-2xl text-primary">confusion map ✎</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">
            捷運混淆矩陣
          </h1>
          <p className="text-muted-foreground mt-2">
            依錯答次數排序，找出最常互相混淆的站點組合。
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800">
          {rows.length} 組 · {total} 次混淆
        </span>
      </div>

      {rows.length ? (
        <div className="grid gap-3 mt-7">
          {rows.map(row => (
            <article
              key={`${row.key}:${row.selected}`}
              className="paper-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div>
                  <strong className="block text-lg">{row.sourceCode}</strong>
                  <span className="text-sm text-muted-foreground">
                    {row.sourceName}
                  </span>
                </div>
                <ArrowLeftRight className="w-5 h-5 text-red-600" />
                <div>
                  <strong className="block text-lg">{row.confusedCode}</strong>
                  <span className="text-sm text-muted-foreground">
                    {row.confusedName}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  {row.direction === "code-to-name" ? "站碼→站名" : "站名→站碼"}
                  · {row.count} 次
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConfusions(
                      clearMrtRepairConfusion(row.key, row.selected)
                    )
                  }
                  aria-label={`清除 ${row.sourceCode} 與 ${row.confusedCode} 的混淆紀錄`}
                  className="rounded-full border p-2 text-muted-foreground hover:border-red-300 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="paper-card p-8 text-center mt-7">
          <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="font-display font-bold text-xl mt-4">
            目前沒有混淆紀錄
          </h2>
          <p className="text-muted-foreground mt-2">
            弱站修復課程出現錯答後，這裡會自動整理容易搞混的站點。
          </p>
          <Link href="/train/mrt/repair">
            <Button className="rounded-full mt-5">
              <Wrench className="w-4 h-4" />
              開始弱站修復
            </Button>
          </Link>
        </section>
      )}
    </main>
  );
}
