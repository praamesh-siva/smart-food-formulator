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
import { OPTIMIZATION_GOALS } from "./formulation-types";

export type {
  ConstraintInfo,
  FormulationResult,
  OptimizationGoal,
  Substitution,
} from "./formulation-types";
export { CONSTRAINT_INFO, OPTIMIZATION_GOALS } from "./formulation-types";

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
  const foodScienceNotes = generateFoodScienceNotes(
    parsed,
    goal,
    substitutions
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
