export type RecipeKind = "pancake" | "muffin" | "cookie" | "pasta" | "bowl" | "general";

export interface ParsedIngredient {
  raw: string;
  quantity: string;
  description: string;
}

export interface ParsedRecipe {
  title: string;
  kind: RecipeKind;
  ingredients: ParsedIngredient[];
  originalLines: string[];
}

const METHOD_LINE =
  /^(preheat|bake|mix|stir|whisk|combine|fold|heat|cool|serve|line|grease|pour|flip|cook|drain|simmer|boil|\d+\.)/i;

const INGREDIENT_KEYWORDS =
  /\b(flour|sugar|egg|milk|butter|salt|vanilla|baking|blueberr|chocolate|buttermilk|oil|honey|pasta|noodle|spaghetti|penne|fettuccine|linguine|garlic|cheese|cream|water|yeast|cinnamon|tomato|onion|basil|seasoning|pepper|parmesan|oregano|thyme|paprika|rice|beef|turkey|avocado|salsa|beans|corn|cilantro|cheddar|sour)\b/i;

export function detectRecipeKind(text: string, title: string): RecipeKind {
  const combined = `${title} ${text}`.toLowerCase();
  if (/\bpancake/.test(combined)) return "pancake";
  if (/\bmuffin/.test(combined)) return "muffin";
  if (/\b(cookie|cookies|biscuit|biscuits|brownie|brownies)\b/.test(combined)) return "cookie";
  if (
    /\b(pasta|spaghetti|penne|fettuccine|linguine|noodle|macaroni|ravioli)\b/.test(
      combined
    )
  )
    return "pasta";
  if (
    /\b(taco bowl|burrito bowl|rice bowl|grain bowl)\b/.test(combined) ||
    (/\bbowl\b/.test(combined) &&
      /\b(rice|beans|salsa|turkey|ground beef)\b/.test(combined))
  )
    return "bowl";
  return "general";
}

export function extractRecipeTitle(recipe: string): string {
  const lines = recipe.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines[0] ?? "";
  if (first.length > 0 && first.length < 80 && !looksLikeIngredient(first)) {
    return first.replace(/^#+\s*/, "");
  }
  return "Your Recipe";
}

function stripListPrefix(line: string): string {
  return line.trim().replace(/^[-*•–]\s+/, "");
}

function looksLikeIngredient(line: string): boolean {
  const trimmed = line.trim();
  if (/^[\d½¼¾⅓⅔⅛]/.test(trimmed)) return true;
  if (/^(salt|pepper|fresh)\b/i.test(trimmed)) return true;
  return false;
}

function looksLikeIngredientLine(line: string): boolean {
  const trimmed = line.trim();
  if (looksLikeIngredient(trimmed)) return true;
  return INGREDIENT_KEYWORDS.test(trimmed);
}

function parseQuantityAndDescription(line: string): { quantity: string; description: string } {
  const trimmed = stripListPrefix(line);
  const match = trimmed.match(
    /^((?:[½¼¾⅓⅔⅛⅜⅝⅞]|\d+[\d\s./½¼¾⅓⅔⅛⅜⅝⅞-]*)(?:\s*(?:cups?|tbsp|tsp|teaspoons?|tablespoons?|oz|ounces?|lbs?|pounds?|grams?|ml|large|small|medium|sticks?|cloves?))*\s*)(.+)$/i
  );
  if (match && match[2].trim().length > 0) {
    return { quantity: match[1].trim(), description: match[2].trim() };
  }
  return { quantity: "", description: trimmed };
}

export function parseRecipe(recipe: string): ParsedRecipe {
  const trimmed = recipe.trim();
  const title = extractRecipeTitle(trimmed);
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

  const ingredientLines: string[] = [];
  let pastTitle = false;

  for (const line of lines) {
    if (!pastTitle && line === title) {
      pastTitle = true;
      continue;
    }
    if (METHOD_LINE.test(line)) continue;
    const ingredientLine = stripListPrefix(line);
    if (looksLikeIngredientLine(ingredientLine)) {
      ingredientLines.push(ingredientLine);
    }
  }

  const ingredients = ingredientLines.map((raw) => {
    const { quantity, description } = parseQuantityAndDescription(raw);
    return { raw, quantity, description };
  });

  const kind = detectRecipeKind(trimmed, title);

  return {
    title,
    kind,
    ingredients,
    originalLines: lines,
  };
}

export function countEggs(recipe: ParsedRecipe): number {
  let total = 0;
  for (const ing of recipe.ingredients) {
    const text = `${ing.quantity} ${ing.description}`.toLowerCase();
    const match = text.match(
      /(\d+[\d\s./½¼¾⅓⅔]*)\s*(?:large\s+|medium\s+|small\s+)?eggs?/
    );
    if (match) {
      const n = parseQuantityNumber(match[1]);
      total += n;
    } else if (/\beggs?\b/.test(text) && !/\begg\s+(white|yolk)/.test(text)) {
      total += 1;
    }
  }
  return total;
}

export function parseQuantityNumber(qty: string): number {
  const map: Record<string, number> = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75,
    "⅓": 0.33,
    "⅔": 0.67,
    "⅛": 0.125,
  };
  let s = qty.trim();
  for (const [char, val] of Object.entries(map)) {
    s = s.replace(new RegExp(char, "g"), ` ${val} `);
  }
  if (s.includes("-")) {
    const parts = s.split("-").map((p) => parseFloat(p.trim()));
    return parts.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  }
  const parts = s.split(/\s+/).filter(Boolean);
  let sum = 0;
  for (const p of parts) {
    const n = parseFloat(p);
    if (Number.isFinite(n)) sum += n;
  }
  return sum || 1;
}

export function hasIngredient(
  recipe: ParsedRecipe,
  patterns: RegExp[]
): boolean {
  return recipe.ingredients.some((ing) => {
    const text = `${ing.quantity} ${ing.description}`.toLowerCase();
    return patterns.some((p) => p.test(text));
  });
}

export function findIngredient(
  recipe: ParsedRecipe,
  patterns: RegExp[]
): ParsedIngredient | undefined {
  return recipe.ingredients.find((ing) => {
    const text = `${ing.quantity} ${ing.description}`.toLowerCase();
    return patterns.some((p) => p.test(text));
  });
}

export function formatIngredient(ing: ParsedIngredient): string {
  if (ing.quantity) return `${ing.quantity} ${ing.description}`;
  return ing.description;
}

export function findOriginalLine(
  lines: string[],
  pattern: RegExp
): string | undefined {
  return lines.find((line) => pattern.test(line));
}

export function normalizeMethodLine(line: string): string {
  const stripped = line.trim().replace(/^\d+\.\s*/, "");
  return stripped.endsWith(".") ? stripped : `${stripped}.`;
}

export function defaultIngredientsForKind(kind: RecipeKind): ParsedIngredient[] {
  switch (kind) {
    case "pancake":
      return [
        { raw: "1½ cups all-purpose flour", quantity: "1½ cups", description: "all-purpose flour" },
        { raw: "3 tbsp sugar", quantity: "3 tbsp", description: "sugar" },
        { raw: "2 tsp baking powder", quantity: "2 tsp", description: "baking powder" },
        { raw: "½ tsp salt", quantity: "½ tsp", description: "salt" },
        { raw: "1¼ cups buttermilk", quantity: "1¼ cups", description: "buttermilk" },
        { raw: "2 tbsp butter, melted", quantity: "2 tbsp", description: "butter, melted" },
        { raw: "1 large egg", quantity: "1 large", description: "egg" },
        { raw: "1 tsp vanilla extract", quantity: "1 tsp", description: "vanilla extract" },
      ];
    case "muffin":
      return [
        { raw: "2 cups all-purpose flour", quantity: "2 cups", description: "all-purpose flour" },
        { raw: "½ cup granulated sugar", quantity: "½ cup", description: "granulated sugar" },
        { raw: "2 tsp baking powder", quantity: "2 tsp", description: "baking powder" },
        { raw: "½ tsp salt", quantity: "½ tsp", description: "salt" },
        { raw: "½ cup butter, melted", quantity: "½ cup", description: "butter, melted" },
        { raw: "2 large eggs", quantity: "2 large", description: "eggs" },
        { raw: "¾ cup whole milk", quantity: "¾ cup", description: "whole milk" },
        { raw: "1 tsp vanilla extract", quantity: "1 tsp", description: "vanilla extract" },
      ];
    case "cookie":
      return [
        { raw: "2¼ cups all-purpose flour", quantity: "2¼ cups", description: "all-purpose flour" },
        { raw: "1 tsp baking soda", quantity: "1 tsp", description: "baking soda" },
        { raw: "1 cup butter, softened", quantity: "1 cup", description: "butter, softened" },
        { raw: "¾ cup granulated sugar", quantity: "¾ cup", description: "granulated sugar" },
        { raw: "2 large eggs", quantity: "2 large", description: "eggs" },
        { raw: "2 cups chocolate chips", quantity: "2 cups", description: "chocolate chips" },
        { raw: "1 tsp vanilla extract", quantity: "1 tsp", description: "vanilla extract" },
      ];
    case "pasta":
      return [
        { raw: "12 oz pasta", quantity: "12 oz", description: "pasta" },
        { raw: "2 tbsp olive oil", quantity: "2 tbsp", description: "olive oil" },
        { raw: "3 cloves garlic, minced", quantity: "3 cloves", description: "garlic, minced" },
        { raw: "Salt and pepper to taste", quantity: "", description: "salt and pepper to taste" },
      ];
    default:
      return [
        { raw: "2 cups all-purpose flour", quantity: "2 cups", description: "all-purpose flour" },
        { raw: "½ cup sugar", quantity: "½ cup", description: "sugar" },
        { raw: "½ cup butter", quantity: "½ cup", description: "butter" },
        { raw: "2 eggs", quantity: "2", description: "eggs" },
        { raw: "½ cup milk", quantity: "½ cup", description: "milk" },
      ];
  }
}
