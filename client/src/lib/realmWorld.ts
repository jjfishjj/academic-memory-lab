import { useCallback, useEffect, useState } from "react";
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
  created_at: string;
  updated_at: string;
};

type WorldEnvelope = {
  world: RealmWorld;
  member_count: number;
  is_owner: boolean;
};

export type RealmAuthorityStatus = "connecting" | "server" | "local" | "error";

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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

function serverMessage(error: unknown) {
  const raw = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "共同世界暫時無法連線";
  if (raw.includes("room is full")) return "房間已有 4 名玩家，請換一個房號。";
  if (raw.includes("cooldown")) return "技能仍在冷卻，稍等一下再攻擊。";
  if (raw.includes("not attackable")) return "霧魘已被隊友擊敗。";
  if (raw.includes("dialogue is locked")) return "必須先共同擊敗霧魘，才能開始對話。";
  if (raw.includes("branch selection is locked")) return "目前不能改變 NPC 對話分支。";
  if (raw.includes("diplomacy skill is locked")) return "必須先選擇 NPC 開場立場。";
  if (raw.includes("only the room owner")) return "只有房主可以重置共同世界。";
  return raw;
}

export function useRealmWorld(room: string, actorId: string, name: string, connected: boolean) {
  const [world, setWorld] = useState<RealmWorld>(() => localInitial(room, actorId));
  const [status, setStatus] = useState<RealmAuthorityStatus>("connecting");
  const [memberCount, setMemberCount] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setWorld(localInitial(room, actorId));
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
      .subscribe();

    const join = async () => {
      const { data, error: joinError } = await client.rpc("realm_join_world", {
        p_room_code: room,
        p_actor_id: actorId,
        p_display_name: name,
      });
      if (joinError) throw joinError;
      if (cancelled) return;
      const envelope = data as WorldEnvelope;
      setWorld(envelope.world);
      setMemberCount(envelope.member_count);
      setIsOwner(envelope.is_owner);
      setStatus("server");
    };

    void join().catch(reason => {
      if (cancelled) return;
      setStatus("error");
      setError(serverMessage(reason));
    });

    const heartbeat = window.setInterval(() => {
      void client
        .rpc("realm_touch_world", {
          p_room_code: room,
          p_actor_id: actorId,
          p_display_name: name,
        })
        .then(({ data, error: touchError }) => {
          if (cancelled || touchError) return;
          setMemberCount(Number(data) || 1);
        });
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      void client.removeChannel(channel);
    };
  }, [room, actorId, name, connected]);

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
            return localInitial(room, actorId);
          }
          return next;
        });
        return null;
      }

      const { data, error: actionError } = await supabase.rpc("realm_world_action", {
        p_room_code: room,
        p_actor_id: actorId,
        p_action: action,
        p_value: value ?? null,
      });
      if (actionError) throw actionError;
      const envelope = data as WorldEnvelope;
      setWorld(envelope.world);
      setMemberCount(envelope.member_count);
      setIsOwner(envelope.is_owner);
      return envelope.world;
    } catch (reason) {
      setError(serverMessage(reason));
      return null;
    } finally {
      setPending(false);
    }
  }, [actorId, name, pending, room]);

  return { world, status, memberCount, isOwner, error, pending, act };
}
