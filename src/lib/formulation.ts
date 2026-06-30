import {
  generateExpectedResult,
  generateFoodScienceNotes,
  generateMethod,
  transformIngredients,
} from "./formulation-engine";
import {
  defaultIngredientsForKind,
  detectRecipeKind,
  extractRecipeTitle,
  parseRecipe,
} from "./recipe-parser";
import type { FormulationResult, OptimizationGoal } from "./formulation-types";
import { ALLERGEN_FREE_DISCLAIMER, HIGH_PROTEIN_RATIONALE_NOTE, OPTIMIZATION_GOALS } from "./formulation-types";

export type {
  ConstraintInfo,
  FormulationResult,
  OptimizationGoal,
  Substitution,
} from "./formulation-types";
export { CONSTRAINT_INFO, OPTIMIZATION_GOALS, ALLERGEN_FREE_DISCLAIMER } from "./formulation-types";

export function generatePlaceholderFormulation(
  originalRecipe: string,
  goal: OptimizationGoal
): FormulationResult {
  const trimmed = originalRecipe.trim();
  const originalRecipeReference = trimmed.length > 0 ? trimmed : null;
  const goalLabel =
    OPTIMIZATION_GOALS.find((g) => g.value === goal)?.label ?? goal;

  let parsed = parseRecipe(trimmed);

  if (parsed.ingredients.length === 0) {
    const kind = detectRecipeKind(trimmed, parsed.title);
    parsed = {
      ...parsed,
      kind,
      ingredients: defaultIngredientsForKind(kind),
    };
  }

  const recipeName =
    trimmed.length > 0 ? extractRecipeTitle(trimmed) : parsed.title;

  const { ingredients, substitutions } = transformIngredients(parsed, goal);
  const updatedMethod = generateMethod(parsed, goal);
  const foodScienceNotes = withHighProteinRationale(
    withAllergenFreeDisclaimer(
      generateFoodScienceNotes(parsed, goal, substitutions),
      goal
    ),
    goal
  );
  const expectedResult = generateExpectedResult(parsed, goal);

  return {
    recipeName,
    goalLabel,
    reformulatedIngredients: ingredients,
    updatedMethod,
    keySubstitutions: substitutions,
    foodScienceNotes,
    expectedResult,
    originalRecipeReference,
  };
}

function withAllergenFreeDisclaimer(
  notes: string[],
  goal: OptimizationGoal
): string[] {
  if (goal !== "allergen-free") return notes;
  if (notes.some((note) => note.includes(ALLERGEN_FREE_DISCLAIMER.slice(0, 40)))) {
    return notes;
  }
  return [ALLERGEN_FREE_DISCLAIMER, ...notes];
}

function withHighProteinRationale(
  notes: string[],
  goal: OptimizationGoal
): string[] {
  if (goal !== "high-protein") return notes;
  if (notes.some((note) => note.toLowerCase().includes("protein rationale"))) {
    return notes;
  }
  return [HIGH_PROTEIN_RATIONALE_NOTE, ...notes];
}
