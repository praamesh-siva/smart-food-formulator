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
import { DEFAULT_RECIPE_METADATA, OPTIMIZATION_GOALS } from "./formulation-types";
import { finalizeFoodScienceNotes } from "./food-science-notes";

export type {
  AppMode,
  ConstraintInfo,
  FormulationResult,
  MissingOptionalIngredient,
  OptimizationGoal,
  Substitution,
} from "./formulation-types";
export { CONSTRAINT_INFO, OPTIMIZATION_GOALS, ALLERGEN_FREE_DISCLAIMER } from "./formulation-types";
export { generatePlaceholderCreateFromIngredients } from "./create-from-ingredients";

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
  const foodScienceNotes = finalizeFoodScienceNotes(
    generateFoodScienceNotes(parsed, goal, substitutions),
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
    recipeMetadata: { ...DEFAULT_RECIPE_METADATA },
  };
}
