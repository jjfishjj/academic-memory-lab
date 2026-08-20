export type ReviewCard = {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  family: string;
  misses: number;
  streak: number;
  nextReview: number;
  lastReviewed: number;
};

const KEY = "memgenius.review.v1";

export function loadReviewCards(): ReviewCard[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function recordMistake(card: Omit<ReviewCard,"misses"|"streak"|"nextReview"|"lastReviewed">) {
  const cards = loadReviewCards();
  const old = cards.find(x => x.id === card.id);
  const now = Date.now();
  const next: ReviewCard = old
    ? { ...old, ...card, misses: old.misses + 1, streak: 0, lastReviewed: now, nextReview: now }
    : { ...card, misses: 1, streak: 0, lastReviewed: now, nextReview: now };
  localStorage.setItem(KEY, JSON.stringify([next, ...cards.filter(x => x.id !== card.id)]));
}

export function gradeReview(id:string, grade:"again"|"hard"|"good") {
  const now = Date.now();
  const cards = loadReviewCards().map(card => {
    if (card.id !== id) return card;
    const streak = grade === "again" ? 0 : card.streak + 1;
    const wait = grade === "again" ? 60_000 : grade === "hard" ? 86_400_000 : Math.min(30, Math.max(3, streak * 3)) * 86_400_000;
    return { ...card, streak, misses: grade === "again" ? card.misses + 1 : card.misses, lastReviewed: now, nextReview: now + wait };
  });
  localStorage.setItem(KEY, JSON.stringify(cards));
  return cards;
}

