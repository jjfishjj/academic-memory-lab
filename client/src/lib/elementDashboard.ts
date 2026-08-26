import { CORE_FAMILIES,isFamilyComplete,type ElementCourseProgress } from "./elementCourseProgress";
import { getMasteryStatus,type ElementProgress } from "./elementProgress";
import { ALL_TALENTS,type TalentProgress } from "./elementTalentProgress";
export interface ElementBadge { id:string;icon:string;name:string;description:string;earned:boolean }
export function elementBadges(progress:ElementProgress,course:ElementCourseProgress,talents:TalentProgress,streak:number):ElementBadge[]{
 const records=Object.values(progress.elements),mastered=records.filter((r)=>getMasteryStatus(r)==="mastered").length,families=CORE_FAMILIES.filter((f)=>isFamilyComplete(course,f)).length,allTalents=ALL_TALENTS.every((t)=>(talents.talents[t]?.xp||0)>=25);
 return [{id:"first",icon:"⚛️",name:"第一顆原子",description:"完成第一題元素練習",earned:records.length>0},{id:"streak3",icon:"🔥",name:"三日連鎖",description:"連續學習 3 天",earned:streak>=3},{id:"family",icon:"🧭",name:"族別探險家",description:"通關第一個核心族",earned:families>=1},{id:"four",icon:"🏛️",name:"四族守護者",description:"通關四個核心族",earned:families===4},{id:"master20",icon:"🧪",name:"元素研究員",description:"熟練 20 個元素",earned:mastered>=20},{id:"master118",icon:"👑",name:"元素大師",description:"熟練全部 118 個元素",earned:mastered===118},{id:"talents",icon:"🌈",name:"八面天賦",description:"八種天賦各取得 25 XP",earned:allTalents}]
}
