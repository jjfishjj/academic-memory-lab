import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type RallyRun = {
  id?: number;
  user_id?: string;
  display_name: string;
  season: string;
  map_id: string;
  score: number;
  finish_ms: number;
  rank: number;
  ghost_path: number[][];
  raced_on?: string;
  created_at?: string;
  race_ticket?: string | null;
};

export type RallyServerQuestion = {
  id: string;
  type: "listening" | "translation" | "cloze" | "diplomacy" | "confusable";
  cefr: string;
  phrase: string;
  prompt: string;
  answers: string[];
};

export type RallyRaceSession = {
  ticket: string;
  difficulty: "review" | "standard" | "challenge";
  questions: RallyServerQuestion[];
};

export type RallyAnswerResult = {
  correct: boolean;
  correctIndex: number;
  bonus: number;
  nextDueAt: string;
  memory: string;
};

export type RallySeason = {
  id: string;
  title: string;
  status: "scheduled" | "active" | "closed";
  starts_at: string;
  ends_at: string;
  daily_run_limit: number;
};

export type CountryStanding = {
  season: string;
  country_code: "TW" | "FR" | "JP";
  racers: number;
  total_score: number;
  best_finish_ms: number;
};

export type GuildStanding = {
  season: string;
  guild_slug: string;
  guild_name: string;
  emblem: string;
  racers: number;
  total_score: number;
  best_finish_ms: number;
};

export type RallyGuild = {
  slug: string;
  name: string;
  country_code: string;
  emblem: string;
};

export type RallyReward = {
  id: number;
  season: string;
  tier: string;
  coins: number;
  title: string;
  claimed_at: string | null;
};

export type RallyAppeal = {
  id: number;
  reason: string;
  status: string;
  resolution: string | null;
  created_at: string;
};

export type RallySanction = {
  id: number;
  reason: string;
  banned_until: string;
};

export async function startRallyRace(mapId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("start_rally_race_v2", {
    p_map_id: mapId,
  });
  if (error) throw error;
  return data as RallyRaceSession;
}

export async function submitRallyAnswer(
  ticket: string,
  questionId: string,
  selectedIndex: number,
  responseMs: number
) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("submit_rally_answer", {
    p_ticket: ticket,
    p_question_id: questionId,
    p_selected_index: selectedIndex,
    p_response_ms: Math.max(250, Math.min(30000, Math.round(responseMs))),
  });
  if (error) throw error;
  return data as RallyAnswerResult;
}

export async function getRallyUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
export async function sendRallyMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}world-rally`,
    },
  });
  if (error) throw error;
}
export async function loadRallyProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rally_profiles")
    .select("display_name,profile,story_state,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveRallyProfile(
  userId: string,
  displayName: string,
  profile: unknown,
  storyState: unknown,
  expectedUpdatedAt?: string | null
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.id !== userId) throw new Error("雲端角色身分不一致");
  const { data, error } = await supabase.rpc("save_rally_profile_v2", {
    p_display_name: displayName,
    p_profile: profile,
    p_story_state: storyState,
    p_expected_updated_at: expectedUpdatedAt ?? null,
  });
  if (error) {
    if (error.code === "40001") {
      throw new Error(
        "雲端角色已在另一裝置更新；請先下載最新版，再重新套用變更"
      );
    }
    throw error;
  }
  return data as string;
}
export async function submitRallyRun(run: RallyRun) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  if (!run.race_ticket) throw new Error("本場未取得伺服器賽事票券");
  const { data, error } = await supabase.rpc("finish_rally_race_v2", {
    p_ticket: run.race_ticket,
    p_display_name: run.display_name,
    p_rank: run.rank,
    p_ghost_path: run.ghost_path,
  });
  if (error) throw error;
  return data as { runId: number; score: number; learningBonus: number };
}
export async function loadSeasonLeaderboard(season = "S01") {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("rally_runs")
    .select("id,display_name,map_id,score,finish_ms,rank,created_at")
    .eq("season", season)
    .eq("is_valid", true)
    .order("score", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as RallyRun[];
}
export async function loadDailyGhost(mapId: string) {
  if (!supabase) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("rally_runs")
    .select("display_name,finish_ms,ghost_path,score")
    .eq("map_id", mapId)
    .eq("raced_on", today)
    .eq("is_valid", true)
    .order("finish_ms", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as RallyRun | null;
}
export function subscribeToSeason(onChange: () => void) {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel = client
    .channel("rally-season-s01")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "rally_runs" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rally_seasons" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rally_appeals" },
      onChange
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function loadRallyOperations(userId?: string) {
  if (!supabase)
    return {
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
  const today = new Date().toISOString().slice(0, 10);
  const [seasonRes, countryRes, guildBoardRes, guildsRes] = await Promise.all([
    supabase
      .from("rally_seasons")
      .select("id,title,status,starts_at,ends_at,daily_run_limit")
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("rally_country_leaderboard")
      .select("season,country_code,racers,total_score,best_finish_ms")
      .order("total_score", { ascending: false }),
    supabase
      .from("rally_guild_leaderboard")
      .select(
        "season,guild_slug,guild_name,emblem,racers,total_score,best_finish_ms"
      )
      .order("total_score", { ascending: false }),
    supabase
      .from("rally_guilds")
      .select("slug,name,country_code,emblem")
      .order("name"),
  ]);
  const publicError =
    seasonRes.error ||
    countryRes.error ||
    guildBoardRes.error ||
    guildsRes.error;
  if (publicError) throw publicError;
  const season = seasonRes.data as RallySeason | null;
  let affiliation = null,
    todayCount = 0,
    sanctions: RallySanction[] = [],
    appeals: RallyAppeal[] = [],
    rewards: RallyReward[] = [];
  if (userId) {
    const [affRes, countRes, sanctionRes, appealRes, rewardRes] =
      await Promise.all([
        supabase
          .from("rally_affiliations")
          .select("country_code,guild_slug")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("rally_runs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("season", season?.id ?? "S01")
          .eq("raced_on", today)
          .eq("is_valid", true),
        supabase
          .from("rally_sanctions")
          .select("id,reason,banned_until")
          .eq("user_id", userId)
          .gt("banned_until", new Date().toISOString())
          .order("banned_until", { ascending: false }),
        supabase
          .from("rally_appeals")
          .select("id,reason,status,resolution,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("rally_rewards")
          .select("id,season,tier,coins,title,claimed_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
    const privateError =
      affRes.error ||
      countRes.error ||
      sanctionRes.error ||
      appealRes.error ||
      rewardRes.error;
    if (privateError) throw privateError;
    affiliation = affRes.data;
    todayCount = countRes.count ?? 0;
    sanctions = (sanctionRes.data ?? []) as RallySanction[];
    appeals = (appealRes.data ?? []) as RallyAppeal[];
    rewards = (rewardRes.data ?? []) as RallyReward[];
  }
  return {
    season,
    countries: (countryRes.data ?? []) as CountryStanding[],
    guildBoard: (guildBoardRes.data ?? []) as GuildStanding[],
    guilds: (guildsRes.data ?? []) as RallyGuild[],
    affiliation,
    todayCount,
    sanctions,
    appeals,
    rewards,
  };
}

export async function setRallyAffiliation(
  countryCode: "TW" | "FR" | "JP",
  guildSlug: string | null
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("set_rally_affiliation", {
    p_country_code: countryCode,
    p_guild_slug: guildSlug,
  });
  if (error) throw error;
}

export async function submitRallyAppeal(
  userId: string,
  reason: string,
  sanctionId?: number
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.from("rally_appeals").insert({
    user_id: userId,
    sanction_id: sanctionId ?? null,
    reason,
    status: "pending",
  });
  if (error) throw error;
}

export async function claimRallyReward(rewardId: number) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { data, error } = await supabase.rpc("claim_rally_reward", {
    p_reward_id: rewardId,
  });
  if (error) throw error;
  return data as number;
}

export type RallyAdminData = {
  questions: RallyQuestionAdmin[];
  appeals: Array<
    RallyAppeal & {
      user_id: string;
      sanction_id: number | null;
      run_id: number | null;
    }
  >;
  sanctions: Array<
    RallySanction & {
      user_id: string;
      evidence: unknown;
      revoked_at: string | null;
      created_at: string;
    }
  >;
  invalidRuns: RallyRun[];
  seasons: RallySeason[];
  audit: Array<{
    id: number;
    action: string;
    target_type: string;
    target_id: string;
    detail: unknown;
    created_at: string;
  }>;
};

export type RallyQuestionAdmin = {
  id: string;
  map_id: "taipei" | "paris" | "tokyo";
  question_type: RallyServerQuestion["type"];
  cefr: "A1" | "A2" | "B1" | "B2" | "C1";
  phrase: string;
  prompt: string;
  answers: string[];
  correct_index: number;
  memory_hint: string;
  active: boolean;
  approved: boolean;
  updated_at: string;
};

export async function isRallyAdmin() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_rally_admin");
  if (error) throw error;
  return Boolean(data);
}

export async function loadRallyAdminData(): Promise<RallyAdminData> {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const [questions, appeals, sanctions, runs, seasons, audit] =
    await Promise.all([
      supabase
        .from("rally_questions")
        .select(
          "id,map_id,question_type,cefr,phrase,prompt,answers,correct_index,memory_hint,active,approved,updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("rally_appeals")
        .select(
          "id,user_id,sanction_id,run_id,reason,status,resolution,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("rally_sanctions")
        .select("id,user_id,reason,evidence,banned_until,revoked_at,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("rally_runs")
        .select(
          "id,user_id,display_name,season,map_id,score,finish_ms,rank,ghost_path,raced_on,created_at,validation_flags"
        )
        .eq("is_valid", false)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("rally_seasons")
        .select("id,title,status,starts_at,ends_at,daily_run_limit")
        .order("starts_at", { ascending: false }),
      supabase
        .from("rally_admin_audit")
        .select("id,action,target_type,target_id,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
  const error =
    questions.error ||
    appeals.error ||
    sanctions.error ||
    runs.error ||
    seasons.error ||
    audit.error;
  if (error) throw error;
  return {
    questions: questions.data as RallyQuestionAdmin[],
    appeals: appeals.data as RallyAdminData["appeals"],
    sanctions: sanctions.data as RallyAdminData["sanctions"],
    invalidRuns: runs.data as RallyRun[],
    seasons: seasons.data as RallySeason[],
    audit: audit.data as RallyAdminData["audit"],
  };
}

export async function upsertRallyQuestion(
  input: Omit<RallyQuestionAdmin, "active" | "approved" | "updated_at">
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_upsert_rally_question", {
    p_id: input.id,
    p_map_id: input.map_id,
    p_question_type: input.question_type,
    p_cefr: input.cefr,
    p_phrase: input.phrase,
    p_prompt: input.prompt,
    p_answers: input.answers,
    p_correct_index: input.correct_index,
    p_memory_hint: input.memory_hint,
  });
  if (error) throw error;
}

export async function reviewRallyQuestion(
  id: string,
  approved: boolean,
  active: boolean
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_review_rally_question", {
    p_id: id,
    p_approved: approved,
    p_active: active,
  });
  if (error) throw error;
}

export async function resolveRallyAppeal(
  id: number,
  status: "approved" | "rejected",
  resolution: string
) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_resolve_rally_appeal", {
    p_appeal_id: id,
    p_status: status,
    p_resolution: resolution,
  });
  if (error) throw error;
}

export async function revokeRallySanction(id: number, reason: string) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_revoke_rally_sanction", {
    p_sanction_id: id,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function scheduleRallySeason(input: {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  dailyLimit: number;
}) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_schedule_rally_season", {
    p_id: input.id,
    p_title: input.title,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_daily_run_limit: input.dailyLimit,
  });
  if (error) throw error;
}

export async function settleRallySeason(input: {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
}) {
  if (!supabase) throw new Error("Supabase 尚未設定");
  const { error } = await supabase.rpc("admin_settle_rally_season", {
    p_next_id: input.id,
    p_next_title: input.title,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
  });
  if (error) throw error;
}
