import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Gavel,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ShieldOff,
} from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  isRallyAdmin,
  loadRallyAdminData,
  resolveRallyAppeal,
  reviewRallyQuestion,
  revokeRallySanction,
  scheduleRallySeason,
  settleRallySeason,
  upsertRallyQuestion,
  type RallyAdminData,
  type RallyQuestionAdmin,
  type RallyRun,
} from "@/lib/rallyCloud";
import "./RallyAdmin.css";

const empty: RallyAdminData = {
  questions: [],
  appeals: [],
  sanctions: [],
  invalidRuns: [],
  seasons: [],
  audit: [],
};

type QuestionDraft = Omit<
  RallyQuestionAdmin,
  "answers" | "active" | "approved" | "updated_at"
> & { answersText: string };

const blankQuestion: QuestionDraft = {
  id: "",
  map_id: "taipei",
  question_type: "translation",
  cefr: "A2",
  phrase: "",
  prompt: "",
  answersText: "",
  correct_index: 0,
  memory_hint: "",
};

function GhostReplay({ run }: { run: RallyRun }) {
  const [frame, setFrame] = useState(0),
    points = run.ghost_path ?? [];
  useEffect(() => setFrame(0), [run.id]);
  const point = points[Math.min(frame, Math.max(0, points.length - 1))] ?? [
    0, 0, 0,
  ];
  return (
    <div className="ra-replay">
      <div className="ra-track">
        <i
          style={{
            left: `${Math.min(100, (point[0] / 300) * 100)}%`,
            top: `${50 + Math.max(-40, Math.min(40, point[1] * 20))}%`,
          }}
        />
      </div>
      <span>
        {Math.round(point[0])}m・{Math.round(point[2])}ms・{frame + 1}/
        {points.length}
      </span>
      <input
        aria-label="幽靈回放時間軸"
        type="range"
        min="0"
        max={Math.max(0, points.length - 1)}
        value={frame}
        onChange={event => setFrame(Number(event.target.value))}
      />
    </div>
  );
}

export default function RallyAdmin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null),
    [data, setData] = useState(empty),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [resolution, setResolution] = useState("經賽事委員會複核"),
    [selectedRun, setSelectedRun] = useState<RallyRun | null>(null),
    [question, setQuestion] = useState<QuestionDraft>(blankQuestion),
    [season, setSeason] = useState({
      id: "S02",
      title: "世界記憶交流季",
      startsAt: "2027-01-01T00:00",
      endsAt: "2027-04-30T23:59",
      dailyLimit: 5,
    });
  const active = useMemo(
    () => data.seasons.find(entry => entry.status === "active"),
    [data.seasons]
  );

  async function refresh() {
    try {
      const ok = await isRallyAdmin();
      setAuthorized(ok);
      if (ok) setData(await loadRallyAdminData());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入失敗");
      setAuthorized(false);
    }
  }

  useEffect(() => {
    void refresh();
    const { data: auth } = supabase?.auth.onAuthStateChange(
      () => void refresh()
    ) ?? {
      data: { subscription: { unsubscribe() {} } },
    };
    return () => auth.subscription.unsubscribe();
  }, []);

  async function act(task: () => Promise<void>, done: string) {
    setBusy(true);
    try {
      await task();
      setMessage(done);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  }

  function editQuestion(entry: RallyQuestionAdmin) {
    setQuestion({
      id: entry.id,
      map_id: entry.map_id,
      question_type: entry.question_type,
      cefr: entry.cefr,
      phrase: entry.phrase,
      prompt: entry.prompt,
      answersText: entry.answers.join("\n"),
      correct_index: entry.correct_index,
      memory_hint: entry.memory_hint,
    });
  }

  async function saveQuestion() {
    const answers = question.answersText
      .split("\n")
      .map(answer => answer.trim())
      .filter(Boolean);
    if (!/^[a-z0-9-]{3,80}$/.test(question.id)) {
      setMessage("題目 ID 只能使用 3–80 個小寫英數字與連字號");
      return;
    }
    if (answers.length < 2 || answers.length > 4) {
      setMessage("答案必須每行一個，共 2–4 個");
      return;
    }
    if (question.correct_index >= answers.length) {
      setMessage("正解序號超出答案數量");
      return;
    }
    await act(
      () =>
        upsertRallyQuestion({
          id: question.id,
          map_id: question.map_id,
          question_type: question.question_type,
          cefr: question.cefr,
          phrase: question.phrase,
          prompt: question.prompt,
          answers,
          correct_index: question.correct_index,
          memory_hint: question.memory_hint,
        }),
      "題目已儲存為待審草稿；核准後才會進入正式賽事"
    );
    setQuestion(blankQuestion);
  }

  if (authorized === null)
    return (
      <main className="ra-shell">
        <p>正在驗證賽事管理權限…</p>
      </main>
    );
  if (!authorized)
    return (
      <main className="ra-shell ra-denied">
        <Gavel />
        <h1>管理員賽事控制台</h1>
        <p>
          目前 session 沒有賽事管理權限。請使用已列入 admins 的正式帳號登入。
        </p>
        <Link href="/world-rally">
          <ArrowLeft /> 返回萬國風行賽
        </Link>
      </main>
    );

  return (
    <main className="ra-shell">
      <header>
        <div>
          <small>MEMGENIUS RALLY OPERATIONS</small>
          <h1>管理員賽事控制台</h1>
          <p>
            {active
              ? `${active.id} ${active.title}・${new Date(active.ends_at).toLocaleString("zh-TW")} 結束`
              : "目前沒有進行中的賽季"}
          </p>
        </div>
        <button onClick={() => void refresh()}>
          <RefreshCw /> 重新整理
        </button>
        <Link href="/world-rally">
          <ArrowLeft /> 回到賽事
        </Link>
      </header>
      {message && (
        <p className="ra-message" aria-live="polite">
          {message}
        </p>
      )}

      <section>
        <h2>
          <BookOpenCheck /> 正式題庫與審核
        </h2>
        <p className="ra-section-note">
          新增或修改後一律回到待審、停用狀態，避免未核准內容直接進入全球賽事。
        </p>
        <div className="ra-question-form">
          <label>
            題目 ID
            <input
              placeholder="paris-b2-consensus"
              value={question.id}
              onChange={event =>
                setQuestion({
                  ...question,
                  id: event.target.value.toLowerCase(),
                })
              }
            />
          </label>
          <label>
            國家關卡
            <select
              value={question.map_id}
              onChange={event =>
                setQuestion({
                  ...question,
                  map_id: event.target.value as RallyQuestionAdmin["map_id"],
                })
              }
            >
              <option value="taipei">臺北</option>
              <option value="paris">巴黎</option>
              <option value="tokyo">東京</option>
            </select>
          </label>
          <label>
            題型
            <select
              value={question.question_type}
              onChange={event =>
                setQuestion({
                  ...question,
                  question_type: event.target
                    .value as RallyQuestionAdmin["question_type"],
                })
              }
            >
              <option value="listening">聽力</option>
              <option value="translation">翻譯</option>
              <option value="cloze">填空</option>
              <option value="diplomacy">外交情境</option>
              <option value="confusable">易混淆</option>
            </select>
          </label>
          <label>
            CEFR
            <select
              value={question.cefr}
              onChange={event =>
                setQuestion({
                  ...question,
                  cefr: event.target.value as RallyQuestionAdmin["cefr"],
                })
              }
            >
              {(["A1", "A2", "B1", "B2", "C1"] as const).map(level => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            題幹語句
            <input
              value={question.phrase}
              onChange={event =>
                setQuestion({ ...question, phrase: event.target.value })
              }
            />
          </label>
          <label className="wide">
            問題
            <input
              value={question.prompt}
              onChange={event =>
                setQuestion({ ...question, prompt: event.target.value })
              }
            />
          </label>
          <label className="wide">
            答案（每行一個）
            <textarea
              rows={4}
              value={question.answersText}
              onChange={event =>
                setQuestion({ ...question, answersText: event.target.value })
              }
            />
          </label>
          <label>
            正解序號（第一個為 0）
            <input
              type="number"
              min="0"
              max="3"
              value={question.correct_index}
              onChange={event =>
                setQuestion({
                  ...question,
                  correct_index: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="wide">
            記憶提示
            <textarea
              rows={2}
              value={question.memory_hint}
              onChange={event =>
                setQuestion({ ...question, memory_hint: event.target.value })
              }
            />
          </label>
          <div className="ra-form-actions wide">
            <button disabled={busy} onClick={() => void saveQuestion()}>
              <Plus /> 儲存待審草稿
            </button>
            <button onClick={() => setQuestion(blankQuestion)}>清空</button>
          </div>
        </div>
        <div className="ra-question-list">
          {data.questions.map(entry => (
            <article key={entry.id}>
              <div className="ra-question-head">
                <b>{entry.phrase}</b>
                <span>{entry.map_id}</span>
                <span>{entry.question_type}</span>
                <span>{entry.cefr}</span>
                <span className={entry.approved ? "approved" : "pending"}>
                  {entry.approved ? "已核准" : "待審"}
                </span>
                <span className={entry.active ? "active" : "inactive"}>
                  {entry.active ? "上線" : "停用"}
                </span>
              </div>
              <small>{entry.id}</small>
              <p>{entry.prompt}</p>
              <ol>
                {entry.answers.map((answer, index) => (
                  <li
                    className={index === entry.correct_index ? "correct" : ""}
                    key={answer}
                  >
                    {answer}
                  </li>
                ))}
              </ol>
              <div className="ra-form-actions">
                <button onClick={() => editQuestion(entry)}>
                  <Pencil /> 編輯
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => reviewRallyQuestion(entry.id, true, true),
                      "題目已核准並上線"
                    )
                  }
                >
                  <CheckCircle2 /> 核准上線
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () =>
                        reviewRallyQuestion(entry.id, entry.approved, false),
                      "題目已停用"
                    )
                  }
                >
                  <Ban /> 停用
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => reviewRallyQuestion(entry.id, false, false),
                      "題目已退回待審"
                    )
                  }
                >
                  退回待審
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>申訴審核</h2>
        <label>
          裁決說明
          <input
            value={resolution}
            onChange={event => setResolution(event.target.value)}
          />
        </label>
        <div className="ra-grid">
          {data.appeals
            .filter(appeal => appeal.status === "pending")
            .map(appeal => (
              <article key={appeal.id}>
                <b>申訴 #{appeal.id}</b>
                <small>{appeal.user_id}</small>
                <p>{appeal.reason}</p>
                <div>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () =>
                          resolveRallyAppeal(appeal.id, "approved", resolution),
                        "申訴已核准，關聯封禁已解除"
                      )
                    }
                  >
                    核准
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () =>
                          resolveRallyAppeal(appeal.id, "rejected", resolution),
                        "申訴已駁回"
                      )
                    }
                  >
                    駁回
                  </button>
                </div>
              </article>
            ))}
          {!data.appeals.some(appeal => appeal.status === "pending") && (
            <p>目前沒有待審申訴。</p>
          )}
        </div>
      </section>

      <section>
        <h2>封禁與異常軌跡</h2>
        <div className="ra-grid">
          {data.sanctions
            .filter(sanction => !sanction.revoked_at)
            .map(sanction => (
              <article key={sanction.id}>
                <b>
                  <ShieldOff /> 封禁 #{sanction.id}
                </b>
                <small>{sanction.user_id}</small>
                <p>
                  {sanction.reason}
                  <br />至{" "}
                  {new Date(sanction.banned_until).toLocaleString("zh-TW")}
                </p>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => revokeRallySanction(sanction.id, resolution),
                      "封禁已解除"
                    )
                  }
                >
                  解除封禁
                </button>
              </article>
            ))}
        </div>
        <div className="ra-runs">
          {data.invalidRuns.map(run => (
            <button key={run.id} onClick={() => setSelectedRun(run)}>
              <Play /> {run.display_name}・{run.map_id}・
              {(run.finish_ms / 1000).toFixed(1)}s
            </button>
          ))}
        </div>
        {selectedRun && <GhostReplay run={selectedRun} />}
      </section>

      <section>
        <h2>
          <CalendarClock /> 賽季排程與結算
        </h2>
        <div className="ra-form">
          <input
            aria-label="下一賽季編號"
            value={season.id}
            onChange={event => setSeason({ ...season, id: event.target.value })}
          />
          <input
            aria-label="下一賽季名稱"
            value={season.title}
            onChange={event =>
              setSeason({ ...season, title: event.target.value })
            }
          />
          <input
            aria-label="開始時間"
            type="datetime-local"
            value={season.startsAt}
            onChange={event =>
              setSeason({ ...season, startsAt: event.target.value })
            }
          />
          <input
            aria-label="結束時間"
            type="datetime-local"
            value={season.endsAt}
            onChange={event =>
              setSeason({ ...season, endsAt: event.target.value })
            }
          />
          <input
            aria-label="每日場次"
            type="number"
            min="1"
            max="20"
            value={season.dailyLimit}
            onChange={event =>
              setSeason({ ...season, dailyLimit: Number(event.target.value) })
            }
          />
          <button
            disabled={busy}
            onClick={() =>
              void act(() => scheduleRallySeason(season), "賽季排程已儲存")
            }
          >
            儲存排程
          </button>
          <button
            className="danger"
            disabled={busy}
            onClick={() =>
              void act(
                () => settleRallySeason(season),
                "本季已結算並開啟下一賽季"
              )
            }
          >
            立即結算本季
          </button>
        </div>
      </section>

      <section>
        <h2>營運稽核紀錄</h2>
        <ol className="ra-audit">
          {data.audit.map(entry => (
            <li key={entry.id}>
              <b>{entry.action}</b>
              <span>
                {entry.target_type} #{entry.target_id}
              </span>
              <time>{new Date(entry.created_at).toLocaleString("zh-TW")}</time>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
