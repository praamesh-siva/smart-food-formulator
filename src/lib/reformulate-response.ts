import { generatePlaceholderCreateFromIngredients } from "./create-from-ingredients";
import { generatePlaceholderFormulation } from "./formulation";
import { finalizeFoodScienceNotes } from "./food-science-notes";
import type {
  AppMode,
  FormulationResult,
  MissingOptionalIngredient,
  OptimizationGoal,
  RecipeMetadata,
  Substitution,
} from "./formulation-types";
import { DEFAULT_RECIPE_METADATA, OPTIMIZATION_GOALS } from "./formulation-types";

export interface ReformulateApiResponse {
  title: string;
  ingredients: string[];
  method: string[];
  substitutions: Substitution[];
  foodScienceNotes: string[];
  expectedResult: string;
  missingOptionalIngredients?: MissingOptionalIngredient[];
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
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

function ensureMissingOptionalIngredients(
  value: unknown
): MissingOptionalIngredient[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is MissingOptionalIngredient =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as MissingOptionalIngredient).ingredient === "string" &&
        typeof (item as MissingOptionalIngredient).substitute === "string"
    )
    .map((item) => ({
      ingredient: item.ingredient,
      substitute: item.substitute,
    }));
}

function parseRecipeMetadata(data: Record<string, unknown>): RecipeMetadata {
  const pick = (keys: string[], fallback: string) => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return fallback;
  };

  return {
    servings: pick(["servings", "servingSize", "serving_size"], DEFAULT_RECIPE_METADATA.servings),
    prepTime: pick(["prepTime", "prep_time", "preparationTime"], DEFAULT_RECIPE_METADATA.prepTime),
    cookTime: pick(["cookTime", "cook_time", "cookingTime"], DEFAULT_RECIPE_METADATA.cookTime),
    difficulty: pick(["difficulty", "skillLevel", "skill_level"], DEFAULT_RECIPE_METADATA.difficulty),
  };
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
  const missingOptionalIngredients = ensureMissingOptionalIngredients(
    data.missingOptionalIngredients ?? data.missing_optional_ingredients
  );

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
    ...parseRecipeMetadata(data),
    ...(missingOptionalIngredients.length > 0
      ? { missingOptionalIngredients }
      : {}),
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
    return "AI formulation isn't available right now (API quota exceeded). Showing placeholder formulation.";
  }
  if (lower.includes("invalid_api_key") || lower.includes("incorrect api key")) {
    return "AI formulation isn't available (invalid API key). Showing placeholder formulation.";
  }
  if (lower.includes("rate limit")) {
    return "AI formulation is busy right now. Showing placeholder formulation.";
  }
  if (lower.includes("not configured")) {
    return raw;
  }
  return "AI formulation couldn't be completed. Showing placeholder formulation.";
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
  const meta = result.recipeMetadata ?? DEFAULT_RECIPE_METADATA;
  return {
    title: result.recipeName,
    ingredients: result.reformulatedIngredients,
    method: result.updatedMethod,
    substitutions: result.keySubstitutions,
    foodScienceNotes: result.foodScienceNotes,
    expectedResult: result.expectedResult,
    servings: meta.servings,
    prepTime: meta.prepTime,
    cookTime: meta.cookTime,
    difficulty: meta.difficulty,
    ...(result.missingOptionalIngredients?.length
      ? { missingOptionalIngredients: result.missingOptionalIngredients }
      : {}),
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

export function generateFallbackCreateApiResponse(
  ingredients: string,
  restrictions: string,
  goal: OptimizationGoal | null,
  useOnlyMyIngredients = false
): ReformulateApiResponse {
  return formulationResultToApiResponse(
    generatePlaceholderCreateFromIngredients(
      ingredients,
      restrictions,
      goal,
      useOnlyMyIngredients
    )
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
    missingOptionalIngredients: data.missingOptionalIngredients?.map((item) => ({
      ingredient: sanitizeAllergenFreeLine(item.ingredient),
      substitute: sanitizeAllergenFreeLine(item.substitute),
    })),
  };
}

function goalLabelFor(goal: OptimizationGoal | null): string {
  if (!goal) return "Balanced recipe";
  return OPTIMIZATION_GOALS.find((g) => g.value === goal)?.label ?? goal;
}

function recipeMetadataFromResponse(data: ReformulateApiResponse): RecipeMetadata {
  return {
    servings: data.servings ?? DEFAULT_RECIPE_METADATA.servings,
    prepTime: data.prepTime ?? DEFAULT_RECIPE_METADATA.prepTime,
    cookTime: data.cookTime ?? DEFAULT_RECIPE_METADATA.cookTime,
    difficulty: data.difficulty ?? DEFAULT_RECIPE_METADATA.difficulty,
  };
}

export function apiResponseToFormulationResult(
  data: ReformulateApiResponse,
  originalReference: string,
  goal: OptimizationGoal | null,
  source: "openai" | "fallback" = "openai",
  mode: AppMode = "reformulate",
  restrictionsReference: string | null = null
): FormulationResult {
  const goalLabel = goalLabelFor(goal);

  const normalized =
    goal === "allergen-free" ? sanitizeAllergenFreeResponse(data) : data;

  const foodScienceNotes = finalizeFoodScienceNotes(
    normalized.foodScienceNotes,
    goal
  );

  return {
    recipeName: normalized.title || "Your Recipe",
    goalLabel,
    reformulatedIngredients: normalized.ingredients,
    updatedMethod: normalized.method,
    keySubstitutions: normalized.substitutions,
    foodScienceNotes,
    expectedResult: normalized.expectedResult,
    originalRecipeReference: originalReference || null,
    restrictionsReference,
    missingOptionalIngredients: normalized.missingOptionalIngredients,
    recipeMetadata: recipeMetadataFromResponse(normalized),
    mode,
    source,
  };
}
