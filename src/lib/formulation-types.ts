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

export const CONSTRAINT_INFO: Record<OptimizationGoal, ConstraintInfo> = {
  "allergen-free": {
    title: "Allergen-free formulation",
    description:
      "Substitutions prioritize removing common allergens while preserving structure, flavor balance, and shelf stability.",
    principles: [
      "Dairy replaced with plant-based fats and proteins that mimic emulsification (e.g., oat milk, sunflower lecithin).",
      "Eggs substituted with binding agents like aquafaba, flax gel, or commercial egg replacers.",
      "Gluten removed via alternative starches and hydrocolloids to maintain viscosity and bake structure.",
      "Cross-contamination risk minimized by selecting certified allergen-free ingredients.",
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
      "Whey, casein, or pea protein isolates added at levels that maintain solubility.",
      "Moisture adjusted to prevent dry or rubbery textures from excess protein.",
      "Leucine-rich sources prioritized for muscle protein synthesis benefits.",
      "pH and heat stability evaluated to avoid protein denaturation during processing.",
    ],
  },
  "low-calorie": {
    title: "Low calorie",
    description:
      "Caloric density is reduced through fat and sugar substitution while preserving satiety and mouthfeel.",
    principles: [
      "Fats partially replaced with water, air incorporation, or fat replacers like inulin.",
      "Simple sugars reduced and replaced with low-calorie sweeteners and fiber.",
      "Portion-controlled calorie targets set per serving with macro balance maintained.",
      "Satiety enhanced via protein and fiber without exceeding calorie budget.",
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
