import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

export type RealmStage = "combat" | "npc" | "dialogue" | "diplomacy" | "complete";
export type RealmBranch = "listen" | "verify" | "pressure";
export type RealmSkill = "mirror" | "empathy" | "pressure";

export type RealmWorld = {
  room_code: string;
  owner_actor: string;
  enemy_health: number;
  quest_stage: RealmStage;
  dialogue_branch: RealmBranch | null;
  trust: number;
  tension: number;
  won: boolean;
  version: number;
  last_action: string;
  last_actor_name: string;
  enemy_x: number;
  enemy_z: number;
  enemy_target_actor: string | null;
  enemy_target_name: string | null;
  last_combat_result: string;
  created_at: string;
  updated_at: string;
};

export type RealmMember = {
  actor_id: string;
  display_name: string;
  x: number;
  z: number;
  ry: number;
  motion: string;
  health: number;
  dodging_until: string | null;
  last_hit_at: string | null;
  respawn_at: string | null;
};

type WorldEnvelope = {
  world: RealmWorld;
  self: RealmMember;
  member_count: number;
  is_owner: boolean;
};

export type RealmAuthorityStatus = "connecting" | "reconnecting" | "server" | "local" | "error";

const localInitial = (room: string, actorId: string): RealmWorld => ({
  room_code: room,
  owner_actor: actorId,
  enemy_health: 100,
  quest_stage: "combat",
  dialogue_branch: null,
  trust: 20,
  tension: 80,
  won: false,
  version: 1,
  last_action: "world_created",
  last_actor_name: "系統",
  enemy_x: -7,
  enemy_z: 2,
  enemy_target_actor: null,
  enemy_target_name: null,
  last_combat_result: "none",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const localMember = (actorId: string, name: string): RealmMember => ({
  actor_id: actorId,
  display_name: name,
  x: 0,
  z: 8,
  ry: 180,
  motion: "idle",
  health: 100,
  dodging_until: null,
  last_hit_at: null,
  respawn_at: null,
});

function serverMessage(error: unknown) {
  const raw = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "共同世界暫時無法連線";
  if (raw.includes("room is full")) return "房間已有 4 名玩家，請換一個房號。";
  if (raw.includes("Anonymous sign-ins are disabled")) return "Supabase 尚未啟用匿名登入，請在 Auth Providers 開啟 Anonymous Sign-Ins。";
  if (raw.includes("authentication required")) return "伺服器需要有效的玩家身分，請重新整理後再試。";
  if (raw.includes("cooldown")) return "技能仍在冷卻，稍等一下再攻擊。";
  if (raw.includes("out of range")) return "距離太遠，必須靠近目標才能行動。";
  if (raw.includes("movement rejected")) return "伺服器拒絕異常移動，已保留上一個有效位置。";
  if (raw.includes("player is defeated")) return "你已倒下，請讓房主重置共同世界。";
  if (raw.includes("not attackable")) return "霧魘已被隊友擊敗。";
  if (raw.includes("dialogue is locked")) return "必須先共同擊敗霧魘，才能開始對話。";
  if (raw.includes("branch selection is locked")) return "目前不能改變 NPC 對話分支。";
  if (raw.includes("diplomacy skill is locked")) return "必須先選擇 NPC 開場立場。";
  if (raw.includes("only the room owner")) return "只有房主可以重置共同世界。";
  return raw;
}

export type RealmIdentityStatus = "connecting" | "captcha" | "anonymous" | "authenticated" | "local" | "error";

export const realmTurnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || "";

let identityPromise: Promise<{ id: string; anonymous: boolean }> | null = null;

async function ensureRealmIdentity(captchaToken?: string) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data: existing, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (existing.session?.user) {
    return { id: existing.session.user.id, anonymous: Boolean(existing.session.user.is_anonymous) };
  }
  const { data, error } = await supabase.auth.signInAnonymously(
    captchaToken ? { options: { captchaToken } } : undefined,
  );
  if (error) throw error;
  if (!data.user) throw new Error("anonymous identity was not created");
  return { id: data.user.id, anonymous: true };
}

export function useRealmIdentity() {
  const fallback = useRef(sessionStorage.getItem("realm-pc-local-actor") || crypto.randomUUID());
  const [actorId, setActorId] = useState<string | null>(null);
  const [status, setStatus] = useState<RealmIdentityStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  const acceptIdentity = useCallback((identity: { id: string; anonymous: boolean }) => {
    setActorId(identity.id);
    setStatus(identity.anonymous ? "anonymous" : "authenticated");
    setError(null);
  }, []);

  const verifyCaptcha = useCallback(async (captchaToken: string) => {
    setStatus("connecting");
    setError(null);
    try {
      const identity = await ensureRealmIdentity(captchaToken);
      acceptIdentity(identity);
    } catch (reason) {
      setStatus("error");
      setError(serverMessage(reason));
    }
  }, [acceptIdentity]);

  useEffect(() => {
    sessionStorage.setItem("realm-pc-local-actor", fallback.current);
    if (!isSupabaseConfigured || !supabase) {
      setActorId(fallback.current);
      setStatus("local");
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) throw sessionError;
      if (data.session?.user) {
        acceptIdentity({ id: data.session.user.id, anonymous: Boolean(data.session.user.is_anonymous) });
        return;
      }
      if (realmTurnstileSiteKey) {
        setStatus("captcha");
        return;
      }
      identityPromise ??= ensureRealmIdentity().finally(() => { identityPromise = null; });
      return identityPromise.then(identity => { if (!cancelled) acceptIdentity(identity); });
    }).catch(reason => {
      if (!cancelled) {
        setStatus("error");
        setError(serverMessage(reason));
      }
    });
    return () => { cancelled = true; };
  }, [acceptIdentity]);

  return { actorId, status, error, verifyCaptcha, protectedByTurnstile: Boolean(realmTurnstileSiteKey) };
}

export function useRealmWorld(room: string, actorId: string | null, name: string, connected: boolean) {
  const safeActor = actorId ?? "00000000-0000-0000-0000-000000000000";
  const [world, setWorld] = useState<RealmWorld>(() => localInitial(room, safeActor));
  const [self, setSelf] = useState<RealmMember>(() => localMember(safeActor, name));
  const [status, setStatus] = useState<RealmAuthorityStatus>("connecting");
  const [memberCount, setMemberCount] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const latestPose = useRef({ x: 0, z: 8, ry: 180, action: "idle" });
  const syncBusy = useRef(false);

  const applyEnvelope = useCallback((envelope: WorldEnvelope) => {
    setWorld(envelope.world);
    setSelf(envelope.self);
    setMemberCount(envelope.member_count);
    setIsOwner(envelope.is_owner);
  }, []);

  const syncPose = useCallback((pose: { x: number; z: number; ry: number; action: string }) => {
    latestPose.current = pose;
    if (!isSupabaseConfigured) {
      setSelf(current => ({ ...current, ...pose, motion: pose.action }));
    }
  }, []);

  useEffect(() => {
    if (!connected || !actorId) return;
    let cancelled = false;
    let joined = false;
    let retryTimer: number | null = null;
    let attempt = 0;
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setWorld(localInitial(room, actorId));
      setSelf(localMember(actorId, name));
      setStatus("local");
      setIsOwner(true);
      return;
    }

    const client = supabase;
    setStatus("connecting");
    const channel = client
      .channel(`realm-authority-${room}-${actorId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "realm_worlds", filter: `room_code=eq.${room}` },
        payload => {
          if (!cancelled) setWorld(payload.new as RealmWorld);
        },
      )
      .subscribe(channelStatus => {
        if (cancelled) return;
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(channelStatus)) {
          setStatus("reconnecting");
        } else if (channelStatus === "SUBSCRIBED" && joined) {
          setStatus("server");
        }
      });

    const join = async () => {
      setStatus(attempt === 0 ? "connecting" : "reconnecting");
      const { data, error: joinError } = await client.rpc("realm_join_world", {
        p_room_code: room,
        p_display_name: name,
      });
      if (joinError) throw joinError;
      if (cancelled) return;
      const envelope = data as WorldEnvelope;
      applyEnvelope(envelope);
      joined = true;
      attempt = 0;
      setReconnectAttempt(0);
      setStatus("server");
    };

    const scheduleJoin = (reason?: unknown) => {
      if (cancelled || retryTimer !== null) return;
      const message = reason && typeof reason === "object" && "message" in reason ? String((reason as { message: unknown }).message) : "";
      if (message.includes("room is full") || message.includes("invalid room") || message.includes("authentication required")) {
        setStatus("error");
        setError(serverMessage(reason));
        return;
      }
      attempt += 1;
      setReconnectAttempt(attempt);
      setStatus("reconnecting");
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void join().catch(scheduleJoin);
      }, Math.min(5000, 500 * 2 ** Math.min(attempt - 1, 3)));
    };

    void join().catch(scheduleJoin);
    const onOnline = () => { if (!joined) scheduleJoin(); };
    window.addEventListener("online", onOnline);

    const heartbeat = window.setInterval(() => {
      if (syncBusy.current) return;
      syncBusy.current = true;
      const pose = latestPose.current;
      void (async () => {
        const startedAt = performance.now();
        try {
          const { data, error: syncError } = await client.rpc("realm_sync_player", {
            p_room_code: room,
            p_x: pose.x,
            p_z: pose.z,
            p_ry: pose.ry,
            p_motion: pose.action,
          });
          const roundTrip = Math.max(1, Math.round(performance.now() - startedAt));
          if (!cancelled && !syncError && data) {
            applyEnvelope(data as WorldEnvelope);
            setLatencyMs(current => current === null ? roundTrip : Math.round(current * 0.72 + roundTrip * 0.28));
            setLastSyncedAt(Date.now());
            setError(null);
            setStatus("server");
          }
          if (!cancelled && syncError && !String(syncError.message).includes("movement rejected")) {
            if (String(syncError.message).includes("has not joined")) {
              joined = false;
              scheduleJoin(syncError);
            } else {
              setError(serverMessage(syncError));
            }
          }
        } catch (reason) {
          if (!cancelled) scheduleJoin(reason);
        } finally {
          syncBusy.current = false;
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      window.removeEventListener("online", onOnline);
      void client.removeChannel(channel);
    };
  }, [room, actorId, name, connected, applyEnvelope]);

  const act = useCallback(async (action: string, value?: string) => {
    if (pending) return null;
    setPending(true);
    setError(null);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setWorld(current => {
          const next = { ...current, version: current.version + 1, last_action: `${action}${value ? `:${value}` : ""}`, last_actor_name: name, updated_at: new Date().toISOString() };
          if (action === "attack" && current.quest_stage === "combat") {
            next.enemy_health = Math.max(0, current.enemy_health - 34);
            if (next.enemy_health === 0) next.quest_stage = "npc";
          } else if (action === "open_dialogue" && current.quest_stage === "npc") {
            next.quest_stage = "dialogue";
          } else if (action === "choose_branch" && value) {
            const starts = { listen: [48, 54], verify: [58, 45], pressure: [32, 74] } as const;
            const start = starts[value as keyof typeof starts];
            if (start) { next.dialogue_branch = value as RealmBranch; next.trust = start[0]; next.tension = start[1]; next.quest_stage = "diplomacy"; }
          } else if (action === "skill" && value) {
            const deltas = { mirror: [27, -22], empathy: [20, -16], pressure: [7, 8] } as const;
            const delta = deltas[value as keyof typeof deltas];
            if (delta) { next.trust = Math.min(100, next.trust + delta[0]); next.tension = Math.max(0, Math.min(100, next.tension + delta[1])); }
            if (next.trust >= 82 && next.tension <= 25) { next.won = true; next.quest_stage = "complete"; }
          } else if (action === "reset") {
            return localInitial(room, safeActor);
          }
          return next;
        });
        return null;
      }

      const { data, error: actionError } = await supabase.rpc("realm_world_action", {
        p_room_code: room,
        p_action: action,
        p_value: value ?? null,
      });
      if (actionError) throw actionError;
      const envelope = data as WorldEnvelope;
      applyEnvelope(envelope);
      return envelope.world;
    } catch (reason) {
      setError(serverMessage(reason));
      return null;
    } finally {
      setPending(false);
    }
  }, [actorId, name, pending, room, safeActor, applyEnvelope]);

  return { world, self, status, memberCount, isOwner, error, pending, act, syncPose, latencyMs, reconnectAttempt, lastSyncedAt };
}
