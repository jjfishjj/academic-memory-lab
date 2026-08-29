import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Play,
  Trash2,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ALL_MRT_STATIONS } from "@/lib/mrtData";
import { recordMrtAnswer } from "@/lib/mrtProgress";
import {
  buildMrtConfusionPairQuestions,
  clearMrtRepairConfusion,
  loadMrtRepairConfusions,
  recordMrtRepairConfusion,
  summarizeMrtRepairConfusions,
  type MrtRepairConfusionRow,
} from "@/lib/mrtRepair";

export default function MrtConfusions() {
  const [confusions, setConfusions] = useState(() => loadMrtRepairConfusions());
  const [practice, setPractice] = useState<MrtRepairConfusionRow | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const rows = useMemo(
    () => summarizeMrtRepairConfusions(confusions, ALL_MRT_STATIONS),
    [confusions]
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const questions = useMemo(
    () =>
      practice
        ? buildMrtConfusionPairQuestions(practice, ALL_MRT_STATIONS)
        : [],
    [practice]
  );
  const current = questions[questionIndex];
  const practiceDone = Boolean(practice && questionIndex >= questions.length);
  const options = useMemo(() => {
    if (!practice || !current) return [];
    const values =
      current.direction === "code-to-name"
        ? [practice.sourceName, practice.confusedName]
        : [practice.sourceCode, practice.confusedCode];
    return questionIndex % 2 ? [...values].reverse() : values;
  }, [current, practice, questionIndex]);

  const startPractice = (row: MrtRepairConfusionRow) => {
    setPractice(row);
    setQuestionIndex(0);
    setSelected(null);
    setAnswers([]);
  };

  const answerQuestion = (value: string) => {
    if (!current || selected) return;
    const correct = value === current.answer;
    setSelected(value);
    setAnswers(previous => [...previous, correct]);
    recordMrtAnswer(current.station, correct);
    if (!correct) setConfusions(recordMrtRepairConfusion(current, value));
  };

  const nextQuestion = () => {
    setQuestionIndex(index => index + 1);
    setSelected(null);
  };

  const leavePractice = () => {
    setPractice(null);
    setQuestionIndex(0);
    setSelected(null);
    setAnswers([]);
  };

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

      {practice ? (
        <section className="paper-card p-6 sm:p-8 mt-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">
                混淆組合雙向專項
              </p>
              <h2 className="font-display font-extrabold text-2xl mt-1">
                {practice.sourceCode} {practice.sourceName}
                <ArrowLeftRight className="inline w-5 h-5 mx-2 text-red-600" />
                {practice.confusedCode} {practice.confusedName}
              </h2>
            </div>
            {!practiceDone && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                第 {questionIndex + 1}/{questions.length} 題
              </span>
            )}
          </div>

          {practiceDone ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">本輪完成</p>
              <p className="font-display font-extrabold text-5xl mt-1">
                {answers.filter(Boolean).length}/{questions.length}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => startPractice(practice)}
                >
                  <Play className="w-4 h-4" />
                  再練一次
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={leavePractice}
                >
                  返回矩陣
                </Button>
              </div>
            </div>
          ) : current ? (
            <div className="mt-8">
              <p className="text-center text-sm font-bold text-muted-foreground">
                {current.direction === "code-to-name"
                  ? "看到站碼，選出站名"
                  : "看到站名，選出站碼"}
              </p>
              <p className="text-center font-display font-extrabold text-4xl sm:text-5xl mt-3">
                {current.prompt}
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-7">
                {options.map(option => {
                  const isAnswer = option === current.answer;
                  const isSelected = option === selected;
                  const resultClass = selected
                    ? isAnswer
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : isSelected
                        ? "border-red-500 bg-red-50 text-red-900"
                        : "opacity-60"
                    : "hover:border-orange-400 hover:bg-orange-50";
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={Boolean(selected)}
                      onClick={() => answerQuestion(option)}
                      className={`rounded-2xl border-2 p-5 text-lg font-bold transition ${resultClass}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {selected && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 p-4">
                  <p className="font-bold">
                    {selected === current.answer
                      ? "答對了，雙向連結再加深一層。"
                      : `正確答案是 ${current.answer}，這次混淆已記錄。`}
                  </p>
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={nextQuestion}
                  >
                    {questionIndex === questions.length - 1
                      ? "查看成績"
                      : "下一題"}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </section>
      ) : rows.length ? (
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-orange-300 text-orange-800 hover:bg-orange-50"
                  onClick={() => startPractice(row)}
                >
                  <Play className="w-3.5 h-3.5" />
                  開始專項
                </Button>
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
