export type ElementCategory = "alkali" | "alkaline" | "transition" | "post" | "metalloid" | "nonmetal" | "halogen" | "noble" | "lanthanide" | "actinide";

export interface ElementItem {
  number: number;
  symbol: string;
  nameZh: string;
  nameEn: string;
  category: ElementCategory;
  period: number;
  group: number | null;
}

const raw: Array<[string, string, string, ElementCategory]> = [
  ["H","氫","Hydrogen","nonmetal"],["He","氦","Helium","noble"],["Li","鋰","Lithium","alkali"],["Be","鈹","Beryllium","alkaline"],["B","硼","Boron","metalloid"],["C","碳","Carbon","nonmetal"],["N","氮","Nitrogen","nonmetal"],["O","氧","Oxygen","nonmetal"],["F","氟","Fluorine","halogen"],["Ne","氖","Neon","noble"],
  ["Na","鈉","Sodium","alkali"],["Mg","鎂","Magnesium","alkaline"],["Al","鋁","Aluminium","post"],["Si","矽","Silicon","metalloid"],["P","磷","Phosphorus","nonmetal"],["S","硫","Sulfur","nonmetal"],["Cl","氯","Chlorine","halogen"],["Ar","氬","Argon","noble"],["K","鉀","Potassium","alkali"],["Ca","鈣","Calcium","alkaline"],
  ["Sc","鈧","Scandium","transition"],["Ti","鈦","Titanium","transition"],["V","釩","Vanadium","transition"],["Cr","鉻","Chromium","transition"],["Mn","錳","Manganese","transition"],["Fe","鐵","Iron","transition"],["Co","鈷","Cobalt","transition"],["Ni","鎳","Nickel","transition"],["Cu","銅","Copper","transition"],["Zn","鋅","Zinc","transition"],["Ga","鎵","Gallium","post"],["Ge","鍺","Germanium","metalloid"],["As","砷","Arsenic","metalloid"],["Se","硒","Selenium","nonmetal"],["Br","溴","Bromine","halogen"],["Kr","氪","Krypton","noble"],
  ["Rb","銣","Rubidium","alkali"],["Sr","鍶","Strontium","alkaline"],["Y","釔","Yttrium","transition"],["Zr","鋯","Zirconium","transition"],["Nb","鈮","Niobium","transition"],["Mo","鉬","Molybdenum","transition"],["Tc","鎝","Technetium","transition"],["Ru","釕","Ruthenium","transition"],["Rh","銠","Rhodium","transition"],["Pd","鈀","Palladium","transition"],["Ag","銀","Silver","transition"],["Cd","鎘","Cadmium","transition"],["In","銦","Indium","post"],["Sn","錫","Tin","post"],["Sb","銻","Antimony","metalloid"],["Te","碲","Tellurium","metalloid"],["I","碘","Iodine","halogen"],["Xe","氙","Xenon","noble"],
  ["Cs","銫","Caesium","alkali"],["Ba","鋇","Barium","alkaline"],["La","鑭","Lanthanum","lanthanide"],["Ce","鈰","Cerium","lanthanide"],["Pr","鐠","Praseodymium","lanthanide"],["Nd","釹","Neodymium","lanthanide"],["Pm","鉕","Promethium","lanthanide"],["Sm","釤","Samarium","lanthanide"],["Eu","銪","Europium","lanthanide"],["Gd","釓","Gadolinium","lanthanide"],["Tb","鋱","Terbium","lanthanide"],["Dy","鏑","Dysprosium","lanthanide"],["Ho","鈥","Holmium","lanthanide"],["Er","鉺","Erbium","lanthanide"],["Tm","銩","Thulium","lanthanide"],["Yb","鐿","Ytterbium","lanthanide"],["Lu","鎦","Lutetium","lanthanide"],
  ["Hf","鉿","Hafnium","transition"],["Ta","鉭","Tantalum","transition"],["W","鎢","Tungsten","transition"],["Re","錸","Rhenium","transition"],["Os","鋨","Osmium","transition"],["Ir","銥","Iridium","transition"],["Pt","鉑","Platinum","transition"],["Au","金","Gold","transition"],["Hg","汞","Mercury","transition"],["Tl","鉈","Thallium","post"],["Pb","鉛","Lead","post"],["Bi","鉍","Bismuth","post"],["Po","釙","Polonium","post"],["At","砈","Astatine","halogen"],["Rn","氡","Radon","noble"],
  ["Fr","鍅","Francium","alkali"],["Ra","鐳","Radium","alkaline"],["Ac","錒","Actinium","actinide"],["Th","釷","Thorium","actinide"],["Pa","鏷","Protactinium","actinide"],["U","鈾","Uranium","actinide"],["Np","錼","Neptunium","actinide"],["Pu","鈽","Plutonium","actinide"],["Am","鋂","Americium","actinide"],["Cm","鋦","Curium","actinide"],["Bk","鉳","Berkelium","actinide"],["Cf","鉲","Californium","actinide"],["Es","鑀","Einsteinium","actinide"],["Fm","鐨","Fermium","actinide"],["Md","鍆","Mendelevium","actinide"],["No","鍩","Nobelium","actinide"],["Lr","鐒","Lawrencium","actinide"],
  ["Rf","鑪","Rutherfordium","transition"],["Db","𨧀","Dubnium","transition"],["Sg","𨭎","Seaborgium","transition"],["Bh","𨨏","Bohrium","transition"],["Hs","𨭆","Hassium","transition"],["Mt","䥑","Meitnerium","transition"],["Ds","鐽","Darmstadtium","transition"],["Rg","錀","Roentgenium","transition"],["Cn","鎶","Copernicium","transition"],["Nh","鉨","Nihonium","post"],["Fl","鈇","Flerovium","post"],["Mc","鏌","Moscovium","post"],["Lv","鉝","Livermorium","post"],["Ts","鿬","Tennessine","halogen"],["Og","鿫","Oganesson","noble"]
];

const PERIOD_ENDS = [2, 10, 18, 36, 54, 86, 118];
const GROUPS_BY_PERIOD: Record<number, number[]> = {
  1: [1, 18],
  2: [1, 2, 13, 14, 15, 16, 17, 18],
  3: [1, 2, 13, 14, 15, 16, 17, 18],
  4: Array.from({ length: 18 }, (_, index) => index + 1),
  5: Array.from({ length: 18 }, (_, index) => index + 1),
  6: [1, 2, 3, ...Array.from({ length: 15 }, (_, index) => index + 4)],
  7: [1, 2, 3, ...Array.from({ length: 15 }, (_, index) => index + 4)],
};

function positionFor(number: number, category: ElementCategory) {
  const period = PERIOD_ENDS.findIndex((end) => number <= end) + 1;
  if ((category === "lanthanide" && number !== 57) || (category === "actinide" && number !== 89)) return { period, group: null };
  const start = period === 1 ? 1 : PERIOD_ENDS[period - 2] + 1;
  const position = number - start;
  const adjustedPosition = period >= 6 && number > (period === 6 ? 71 : 103) ? position - 14 : position;
  return { period, group: GROUPS_BY_PERIOD[period][adjustedPosition] };
}

export const ELEMENTS: ElementItem[] = raw.map(([symbol, nameZh, nameEn, category], index) => ({
  number: index + 1, symbol, nameZh, nameEn, category, ...positionFor(index + 1, category),
}));

export const CATEGORY_STYLE: Record<ElementCategory, { label: string; className: string }> = {
  alkali: { label: "鹼金屬", className: "bg-rose-100 text-rose-800 border-rose-200" }, alkaline: { label: "鹼土金屬", className: "bg-orange-100 text-orange-800 border-orange-200" },
  transition: { label: "過渡金屬", className: "bg-amber-100 text-amber-900 border-amber-200" }, post: { label: "後過渡金屬", className: "bg-slate-100 text-slate-800 border-slate-200" },
  metalloid: { label: "類金屬", className: "bg-lime-100 text-lime-900 border-lime-200" }, nonmetal: { label: "非金屬", className: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  halogen: { label: "鹵素", className: "bg-cyan-100 text-cyan-900 border-cyan-200" }, noble: { label: "惰性氣體", className: "bg-violet-100 text-violet-900 border-violet-200" },
  lanthanide: { label: "鑭系", className: "bg-pink-100 text-pink-900 border-pink-200" }, actinide: { label: "錒系", className: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200" },
};
