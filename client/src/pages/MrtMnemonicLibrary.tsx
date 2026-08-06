import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckSquare,
  Download,
  Heart,
  Pencil,
  Search,
  Trash2,
  Volume2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ALL_MRT_STATIONS } from "@/lib/mrtData";
import { generateMrtMnemonicCandidates } from "@/lib/mnemonicAi";
import {
  deletePersonalMrtMnemonic,
  getMrtMnemonic,
  loadMrtStylePreferences,
  loadPersonalMrtMnemonics,
  savePersonalMrtMnemonic,
  speakMrtMnemonic,
  recordMrtStyleChoice,
  sortMrtSuggestionsByPreference,
  updatePersonalMrtMnemonics,
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
      sortMrtSuggestionsByPreference(result.suggestions, preferences)
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
          {selectedCodes.size > 0 && (
            <span className="text-sm font-bold text-primary">
              已選 {selectedCodes.size} 筆
            </span>
          )}
        </div>
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
                                      nextPreferences
                                    )
                                  );
                                }}
                                className="text-left rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm hover:border-purple-500"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 leading-7">{saved.sound}</p>
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
    </main>
  );
}
