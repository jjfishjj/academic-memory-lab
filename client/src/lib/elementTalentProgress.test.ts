import { beforeEach,describe,expect,it } from "vitest";
import { awardTalentXp,getAdaptiveTalents,loadTalentProgress,talentLevel } from "./elementTalentProgress";
class MemoryStorage{private v=new Map<string,string>();getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}key(i:number){return Array.from(this.v.keys())[i]??null}get length(){return this.v.size}}
beforeEach(()=>Object.defineProperty(globalThis,"localStorage",{value:new MemoryStorage(),configurable:true}));
describe("element talent XP",()=>{
  it("accumulates XP and completions independently",()=>{awardTalentXp("soundMimic",25);awardTalentXp("soundMimic",40);awardTalentXp("visualBuilder",10);const p=loadTalentProgress();expect(p.talents.soundMimic?.xp).toBe(65);expect(p.talents.soundMimic?.completions).toBe(2);expect(p.talents.visualBuilder?.xp).toBe(10)});
  it("recommends primary and secondary talents",()=>{expect(getAdaptiveTalents({vark:"visual",primaryTalent:"creativeConnector",secondaryTalent:"socialOutput",updatedAt:""})).toEqual(["creativeConnector","socialOutput"])});
  it("falls back safely and levels each 100 XP",()=>{expect(getAdaptiveTalents(null)).toEqual(["visualBuilder","systemAccumulator"]);expect(talentLevel(240)).toBe(3)});
});
