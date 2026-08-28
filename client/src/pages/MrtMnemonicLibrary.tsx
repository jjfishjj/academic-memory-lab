import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckSquare,
  Download,
  Heart,
  Pencil,
  Search,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ALL_MRT_STATIONS } from "@/lib/mrtData";
import { generateMrtMnemonicCandidates } from "@/lib/mnemonicAi";
import {
  applyMrtMnemonicImport,
  deletePersonalMrtMnemonic,
  experimentDueDay,
  getMrtMnemonic,
  loadMrtMnemonicExperiments,
  mnemonicStyleOf,
  parseMrtMnemonicImport,
  previewMrtMnemonicImport,
  qualityAdjustedPreferences,
  loadMrtStylePreferences,
  loadPersonalMrtMnemonics,
  savePersonalMrtMnemonic,
  saveMrtMnemonicExperiments,
  speakMrtMnemonic,
  recordMrtStyleChoice,
  sortMrtSuggestionsByPreference,
  summarizeMrtExperiments,
  updatePersonalMrtMnemonics,
  type MrtMnemonicQuality,
  type MrtMnemonicExperiment,
  type MrtMnemonicImportPreview,
  type MrtImportConflictStrategy,
  type PersonalMrtMnemonic,
} from "@/lib/mrtMnemonics";

type SortMode = "code" | "name" | "favorite";

export default function MrtMnemonicLibrary() {
  const [items, setItems] = useState<Record<string, PersonalMrtMnemonic>>(() =>
    loadPersonalMrtMnemonics()
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("favorite");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiSource, setAiSource] = useState<"ai" | "offline" | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState(() =>
    loadMrtStylePreferences()
  );
  const [message, setMessage] = useState("");
  const [importPreview, setImportPreview] =
    useState<MrtMnemonicImportPreview | null>(null);
  const [importStrategy, setImportStrategy] =
    useState<MrtImportConflictStrategy>("skip");
  const [experiments, setExperiments] = useState<MrtMnemonicExperiment[]>(() =>
    loadMrtMnemonicExperiments()
  );
  const importRef = useRef<HTMLInputElement>(null);

  const adjustedPreferences = useMemo(
    () => qualityAdjustedPreferences(items, preferences),
    [items, preferences]
  );
  const experimentSummaries = useMemo(
    () => summarizeMrtExperiments(experiments),
    [experiments]
  );
  const retentionByDay = useMemo(
    () =>
      ([1, 3, 7] as const).map(day => {
        const rows = experimentSummaries.flatMap(summary =>
          summary.retention.filter(item => item.day === day)
        );
        const attempts = rows.reduce((sum, item) => sum + item.attempts, 0);
        const remembered = rows.reduce((sum, item) => sum + item.remembered, 0);
        return {
          day,
          rate: attempts ? Math.round((remembered / attempts) * 100) : null,
          attempts,
        };
      }),
    [experimentSummaries]
  );
  const abLineStats = useMemo(
    () =>
      Object.values(
        experimentSummaries.reduce<
          Record<
            string,
            { lineId: string; remembered: number; attempts: number }
          >
        >((result, summary) => {
          const lineId =
            ALL_MRT_STATIONS.find(
              station => station.code === summary.stationCode
            )?.lineId ?? "?";
          const current = result[lineId] ?? {
            lineId,
            remembered: 0,
            attempts: 0,
          };
          summary.retention.forEach(item => {
            current.remembered += item.remembered;
            current.attempts += item.attempts;
          });
          result[lineId] = current;
          return result;
        }, {})
      ),
    [experimentSummaries]
  );
  const abStyleStats = useMemo(
    () =>
      Object.values(
        experimentSummaries
          .flatMap(summary => summary.variants)
          .reduce<
            Record<
              string,
              { style: string; remembered: number; attempts: number }
            >
          >((result, variant) => {
            const style =
              variant.style === "humor"
                ? "幽默型"
                : variant.style === "story"
                  ? "故事型"
                  : variant.style === "celebrity"
                    ? "名人型"
                    : "自訂型";
            const current = result[style] ?? {
              style,
              remembered: 0,
              attempts: 0,
            };
            current.remembered += variant.remembered;
            current.attempts += variant.attempts;
            result[style] = current;
            return result;
          }, {})
      ),
    [experimentSummaries]
  );
  const styleStats = useMemo(
    () =>
      [
        {
          id: "humor" as const,
          label: "幽默型",
          count: adjustedPreferences.humor,
        },
        {
          id: "story" as const,
          label: "故事型",
          count: adjustedPreferences.story,
        },
        {
          id: "celebrity" as const,
          label: "名人型",
          count: adjustedPreferences.celebrity,
        },
      ].sort((a, b) => b.count - a.count),
    [adjustedPreferences]
  );
  const lineStats = useMemo(
    () =>
      Object.entries(items).reduce<
        Record<string, { total: number; good: number }>
      >((result, [code, item]) => {
        const station = ALL_MRT_STATIONS.find(
          candidate => candidate.code === code
        );
        if (!station) return result;
        const current = result[station.lineId] ?? { total: 0, good: 0 };
        current.total += 1;
        if (item.quality === "good") current.good += 1;
        result[station.lineId] = current;
        return result;
      }, {}),
    [items]
  );

  const rows = useMemo(
    () =>
      Object.keys(items)
        .map(code => ({
          station: ALL_MRT_STATIONS.find(station => station.code === code),
          saved: items[code],
        }))
        .filter(
          (
            row
          ): row is {
            station: NonNullable<typeof row.station>;
            saved: PersonalMrtMnemonic;
          } => Boolean(row.station)
        )
        .filter(({ station, saved }) =>
          `${station.code}${station.name}${saved.sound}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .sort((a, b) =>
          sort === "favorite"
            ? Number(b.saved.favorite) - Number(a.saved.favorite) ||
              a.station.code.localeCompare(b.station.code)
            : sort === "name"
              ? a.station.name.localeCompare(b.station.name, "zh-Hant")
              : a.station.code.localeCompare(b.station.code)
        ),
    [items, query, sort]
  );

  const beginEdit = (code: string) => {
    setEditing(code);
    setDraft(items[code].sound);
    setSuggestions([]);
    setAiSource(null);
  };
  const save = (code: string, sound = draft) => {
    if (!sound.trim()) return;
    setItems(
      savePersonalMrtMnemonic(code, {
        sound: sound.trim(),
        favorite: items[code]?.favorite ?? false,
        quality: items[code]?.quality,
      })
    );
    setDraft(sound.trim());
  };
  const generate = async (code: string) => {
    const station = ALL_MRT_STATIONS.find(item => item.code === code);
    if (!station) return;
    setBusy(true);
    const result = await generateMrtMnemonicCandidates(station);
    setSuggestions(
      sortMrtSuggestionsByPreference(result.suggestions, adjustedPreferences)
    );
    setAiSource(result.source);
    setBusy(false);
  };

  const toggleSelected = (code: string) =>
    setSelectedCodes(current => {
      const next = new Set(current);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  const selectVisible = () =>
    setSelectedCodes(current =>
      rows.every(row => current.has(row.station.code))
        ? new Set()
        : new Set(rows.map(row => row.station.code))
    );
  const batchFavorite = () =>
    setItems(
      updatePersonalMrtMnemonics(current =>
        Object.fromEntries(
          Object.entries(current).map(([code, value]) => [
            code,
            selectedCodes.has(code) ? { ...value, favorite: true } : value,
          ])
        )
      )
    );
  const batchDelete = () => {
    if (
      !selectedCodes.size ||
      !window.confirm(`刪除選取的 ${selectedCodes.size} 個個人聯想？`)
    )
      return;
    setItems(
      updatePersonalMrtMnemonics(current =>
        Object.fromEntries(
          Object.entries(current).filter(([code]) => !selectedCodes.has(code))
        )
      )
    );
    setSelectedCodes(new Set());
  };
  const exportJson = () => {
    const chosen = selectedCodes.size
      ? Object.fromEntries(
          Object.entries(items).filter(([code]) => selectedCodes.has(code))
        )
      : items;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            preferences,
            mnemonics: chosen,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "memodesk-mrt-mnemonics.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseMrtMnemonicImport(JSON.parse(await file.text()));
      setImportPreview(
        previewMrtMnemonicImport(
          parsed,
          items,
          new Set(ALL_MRT_STATIONS.map(station => station.code)),
          importStrategy
        )
      );
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? `匯入失敗：${error.message}` : "匯入失敗"
      );
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };
  const confirmImport = () => {
    if (!importPreview) return;
    const next = applyMrtMnemonicImport(importPreview, items);
    setItems(updatePersonalMrtMnemonics(() => next));
    if (importPreview.incoming.preferences) {
      const merged = { ...preferences, ...importPreview.incoming.preferences };
      localStorage.setItem(
        "memodesk-mrt-style-preferences",
        JSON.stringify(merged)
      );
      setPreferences(merged);
    }
    setMessage(
      `已新增 ${importPreview.added.length} 筆、覆蓋 ${importPreview.overwritten.length} 筆、略過 ${importPreview.skipped.length + importPreview.invalid.length} 筆。`
    );
    setImportPreview(null);
  };
  const startExperiment = (stationCode: string) => {
    if (suggestions.length < 2) return;
    const experiment: MrtMnemonicExperiment = {
      id: `${stationCode}-${Date.now()}`,
      stationCode,
      variants: [suggestions[0], suggestions[1]],
      startedAt: new Date().toISOString(),
      checks: [],
    };
    const next = [experiment, ...experiments];
    saveMrtMnemonicExperiments(next);
    setExperiments(next);
    setMessage(`${stationCode} A/B 測試已開始；第 1、3、7 天會出現回想檢查。`);
  };
  const recordExperiment = (
    id: string,
    variant: 0 | 1,
    remembered: boolean
  ) => {
    const next = experiments.map(experiment =>
      experiment.id !== id
        ? experiment
        : {
            ...experiment,
            checks: experiment.checks.some(
              check =>
                check.day === experimentDueDay(experiment) &&
                check.variant === variant
            )
              ? experiment.checks
              : [
                  ...experiment.checks,
                  {
                    day: experimentDueDay(experiment)!,
                    variant,
                    remembered,
                    answeredAt: new Date().toISOString(),
                  },
                ],
          }
    );
    saveMrtMnemonicExperiments(next);
    setExperiments(next);
  };
  const setQuality = (code: string, quality: MrtMnemonicQuality) =>
    setItems(savePersonalMrtMnemonic(code, { ...items[code], quality }));

  return (
    <main className="container max-w-5xl py-8">
      <Link
        href="/train/mrt"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        捷運任務板
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
        <div>
          <p className="font-hand text-2xl text-primary">my memory hooks ✎</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            個人聯想管理
          </h1>
          <p className="text-muted-foreground mt-2">
            搜尋、排序、修改與刪除你在課程中保存的聯想。
          </p>
        </div>
        <span className="rounded-full bg-rose-100 text-rose-800 px-4 py-2 text-sm font-bold">
          <Heart className="w-4 h-4 inline mr-1" />
          {Object.values(items).filter(item => item.favorite).length} 個收藏
        </span>
      </div>
      <section className="paper-card p-5 mt-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-700" />
          <h2 className="font-display font-bold text-xl">AI 偏好分析</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {styleStats.map((style, index) => (
            <div
              key={style.id}
              className={`rounded-xl p-4 ${index === 0 ? "bg-purple-100 text-purple-950" : "bg-muted"}`}
            >
              <span className="text-sm font-bold">
                {style.label}
                {index === 0 && " · 目前首選"}
              </span>
              <strong className="block text-3xl mt-1">{style.count}</strong>
              <span className="text-xs">採用與品質加權分數</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(lineStats).map(([lineId, value]) => (
            <span
              key={lineId}
              className="rounded-full border px-3 py-1 text-xs font-bold"
            >
              {lineId}：{value.total} 筆 · 好記 {value.good}
            </span>
          ))}
        </div>
      </section>
      <section className="paper-card p-5 mt-6">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-700" />
          <h2 className="font-display font-bold text-xl">AI 聯想 A/B 實驗</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          從任一站的 AI 候選啟動兩種風格，於第 1、3、7 天比較回想效果。
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {retentionByDay.map(item => (
            <div key={item.day} className="rounded-xl bg-cyan-50 p-4">
              <span className="text-xs font-bold text-cyan-800">
                第 {item.day} 天留存
              </span>
              <strong className="block text-3xl mt-1">
                {item.rate === null ? "—" : `${item.rate}%`}
              </strong>
              <small className="text-muted-foreground">
                {item.attempts} 次回測
              </small>
              <div className="h-2 rounded-full bg-white mt-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-600"
                  style={{ width: `${item.rate ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {(abLineStats.length > 0 || abStyleStats.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl border p-4">
              <strong>依路線</strong>
              <div className="flex flex-wrap gap-2 mt-3">
                {abLineStats.map(item => (
                  <span
                    key={item.lineId}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
                  >
                    {item.lineId} ·{" "}
                    {item.attempts
                      ? Math.round((item.remembered / item.attempts) * 100)
                      : 0}
                    %
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <strong>依聯想風格</strong>
              <div className="flex flex-wrap gap-2 mt-3">
                {abStyleStats.map(item => (
                  <span
                    key={item.style}
                    className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800"
                  >
                    {item.style} ·{" "}
                    {item.attempts
                      ? Math.round((item.remembered / item.attempts) * 100)
                      : 0}
                    %
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {experiments.length === 0 ? (
          <p className="rounded-xl bg-muted p-4 mt-4 text-sm">
            尚無實驗；編輯一站、產生 AI 候選後即可開始。
          </p>
        ) : (
          <div className="grid gap-3 mt-4">
            {experiments.slice(0, 6).map(experiment => {
              const due = experimentDueDay(experiment);
              const summary = experimentSummaries.find(
                item => item.stationCode === experiment.stationCode
              );
              const scores = [0, 1].map(
                variant =>
                  experiment.checks.filter(
                    check => check.variant === variant && check.remembered
                  ).length
              );
              return (
                <div key={experiment.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <strong>
                      {experiment.stationCode} · 第 {due ?? "—"} 天檢查
                    </strong>
                    <span className="text-xs font-bold">
                      A {scores[0]} 次記得 · B {scores[1]} 次記得
                    </span>
                  </div>
                  {experiment.appliedAt &&
                    experiment.appliedWinner !== undefined && (
                      <p className="rounded-lg bg-blue-50 text-blue-800 p-2 mt-3 text-xs font-bold">
                        第 7 天已自動套用{" "}
                        {experiment.appliedWinner === 0 ? "A" : "B"}
                        ，另一版本已淘汰。
                      </p>
                    )}
                  {summary?.winner !== null &&
                    summary?.winner !== undefined && (
                      <p className="rounded-lg bg-emerald-50 text-emerald-800 p-2 mt-3 text-xs font-bold">
                        目前勝出：{summary.winner === 0 ? "A" : "B"} ·{" "}
                        {summary.variants[summary.winner].text}
                      </p>
                    )}
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    {experiment.variants.map((variant, index) => (
                      <div
                        key={variant}
                        className="rounded-lg bg-muted p-3 text-sm"
                      >
                        <b>{index ? "B" : "A"}</b> {variant}
                        {due &&
                          !experiment.checks.some(
                            check =>
                              check.day === due && check.variant === index
                          ) && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() =>
                                  recordExperiment(
                                    experiment.id,
                                    index as 0 | 1,
                                    true
                                  )
                                }
                                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold"
                              >
                                記得
                              </button>
                              <button
                                onClick={() =>
                                  recordExperiment(
                                    experiment.id,
                                    index as 0 | 1,
                                    false
                                  )
                                }
                                className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold"
                              >
                                忘了
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <div className="paper-card p-4 mt-7 flex flex-col sm:flex-row gap-3">
        <label className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="搜尋站碼、站名或聯想"
            className="w-full rounded-xl border py-3 pl-10 pr-3"
          />
        </label>
        <select
          value={sort}
          onChange={event => setSort(event.target.value as SortMode)}
          className="rounded-xl border bg-white px-4 py-3"
        >
          <option value="favorite">收藏優先</option>
          <option value="code">依站碼</option>
          <option value="name">依站名</option>
        </select>
      </div>
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={selectVisible}
            className="rounded-full"
          >
            <CheckSquare className="w-4 h-4" />
            {rows.every(row => selectedCodes.has(row.station.code))
              ? "取消全選"
              : "選取目前結果"}
          </Button>
          <Button
            disabled={!selectedCodes.size}
            variant="outline"
            onClick={batchFavorite}
            className="rounded-full"
          >
            <Heart className="w-4 h-4" />
            批次收藏
          </Button>
          <Button
            disabled={!selectedCodes.size}
            variant="outline"
            onClick={batchDelete}
            className="rounded-full text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            批次刪除
          </Button>
          <Button
            variant="outline"
            onClick={exportJson}
            className="rounded-full"
          >
            <Download className="w-4 h-4" />
            匯出 {selectedCodes.size ? `${selectedCodes.size} 筆` : "全部"} JSON
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            onChange={event => importJson(event.target.files?.[0])}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => importRef.current?.click()}
            className="rounded-full"
          >
            <Upload className="w-4 h-4" />
            匯入 JSON
          </Button>
          {selectedCodes.size > 0 && (
            <span className="text-sm font-bold text-primary">
              已選 {selectedCodes.size} 筆
            </span>
          )}
        </div>
      )}
      {message && (
        <p
          className={`rounded-xl p-3 mt-4 text-sm font-bold ${message.startsWith("匯入失敗") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
      {rows.length === 0 ? (
        <div className="paper-card p-10 text-center mt-6">
          <p className="font-display font-bold text-xl">
            {Object.keys(items).length ? "找不到符合的聯想" : "還沒有個人聯想"}
          </p>
          <p className="text-muted-foreground mt-2">
            到完整路線課程翻牌後，按鉛筆編輯或愛心收藏。
          </p>
          <Link href="/train/mrt/course">
            <Button className="rounded-full mt-5">前往完整路線課程</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {rows.map(({ station, saved }) => {
            const mnemonic = getMrtMnemonic(station, items);
            const isEditing = editing === station.code;
            return (
              <article key={station.code} className="paper-card p-5">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedCodes.has(station.code)}
                    onChange={() => toggleSelected(station.code)}
                    aria-label={`選取 ${station.code} ${station.name}`}
                    className="mt-4 w-4 h-4"
                  />
                  <span className="rounded-full bg-primary text-primary-foreground w-12 h-12 shrink-0 flex items-center justify-center font-black text-xs">
                    {station.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display font-bold text-xl">
                        {station.name}
                      </h2>
                      {saved.favorite && (
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <textarea
                          value={draft}
                          onChange={event => setDraft(event.target.value)}
                          rows={3}
                          maxLength={180}
                          className="w-full border rounded-xl p-3 mt-3"
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            disabled={!draft.trim()}
                            onClick={() => save(station.code)}
                            className="rounded-full"
                          >
                            儲存
                          </Button>
                          <Button
                            disabled={busy}
                            variant="outline"
                            onClick={() => generate(station.code)}
                            className="rounded-full"
                          >
                            <Bot className="w-4 h-4" />
                            {busy ? "產生中…" : "AI 三種候選"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            className="rounded-full"
                          >
                            關閉
                          </Button>
                        </div>
                        {suggestions.length > 0 && (
                          <div className="grid gap-2 mt-4">
                            <p className="text-xs font-bold text-purple-700">
                              {aiSource === "ai"
                                ? "AI 候選"
                                : "離線候選（AI 尚未設定或暫時無法使用）"}
                            </p>
                            {suggestions.map(suggestion => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setDraft(suggestion);
                                  save(station.code, suggestion);
                                  const nextPreferences =
                                    recordMrtStyleChoice(suggestion);
                                  setPreferences(nextPreferences);
                                  setSuggestions(current =>
                                    sortMrtSuggestionsByPreference(
                                      current,
                                      qualityAdjustedPreferences(
                                        items,
                                        nextPreferences
                                      )
                                    )
                                  );
                                }}
                                className="text-left rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm hover:border-purple-500"
                              >
                                {suggestion}
                              </button>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => startExperiment(station.code)}
                              className="rounded-full justify-self-start"
                            >
                              開始前兩個候選的 A/B 測試
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-2 leading-7">{saved.sound}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs font-bold text-muted-foreground py-1">
                            這個聯想：
                          </span>
                          {(
                            [
                              ["good", "好記"],
                              ["okay", "普通"],
                              ["hard", "難記"],
                            ] as const
                          ).map(([quality, label]) => (
                            <button
                              key={quality}
                              onClick={() => setQuality(station.code, quality)}
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${saved.quality === quality ? (quality === "good" ? "bg-emerald-100 border-emerald-400 text-emerald-800" : quality === "hard" ? "bg-red-100 border-red-400 text-red-800" : "bg-amber-100 border-amber-400 text-amber-800") : "bg-white"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {mnemonicStyleOf(saved.sound) && (
                          <p className="text-xs text-purple-700 mt-2">
                            此評分會調整未來同風格候選順位。
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => speakMrtMnemonic(station, mnemonic)}
                      className="p-2 rounded-full hover:bg-muted"
                      aria-label="播放"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => beginEdit(station.code)}
                      className="p-2 rounded-full hover:bg-muted"
                      aria-label="編輯"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setItems(
                          savePersonalMrtMnemonic(station.code, {
                            ...saved,
                            favorite: !saved.favorite,
                          })
                        )
                      }
                      className={`p-2 rounded-full hover:bg-muted ${saved.favorite ? "text-rose-600" : ""}`}
                      aria-label="收藏"
                    >
                      <Heart
                        className={`w-4 h-4 ${saved.favorite ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`刪除 ${station.name} 的個人聯想？`))
                          setItems(deletePersonalMrtMnemonic(station.code));
                      }}
                      className="p-2 rounded-full hover:bg-red-50 text-red-600"
                      aria-label="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {importPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 grid place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="匯入預覽"
        >
          <section className="bg-background rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl">匯入預覽</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  確認後才會寫入，目前資料尚未改動。
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} aria-label="關閉">
                <X />
              </button>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setImportStrategy("skip");
                  setImportPreview(
                    previewMrtMnemonicImport(
                      importPreview.incoming,
                      items,
                      new Set(ALL_MRT_STATIONS.map(s => s.code)),
                      "skip"
                    )
                  );
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${importStrategy === "skip" ? "bg-primary text-primary-foreground" : ""}`}
              >
                保留本機、略過衝突
              </button>
              <button
                onClick={() => {
                  setImportStrategy("overwrite");
                  setImportPreview(
                    previewMrtMnemonicImport(
                      importPreview.incoming,
                      items,
                      new Set(ALL_MRT_STATIONS.map(s => s.code)),
                      "overwrite"
                    )
                  );
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${importStrategy === "overwrite" ? "bg-primary text-primary-foreground" : ""}`}
              >
                用匯入檔覆蓋
              </button>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 mt-5">
              {(
                [
                  ["新增", importPreview.added, "bg-emerald-50"],
                  ["覆蓋", importPreview.overwritten, "bg-amber-50"],
                  ["略過", importPreview.skipped, "bg-slate-100"],
                  ["無效站碼", importPreview.invalid, "bg-red-50"],
                ] as const
              ).map(([label, codes, color]) => (
                <div key={label} className={`rounded-xl p-3 ${color}`}>
                  <strong>
                    {label} {codes.length}
                  </strong>
                  <p className="text-xs mt-2 break-words">
                    {codes.join("、") || "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setImportPreview(null)}>
                取消
              </Button>
              <Button onClick={confirmImport}>確認匯入</Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
