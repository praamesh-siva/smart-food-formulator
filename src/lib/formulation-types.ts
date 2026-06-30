export type OptimizationGoal =
  | "allergen-free"
  | "vegan"
  | "sugar-reduction"
  | "cost-optimization"
  | "high-protein"
  | "low-calorie";

export const OPTIMIZATION_GOALS: {
  value: OptimizationGoal;
  label: string;
}[] = [
  { value: "allergen-free", label: "Allergen-free" },
  { value: "vegan", label: "Vegan" },
  { value: "sugar-reduction", label: "Sugar reduction" },
  { value: "cost-optimization", label: "Cost optimization" },
  { value: "high-protein", label: "High protein" },
  { value: "low-calorie", label: "Low calorie" },
];

export interface ConstraintInfo {
  title: string;
  description: string;
  principles: string[];
}

export const ALLERGEN_FREE_DISCLAIMER =
  "Always verify ingredient labels and manufacturing practices for your specific allergens. This formulation reduces common allergens but cannot guarantee absence of cross-contamination—confirm with certified products and your healthcare provider when needed.";

export const HIGH_PROTEIN_RATIONALE_NOTE =
  "Protein rationale: the biggest gains usually come from partial vanilla whey protein flour replacement, Greek yogurt, and extra egg whites. Cottage cheese or lean poultry work in savory dishes. Whole wheat flour adds fiber and only a modest protein increase—not a primary high-protein strategy.";

export const LOW_CALORIE_RATIONALE_NOTE =
  "Calorie rationale: the largest savings usually come from cutting butter/oil (replace with applesauce, Greek yogurt, or mashed banana plus a small amount of oil) and moderately reducing sugar. Skim milk, egg whites, and smaller portions of cheese, avocado, or chocolate chips add further reductions. Boost vanilla, cinnamon, lemon zest, or berries so the lighter version stays flavorful.";

export const CONSTRAINT_INFO: Record<OptimizationGoal, ConstraintInfo> = {
  "allergen-free": {
    title: "Allergen-free formulation",
    description:
      "Substitutions prioritize removing common allergens while preserving structure, flavor balance, and shelf stability.",
    principles: [
      "Dairy replaced with neutral options such as rice milk; certified gluten-free oat milk only when appropriate.",
      "Eggs substituted with aquafaba or commercial replacers; flax/chia only when seed allergies are not a concern.",
      "Wheat flour replaced with certified gluten-free 1:1 baking flour blends.",
      "Tree-nut milks (almond, cashew) and other major allergens avoided; verify labels and cross-contamination risk.",
    ],
  },
  vegan: {
    title: "Vegan formulation",
    description:
      "All animal-derived ingredients are replaced with plant-based alternatives that deliver comparable texture and nutrition.",
    principles: [
      "Animal proteins swapped for legumes, tofu, tempeh, or pea protein isolates.",
      "Butter and cream replaced with coconut oil, cashew cream, or refined plant shortenings.",
      "Honey and gelatin excluded; maple syrup and agar-agar or pectin used instead.",
      "Vitamin B12 and complete amino acid profiles considered via fortified ingredients.",
    ],
  },
  "sugar-reduction": {
    title: "Sugar reduction",
    description:
      "Sweetness is lowered while maintaining perceived flavor through bulk replacers and synergistic sweeteners.",
    principles: [
      "Sucrose partially replaced with erythritol, allulose, or stevia blends for lower glycemic impact.",
      "Bulk maintained with polyols or fiber syrups to prevent texture collapse.",
      "Flavor enhancement via vanilla, cinnamon, or fruit concentrates to compensate for reduced sweetness.",
      "Water activity monitored to preserve microbial stability after sugar reduction.",
    ],
  },
  "cost-optimization": {
    title: "Cost optimization",
    description:
      "Ingredient costs are reduced by substituting premium components with functionally equivalent lower-cost alternatives.",
    principles: [
      "Expensive proteins replaced with textured vegetable protein or whey concentrates.",
      "Premium oils swapped for commodity vegetable oils with antioxidant stabilization.",
      "Whole spices substituted with oleoresins or standardized extracts for consistent potency.",
      "Yield improved through water binding with modified starches instead of costly hydrocolloids.",
    ],
  },
  "high-protein": {
    title: "High protein",
    description:
      "Protein content is increased while managing water binding, texture, and digestibility.",
    principles: [
      "Identify the highest-impact protein opportunities first: partial whey flour replacement, Greek yogurt, egg whites, cottage cheese, or lean poultry.",
      "In muffins and quick breads, replace at most ~25% of flour with vanilla whey protein powder—more dries the crumb.",
      "Balance Greek yogurt or protein powder with extra milk or moisture so texture stays tender, not rubbery.",
      "Whole wheat adds fiber and modest protein; it is not a substitute for concentrated protein sources.",
    ],
  },
  "low-calorie": {
    title: "Low calorie",
    description:
      "Caloric density is reduced by targeting the highest-calorie ingredients—fat, sugar, and full-fat dairy—while keeping the recipe moist and flavorful.",
    principles: [
      "Identify top calorie sources first: butter/oil, sugar, whole milk, cheese, and calorie-dense add-ins.",
      "For muffins, reduce sugar moderately (e.g., 1 cup → ½–¾ cup) and replace most fat with applesauce, Greek yogurt, or banana plus 1–2 tbsp oil.",
      "Use skim milk and egg whites where appropriate; note that removing yolks may reduce richness.",
      "Support flavor with vanilla, cinnamon, lemon zest, or extra fruit so lighter bakes do not taste bland.",
    ],
  },
};

export interface Substitution {
  original: string;
  replacement: string;
  rationale: string;
}

export interface FormulationResult {
  recipeName: string;
  goalLabel: string;
  reformulatedIngredients: string[];
  updatedMethod: string[];
  keySubstitutions: Substitution[];
  foodScienceNotes: string[];
  expectedResult: string;
  originalRecipeReference: string | null;
  source?: "openai" | "fallback";
}
