import { beforeEach, describe, expect, it } from "vitest";
import { CORE_FAMILIES, isFamilyComplete, isFamilyRecommendedUnlocked, loadElementCourseProgress, recordFamilyPlacement, recordFamilyQuiz } from "./elementCourseProgress";
class MemoryStorage { private values = new Map<string,string>(); getItem(k:string){return this.values.get(k)??null} setItem(k:string,v:string){this.values.set(k,v)} removeItem(k:string){this.values.delete(k)} clear(){this.values.clear()} key(i:number){return Array.from(this.values.keys())[i]??null} get length(){return this.values.size} }
beforeEach(()=>Object.defineProperty(globalThis,"localStorage",{value:new MemoryStorage(),configurable:true}));
describe("core family unlock course",()=>{
  it("requires both 80 percent quiz and placement",()=>{ recordFamilyQuiz("alkali",80); expect(isFamilyComplete(loadElementCourseProgress(),"alkali")).toBe(false); recordFamilyPlacement("alkali"); expect(isFamilyComplete(loadElementCourseProgress(),"alkali")).toBe(true); });
  it("unlocks the next recommended family in order",()=>{ expect(isFamilyRecommendedUnlocked(loadElementCourseProgress(),CORE_FAMILIES[1])).toBe(false); recordFamilyQuiz("alkali",100); recordFamilyPlacement("alkali"); expect(isFamilyRecommendedUnlocked(loadElementCourseProgress(),CORE_FAMILIES[1])).toBe(true); });
  it("keeps the best quiz score",()=>{ recordFamilyQuiz("halogen",100); recordFamilyQuiz("halogen",40); expect(loadElementCourseProgress().families.halogen?.bestQuizPercent).toBe(100); });
});
