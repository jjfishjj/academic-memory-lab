import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Cloud,
  Flag,
  Ghost,
  LogIn,
  LogOut,
  RefreshCw,
  Trophy,
  Wifi,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  claimRallyReward,
  getRallyUser,
  loadDailyGhost,
  loadRallyOperations,
  loadRallyProfile,
  loadSeasonLeaderboard,
  saveRallyProfile,
  sendRallyMagicLink,
  setRallyAffiliation,
  submitRallyAppeal,
  submitRallyRun,
  subscribeToSeason,
  type RallyRun,
} from "@/lib/rallyCloud";

type RallyOperations = Awaited<ReturnType<typeof loadRallyOperations>>;
const emptyOperations: RallyOperations = {
  season: null,
  countries: [],
  guildBoard: [],
  guilds: [],
  affiliation: null,
  todayCount: 0,
  sanctions: [],
  appeals: [],
  rewards: [],
};

export default function WorldRallyOnline({
  mapId,
  profile,
  learningProfile,
  storyState,
  latestRun,
  onRestore,
  onLearningRestore,
  onGhost,
}: {
  mapId: string;
  profile: unknown;
  learningProfile: unknown;
  storyState: unknown;
  latestRun: RallyRun | null;
  onRestore: (profile: unknown, story: unknown) => void;
  onLearningRestore: (learning: unknown) => void;
  onGhost: (ghost: RallyRun | null) => void;
}) {
  const [open, setOpen] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [email, setEmail] = useState(""),
    [name, setName] = useState("世界旅人"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [country, setCountry] = useState<"TW" | "FR" | "JP">("TW"),
    [guild, setGuild] = useState("star-harbor"),
    [appeal, setAppeal] = useState(""),
    [operations, setOperations] = useState<RallyOperations>(emptyOperations),
    [leaders, setLeaders] = useState<RallyRun[]>([]),
    [ghost, setGhost] = useState<RallyRun | null>(null);
  const submitted = useRef(""),
    currentUser = useRef<User | null>(null);
  function restoreCloudPayload(remote: Awaited<ReturnType<typeof loadRallyProfile>>) {
    if (!remote) return;
    const payload = remote.profile as { game?: unknown; learning?: unknown };
    setName(remote.display_name);
    onRestore(payload?.game ?? remote.profile, remote.story_state);
    if (payload?.learning) onLearningRestore(payload.learning);
  }
  async function refresh(userId = currentUser.current?.id) {
    if (!isSupabaseConfigured) return;
    try {
      const ops = await loadRallyOperations(userId);
      const [board, daily] = await Promise.all([
        loadSeasonLeaderboard(ops.season?.id ?? "S01"),
        loadDailyGhost(mapId),
      ]);
      setOperations(ops);
      if (ops.affiliation) {
        setCountry(ops.affiliation.country_code as "TW" | "FR" | "JP");
        setGuild(ops.affiliation.guild_slug ?? "memory-league");
      }
      setLeaders(board);
      setGhost(daily);
      onGhost(daily);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "無法載入雲端資料");
    }
  }
  useEffect(() => {
    if (!supabase) return;
    getRallyUser()
      .then(found => {
        currentUser.current = found;
        setUser(found);
        void refresh(found?.id);
        if (found) void loadRallyProfile(found.id).then(restoreCloudPayload);
      })
      .catch(() => undefined);
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      currentUser.current = s?.user ?? null;
      setUser(currentUser.current);
      void refresh(currentUser.current?.id);
    });
    void refresh();
    const off = subscribeToSeason(() => void refresh());
    return () => {
      data.subscription.unsubscribe();
      off();
    };
  }, []);
  useEffect(() => {
    void refresh();
  }, [mapId]);
  useEffect(() => {
    if (!latestRun || !user) return;
    const key = `${latestRun.map_id}-${latestRun.finish_ms}-${latestRun.score}`;
    if (submitted.current === key) return;
    submitted.current = key;
    submitRallyRun({ ...latestRun, user_id: user.id, display_name: name })
      .then(async () => {
        await saveRallyProfile(
          user.id,
          name,
          { game: profile, learning: learningProfile },
          storyState
        );
        setMessage("本場成績已上傳賽季排行榜");
        void refresh();
      })
      .catch(e => setMessage(e instanceof Error ? e.message : "成績上傳失敗"));
  }, [latestRun, user, name, profile, learningProfile, storyState]);
  async function login() {
    if (!email.includes("@")) {
      setMessage("請輸入有效 Email");
      return;
    }
    setBusy(true);
    try {
      await sendRallyMagicLink(email);
      setMessage("登入連結已寄出，請到信箱完成登入");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "寄送失敗");
    } finally {
      setBusy(false);
    }
  }
  async function sync(direction: "up" | "down") {
    if (!user) return;
    setBusy(true);
    try {
      if (direction === "up") {
        await saveRallyProfile(
          user.id,
          name,
          { game: profile, learning: learningProfile },
          storyState
        );
        setMessage("角色、錯題與學習歷程已上傳");
      } else {
        const remote = await loadRallyProfile(user.id);
        if (!remote) throw new Error("雲端尚無角色資料");
        restoreCloudPayload(remote);
        setMessage("已下載雲端角色與學習歷程");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "同步失敗");
    } finally {
      setBusy(false);
    }
  }
  async function saveAffiliation() {
    if (!user) return;
    setBusy(true);
    try {
      await setRallyAffiliation(country, guild || null);
      setMessage("國家代表與公會已更新，下一場會計入團體榜");
      await refresh(user.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "陣營更新失敗");
    } finally {
      setBusy(false);
    }
  }
  async function sendAppeal() {
    if (!user || appeal.trim().length < 10) {
      setMessage("申訴說明至少需要 10 個字");
      return;
    }
    setBusy(true);
    try {
      await submitRallyAppeal(
        user.id,
        appeal.trim(),
        operations.sanctions[0]?.id
      );
      setAppeal("");
      setMessage("申訴已送交外交競技委員會");
      await refresh(user.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "申訴送出失敗");
    } finally {
      setBusy(false);
    }
  }
  async function claim(id: number) {
    setBusy(true);
    try {
      const coins = await claimRallyReward(id);
      setMessage(`賽季獎勵已領取・+${coins} 金幣`);
      await refresh(user?.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "獎勵領取失敗");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="wr-online">
      <button className="wr-online-toggle" onClick={() => setOpen(v => !v)}>
        <Wifi />
        <span>
          <b>
            {user
              ? "雲端角色已連線"
              : isSupabaseConfigured
                ? "連接雲端角色"
                : "本機冒險模式"}
          </b>
          <small>
            {ghost
              ? `今日幽靈：${ghost.display_name}・${(ghost.finish_ms / 1000).toFixed(1)}s`
              : "全球 S01 賽季"}
          </small>
        </span>
      </button>
      {open && (
        <div className="wr-online-panel">
          <div className="wr-online-auth">
            <Cloud />
            <div>
              <b>MEMGENIUS CLOUD</b>
              <small>
                {isSupabaseConfigured
                  ? user
                    ? `已登入 ${user.email}`
                    : "Magic Link 跨裝置登入"
                  : "設定 VITE_SUPABASE_URL 與 publishable key 後啟用"}
              </small>
            </div>
            {user ? (
              <>
                <input
                  aria-label="公開暱稱"
                  value={name}
                  maxLength={24}
                  onChange={e => setName(e.target.value)}
                />
                <button onClick={() => sync("up")} disabled={busy}>
                  上傳角色
                </button>
                <button onClick={() => sync("down")} disabled={busy}>
                  下載角色
                </button>
                <button onClick={() => supabase?.auth.signOut()}>
                  <LogOut />
                </button>
              </>
            ) : isSupabaseConfigured ? (
              <>
                <input
                  aria-label="雲端登入 Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <button onClick={login} disabled={busy}>
                  <LogIn />
                  寄送登入連結
                </button>
              </>
            ) : (
              <span className="wr-local-tag">LOCAL FALLBACK</span>
            )}
          </div>
          {message && (
            <p className="wr-cloud-message" aria-live="polite">
              {message}
            </p>
          )}
          <div className="wr-ghost-card">
            <Ghost />
            <div>
              <small>DAILY GHOST</small>
              <b>{ghost ? ghost.display_name : "等待首位車手"}</b>
              <span>
                {ghost
                  ? `${(ghost.finish_ms / 1000).toFixed(1)} 秒・${ghost.score} 分`
                  : "今天由你創下第一筆路線"}
              </span>
            </div>
            <button onClick={() => void refresh()}>
              <RefreshCw />
            </button>
          </div>
          <div className="wr-ops">
            <div className="wr-ops-head">
              <Flag />
              <span>
                <b>{operations.season?.id ?? "OFF"} 全球賽季</b>
                <small>
                  {operations.season
                    ? `${operations.season.title}・今日 ${operations.todayCount}/${operations.season.daily_run_limit} 場`
                    : "目前沒有開放中的賽季"}
                </small>
              </span>
            </div>
            {user && (
              <div className="wr-affiliation">
                <select
                  aria-label="國家代表"
                  value={country}
                  onChange={e =>
                    setCountry(e.target.value as "TW" | "FR" | "JP")
                  }
                >
                  <option value="TW">🇹🇼 臺灣代表</option>
                  <option value="FR">🇫🇷 法國代表</option>
                  <option value="JP">🇯🇵 日本代表</option>
                </select>
                <select
                  aria-label="外交公會"
                  value={guild}
                  onChange={e => setGuild(e.target.value)}
                >
                  {operations.guilds.map(g => (
                    <option key={g.slug} value={g.slug}>
                      {g.emblem} {g.name}
                    </option>
                  ))}
                </select>
                <button disabled={busy} onClick={saveAffiliation}>
                  儲存陣營
                </button>
              </div>
            )}
            {operations.sanctions.length > 0 && (
              <div className="wr-sanction">
                <AlertTriangle />
                <span>
                  <b>競賽暫停：{operations.sanctions[0].reason}</b>
                  <small>
                    至 {new Date(operations.sanctions[0].banned_until).toLocaleString()}
                  </small>
                </span>
              </div>
            )}
            {user && (
              <div className="wr-appeal">
                <input
                  aria-label="競賽申訴說明"
                  value={appeal}
                  maxLength={500}
                  onChange={e => setAppeal(e.target.value)}
                  placeholder="異常判定申訴（至少 10 字）"
                />
                <button disabled={busy} onClick={sendAppeal}>
                  送出申訴
                </button>
              </div>
            )}
            {operations.appeals.map(a => (
              <small className="wr-appeal-status" key={a.id}>
                申訴 #{a.id}・{a.status}
                {a.resolution ? `・${a.resolution}` : ""}
              </small>
            ))}
            {operations.rewards.map(r => (
              <div className="wr-reward" key={r.id}>
                <span>
                  <b>{r.title}</b>
                  <small>{r.season}・{r.coins} 金幣</small>
                </span>
                <button disabled={busy || Boolean(r.claimed_at)} onClick={() => claim(r.id)}>
                  {r.claimed_at ? "已領取" : "領取"}
                </button>
              </div>
            ))}
            <div className="wr-team-boards">
              <section>
                <b>國家榜</b>
                {operations.countries.slice(0, 3).map((c, i) => (
                  <small key={c.country_code}>
                    {i + 1}. {c.country_code}・{c.total_score}
                  </small>
                ))}
              </section>
              <section>
                <b>公會榜</b>
                {operations.guildBoard.slice(0, 3).map((g, i) => (
                  <small key={g.guild_slug}>
                    {i + 1}. {g.emblem} {g.guild_name}・{g.total_score}
                  </small>
                ))}
              </section>
            </div>
          </div>
          <div className="wr-season">
            <div>
              <Trophy />
              <b>{operations.season?.id ?? "S01"} 全球排行榜</b>
            </div>
            <ol>
              {leaders.length ? (
                leaders.slice(0, 8).map((r, i) => (
                  <li key={r.id ?? i}>
                    <span>
                      {i + 1}. {r.display_name}
                    </span>
                    <small>{r.map_id}</small>
                    <b>{r.score}</b>
                  </li>
                ))
              ) : (
                <li className="empty">尚無雲端賽季資料・本機模式仍可遊玩</li>
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
