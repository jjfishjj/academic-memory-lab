import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Atom,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadElementProgress,
  summarizeElementProgress,
} from "@/lib/elementProgress";
import { createMemoryTopic, loadMemoryTopics } from "@/lib/memoryTopics";

export default function MemoryLibrary() {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [topics, setTopics] = useState(() => loadMemoryTopics());
  const progress = useMemo(() => loadElementProgress(), []);
  const summary = useMemo(() => summarizeElementProgress(progress), [progress]);
  const elementLearned = 118 - summary.unseen;
  const matches = "化學元素週期表 元素 chemistry periodic table".includes(
    query.trim().toLowerCase()
  );

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b bg-[#FAF6EE]/90 sticky top-0 z-20 backdrop-blur">
        <div className="container h-16 flex items-center justify-between gap-4">
          <Link href="/" className="font-display font-extrabold">
            MemoDesk
          </Link>
          <b className="text-sm">我的記憶庫</b>
          <Link
            href="/train/mrt/profile"
            className="text-sm text-primary font-bold"
          >
            我的學習模型
          </Link>
        </div>
      </header>
      <main className="container max-w-6xl pt-8">
        <section className="grid lg:grid-cols-[1fr_330px] gap-6">
          <div className="paper-card p-6 sm:p-8 bg-[linear-gradient(135deg,#ecfdf5,#fff7d6)]">
            <p className="font-hand text-2xl text-primary">
              memory starts with meaning
            </p>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight mt-1">
              你現在最想
              <br />
              記住什麼？
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              先選內容，再由你的 VARK
              與八種天賦安排訓練。你不用先理解每一種記憶法。
            </p>
            <label className="mt-6 flex items-center gap-2 rounded-full bg-white border px-4 shadow-sm max-w-xl">
              <Search className="w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜尋想記住的主題…"
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </label>
          </div>
          <aside className="paper-card p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今天建議</p>
              <h2 className="font-display font-extrabold text-2xl mt-1">
                先複習到期內容
              </h2>
              <p className="text-sm mt-3">
                週期表目前有 <b className="text-primary">{summary.due}</b>{" "}
                個待複習元素。
              </p>
            </div>
            <Link href="/train/elements">
              <Button className="w-full rounded-full mt-5">
                <Clock3 />
                開始今日複習
              </Button>
            </Link>
          </aside>
        </section>
        <section className="mt-9">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="font-hand text-xl text-primary">
                things I want to remember
              </p>
              <h2 className="font-display font-extrabold text-2xl">正在學習</h2>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setCreating(true)}
            >
              <Plus />
              新增主題
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {matches && (
              <Link
                href="/elements"
                className="paper-card overflow-hidden border-2 border-teal-200 group"
              >
                <div className="p-6 bg-[radial-gradient(circle_at_top_right,#fde68a,transparent_38%),linear-gradient(135deg,#e6fffa,#fff)]">
                  <div className="flex justify-between">
                    <span className="w-14 h-14 rounded-2xl bg-teal-700 text-white grid place-items-center">
                      <Atom className="w-8" />
                    </span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 h-fit rounded-full">
                      進行中
                    </span>
                  </div>
                  <p className="text-xs font-bold text-primary mt-6">
                    化學 · 118 個知識點
                  </p>
                  <h3 className="font-display font-extrabold text-3xl mt-1">
                    化學元素週期表
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    名稱、符號、原子序，以及族與週期中的位置。
                  </p>
                </div>
                <div className="p-5 bg-white">
                  <div className="flex justify-between text-sm">
                    <span>已接觸 {elementLearned}/118</span>
                    <b>{summary.mastered} 個已熟練</b>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-teal-600"
                      style={{ width: `${(elementLearned / 118) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4" />
                      點入後選擇個人化訓練
                    </span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )}
            {topics
              .filter(topic =>
                `${topic.title} ${topic.category}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
              )
              .map(topic => (
                <Link
                  key={topic.id}
                  href={`/memory/topic/${topic.id}`}
                  className="paper-card p-6 bg-white group"
                >
                  <span className="text-4xl">{topic.emoji}</span>
                  <p className="text-xs font-bold text-primary mt-4">
                    {topic.category} · {topic.points.length} 個知識點
                  </p>
                  <h3 className="font-display font-extrabold text-2xl mt-1">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    已熟練 {topic.points.filter(point => point.mastered).length}
                    /{topic.points.length}
                  </p>
                  <span className="flex justify-between mt-6 text-sm font-bold text-primary">
                    查看內容與推薦訓練{" "}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            <button
              onClick={() => setCreating(true)}
              className="paper-card p-6 bg-white text-left border-dashed"
            >
              <span className="text-4xl">🧠</span>
              <h3 className="font-display font-extrabold text-xl mt-4">
                建立下一個記憶主題
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                單字、公式、人物或任何想記住的內容。
              </p>
              <p className="text-sm font-bold text-primary mt-6">＋ 現在建立</p>
            </button>
          </div>
          {!matches &&
            topics.every(
              topic =>
                !`${topic.title} ${topic.category}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
            ) && (
              <div className="paper-card p-10 text-center mt-4">
                <Search className="mx-auto text-muted-foreground" />
                <h3 className="font-display font-bold text-xl mt-3">
                  找不到這個記憶主題
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  下一階段會開放貼上或輸入自己的學習內容。
                </p>
              </div>
            )}
        </section>
      </main>
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-topic-title"
            className="paper-card bg-[#FAF6EE] p-6 w-full max-w-xl max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-primary font-bold">
                  A · 自訂記憶主題
                </p>
                <h2
                  id="new-topic-title"
                  className="font-display font-extrabold text-2xl"
                >
                  你想記住什麼？
                </h2>
              </div>
              <button aria-label="關閉" onClick={() => setCreating(false)}>
                <X />
              </button>
            </div>
            <label className="block font-bold mt-5">
              主題名稱
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：台灣歷史重要年代"
                className="mt-2 bg-white"
              />
            </label>
            <label className="block font-bold mt-4">
              分類
              <Input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="例如：歷史、英文、工作"
                className="mt-2 bg-white"
              />
            </label>
            <label className="block font-bold mt-4">
              要記住的內容
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
                placeholder={
                  "一行一個知識點\n問題 :: 答案\n例如：台灣首次總統直選 :: 1996 年"
                }
                className="mt-2 w-full rounded-xl border bg-white p-3 font-normal"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              使用「::」分隔問題與答案；未使用時，整行會成為一張記憶卡。
            </p>
            {error && (
              <p
                className="text-sm text-destructive font-bold mt-3"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              className="w-full rounded-full mt-5"
              onClick={() => {
                try {
                  createMemoryTopic(title, category, content);
                  setTopics(loadMemoryTopics());
                  setCreating(false);
                  setTitle("");
                  setCategory("");
                  setContent("");
                  setError("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "建立失敗");
                }
              }}
            >
              建立主題
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
