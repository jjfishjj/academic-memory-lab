import type { TalentType, MemoryProfile } from "./memoryProfile";
import { recordElementActivity } from "./elementEngagement";

export const TALENT_PROGRESS_KEY = "memodesk-element-talent-progress-v1";
export const ALL_TALENTS: TalentType[] = ["visualBuilder","soundMimic","textOrganizer","actionContext","socialOutput","systemAccumulator","creativeConnector","businessApplier"];
export interface TalentStat { xp: number; completions: number; lastCompletedAt: string }
export interface TalentProgress { version: 1; talents: Partial<Record<TalentType,TalentStat>> }

export function loadTalentProgress(): TalentProgress { try { const value=JSON.parse(localStorage.getItem(TALENT_PROGRESS_KEY)||"null") as TalentProgress|null; return value?.version===1?value:{version:1,talents:{}} } catch { return {version:1,talents:{}} } }
export function awardTalentXp(talent:TalentType,xp=25,now=new Date()) { recordElementActivity("talent",1,now); const progress=loadTalentProgress(); const previous=progress.talents[talent]||{xp:0,completions:0,lastCompletedAt:""}; progress.talents[talent]={xp:previous.xp+xp,completions:previous.completions+1,lastCompletedAt:now.toISOString()}; try{localStorage.setItem(TALENT_PROGRESS_KEY,JSON.stringify(progress))}catch{/* ignore */} return progress }
export function getAdaptiveTalents(profile:MemoryProfile|null):[TalentType,TalentType] { if(profile&&profile.primaryTalent!==profile.secondaryTalent)return [profile.primaryTalent,profile.secondaryTalent]; return ["visualBuilder","systemAccumulator"] }
export function talentLevel(xp:number){return Math.floor(xp/100)+1}
