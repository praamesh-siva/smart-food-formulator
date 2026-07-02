import type { OptimizationGoal } from "./formulation-types";
import {
  ALLERGEN_FREE_DISCLAIMER,
  HIGH_PROTEIN_RATIONALE_NOTE,
  LOW_CALORIE_RATIONALE_NOTE,
} from "./formulation-types";

function normalizeNoteText(note: string): string {
  return note.toLowerCase().replace(/\s+/g, " ").trim();
}

function wordOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(normalizeNoteText(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeNoteText(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) shared += 1;
  }
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function notesAreSimilar(a: string, b: string): boolean {
  const na = normalizeNoteText(a);
  const nb = normalizeNoteText(b);
  if (na === nb) return true;
  if (na.length >= 40 && nb.length >= 40 && (na.includes(nb) || nb.includes(na))) {
    return true;
  }
  return wordOverlapRatio(a, b) >= 0.72;
}

const ALLERGEN_DISCLAIMER_FRAGMENTS = [
  "cross-contamination",
  "cross contamination",
  "verify ingredient labels",
  "verify all labels",
  "verify labels match",
  "manufacturing practices",
  "healthcare provider",
  "confirm facility labels",
  "allergen-aware goal",
  "double-check labels",
  "confirm allergens and preferences",
];

function isAllergenDisclaimerLike(note: string): boolean {
  const n = normalizeNoteText(note);
  if (notesAreSimilar(note, ALLERGEN_FREE_DISCLAIMER)) return true;

  const fragmentHits = ALLERGEN_DISCLAIMER_FRAGMENTS.filter((fragment) =>
    n.includes(fragment)
  ).length;

  if (fragmentHits >= 2) return true;
  if (fragmentHits >= 1 && n.length <= 140) return true;
  if (/^dietary notes applied:/.test(n) && n.includes("verify")) return true;

  return false;
}

function isProteinRationaleLike(note: string): boolean {
  const n = note.toLowerCase();
  return (
    n.includes("protein rationale") ||
    notesAreSimilar(note, HIGH_PROTEIN_RATIONALE_NOTE)
  );
}

function isCalorieRationaleLike(note: string): boolean {
  const n = note.toLowerCase();
  return (
    n.includes("calorie rationale") ||
    notesAreSimilar(note, LOW_CALORIE_RATIONALE_NOTE)
  );
}

export function dedupeFoodScienceNotes(notes: string[], max = 5): string[] {
  const result: string[] = [];

  for (const note of notes) {
    const trimmed = note.trim();
    if (!trimmed) continue;
    if (result.some((existing) => notesAreSimilar(existing, trimmed))) continue;
    result.push(trimmed);
    if (result.length >= max) break;
  }

  return result;
}

export function finalizeFoodScienceNotes(
  notes: string[],
  goal: OptimizationGoal | null,
  max = 5
): string[] {
  let working = notes.map((note) => note.trim()).filter(Boolean);

  if (goal === "allergen-free") {
    working = working.filter((note) => !isAllergenDisclaimerLike(note));
    working.unshift(ALLERGEN_FREE_DISCLAIMER);
  } else if (goal === "high-protein") {
    working = working.filter((note) => !isProteinRationaleLike(note));
    working.unshift(HIGH_PROTEIN_RATIONALE_NOTE);
  } else if (goal === "low-calorie") {
    working = working.filter((note) => !isCalorieRationaleLike(note));
    working.unshift(LOW_CALORIE_RATIONALE_NOTE);
  }

  return dedupeFoodScienceNotes(working, max);
}
