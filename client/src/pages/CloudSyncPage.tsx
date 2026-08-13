import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft, Cloud, LogOut, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase, syncLearningData } from "@/lib/supabase";

export default function CloudSyncPage() {
  const [user, setUser] = useState<User | null>(null); const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!supabase) return; supabase.auth.getUser().then(({ data }) => setUser(data.user)); const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null)); return () => data.subscription.unsubscribe(); }, []);
  const magicLink = async () => { if (!supabase || !email) return; setBusy(true); const appBase = import.meta.env.BASE_URL.replace(/\/$/, ""); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${appBase}/train/mrt/sync` } }); setMessage(error ? error.message : "登入連結已寄出，請到信箱完成登入。"); setBusy(false); };
  const sync = async () => { setBusy(true); try { const result = await syncLearningData(); setMessage(result === "uploaded" ? "本機進度已上傳。" : result === "downloaded" ? "已下載較新的雲端進度，重新整理後生效。" : "本機與雲端已一致。"); } catch (error) { setMessage(error instanceof Error ? error.message : "同步失敗"); } setBusy(false); };
  return <main className="container max-w-2xl py-8"><Link href="/train/mrt" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="w-4 h-4" />捷運任務板</Link><Cloud className="w-14 h-14 text-primary mt-8" /><h1 className="font-display font-extrabold text-3xl mt-4">Supabase 雲端同步</h1>
    {!isSupabaseConfigured ? <div className="paper-card bg-amber-50 p-6 mt-6"><strong>尚未連接 Supabase 專案</strong><p className="text-sm text-muted-foreground mt-2">複製 `.env.example` 為 `.env`，填入 Project URL 與 anon key，再執行 migration SQL。</p></div> : !user ? <div className="paper-card p-6 mt-6"><label className="font-bold">Email Magic Link 登入</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full border rounded-xl px-4 py-3 mt-3" /><Button disabled={busy || !email} onClick={magicLink} className="rounded-full mt-4">寄送登入連結</Button></div> : <div className="paper-card p-6 mt-6"><p className="text-sm text-muted-foreground">已登入</p><strong>{user.email}</strong><div className="flex flex-wrap gap-3 mt-5"><Button disabled={busy} onClick={sync} className="rounded-full"><RefreshCw className="w-4 h-4" />立即同步</Button><Button variant="outline" onClick={() => supabase?.auth.signOut()} className="rounded-full"><LogOut className="w-4 h-4" />登出</Button></div></div>}{message && <p className="mt-5 font-bold text-primary" aria-live="polite">{message}</p>}
  </main>;
}
