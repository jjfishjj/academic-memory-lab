import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Gavel, Play, RefreshCw, ShieldOff } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { isRallyAdmin, loadRallyAdminData, resolveRallyAppeal, revokeRallySanction, scheduleRallySeason, settleRallySeason, type RallyAdminData, type RallyRun } from "@/lib/rallyCloud";
import "./RallyAdmin.css";

const empty: RallyAdminData = { appeals: [], sanctions: [], invalidRuns: [], seasons: [], audit: [] };

function GhostReplay({ run }: { run: RallyRun }) {
  const [frame, setFrame] = useState(0), points = run.ghost_path ?? [];
  useEffect(() => { setFrame(0); }, [run.id]);
  const point = points[Math.min(frame, Math.max(0, points.length - 1))] ?? [0, 0, 0];
  return <div className="ra-replay"><div className="ra-track"><i style={{ left: `${Math.min(100, (point[0] / 300) * 100)}%`, top: `${50 + Math.max(-40, Math.min(40, point[1] * 20))}%` }} /></div><span>{Math.round(point[0])}m・{Math.round(point[2])}ms・{frame + 1}/{points.length}</span><input aria-label="幽靈回放時間軸" type="range" min="0" max={Math.max(0, points.length - 1)} value={frame} onChange={e => setFrame(Number(e.target.value))} /></div>;
}

export default function RallyAdmin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null), [data, setData] = useState(empty), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [resolution, setResolution] = useState("經賽事委員會複核"), [selectedRun, setSelectedRun] = useState<RallyRun | null>(null);
  const [season, setSeason] = useState({ id: "S02", title: "世界記憶交流季", startsAt: "2027-01-01T00:00", endsAt: "2027-04-30T23:59", dailyLimit: 5 });
  const active = useMemo(() => data.seasons.find(s => s.status === "active"), [data.seasons]);
  async function refresh() { try { const ok = await isRallyAdmin(); setAuthorized(ok); if (ok) setData(await loadRallyAdminData()); } catch (e) { setMessage(e instanceof Error ? e.message : "載入失敗"); setAuthorized(false); } }
  useEffect(() => { void refresh(); const { data: auth } = supabase?.auth.onAuthStateChange(() => void refresh()) ?? { data: { subscription: { unsubscribe() {} } } }; return () => auth.subscription.unsubscribe(); }, []);
  async function act(task: () => Promise<void>, done: string) { setBusy(true); try { await task(); setMessage(done); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "操作失敗"); } finally { setBusy(false); } }
  if (authorized === null) return <main className="ra-shell"><p>正在驗證賽事管理權限…</p></main>;
  if (!authorized) return <main className="ra-shell ra-denied"><Gavel /><h1>管理員賽事控制台</h1><p>目前 session 沒有賽事管理權限。請使用已列入 admins 的正式帳號登入。</p><Link href="/world-rally"><ArrowLeft /> 返回萬國風行賽</Link></main>;
  return <main className="ra-shell"><header><div><small>MEMGENIUS RALLY OPERATIONS</small><h1>管理員賽事控制台</h1><p>{active ? `${active.id} ${active.title}・${new Date(active.ends_at).toLocaleString("zh-TW")} 結束` : "目前沒有進行中的賽季"}</p></div><button onClick={() => void refresh()}><RefreshCw />重新整理</button><Link href="/world-rally"><ArrowLeft />回到賽事</Link></header>{message && <p className="ra-message" aria-live="polite">{message}</p>}
  <section><h2>申訴審核</h2><label>裁決說明<input value={resolution} onChange={e => setResolution(e.target.value)} /></label><div className="ra-grid">{data.appeals.filter(a => a.status === "pending").map(a => <article key={a.id}><b>申訴 #{a.id}</b><small>{a.user_id}</small><p>{a.reason}</p><div><button disabled={busy} onClick={() => void act(() => resolveRallyAppeal(a.id,"approved",resolution),"申訴已核准，關聯封禁已解除")}>核准</button><button disabled={busy} onClick={() => void act(() => resolveRallyAppeal(a.id,"rejected",resolution),"申訴已駁回")}>駁回</button></div></article>)}{!data.appeals.some(a => a.status === "pending") && <p>目前沒有待審申訴。</p>}</div></section>
  <section><h2>封禁與異常軌跡</h2><div className="ra-grid">{data.sanctions.filter(s => !s.revoked_at).map(s => <article key={s.id}><b><ShieldOff /> 封禁 #{s.id}</b><small>{s.user_id}</small><p>{s.reason}<br />至 {new Date(s.banned_until).toLocaleString("zh-TW")}</p><button disabled={busy} onClick={() => void act(() => revokeRallySanction(s.id,resolution),"封禁已解除")}>解除封禁</button></article>)}</div><div className="ra-runs">{data.invalidRuns.map(r => <button key={r.id} onClick={() => setSelectedRun(r)}><Play />{r.display_name}・{r.map_id}・{(r.finish_ms/1000).toFixed(1)}s</button>)}</div>{selectedRun && <GhostReplay run={selectedRun} />}</section>
  <section><h2><CalendarClock /> 賽季排程與結算</h2><div className="ra-form"><input aria-label="下一賽季編號" value={season.id} onChange={e => setSeason({...season,id:e.target.value})}/><input aria-label="下一賽季名稱" value={season.title} onChange={e => setSeason({...season,title:e.target.value})}/><input aria-label="開始時間" type="datetime-local" value={season.startsAt} onChange={e => setSeason({...season,startsAt:e.target.value})}/><input aria-label="結束時間" type="datetime-local" value={season.endsAt} onChange={e => setSeason({...season,endsAt:e.target.value})}/><input aria-label="每日場次" type="number" min="1" max="20" value={season.dailyLimit} onChange={e => setSeason({...season,dailyLimit:Number(e.target.value)})}/><button disabled={busy} onClick={() => void act(() => scheduleRallySeason(season),"賽季排程已儲存")}>儲存排程</button><button className="danger" disabled={busy} onClick={() => void act(() => settleRallySeason(season),"本季已結算並開啟下一賽季")}>立即結算本季</button></div></section>
  <section><h2>營運稽核紀錄</h2><ol className="ra-audit">{data.audit.map(a => <li key={a.id}><b>{a.action}</b><span>{a.target_type} #{a.target_id}</span><time>{new Date(a.created_at).toLocaleString("zh-TW")}</time></li>)}</ol></section></main>;
}
