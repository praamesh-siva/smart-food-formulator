import type {
  FormulationResult,
  MissingOptionalIngredient,
  OptimizationGoal,
} from "./formulation-types";
import { DEFAULT_RECIPE_METADATA, OPTIMIZATION_GOALS } from "./formulation-types";
import { finalizeFoodScienceNotes } from "./food-science-notes";

function parsePantryLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function inferTitle(ingredients: string[]): string {
  const joined = ingredients.join(" ").toLowerCase();
  if (/\b(chicken|turkey|beef|pork|salmon|tofu)\b/.test(joined)) {
    return "Pantry Protein Bowl";
  }
  if (/\b(flour|sugar|egg|butter|milk)\b/.test(joined)) {
    return "Pantry Bake";
  }
  if (/\b(pasta|rice|noodle)\b/.test(joined)) {
    return "Pantry One-Pot Meal";
  }
  return "Recipe From Your Ingredients";
}

function goalLabelFor(goal: OptimizationGoal | null): string {
  if (!goal) return "Balanced recipe";
  return OPTIMIZATION_GOALS.find((g) => g.value === goal)?.label ?? goal;
}

function defaultMissingItems(ingredients: string[]): MissingOptionalIngredient[] {
  const joined = ingredients.join(" ").toLowerCase();
  const missing: MissingOptionalIngredient[] = [];

  if (!/\b(oil|butter|fat)\b/.test(joined)) {
    missing.push({
      ingredient: "Cooking fat (oil or butter)",
      substitute: "Use any neutral oil, olive oil, or melted butter if available",
    });
  }
  if (!/\b(salt|pepper|spice|garlic|onion|herb)\b/.test(joined)) {
    missing.push({
      ingredient: "Seasonings",
      substitute: "Salt, pepper, dried herbs, garlic powder, or any spices on hand",
    });
  }
  if (!/\b(egg|flour|baking powder|baking soda|leaven)\b/.test(joined) && /\b(flour|sugar)\b/.test(joined)) {
    missing.push({
      ingredient: "Leavening or binder",
      substitute: "Eggs, baking powder, or yogurt to help structure baked goods",
    });
  }

  return missing.slice(0, 4);
}

export function generatePlaceholderCreateFromIngredients(
  ingredientsText: string,
  restrictionsText: string,
  goal: OptimizationGoal | null,
  useOnlyMyIngredients = false
): FormulationResult {
  const pantry = parsePantryLines(ingredientsText);
  const title = inferTitle(pantry);
  const restrictions = restrictionsText.trim();
  const goalLabel = goalLabelFor(goal);

  const primary = pantry.slice(0, 6);
  const recipeIngredients = primary.length > 0 ? primary : ["Ingredients from your pantry list"];

  const method = [
    "Review available ingredients and prep anything that needs chopping, rinsing, or thawing.",
    "Heat a skillet or pot over medium heat with a small amount of oil if you have it.",
    `Combine ${recipeIngredients.slice(0, 3).join(", ")}${recipeIngredients.length > 3 ? ", and remaining pantry items" : ""} in the pan.`,
    "Cook until proteins are fully done and vegetables are tender, seasoning to taste.",
    "Adjust consistency with a splash of water, broth, or milk if the mixture looks dry.",
    "Serve warm and garnish with any fresh herbs or citrus you have on hand.",
  ];

  const missingOptionalIngredients = useOnlyMyIngredients
    ? []
    : defaultMissingItems(pantry);

  const notes: string[] = [
    `${title}: built primarily from ingredients you listed.`,
  ];

  if (useOnlyMyIngredients) {
    notes.push(
      "Strict mode: recipe uses only your listed ingredients (water allowed if needed)—no optional add-ons suggested."
    );
  }

  if (restrictions) {
    notes.push(`Dietary restrictions applied: ${restrictions}.`);
  }

  if (!useOnlyMyIngredients) {
    notes.push(
      missingOptionalIngredients.length > 0
        ? "Suggested optional ingredients below would improve flavor or texture but are not strictly required."
        : "Your ingredient list covers the basics for a workable recipe."
    );
  }

  if (goal === "vegan") {
    notes.push("Vegan goal: avoid animal products not listed and favor plant proteins and oils.");
  } else if (goal === "high-protein") {
    notes.push("High-protein goal: prioritize eggs, dairy, legumes, poultry, or tofu from your list as the main protein.");
  } else if (goal === "low-calorie") {
    notes.push("Low-calorie goal: minimize added fats and sugars; lean on vegetables, lean proteins, and herbs for flavor.");
  }

  return {
    recipeName: title,
    goalLabel,
    reformulatedIngredients: recipeIngredients,
    updatedMethod: method,
    keySubstitutions: [],
    foodScienceNotes: finalizeFoodScienceNotes(notes, goal),
    expectedResult: `A practical ${title.toLowerCase()} using what you have on hand. Texture and flavor depend on your specific pantry items—season gradually and adjust moisture as needed.`,
    originalRecipeReference: ingredientsText.trim() || null,
    restrictionsReference: restrictions || null,
    missingOptionalIngredients,
    mode: "create-from-ingredients",
    source: "fallback",
    recipeMetadata: { ...DEFAULT_RECIPE_METADATA },
  };
}
