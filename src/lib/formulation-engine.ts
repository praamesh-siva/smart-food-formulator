import type { OptimizationGoal, Substitution } from "./formulation-types";
import {
  countEggs,
  findOriginalLine,
  formatIngredient,
  findIngredient,
  hasIngredient,
  normalizeMethodLine,
  parseQuantityNumber,
  type ParsedIngredient,
  type ParsedRecipe,
  type RecipeKind,
} from "./recipe-parser";

interface TransformResult {
  ingredients: string[];
  substitutions: Substitution[];
}

function veganButterLine(qty: string, desc: string): string {
  const isMelted = /\bmelted\b/i.test(desc);
  const isSoftened = /\bsoftened\b/i.test(desc);
  const replacement = isSoftened
    ? "vegan butter, softened"
    : isMelted
      ? "melted vegan butter or neutral oil"
      : "vegan butter or neutral oil";
  return qty ? `${qty} ${replacement}` : replacement;
}

function allergenFreeButterLine(qty: string, desc: string): string {
  const isSoftened = /\bsoftened\b/i.test(desc);
  const isMelted = /\bmelted\b/i.test(desc);
  const replacement = isSoftened
    ? "dairy-free buttery spread, softened"
    : "neutral oil (sunflower or avocado)";
  if (isMelted && !isSoftened) {
    return qty ? `${qty} neutral oil (sunflower or avocado)` : "neutral oil (sunflower or avocado)";
  }
  return qty ? `${qty} ${replacement}` : replacement;
}

function creamFatLabel(recipe: ParsedRecipe, goal: OptimizationGoal): string {
  const butterIng = findIngredient(recipe, [/butter/]);
  const desc = butterIng?.description ?? "";
  const softened = /\bsoftened\b/i.test(desc);
  const melted = /\bmelted\b/i.test(desc);

  if (goal === "vegan") {
    if (softened) return "vegan butter, softened";
    if (melted) return "melted vegan butter or neutral oil";
    return "vegan butter or neutral oil";
  }
  if (goal === "allergen-free") {
    if (softened) return "dairy-free buttery spread, softened";
    return "neutral oil (sunflower or avocado)";
  }
  if (goal === "cost-optimization") {
    if (softened) return "vegetable shortening, softened";
    if (melted) return "vegetable oil, melted";
    return "vegetable oil";
  }
  if (softened) return "butter, softened";
  if (melted) return "melted butter";
  return "butter";
}

function methodLineFromOriginal(
  lines: string[],
  pattern: RegExp,
  fallback: string
): string {
  const original = findOriginalLine(lines, pattern);
  return normalizeMethodLine(original ?? fallback);
}

function pushSub(
  subs: Substitution[],
  original: string,
  replacement: string,
  rationale: string
) {
  if (original.toLowerCase() !== replacement.toLowerCase()) {
    subs.push({ original, replacement, rationale });
  }
}

function descOf(ing: ParsedIngredient): string {
  return `${ing.quantity} ${ing.description}`.toLowerCase();
}

function halveQuantityText(qty: string): string {
  const n = parseQuantityNumber(qty);
  if (n <= 0.5) return "half of original amount";
  if (qty.includes("cup")) {
    if (n === 1.5) return "¾ cup";
    if (n === 1) return "½ cup";
    if (n === 0.5) return "¼ cup";
    if (n === 0.75) return "⅜ cup";
    if (n === 2) return "1 cup";
    if (n === 3) return "1½ cups";
  }
  if (qty.includes("tbsp")) {
    if (n === 3) return "1½ tbsp";
    if (n === 2) return "1 tbsp";
  }
  return `half of the original (${qty.trim()})`;
}

function flaxEggLine(eggCount: number): string {
  if (eggCount <= 1) {
    return "1 flax egg: 1 tbsp ground flaxseed + 3 tbsp water";
  }
  return `${eggCount} flax eggs: ${eggCount} tbsp ground flaxseed + ${eggCount * 3} tbsp water`;
}

function aquafabaText(eggCount: number): string {
  const tbsp = Math.max(2, eggCount * 2);
  return `${tbsp} tbsp aquafaba (whipped to soft peaks)`;
}

function isEggLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return /\beggs?\b/.test(d) && !/\b(white|yolk|plant|flax)\b/.test(d);
}

function isButterLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return /\bbutter\b/.test(d) && !/\b(plant|vegan|nut)\b/.test(d);
}

function isDairyMilkLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  if (/\b(substitute|alternative)\b/.test(d)) return false;
  if (/\bheavy cream\b/.test(d)) return false;
  if (/\bsour cream\b/.test(d)) return false;
  return (
    /\b(whole milk|milk|buttermilk|skim milk|cream)\b/.test(d) &&
    !/\b(coconut|oat|soy|almond|plant|cashew)\b/.test(d)
  );
}

function isSourCreamLine(ing: ParsedIngredient): boolean {
  return /\bsour cream\b/.test(descOf(ing));
}

function isRiceLine(ing: ParsedIngredient): boolean {
  return /\b(rice|cauliflower rice)\b/.test(descOf(ing));
}

function isGroundMeatLine(ing: ParsedIngredient): boolean {
  return /\b(ground beef|ground turkey|ground pork|ground chicken)\b/.test(descOf(ing));
}

function isAvocadoLine(ing: ParsedIngredient): boolean {
  return /\bavocado\b/.test(descOf(ing));
}

function isHeavyCreamLine(ing: ParsedIngredient): boolean {
  return /\bheavy cream\b/.test(descOf(ing));
}

function isParmesanLine(ing: ParsedIngredient): boolean {
  return /\bparmesan\b/.test(descOf(ing));
}

function isFlourLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return /\bflour\b/.test(d) && !/\b(almond|coconut|protein)\b/.test(d);
}

function isSugarLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return (
    /\b(granulated sugar|sugar|brown sugar)\b/.test(d) &&
    !/\b(powder|erythritol|substitute)\b/.test(d)
  );
}

function isHoneyLine(ing: ParsedIngredient): boolean {
  return /\bhoney\b/.test(descOf(ing));
}

function isChocolateChipLine(ing: ParsedIngredient): boolean {
  return /\bchocolate chips?\b/.test(descOf(ing));
}

function isCheeseLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return /\b(parmesan|cheese|mozzarella|ricotta)\b/.test(d) && !/\bvegan\b/.test(d);
}

function isVanillaLine(ing: ParsedIngredient): boolean {
  return /\bvanilla\b/.test(descOf(ing));
}

function isEggPastaLine(ing: ParsedIngredient): boolean {
  const d = descOf(ing);
  return /\b(pasta|spaghetti|noodle|penne|fettuccine|linguine)\b/.test(d);
}

function transformIngredient(
  ing: ParsedIngredient,
  goal: OptimizationGoal,
  eggCount: number,
  recipeKind: RecipeKind
): { line: string | null; subs: Substitution[] } {
  const subs: Substitution[] = [];
  const raw = formatIngredient(ing);
  const qty = ing.quantity;
  const desc = ing.description;

  if (recipeKind === "pasta" && goal === "vegan") {
    if (isHeavyCreamLine(ing)) {
      const line = `${qty} oat cream or cashew cream`;
      pushSub(
        subs,
        raw,
        line,
        "Plant-based cream replaces dairy heavy cream for richness."
      );
      return { line, subs };
    }
    if (isParmesanLine(ing)) {
      const line = `${qty} vegan Parmesan or nutritional yeast`;
      pushSub(
        subs,
        raw,
        line,
        "Plant-based alternative delivers savory depth without dairy."
      );
      return { line, subs };
    }
    if (isEggPastaLine(ing)) {
      return { line: raw, subs };
    }
    return { line: raw, subs };
  }

  if (recipeKind === "bowl" && goal === "low-calorie") {
    if (isRiceLine(ing)) {
      const line = "1/2 cup cooked rice per bowl (or cauliflower rice)";
      pushSub(
        subs,
        raw,
        line,
        "Smaller rice portion per bowl lowers calories while keeping the base."
      );
      return { line, subs };
    }
    if (isGroundMeatLine(ing)) {
      const line = qty ? `${qty} lean ground turkey` : "lean ground turkey";
      if (/\bground beef\b/.test(descOf(ing)) || !/\blean\b/.test(descOf(ing))) {
        pushSub(subs, raw, line, "Lean turkey reduces fat calories vs. higher-fat ground meats.");
        return { line, subs };
      }
      return { line: raw, subs };
    }
    if (isCheeseLine(ing)) {
      const line = `1/4 cup ${desc}`;
      pushSub(subs, raw, line, "Reduced cheese portion cuts calories while keeping flavor.");
      return { line, subs };
    }
    if (isSourCreamLine(ing)) {
      const line = qty
        ? `${qty} plain Greek yogurt or light sour cream`
        : "plain Greek yogurt or light sour cream";
      pushSub(
        subs,
        raw,
        line,
        "Greek yogurt or light sour cream replaces full-fat sour cream with fewer calories."
      );
      return { line, subs };
    }
    if (isAvocadoLine(ing)) {
      const line = "1/4 avocado, sliced (or omit)";
      pushSub(
        subs,
        raw,
        line,
        "A smaller avocado portion—or skipping it—significantly lowers bowl calories."
      );
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isEggLine(ing)) {
    if (goal === "vegan") {
      const n = Math.max(1, Math.round(parseQuantityNumber(`${ing.quantity} ${ing.description}`)));
      const line = flaxEggLine(n);
      pushSub(subs, raw, line, "Gelled flax binds and adds moisture without animal protein.");
      return { line, subs };
    }
    if (goal === "allergen-free") {
      const n = Math.round(parseQuantityNumber(`${ing.quantity} ${ing.description}`)) || 1;
      const line = aquafabaText(n);
      pushSub(subs, raw, line, "Aquafaba replaces egg whites for lift and binding.");
      return { line, subs };
    }
    if (goal === "low-calorie") {
      const n = Math.round(parseQuantityNumber(`${ing.quantity} ${ing.description}`)) || 1;
      const line =
        n === 1
          ? "1 large egg white"
          : `${n} large egg whites`;
      pushSub(subs, raw, line, "Egg whites retain structure without yolk fat.");
      return { line, subs };
    }
    if (goal === "high-protein" && eggCount > 0) {
      const line = `${raw} + 1 additional egg white`;
      pushSub(subs, raw, line, "Extra albumin supports structure with added protein.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isButterLine(ing)) {
    if (goal === "vegan") {
      const line = veganButterLine(qty, desc);
      pushSub(subs, raw, line, "Same amount of plant-based fat replaces dairy butter.");
      return { line, subs };
    }
    if (goal === "allergen-free") {
      const line = allergenFreeButterLine(qty, desc);
      pushSub(subs, raw, line, "Removes dairy while maintaining fat content for texture.");
      return { line, subs };
    }
    if (goal === "cost-optimization") {
      const isSoftened = /\bsoftened\b/i.test(desc);
      const isMelted = /\bmelted\b/i.test(desc);
      const line = isSoftened
        ? `${qty} vegetable shortening, softened`
        : isMelted
          ? `${qty} vegetable oil, melted`
          : `${qty} vegetable oil`;
      pushSub(subs, raw, line, "Commodity oil lowers ingredient cost vs. butter.");
      return { line, subs };
    }
    if (goal === "low-calorie") {
      const modifiers = desc.includes(",") ? desc.split(",").slice(1).join(",").trim() : "";
      const modSuffix = modifiers ? ` (${modifiers})` : "";
      const line =
        parseQuantityNumber(qty) >= 0.25
          ? `2 tbsp olive oil + 2 tbsp unsweetened applesauce${modSuffix}`
          : `${qty} olive oil${modSuffix}`;
      pushSub(subs, raw, line, "Reduces saturated fat calories while keeping moisture.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isHeavyCreamLine(ing)) {
    if (goal === "vegan") {
      const line = `${qty} oat cream or cashew cream`;
      pushSub(
        subs,
        raw,
        line,
        "Plant-based cream replaces dairy heavy cream for richness."
      );
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isDairyMilkLine(ing)) {
    if (goal === "vegan") {
      const line = `${qty} oat milk or soy milk`;
      pushSub(subs, raw, line, "Neutral non-dairy milk replaces dairy without off-flavors.");
      return { line, subs };
    }
    if (goal === "allergen-free") {
      const line = `${qty} oat milk (certified allergen-free)`;
      pushSub(subs, raw, line, "Dairy-free milk substitute with mild flavor and good emulsification.");
      return { line, subs };
    }
    if (goal === "cost-optimization" && /\bbuttermilk\b/.test(descOf(ing))) {
      const line = `${qty} whole milk + 1 tbsp lemon juice (buttermilk substitute)`;
      pushSub(subs, raw, line, "Acidified milk mimics buttermilk at lower cost.");
      return { line, subs };
    }
    if (goal === "low-calorie") {
      const line = `${qty.replace(/whole|full-fat/gi, "").trim() || qty} skim milk`;
      pushSub(subs, raw, line, "Skim milk lowers fat calories in the wet mix.");
      return { line, subs };
    }
    if (goal === "high-protein" && /\bmilk\b/.test(descOf(ing))) {
      const line = `¼ cup Greek yogurt (2%) + ${qty} milk`;
      pushSub(subs, raw, line, "Greek yogurt adds protein and moisture for a higher-protein batter.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isHoneyLine(ing)) {
    if (goal === "vegan") {
      const line = `${qty} maple syrup`;
      pushSub(subs, raw, line, "Maple syrup replaces honey as a plant-based sweetener.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isFlourLine(ing)) {
    if (goal === "allergen-free") {
      const line = `${qty} gluten-free 1:1 baking flour`;
      pushSub(subs, raw, line, "Certified gluten-free flour removes wheat gluten from the formula.");
      return { line, subs };
    }
    if (goal === "high-protein") {
      const line = `${halveQuantityText(qty)} all-purpose flour + ${halveQuantityText(qty)} unflavored whey protein isolate`;
      pushSub(subs, raw, line, "Partial flour replacement with whey isolate boosts protein per serving.");
      return { line, subs };
    }
    if (goal === "low-calorie" && /\ball-purpose\b/.test(descOf(ing))) {
      const line = `${qty} whole wheat flour`;
      pushSub(subs, raw, line, "Whole wheat adds fiber for satiety with modest calorie trade-off.");
      return { line, subs };
    }
    if (goal === "cost-optimization") {
      const line = `${qty} enriched all-purpose flour`;
      pushSub(subs, raw, line, "Standard enriched flour is economical and consistent for production.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isSugarLine(ing)) {
    if (goal === "sugar-reduction") {
      const half = halveQuantityText(qty);
      const line = `${half} ${desc.replace(/granulated\s+/i, "")} + ${half} erythritol`;
      pushSub(subs, raw, line, "~50% sugar reduction with erythritol maintaining bulk and sweetness.");
      return { line, subs };
    }
    if (goal === "low-calorie") {
      const line = `${halveQuantityText(qty)} ${desc}`;
      pushSub(subs, raw, line, "Reduced sugar lowers caloric density of the finished product.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isChocolateChipLine(ing)) {
    if (goal === "vegan") {
      const line = `${qty} dairy-free chocolate chips`;
      pushSub(subs, raw, line, "Removes milk-based ingredients from the chocolate.");
      return { line, subs };
    }
    if (goal === "allergen-free") {
      const line = `${qty} dairy-free chocolate chips`;
      pushSub(subs, raw, line, "Removes milk-based ingredients from the chocolate.");
      return { line, subs };
    }
    if (goal === "cost-optimization") {
      const line = `${qty} standard-grade chocolate chips`;
      pushSub(subs, raw, line, "Standard chips reduce cost while maintaining melt and flavor.");
      return { line, subs };
    }
    if (goal === "low-calorie") {
      const line = `½ cup mini chocolate chips (use half the original volume)`;
      pushSub(subs, raw, line, "Smaller chips distribute flavor with less total chocolate mass.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isCheeseLine(ing)) {
    if (goal === "vegan") {
      const line = `${qty} vegan Parmesan or nutritional yeast`;
      pushSub(subs, raw, line, "Plant-based alternative delivers savory depth without dairy.");
      return { line, subs };
    }
    return { line: raw, subs };
  }

  if (isVanillaLine(ing) && goal === "cost-optimization") {
    const line = `${qty} imitation vanilla extract`;
    pushSub(subs, raw, line, "Imitation vanilla offers consistent potency at lower cost.");
    return { line, subs };
  }

  return { line: raw, subs };
}

export function transformIngredients(
  recipe: ParsedRecipe,
  goal: OptimizationGoal
): TransformResult {
  const eggCount = countEggs(recipe);
  const lines: string[] = [];
  const allSubs: Substitution[] = [];

  for (const ing of recipe.ingredients) {
    const { line, subs } = transformIngredient(
      ing,
      goal,
      eggCount,
      recipe.kind
    );
    if (line) lines.push(line);
    allSubs.push(...subs);
  }

  return { ingredients: lines, substitutions: dedupeSubs(allSubs) };
}

function dedupeSubs(subs: Substitution[]): Substitution[] {
  const seen = new Set<string>();
  return subs.filter((s) => {
    const key = s.original.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateMethod(
  recipe: ParsedRecipe,
  goal: OptimizationGoal
): string[] {
  switch (recipe.kind) {
    case "pancake":
      return pancakeMethod(recipe, goal);
    case "muffin":
      return muffinMethod(recipe, goal);
    case "cookie":
      return cookieMethod(recipe, goal);
    case "pasta":
      return pastaMethod(recipe, goal);
    case "bowl":
      return tacoBowlMethod(recipe, goal);
    default:
      return generalMethod(recipe, goal);
  }
}

function pancakeMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const hasBlueberries = hasIngredient(recipe, [/blueberr/]);
  const hasButtermilk = hasIngredient(recipe, [/buttermilk/]);
  const hasMilk = hasIngredient(recipe, [/milk|cream/]);
  const isVegan = goal === "vegan";

  const steps: string[] = [
    "In a large bowl, whisk together the flour, sugar, baking powder, and salt until evenly combined.",
  ];

  if (isVegan) {
    const wetParts: string[] = [];
    if (hasButtermilk || hasMilk) wetParts.push("oat milk or soy milk");
    wetParts.push("flax egg", "vegan butter or neutral oil");
    if (hasIngredient(recipe, [/vanilla/])) wetParts.push("vanilla");
    steps.push(
      `Prepare the flax egg and let it gel for 5–10 minutes. In a separate bowl, whisk the ${wetParts.join(", ")} until smooth.`
    );
  } else if (hasButtermilk && goal !== "allergen-free") {
    steps.push(
      "In a separate bowl, whisk the buttermilk, egg, melted butter, and vanilla until combined."
    );
  } else {
    steps.push(
      "In a separate bowl, whisk the milk, egg (or substitute), melted fat, and vanilla until smooth."
    );
  }

  steps.push(
    "Pour the wet ingredients into the dry ingredients and stir with a spatula until just combined. A few small lumps are fine—do not over-mix or the pancakes will be tough."
  );

  if (hasBlueberries) {
    steps.push(
      "Gently fold in the blueberries so they are distributed evenly without crushing."
    );
  }

  steps.push(
    "Rest the batter for 5–10 minutes while the griddle preheats; this hydrates the flour for a more tender pancake.",
    "Heat a griddle or non-stick skillet over medium heat and lightly grease with oil or butter.",
    "Pour about ¼ cup of batter per pancake onto the hot surface.",
    "Cook until bubbles form across the surface and the edges look set, about 2–3 minutes. Flip carefully and cook the second side for 1–2 minutes until golden brown.",
    "Serve immediately while warm."
  );

  return steps;
}

function muffinPreheatStep(recipe: ParsedRecipe): string {
  const original = findOriginalLine(recipe.originalLines, /^preheat/i);
  if (original) {
    const withPan = findOriginalLine(recipe.originalLines, /muffin tin|muffin pan|paper liners/i);
    if (withPan && !original.toLowerCase().includes("muffin")) {
      return normalizeMethodLine(`${original}. ${withPan}`);
    }
    return normalizeMethodLine(original);
  }
  return "Preheat oven to 350°F (175°C). Line a 12-cup muffin tin with paper liners or grease lightly.";
}

function muffinBakeStep(recipe: ParsedRecipe): string {
  const original = findOriginalLine(recipe.originalLines, /\bbake\b/i);
  if (original) return normalizeMethodLine(original);
  return "Bake 18–22 minutes until a toothpick inserted in the center comes out clean.";
}

function muffinMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const hasBananas = hasIngredient(recipe, [/banana/]);
  const hasBlueberries = hasIngredient(recipe, [/blueberr/]);
  const hasChocolateChips = hasIngredient(recipe, [/chocolate chip/]);
  const hasBakingSoda = hasIngredient(recipe, [/baking soda/]);
  const hasBakingPowder = hasIngredient(recipe, [/baking powder/]);
  const hasMilk = hasIngredient(recipe, [/milk|buttermilk|cream/]);
  const hasEggs = countEggs(recipe) > 0;
  const hasButter = hasIngredient(recipe, [/butter/]);
  const hasSugar = hasIngredient(recipe, [/sugar/]);
  const hasVanilla = hasIngredient(recipe, [/vanilla/]);
  const hasFlour = hasIngredient(recipe, [/flour/]);
  const hasSalt = hasIngredient(recipe, [/\bsalt\b/]);

  const steps: string[] = [muffinPreheatStep(recipe)];

  const dryItems: string[] = [];
  if (hasFlour) dryItems.push("flour");
  if (hasBakingSoda) dryItems.push("baking soda");
  if (hasBakingPowder) dryItems.push("baking powder");
  if (hasSalt) dryItems.push("salt");
  if (hasSugar && !hasBananas) dryItems.push("sugar");

  if (dryItems.length > 0) {
    steps.push(`Whisk the ${dryItems.join(", ")} in a large bowl.`);
  }

  if (goal === "vegan") {
    const wetItems: string[] = [];
    if (hasBananas) wetItems.push("mashed bananas");
    if (hasButter) wetItems.push("melted vegan butter or neutral oil");
    if (hasSugar && hasBananas) wetItems.push("sugar");
    wetItems.push("flax egg");
    if (hasVanilla) wetItems.push("vanilla");
    if (hasMilk) wetItems.push("oat milk or soy milk");

    steps.push(
      `Prepare the flax egg and let gel 10 minutes. In another bowl, combine ${wetItems.join(", ")}.`
    );
  } else {
    const wetItems: string[] = [];
    if (hasBananas) wetItems.push("mashed bananas");
    if (hasButter) wetItems.push("melted butter");
    if (hasSugar && hasBananas) wetItems.push("sugar");
    if (hasEggs) wetItems.push("eggs");
    if (hasVanilla) wetItems.push("vanilla");
    if (hasMilk) wetItems.push("milk");

    steps.push(`Whisk ${wetItems.join(", ")} in a separate bowl until smooth.`);
  }

  steps.push(
    "Fold the wet ingredients into the dry until just combined—do not over-mix."
  );

  if (hasChocolateChips) {
    steps.push("Fold in the chocolate chips.");
  }
  if (hasBlueberries) {
    steps.push("Gently fold in the blueberries.");
  }

  steps.push(
    "Divide batter evenly among muffin cups, filling each about two-thirds full.",
    muffinBakeStep(recipe),
    "Cool in the tin 5 minutes, then transfer to a wire rack."
  );

  return steps;
}

function cookieMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const hasFlour = hasIngredient(recipe, [/flour/]);
  const hasBakingSoda = hasIngredient(recipe, [/baking soda/]);
  const hasBakingPowder = hasIngredient(recipe, [/baking powder/]);
  const hasSalt = hasIngredient(recipe, [/\bsalt\b/]);
  const hasButter = hasIngredient(recipe, [/butter/]);
  const hasBrownSugar = hasIngredient(recipe, [/brown sugar/]);
  const hasGranulatedSugar = hasIngredient(recipe, [/granulated sugar/]);
  const hasSugar =
    hasGranulatedSugar ||
    (hasIngredient(recipe, [/sugar/]) && !hasBrownSugar);
  const hasEggs = countEggs(recipe) > 0;
  const hasVanilla = hasIngredient(recipe, [/vanilla/]);
  const hasMilk = hasIngredient(recipe, [/milk|cream/]);
  const hasChips = hasIngredient(recipe, [/chocolate/]);
  const hasNuts = hasIngredient(recipe, [/walnut|pecan|almond|hazelnut|nut/]);
  const hasOats = hasIngredient(recipe, [/oats?/]);
  const hasCinnamon = hasIngredient(recipe, [/cinnamon/]);

  const sugarParts: string[] = [];
  if (hasGranulatedSugar) sugarParts.push("granulated sugar");
  if (hasBrownSugar) sugarParts.push("brown sugar");
  if (sugarParts.length === 0 && hasSugar) sugarParts.push("sugar");

  const dryItems: string[] = [];
  if (hasFlour) dryItems.push("flour");
  if (hasBakingSoda) dryItems.push("baking soda");
  if (hasBakingPowder) dryItems.push("baking powder");
  if (hasSalt) dryItems.push("salt");
  if (hasCinnamon) dryItems.push("cinnamon");
  if (hasOats) dryItems.push("oats");

  const preheatDefault =
    "Preheat oven to 350°F (175°C). Line baking sheets with parchment paper.";
  const steps = [
    methodLineFromOriginal(recipe.originalLines, /^preheat/i, preheatDefault),
  ];

  if (hasButter && sugarParts.length > 0) {
    steps.push(
      `In a large bowl, cream ${creamFatLabel(recipe, goal)} with ${sugarParts.join(" and ")} until light and fluffy.`
    );
  } else if (hasButter) {
    steps.push(`Cream ${creamFatLabel(recipe, goal)} until smooth.`);
  }

  if (goal === "vegan") {
    const beatIn: string[] = [];
    if (hasEggs) beatIn.push("flax egg");
    if (hasVanilla) beatIn.push("vanilla");
    if (hasMilk) beatIn.push("oat milk or soy milk");
    if (beatIn.length > 0) {
      const prefix = hasEggs
        ? "Prepare flax egg and rest 10 minutes. "
        : "";
      steps.push(`${prefix}Beat in ${beatIn.join(", ")}.`);
    }
  } else if (goal === "allergen-free") {
    const beatIn: string[] = [];
    if (hasEggs) beatIn.push("aquafaba");
    if (hasVanilla) beatIn.push("vanilla");
    if (hasMilk) beatIn.push("oat milk");
    if (beatIn.length > 0) {
      steps.push(`Beat in ${beatIn.join(", ")}.`);
    }
  } else {
    const beatIn: string[] = [];
    if (hasEggs) beatIn.push("eggs one at a time");
    if (hasVanilla) beatIn.push("vanilla");
    if (hasMilk) beatIn.push("milk");
    if (beatIn.length > 0) {
      steps.push(`Beat in ${beatIn.join(", then ")}.`);
    }
  }

  if (dryItems.length > 0) {
    steps.push(
      `Mix in ${dryItems.join(", ")} until just combined—do not over-mix.`
    );
  }

  if (hasChips) {
    steps.push("Fold in chocolate chips evenly throughout the dough.");
  }
  if (hasNuts) {
    steps.push("Fold in nuts until distributed through the dough.");
  }

  steps.push(
    "Scoop rounded tablespoons of dough onto prepared baking sheets, spacing about 2 inches apart."
  );

  const bakeDefault =
    "Bake 10–12 minutes until edges are set and centers still look slightly soft.";
  steps.push(
    methodLineFromOriginal(recipe.originalLines, /\bbake\b/i, bakeDefault),
    "Cool on the sheet 2 minutes, then transfer to a rack."
  );

  return steps;
}

function findPastaIngredient(recipe: ParsedRecipe): ParsedIngredient | undefined {
  const patterns = [
    /\bspaghetti\b/i,
    /\bpenne\b/i,
    /\bfettuccine\b/i,
    /\blinguine\b/i,
    /\bmacaroni\b/i,
    /\brigatoni\b/i,
    /\bravioli\b/i,
    /\bnoodles?\b/i,
    /\bpasta\b/i,
  ];
  for (const pattern of patterns) {
    const ing = findIngredient(recipe, [pattern]);
    if (ing) return ing;
  }
  return undefined;
}

function pastaCookName(ing: ParsedIngredient): string {
  return ing.description.split(",")[0].trim();
}

function pastaMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const pastaIng = findPastaIngredient(recipe);
  const pastaName = pastaIng ? pastaCookName(pastaIng) : "pasta";

  const hasGarlic = hasIngredient(recipe, [/garlic/]);
  const hasOliveOil = hasIngredient(recipe, [/olive oil/]);
  const hasButter = hasIngredient(recipe, [/butter/]);
  const hasCheese = hasIngredient(recipe, [/parmesan|\bcheese\b/]);
  const hasSaltPepper = hasIngredient(recipe, [/salt|pepper/]);

  const steps: string[] = [
    `Bring a large pot of salted water to a boil. Cook the ${pastaName} according to package directions until al dente.`,
    "Drain the pasta, reserving ½ cup of pasta water. Do not rinse.",
  ];

  if (goal === "vegan") {
    if (hasGarlic) {
      const sautéFat = hasOliveOil
        ? "olive oil"
        : hasButter
          ? "vegan butter or neutral oil"
          : "oil";
      steps.push(
        `In the same pot or a large skillet, warm ${sautéFat} over medium heat. Sauté garlic until fragrant, about 1 minute.`
      );
    } else if (hasOliveOil || hasButter) {
      const warmFat =
        hasOliveOil && hasButter
          ? "olive oil and vegan butter or neutral oil"
          : hasButter
            ? "vegan butter or neutral oil"
            : "olive oil";
      steps.push(`In a large skillet, warm ${warmFat} over medium heat.`);
    }

    const tossParts: string[] = [];
    if (hasButter) tossParts.push("vegan butter or neutral oil");
    if (hasCheese) tossParts.push("vegan Parmesan or nutritional yeast");

    let finishStep =
      "Add the drained pasta with a splash of reserved pasta water.";
    if (tossParts.length > 0) {
      finishStep += ` Toss with ${tossParts.join(" and ")}.`;
    }
    if (hasSaltPepper) {
      finishStep += " Season with salt and pepper.";
    }
    finishStep +=
      " Toss until the sauce coats the pasta and emulsifies into a silky finish.";
    steps.push(finishStep);
  } else {
    if (hasGarlic) {
      const sautéFat =
        hasOliveOil && hasButter
          ? "olive oil and butter"
          : hasButter
            ? "butter"
            : hasOliveOil
              ? "olive oil"
              : "oil";
      steps.push(
        `In a large skillet, warm ${sautéFat} over medium heat. Sauté garlic until fragrant, about 1 minute.`
      );
    } else if (hasOliveOil || hasButter) {
      const warmFat =
        hasOliveOil && hasButter
          ? "olive oil and butter"
          : hasButter
            ? "butter"
            : "olive oil";
      steps.push(`In a large skillet, warm ${warmFat} over medium heat.`);
    }

    const tossParts: string[] = [];
    if (hasButter) tossParts.push("butter");
    if (hasCheese) tossParts.push("grated cheese");

    let finishStep = "Add drained pasta with reserved pasta water.";
    if (tossParts.length > 0) {
      finishStep += ` Toss with ${tossParts.join(" and ")} until creamy.`;
    }
    if (hasSaltPepper) {
      finishStep += " Season with salt and pepper";
    }
    finishStep += " and serve immediately.";
    steps.push(finishStep);
  }

  return steps;
}

function tacoBowlMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const hasRice = hasIngredient(recipe, [/\brice\b/]);
  const hasCauliflower = hasIngredient(recipe, [/cauliflower/]);
  const hasMeat = hasIngredient(recipe, [/ground beef|ground turkey|ground pork|ground chicken|turkey/]);
  const hasBeans = hasIngredient(recipe, [/beans/]);
  const hasCorn = hasIngredient(recipe, [/corn/]);
  const hasSalsa = hasIngredient(recipe, [/salsa/]);
  const hasCheese = hasIngredient(recipe, [/cheese|cheddar/]);
  const hasSourCream = hasIngredient(recipe, [/sour cream|greek yogurt|yogurt/]);
  const hasAvocado = hasIngredient(recipe, [/avocado/]);
  const hasCilantro = hasIngredient(recipe, [/cilantro/]);

  if (goal === "low-calorie") {
    const steps: string[] = [];

    if (hasRice) {
      steps.push(
        "Cook rice according to package directions, or prepare cauliflower rice for a lower-calorie base."
      );
    } else if (hasCauliflower) {
      steps.push(
        "Prepare cauliflower rice according to package directions, or pulse cauliflower florets in a food processor."
      );
    }

    if (hasMeat) {
      steps.push(
        "Cook lean ground turkey in a skillet over medium-high heat until browned and fully cooked, breaking into crumbles. Season with salt and pepper."
      );
    }

    const warmItems: string[] = [];
    if (hasBeans) warmItems.push("beans");
    if (hasCorn) warmItems.push("corn");
    if (warmItems.length > 0) {
      steps.push(
        `Warm ${warmItems.join(" and ")} in a small pot or microwave until heated through.`
      );
    }

    const assembleParts: string[] = [];
    if (hasRice || hasCauliflower) assembleParts.push("rice");
    if (hasMeat) assembleParts.push("turkey");
    if (hasBeans) assembleParts.push("beans");
    if (hasCorn) assembleParts.push("corn");
    if (hasSalsa) assembleParts.push("salsa");
    if (hasCheese) assembleParts.push("cheese");
    if (hasSourCream) assembleParts.push("Greek yogurt or light sour cream");
    if (hasAvocado) assembleParts.push("avocado");

    let assembleStep = "Assemble each bowl";
    if (assembleParts.length > 0) {
      assembleStep += ` with ${assembleParts.join(", ")}`;
    }
    if (hasCilantro) {
      assembleStep += ". Top with fresh cilantro";
    }
    assembleStep += " and serve.";
    steps.push(assembleStep);

    return steps;
  }

  const steps: string[] = [];
  if (hasRice) {
    steps.push("Cook rice according to package directions.");
  }
  if (hasMeat) {
    steps.push(
      "Cook ground meat in a skillet over medium-high heat until browned and fully cooked."
    );
  }
  const warmItems: string[] = [];
  if (hasBeans) warmItems.push("beans");
  if (hasCorn) warmItems.push("corn");
  if (warmItems.length > 0) {
    steps.push(`Warm ${warmItems.join(" and ")} until heated through.`);
  }
  steps.push(
    `Layer ${recipe.title} components in bowls and top with salsa, cheese, and fresh cilantro as desired. Serve immediately.`
  );
  return steps;
}

function generalMethod(recipe: ParsedRecipe, goal: OptimizationGoal): string[] {
  const title = recipe.title;
  return [
    `Prepare reformulated ingredients for ${title} per the ingredient list above.`,
    "Combine dry ingredients in one bowl and wet ingredients in another, matching the original recipe's mixing order.",
    goal === "vegan"
      ? "Ensure flax eggs are fully gelled before incorporating into the wet mix."
      : "Mix wet and dry components until just uniform—avoid over-working the batter or dough.",
    "Cook using the same technique as the original recipe (bake, pan-fry, or simmer as appropriate).",
    "Check doneness a few minutes earlier than the original timing; reformulated formulas may cook faster.",
    "Rest or cool as needed before serving.",
  ];
}

export function generateFoodScienceNotes(
  recipe: ParsedRecipe,
  goal: OptimizationGoal,
  substitutions: Substitution[]
): string[] {
  const title = recipe.title;
  const kind = recipe.kind;
  const notes: string[] = [];

  if (kind === "pancake") {
    if (goal === "vegan") {
      notes.push(
        `${title}: flax egg binds the batter but provides less lift than a whole egg—baking powder carries most of the rise for fluffy pancakes.`
      );
      if (hasIngredient(recipe, [/buttermilk/])) {
        notes.push(
          "Replacing buttermilk with oat or soy milk removes dairy acidity; resting the batter helps hydrate flour for a tender crumb."
        );
      }
      if (hasIngredient(recipe, [/blueberr/])) {
        notes.push(
          "Fold blueberries gently at the end to prevent bleeding and keep pancake surfaces evenly golden."
        );
      }
    } else if (goal === "allergen-free") {
      notes.push(
        `${title}: aquafaba adds moisture and light structure in place of eggs; avoid over-mixing once wet ingredients are added.`
      );
    } else if (goal === "sugar-reduction") {
      notes.push(
        `${title}: reduced sugar slows browning—pancakes may look paler before they are done; rely on bubble formation and edge set for doneness.`
      );
    } else if (goal === "low-calorie") {
      notes.push(
        `${title}: lower fat and egg yolks produce a slightly thinner batter; a non-stick griddle and moderate heat prevent sticking without excess oil.`
      );
    } else {
      notes.push(
        `${title}: griddle temperature is critical—medium heat cooks through without drying the pancake surface.`
      );
    }
  } else if (kind === "muffin") {
    if (goal === "vegan") {
      notes.push(
        `${title}: plant-based butter or oil at the same quantity preserves richness; fold wet into dry until no dry streaks remain to avoid toughness.`
      );
      if (hasIngredient(recipe, [/banana/])) {
        notes.push(
          `${title}: mashed bananas provide moisture and structure—flax egg binds the batter while baking soda handles leavening.`
        );
      }
      if (hasIngredient(recipe, [/chocolate chip/])) {
        notes.push(
          `${title}: fold dairy-free chocolate chips at the end so they stay intact and melt evenly in the crumb.`
        );
      }
      if (hasIngredient(recipe, [/blueberr/])) {
        notes.push(
          `${title}: fold blueberries gently at the end to prevent bleeding and keep muffin tops evenly golden.`
        );
      }
    } else if (goal === "high-protein") {
      notes.push(
        `${title}: sift whey protein with flour to prevent clumping; slightly lower bake temperature helps centers set without drying.`
      );
    } else {
      notes.push(
        `${title}: portion cups two-thirds full for even dome formation and consistent bake time across the tray.`
      );
    }
  } else if (kind === "cookie") {
    if (goal === "vegan") {
      notes.push(
        `${title}: brown sugar hygroscopy keeps vegan cookies chewy; plant butter mimics dairy butter spread better than oil-based doughs.`
      );
    } else if (goal === "sugar-reduction") {
      notes.push(
        `${title}: less sugar can reduce spread—slightly smaller scoops help cookies bake evenly without over-drying.`
      );
    } else {
      notes.push(
        `${title}: remove cookies when centers still look soft; they firm as they cool on the rack.`
      );
    }
  } else if (kind === "pasta") {
    if (goal === "vegan") {
      const hasOliveOil = hasIngredient(recipe, [/olive oil/]);
      const hasButter = hasIngredient(recipe, [/butter/]);
      const emulsifier =
        hasOliveOil && hasButter
          ? "oil and plant-based butter"
          : hasButter
            ? "plant-based butter"
            : hasOliveOil
              ? "oil"
              : "fat";
      notes.push(
        `${title}: reserved pasta water starch emulsifies with ${emulsifier} to create creaminess—add gradually while tossing.`
      );
    } else {
      notes.push(
        `${title}: finishing pasta in the sauce (not rinsing) helps starch bind the coating to each strand.`
      );
    }
  } else if (kind === "bowl") {
    if (goal === "low-calorie") {
      notes.push(
        `${title}: a smaller rice base and lean turkey keep the bowl filling while cutting fat and starch calories.`
      );
      notes.push(
        `${title}: Greek yogurt or light sour cream adds tang and creaminess with fewer calories than full-fat sour cream.`
      );
      if (hasIngredient(recipe, [/avocado/])) {
        notes.push(
          `${title}: use 1/4 avocado per bowl—or skip it—to control fat calories without losing the fresh topping option.`
        );
      }
    } else {
      notes.push(
        `${title}: warm components before assembly so the bowl stays hot from rice through toppings.`
      );
    }
  } else {
    notes.push(
      `${title}: reformulation preserves the original structure where possible—adjust cook time ±5 minutes and check doneness early.`
    );
  }

  if (substitutions.some((s) => /flax/i.test(s.replacement))) {
    notes.push("Flax gel relies on soluble fiber for binding; allow full gel time before mixing for best cohesion.");
  }

  return notes.slice(0, 4);
}

export function generateExpectedResult(
  recipe: ParsedRecipe,
  goal: OptimizationGoal
): string {
  const title = recipe.title;
  const kind = recipe.kind;

  if (kind === "pancake") {
    if (goal === "vegan") {
      return `${title} with a tender, fluffy crumb and even golden browning. Dairy and eggs are removed while keeping familiar pancake flavor—slightly less rich than the original but soft and stackable.`;
    }
    if (goal === "sugar-reduction") {
      return `${title} that are lightly sweet with pronounced vanilla and warm griddle notes. Less cloying than the original with a moist, tender interior.`;
    }
    if (goal === "low-calorie") {
      return `Leaner ${title} with a lighter texture and reduced richness. Still tender when served warm; best enjoyed fresh off the griddle.`;
    }
    return `${title} with a classic fluffy interior, golden edges, and balanced sweetness—closely matching the original eating experience.`;
  }

  if (kind === "muffin") {
    const hasBananas = hasIngredient(recipe, [/banana/]);
    const hasChocolateChips = hasIngredient(recipe, [/chocolate chip/]);
    const hasBlueberries = hasIngredient(recipe, [/blueberr/]);

    if (goal === "vegan") {
      if (hasBananas && hasChocolateChips) {
        return `Moist ${title} with tender crumb, natural banana sweetness, and melty dairy-free chocolate chips. Domed tops and a soft, bakery-style interior—comparable to the original without eggs or dairy butter.`;
      }
      if (hasBlueberries) {
        return `Moist ${title} with a tender crumb and domed tops. Blueberries stay intact when folded gently; comparable to conventional vegan muffins with plant-based butter.`;
      }
      return `Moist ${title} with a tender crumb and domed tops. Comparable to conventional muffins when using the same quantities of plant-based butter or oil.`;
    }
    return `Evenly risen ${title} with a soft crumb and balanced flavor aligned with the ${OPTIMIZATION_GOAL_LABEL[goal]} target.`;
  }

  if (kind === "cookie") {
    return `Chewy-centered ${title} with set edges and good chocolate distribution. Texture and spread appropriate for a ${OPTIMIZATION_GOAL_LABEL[goal]} formulation.`;
  }

  if (kind === "pasta") {
    return `${title} with well-coated pasta, silky sauce cling, and savory depth. Al dente texture preserved through proper boiling and finishing in the pan.`;
  }

  if (kind === "bowl") {
    if (goal === "low-calorie") {
      return `A lighter ${title} with 1/2 cup rice per serving, lean turkey, reduced cheese, and tangy Greek yogurt or light sour cream. Salsa, beans, corn, and cilantro keep the bowl bright and satisfying at a lower calorie count.`;
    }
    return `${title} with warm rice, seasoned protein, and fresh toppings layered for a balanced, customizable bowl.`;
  }

  return `A reformulated ${title} that preserves the original character while meeting ${OPTIMIZATION_GOAL_LABEL[goal]} constraints. Texture and flavor should feel familiar with targeted ingredient adjustments.`;
}

const OPTIMIZATION_GOAL_LABEL: Record<OptimizationGoal, string> = {
  "allergen-free": "allergen-free",
  vegan: "vegan",
  "sugar-reduction": "reduced-sugar",
  "cost-optimization": "cost-optimized",
  "high-protein": "high-protein",
  "low-calorie": "low-calorie",
};
