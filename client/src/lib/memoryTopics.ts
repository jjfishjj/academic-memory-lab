import type { MemoryProfile } from "./memoryProfile";
import { markLocalDataUpdated } from "./supabase";

export const MEMORY_TOPICS_KEY = "memodesk-memory-topics-v1";

export interface MemoryPoint {
  id: string;
  prompt: string;
  answer: string;
  mastered: boolean;
}
export interface MemoryTopic {
  id: string;
  title: string;
  category: string;
  emoji: string;
  createdAt: string;
  points: MemoryPoint[];
}

const empty = (): MemoryTopic[] => [];
export function loadMemoryTopics(): MemoryTopic[] {
  try {
    const value = JSON.parse(localStorage.getItem(MEMORY_TOPICS_KEY) || "[]");
    return Array.isArray(value) ? value : empty();
  } catch {
    return empty();
  }
}
export function saveMemoryTopics(topics: MemoryTopic[]) {
  localStorage.setItem(MEMORY_TOPICS_KEY, JSON.stringify(topics));
  markLocalDataUpdated();
  return topics;
}
export function parseMemoryPoints(text: string): MemoryPoint[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [prompt, ...rest] = line.split("::");
      const answer = rest.join("::").trim();
      return {
        id: `${Date.now()}-${index}`,
        prompt: prompt.trim(),
        answer: answer || prompt.trim(),
        mastered: false,
      };
    });
}
export function createMemoryTopic(
  title: string,
  category: string,
  text: string,
  emoji = "🧠"
): MemoryTopic {
  const clean = title.trim(),
    points = parseMemoryPoints(text);
  if (!clean) throw new Error("請輸入主題名稱");
  if (!points.length) throw new Error("請至少輸入一個想記住的知識點");
  const topic = {
    id: `topic-${Date.now().toString(36)}`,
    title: clean,
    category: category.trim() || "自訂",
    emoji,
    createdAt: new Date().toISOString(),
    points,
  };
  saveMemoryTopics([topic, ...loadMemoryTopics()]);
  return topic;
}
export function findMemoryTopic(id: string) {
  return loadMemoryTopics().find(topic => topic.id === id);
}
export function setPointMastery(
  topicId: string,
  pointId: string,
  mastered: boolean
) {
  const topics = loadMemoryTopics().map(topic =>
    topic.id === topicId
      ? {
          ...topic,
          points: topic.points.map(point =>
            point.id === pointId ? { ...point, mastered } : point
          ),
        }
      : topic
  );
  saveMemoryTopics(topics);
  return topics.find(topic => topic.id === topicId);
}

export function recommendedTraining(profile: MemoryProfile | null) {
  if (!profile)
    return {
      id: "flip",
      name: "翻卡提取",
      reason: "先用最通用的主動回想建立基準。",
      icon: "🃏",
    };
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic")
    return {
      id: "speak",
      name: "朗讀節奏",
      reason: "你的聽覺／聲音天賦適合先聽、再覆述。",
      icon: "🎧",
    };
  if (
    profile.vark === "kinesthetic" ||
    profile.primaryTalent === "actionContext"
  )
    return {
      id: "action",
      name: "行動翻卡",
      reason: "你的動覺／行動天賦適合操作後立即作答。",
      icon: "🎬",
    };
  if (profile.vark === "visual" || profile.primaryTalent === "visualBuilder")
    return {
      id: "visual",
      name: "圖像翻卡",
      reason: "你的視覺天賦適合用空間與畫面建立鉤子。",
      icon: "🖼️",
    };
  if (profile.primaryTalent === "creativeConnector")
    return {
      id: "story",
      name: "荒謬故事",
      reason: "你的創意連結天賦適合把知識串成誇張故事。",
      icon: "🧠",
    };
  return {
    id: "write",
    name: "書寫提取",
    reason: "你的讀寫／整理天賦適合先分類再默寫。",
    icon: "✍️",
  };
}
