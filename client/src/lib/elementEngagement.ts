export const ELEMENT_ACTIVITY_KEY = "memodesk-element-activity-v1";
export type ElementActivityKind = "answers" | "talent" | "placement" | "family";
export interface DayActivity { answers: number; talent: number; placement: number; family: number }
export interface ElementActivity { version: 1; days: Record<string, DayActivity> }
const emptyDay=():DayActivity=>({answers:0,talent:0,placement:0,family:0});
export function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
export function loadElementActivity():ElementActivity{try{const v=JSON.parse(localStorage.getItem(ELEMENT_ACTIVITY_KEY)||"null") as ElementActivity|null;return v?.version===1?v:{version:1,days:{}}}catch{return{version:1,days:{}}}}
export function recordElementActivity(kind:ElementActivityKind,amount=1,date=new Date()){const activity=loadElementActivity(),key=localDateKey(date),day=activity.days[key]||emptyDay();activity.days[key]={...day,[kind]:day[kind]+amount};try{localStorage.setItem(ELEMENT_ACTIVITY_KEY,JSON.stringify(activity));localStorage.setItem("memodesk-local-updated-at",date.toISOString())}catch{/* ignore */}return activity}
export function currentStreak(activity:ElementActivity,now=new Date()){let streak=0;const date=new Date(now);for(;;){if(!activity.days[localDateKey(date)])break;streak++;date.setDate(date.getDate()-1)}return streak}
export function dailyMissionProgress(activity:ElementActivity,now=new Date()){const day=activity.days[localDateKey(now)]||emptyDay();return {review:{value:Math.min(day.answers,5),goal:5,done:day.answers>=5},talent:{value:Math.min(day.talent,1),goal:1,done:day.talent>=1},practice:{value:Math.min(day.placement+day.family,1),goal:1,done:day.placement+day.family>=1}}}
