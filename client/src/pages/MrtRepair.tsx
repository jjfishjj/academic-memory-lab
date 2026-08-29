import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Wrench } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ALL_MRT_STATIONS } from "@/lib/mrtData";
import {
  getMrtMnemonic,
  loadPersonalMrtMnemonics,
  updatePersonalMrtMnemonics,
} from "@/lib/mrtMnemonics";
import { loadMrtProgress, recordMrtAnswer } from "@/lib/mrtProgress";
import {
  buildMrtRepairQuestions,
  buildAdaptiveMrtRepairOptions,
  loadMrtRepairConfusions,
  recordMrtRepairConfusion,
  repairQuality,
  saveMrtRepairResult,
  selectDailyRepairStations,
} from "@/lib/mrtRepair";

export default function MrtRepair() {
  const stations = useMemo(
    () =>
      selectDailyRepairStations(
        ALL_MRT_STATIONS,
        loadMrtProgress(),
        loadPersonalMrtMnemonics()
      ),
    []
  );
  const questions = useMemo(
    () => buildMrtRepairQuestions(stations),
    [stations]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [confusions, setConfusions] = useState(() => loadMrtRepairConfusions());
  const current = questions[index];
  const options = useMemo(
    () =>
      current
        ? buildAdaptiveMrtRepairOptions(current, ALL_MRT_STATIONS, confusions)
        : [],
    [confusions, current]
  );

  const resultKey = current
    ? `${current.station.code}:${current.direction}`
    : "";

  const answer = (value: string) => {
    if (!current || selected) return;
    const correct = value === current.answer;
    setSelected(value);
    setResults(saved => ({ ...saved, [resultKey]: correct }));
    recordMrtAnswer(current.station, correct);
    if (!correct) setConfusions(recordMrtRepairConfusion(current, value));
  };
  const next = () => {
    if (index < questions.length - 1) {
      setIndex(value => value + 1);
      setSelected(null);
      return;
    }
    const finalResults = { ...results };
    const latestProgress = loadMrtProgress();
    updatePersonalMrtMnemonics(currentItems =>
      stations.reduce(
        (next, station) => {
          const existing = next[station.code];
          const stationProgress = latestProgress.stations[station.code];
          const accuracy = stationProgress?.attempts
            ? stationProgress.correct / stationProgress.attempts
            : finalResults[`${station.code}:code-to-name`] &&
                finalResults[`${station.code}:name-to-code`]
              ? 1
              : 0;
          next[station.code] = {
            sound: existing?.sound ?? getMrtMnemonic(station).sound,
            favorite: existing?.favorite ?? false,
            quality: repairQuality(accuracy),
          };
          return next;
        },
        { ...currentItems }
      )
    );
    const correctCodes = stations
      .filter(
        station =>
          finalResults[`${station.code}:code-to-name`] &&
          finalResults[`${station.code}:name-to-code`]
      )
      .map(station => station.code);
    const correctAnswers = Object.values(finalResults).filter(Boolean).length;
    saveMrtRepairResult({
      date: new Date().toLocaleDateString("en-CA"),
      stationCodes: stations.map(station => station.code),
      correctCodes,
      accuracy: Math.round((correctAnswers / questions.length) * 100),
      weakBefore: stations.length,
      weakAfter: stations.length - correctCodes.length,
    });
    setDone(true);
  };

  if (done) {
    const correct = Object.values(results).filter(Boolean).length;
    return (
      <main className="container max-w-3xl py-10">
        <section className="paper-card p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <p className="font-hand text-primary text-xl mt-4">
            repair complete ✎
          </p>
          <h1 className="font-display font-black text-3xl mt-2">
            今日弱站修復完成
          </h1>
          <strong className="block text-5xl mt-5">
            {correct}/{questions.length}
          </strong>
          <p className="text-muted-foreground mt-3">
            每站兩個方向都答對才算修復；品質已依更新後累積正確率重新評估。
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {stations.map(station => (
              <span
                key={station.code}
                className={`rounded-full px-3 py-2 text-sm font-bold ${results[`${station.code}:code-to-name`] && results[`${station.code}:name-to-code`] ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
              >
                {station.code} {station.name}
              </span>
            ))}
          </div>
          <Link href="/train/mrt">
            <Button className="rounded-full mt-7">回捷運任務板</Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container max-w-3xl py-8">
      <Link
        href="/train/mrt"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        捷運任務板
      </Link>
      <div className="mt-7 flex items-center gap-3">
        <span className="rounded-2xl bg-red-100 p-3">
          <Wrench className="text-red-700" />
        </span>
        <div>
          <p className="text-xs font-black text-red-700">每日 5 站弱點專班</p>
          <h1 className="font-display font-black text-3xl">弱站自動修復課程</h1>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        {stations.map((station, stationIndex) => (
          <span
            key={`${station.code}-${stationIndex}`}
            className={`h-2 flex-1 rounded-full ${stationIndex * 2 + 1 < index ? "bg-emerald-500" : stationIndex * 2 <= index ? "bg-red-500" : "bg-muted"}`}
          />
        ))}
      </div>
      {current && (
        <section className="paper-card p-6 sm:p-8 mt-5">
          <span className="text-sm font-bold text-muted-foreground">
            第 {index + 1}/{questions.length} 題 · {current.station.lineId} ·
            {current.direction === "code-to-name" ? " 站碼→站名" : " 站名→站碼"}
          </span>
          <p className="text-xs text-muted-foreground mt-2">
            干擾選項會優先重現你曾混淆的答案，再加入同線與相近站碼。
          </p>
          <div className="rounded-2xl bg-primary text-primary-foreground text-center py-9 mt-4">
            <strong className="text-5xl">{current.prompt}</strong>
            <p className="mt-3">
              {current.direction === "code-to-name"
                ? "這個站碼是哪一站？"
                : "這個站名的站碼是？"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {options.map(option => {
              const correct = option === current.answer;
              return (
                <button
                  key={option}
                  disabled={Boolean(selected)}
                  onClick={() => answer(option)}
                  className={`rounded-xl border p-4 text-left font-bold ${selected ? (correct ? "bg-emerald-100 border-emerald-400" : selected === option ? "bg-red-100 border-red-400" : "opacity-60") : "hover:border-primary"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="rounded-xl bg-amber-50 p-4 mt-5">
              <strong>
                {selected === current.answer
                  ? "答對了！"
                  : `正解：${current.answer}`}
              </strong>
              <p className="text-sm mt-1">
                聯想：
                {
                  getMrtMnemonic(current.station, loadPersonalMrtMnemonics())
                    .sound
                }
              </p>
              <Button onClick={next} className="rounded-full mt-4">
                {index === questions.length - 1 ? "完成並重新評估" : "下一題"}
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
