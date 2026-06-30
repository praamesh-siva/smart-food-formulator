import { generatePlaceholderFormulation } from "./formulation";
import type {
  FormulationResult,
  OptimizationGoal,
  Substitution,
} from "./formulation-types";
import {
  ALLERGEN_FREE_DISCLAIMER,
  HIGH_PROTEIN_RATIONALE_NOTE,
  LOW_CALORIE_RATIONALE_NOTE,
  OPTIMIZATION_GOALS,
} from "./formulation-types";

export interface ReformulateApiResponse {
  title: string;
  ingredients: string[];
  method: string[];
  substitutions: Substitution[];
  foodScienceNotes: string[];
  expectedResult: string;
}

export interface ReformulateApiPayload extends ReformulateApiResponse {
  source?: "openai" | "fallback";
  error?: string;
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function ensureSubstitutions(value: unknown): Substitution[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Substitution =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Substitution).original === "string" &&
        typeof (item as Substitution).replacement === "string" &&
        typeof (item as Substitution).rationale === "string"
    )
    .map((item) => ({
      original: item.original,
      replacement: item.replacement,
      rationale: item.rationale,
    }));
}

export function parseReformulateApiResponse(
  value: unknown
): ReformulateApiResponse | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;

  const title =
    typeof data.title === "string"
      ? data.title
      : typeof data.recipeName === "string"
        ? data.recipeName
        : "Your Recipe";

  const ingredients = ensureStringArray(
    data.ingredients ?? data.reformulatedIngredients
  );
  const method = ensureStringArray(data.method ?? data.updatedMethod);
  const substitutions = ensureSubstitutions(
    data.substitutions ?? data.keySubstitutions
  );
  const foodScienceNotes = ensureStringArray(
    data.foodScienceNotes ?? data.food_science_notes
  );
  const expectedResult =
    typeof data.expectedResult === "string"
      ? data.expectedResult
      : typeof data.expected_result === "string"
        ? data.expected_result
        : "";

  if (ingredients.length === 0 && method.length === 0) {
    return null;
  }

  return {
    title,
    ingredients,
    method,
    substitutions,
    foodScienceNotes,
    expectedResult,
  };
}

export function isOpenAiPayload(
  value: unknown
): value is ReformulateApiPayload & { source: "openai" } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ReformulateApiPayload).source === "openai"
  );
}

export function isFallbackPayload(
  value: unknown
): value is ReformulateApiPayload & { source: "fallback" } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ReformulateApiPayload).source === "fallback"
  );
}

export function getPayloadError(value: unknown): string | null {
  if (typeof value === "object" && value !== null) {
    const error = (value as ReformulateApiPayload).error;
    if (typeof error === "string" && error.trim()) return error.trim();
  }
  return null;
}

export function friendlyReformulateError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("quota") || lower.includes("billing")) {
    return "AI reformulation isn't available right now (API quota exceeded). Showing placeholder formulation.";
  }
  if (lower.includes("invalid_api_key") || lower.includes("incorrect api key")) {
    return "AI reformulation isn't available (invalid API key). Showing placeholder formulation.";
  }
  if (lower.includes("rate limit")) {
    return "AI reformulation is busy right now. Showing placeholder formulation.";
  }
  if (lower.includes("not configured")) {
    return raw;
  }
  return "AI reformulation couldn't be completed. Showing placeholder formulation.";
}

export async function parseJsonResponse(
  response: Response
): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function formulationResultToApiResponse(
  result: FormulationResult
): ReformulateApiResponse {
  return {
    title: result.recipeName,
    ingredients: result.reformulatedIngredients,
    method: result.updatedMethod,
    substitutions: result.keySubstitutions,
    foodScienceNotes: result.foodScienceNotes,
    expectedResult: result.expectedResult,
  };
}

export function generateFallbackApiResponse(
  recipe: string,
  goal: OptimizationGoal
): ReformulateApiResponse {
  return formulationResultToApiResponse(
    generatePlaceholderFormulation(recipe, goal)
  );
}

const TREE_NUT_MILK_PATTERN =
  /\b(almond|cashew|hazelnut|macadamia|walnut)\s+milk\b/gi;

function sanitizeAllergenFreeLine(text: string): string {
  let result = text.replace(TREE_NUT_MILK_PATTERN, "rice milk");
  if (
    /\boat milk\b/i.test(result) &&
    !/certified gluten-free oat milk/i.test(result)
  ) {
    result = result.replace(
      /\boat milk\b/gi,
      "rice milk (or certified gluten-free oat milk if tolerated)"
    );
  }
  return result.replace(/\bsoy milk\b/gi, "rice milk");
}

function sanitizeAllergenFreeResponse(
  data: ReformulateApiResponse
): ReformulateApiResponse {
  return {
    ...data,
    ingredients: data.ingredients.map(sanitizeAllergenFreeLine),
    method: data.method.map(sanitizeAllergenFreeLine),
    substitutions: data.substitutions.map((sub) => ({
      original: sub.original,
      replacement: sanitizeAllergenFreeLine(sub.replacement),
      rationale: sanitizeAllergenFreeLine(sub.rationale),
    })),
    foodScienceNotes: data.foodScienceNotes.map(sanitizeAllergenFreeLine),
    expectedResult: sanitizeAllergenFreeLine(data.expectedResult),
  };
}

function withAllergenFreeDisclaimer(notes: string[]): string[] {
  if (notes.some((note) => note.includes(ALLERGEN_FREE_DISCLAIMER.slice(0, 40)))) {
    return notes;
  }
  return [ALLERGEN_FREE_DISCLAIMER, ...notes];
}

function withHighProteinRationale(notes: string[]): string[] {
  if (
    notes.some((note) =>
      note.toLowerCase().includes("protein rationale")
    )
  ) {
    return notes;
  }
  return [HIGH_PROTEIN_RATIONALE_NOTE, ...notes];
}

function withLowCalorieRationale(notes: string[]): string[] {
  if (notes.some((note) => note.toLowerCase().includes("calorie rationale"))) {
    return notes;
  }
  return [LOW_CALORIE_RATIONALE_NOTE, ...notes];
}

export function apiResponseToFormulationResult(
  data: ReformulateApiResponse,
  originalRecipe: string,
  goal: OptimizationGoal,
  source: "openai" | "fallback" = "openai"
): FormulationResult {
  const goalLabel =
    OPTIMIZATION_GOALS.find((g) => g.value === goal)?.label ?? goal;

  const normalized =
    goal === "allergen-free" ? sanitizeAllergenFreeResponse(data) : data;

  const foodScienceNotes =
    goal === "allergen-free"
      ? withAllergenFreeDisclaimer(normalized.foodScienceNotes)
      : goal === "high-protein"
        ? withHighProteinRationale(normalized.foodScienceNotes)
        : goal === "low-calorie"
          ? withLowCalorieRationale(normalized.foodScienceNotes)
          : normalized.foodScienceNotes;

  return {
    recipeName: normalized.title || "Your Recipe",
    goalLabel,
    reformulatedIngredients: normalized.ingredients,
    updatedMethod: normalized.method,
    keySubstitutions: normalized.substitutions,
    foodScienceNotes,
    expectedResult: normalized.expectedResult,
    originalRecipeReference: originalRecipe,
    source,
  };
}
