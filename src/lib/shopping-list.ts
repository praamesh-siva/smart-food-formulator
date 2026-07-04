export type ShoppingCategory =
  | "produce"
  | "dairy"
  | "pantry"
  | "protein"
  | "spices";

export const SHOPPING_CATEGORY_ORDER: ShoppingCategory[] = [
  "produce",
  "protein",
  "dairy",
  "pantry",
  "spices",
];

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  produce: "Produce",
  protein: "Protein",
  dairy: "Dairy",
  pantry: "Pantry",
  spices: "Spices",
};

export interface ParsedShoppingItem {
  id: string;
  label: string;
  searchName: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
}

const QUANTITY_PATTERN =
  /^([\d\s\/\.]+)\s*(cups?|c\.|tbsp|tbs|tablespoons?|tsp|teaspoons?|oz|ounces?|fl\.?\s*oz|lb|lbs|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|pinch(?:es)?|cloves?|cans?|packages?|pkg|bunches?|slices?|sticks?|heads?|large|medium|small)?\s*(.+)$/i;

const COUNT_PATTERN = /^(\d+)\s+(.+)$/;

const PREP_SUFFIX_PATTERN =
  /\s*,\s*(?:beaten|chopped|diced|minced|sliced|grated|shredded|crushed|peeled|seeded|optional|to taste|at room temperature|softened|melted|divided|well\s+.*)$/i;

const CATEGORY_KEYWORDS: Record<ShoppingCategory, RegExp[]> = {
  spices: [
    /\bsalt\b/i,
    /\bblack pepper\b/i,
    /\bwhite pepper\b/i,
    /\bred pepper flakes\b/i,
    /\bcinnamon\b/i,
    /\bcumin\b/i,
    /\bpaprika\b/i,
    /\boregano\b/i,
    /\bbasil\b/i,
    /\bthyme\b/i,
    /\brosemary\b/i,
    /\bturmeric\b/i,
    /\bnutmeg\b/i,
    /\bcayenne\b/i,
    /\bchili powder\b/i,
    /\bcurry\b/i,
    /\bvanilla extract\b/i,
    /\bgarlic powder\b/i,
    /\bonion powder\b/i,
    /\bseasoning\b/i,
    /\bspice\b/i,
    /\bbay leaf\b/i,
    /\bred pepper flakes\b/i,
    /\ballspice\b/i,
    /\bcardamom\b/i,
    /\bdill\b/i,
    /\bsage\b/i,
    /\bclove\b/i,
    /\bmustard powder\b/i,
  ],
  dairy: [
    /\bmilk\b/i,
    /\bbutter\b/i,
    /\bcream\b/i,
    /\bcheese\b/i,
    /\byogurt\b/i,
    /\bsour cream\b/i,
    /\bcottage cheese\b/i,
    /\bparmesan\b/i,
    /\bmozzarella\b/i,
    /\bcheddar\b/i,
    /\bwhipping cream\b/i,
    /\bhalf-and-half\b/i,
    /\bhalf and half\b/i,
    /\bkefir\b/i,
    /\bcreme fraiche\b/i,
  ],
  protein: [
    /\bchicken\b/i,
    /\bbeef\b/i,
    /\bpork\b/i,
    /\bsalmon\b/i,
    /\bfish\b/i,
    /\bshrimp\b/i,
    /\btofu\b/i,
    /\btempeh\b/i,
    /\bbeans\b/i,
    /\blentils\b/i,
    /\bchickpeas\b/i,
    /\bturkey\b/i,
    /\bbacon\b/i,
    /\bsausage\b/i,
    /\bham\b/i,
    /\begg\b/i,
    /\beggs\b/i,
    /\bprotein powder\b/i,
    /\bground beef\b/i,
    /\bground turkey\b/i,
    /\bsteak\b/i,
    /\btuna\b/i,
    /\bcod\b/i,
    /\btilapia\b/i,
    /\bseitan\b/i,
  ],
  produce: [
    /\bonion\b/i,
    /\bgarlic\b/i,
    /\btomato\b/i,
    /\bpotato\b/i,
    /\bcarrot\b/i,
    /\bcelery\b/i,
    /\bbell pepper\b/i,
    /\blettuce\b/i,
    /\bspinach\b/i,
    /\bkale\b/i,
    /\bapple\b/i,
    /\bbanana\b/i,
    /\blemon\b/i,
    /\blime\b/i,
    /\bavocado\b/i,
    /\bbroccoli\b/i,
    /\bmushroom\b/i,
    /\bzucchini\b/i,
    /\bcilantro\b/i,
    /\bparsley\b/i,
    /\bginger\b/i,
    /\bfruit\b/i,
    /\bvegetable\b/i,
    /\bberries\b/i,
    /\bstrawberr/i,
    /\bblueberr/i,
    /\basparagus\b/i,
    /\bcucumber\b/i,
    /\bsquash\b/i,
    /\bcabbage\b/i,
    /\bcorn\b/i,
    /\bpeas\b/i,
    /\bgreen beans\b/i,
    /\bscallion\b/i,
    /\bshallot\b/i,
    /\bherbs?\b/i,
    /\bmint\b/i,
    /\barugula\b/i,
  ],
  pantry: [
    /\bflour\b/i,
    /\bsugar\b/i,
    /\boil\b/i,
    /\bolive oil\b/i,
    /\brice\b/i,
    /\bpasta\b/i,
    /\bbread\b/i,
    /\bvinegar\b/i,
    /\bhoney\b/i,
    /\bbroth\b/i,
    /\bstock\b/i,
    /\bbaking powder\b/i,
    /\bbaking soda\b/i,
    /\bcornstarch\b/i,
    /\boats\b/i,
    /\bcanned\b/i,
    /\bsauce\b/i,
    /\bsoy sauce\b/i,
    /\bketchup\b/i,
    /\bmayonnaise\b/i,
    /\bmustard\b/i,
    /\bmaple syrup\b/i,
    /\bpeanut butter\b/i,
    /\bnuts\b/i,
    /\bwalnuts\b/i,
    /\balmonds\b/i,
    /\bchocolate chips\b/i,
    /\bcocoa\b/i,
    /\bwater\b/i,
    /\bwine\b/i,
    /\bquinoa\b/i,
    /\bcouscous\b/i,
    /\btortilla\b/i,
    /\bcracker\b/i,
    /\bbreadcrumb\b/i,
  ],
};

const UNIT_ALIASES: Record<string, string> = {
  cup: "cup",
  cups: "cup",
  c: "cup",
  tbsp: "tablespoon",
  tbs: "tablespoon",
  tablespoon: "tablespoon",
  tablespoons: "tablespoon",
  tsp: "teaspoon",
  teaspoon: "teaspoon",
  teaspoons: "teaspoon",
  oz: "ounce",
  ounce: "ounce",
  ounces: "ounce",
  lb: "pound",
  lbs: "pound",
  pound: "pound",
  pounds: "pound",
  g: "gram",
  gram: "gram",
  grams: "gram",
  kg: "kilogram",
  kilogram: "kilogram",
  kilograms: "kilogram",
  ml: "milliliter",
  milliliter: "milliliter",
  milliliters: "milliliter",
  l: "liter",
  liter: "liter",
  liters: "liter",
  pinch: "pinch",
  pinches: "pinch",
  clove: "each",
  cloves: "each",
  can: "each",
  cans: "each",
  package: "each",
  packages: "each",
  pkg: "each",
  bunch: "each",
  bunches: "each",
  slice: "each",
  slices: "each",
  stick: "each",
  sticks: "each",
  head: "each",
  heads: "each",
  large: "each",
  medium: "each",
  small: "each",
};

function normalizeIngredientLine(line: string): string {
  return line
    .trim()
    .replace(/^[-•*]\s*/, "")
    .replace(/\s+/g, " ");
}

function parseQuantity(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 1;

  if (trimmed.includes("/")) {
    const [numerator, denominator] = trimmed.split("/").map((part) => part.trim());
    const top = Number.parseFloat(numerator);
    const bottom = Number.parseFloat(denominator);
    if (Number.isFinite(top) && Number.isFinite(bottom) && bottom !== 0) {
      return top / bottom;
    }
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeUnit(rawUnit: string | undefined): string {
  if (!rawUnit) return "each";
  const key = rawUnit.toLowerCase().replace(/\./g, "").trim();
  return UNIT_ALIASES[key] ?? "each";
}

function simplifySearchName(name: string): string {
  return name
    .replace(PREP_SUFFIX_PATTERN, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyShoppingCategory(searchName: string): ShoppingCategory {
  const normalized = searchName.toLowerCase();

  const classificationOrder: ShoppingCategory[] = [
    "spices",
    "protein",
    "dairy",
    "produce",
    "pantry",
  ];

  for (const category of classificationOrder) {
    if (CATEGORY_KEYWORDS[category].some((pattern) => pattern.test(normalized))) {
      return category;
    }
  }

  return "pantry";
}

export function parseShoppingIngredient(
  line: string,
  index: number
): ParsedShoppingItem {
  const label = normalizeIngredientLine(line);
  const quantityMatch = label.match(QUANTITY_PATTERN);
  const countMatch = !quantityMatch ? label.match(COUNT_PATTERN) : null;

  let searchName: string;

  if (quantityMatch) {
    const quantity = parseQuantity(quantityMatch[1]);
    const unit = normalizeUnit(quantityMatch[2]);
    searchName = simplifySearchName(quantityMatch[3]) || label;
    return {
      id: `item-${index}-${searchName.toLowerCase().slice(0, 24)}`,
      label,
      searchName,
      quantity,
      unit,
      category: classifyShoppingCategory(searchName),
    };
  }

  if (countMatch) {
    const quantity = parseQuantity(countMatch[1]);
    searchName = simplifySearchName(countMatch[2]) || label;
    return {
      id: `item-${index}-${searchName.toLowerCase().slice(0, 24)}`,
      label,
      searchName,
      quantity,
      unit: "each",
      category: classifyShoppingCategory(searchName),
    };
  }

  searchName = simplifySearchName(label) || label;
  return {
    id: `item-${index}-${searchName.toLowerCase().slice(0, 24)}`,
    label,
    searchName,
    quantity: 1,
    unit: "each",
    category: classifyShoppingCategory(searchName),
  };
}

export function extractShoppingListItems(
  ingredients: string[]
): ParsedShoppingItem[] {
  const seen = new Set<string>();
  const items: ParsedShoppingItem[] = [];

  ingredients.forEach((line, index) => {
    const normalized = normalizeIngredientLine(line);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    items.push(parseShoppingIngredient(normalized, index));
  });

  return items;
}

export interface GroupedShoppingList {
  category: ShoppingCategory;
  label: string;
  items: ParsedShoppingItem[];
}

export function groupShoppingListItems(
  items: ParsedShoppingItem[]
): GroupedShoppingList[] {
  const groups = new Map<ShoppingCategory, ParsedShoppingItem[]>();

  for (const item of items) {
    const bucket = groups.get(item.category) ?? [];
    bucket.push(item);
    groups.set(item.category, bucket);
  }

  return SHOPPING_CATEGORY_ORDER.filter((category) => groups.has(category)).map(
    (category) => ({
      category,
      label: SHOPPING_CATEGORY_LABELS[category],
      items: groups.get(category) ?? [],
    })
  );
}

export function formatGroupedShoppingList(
  recipeName: string,
  items: ParsedShoppingItem[]
): string {
  const groups = groupShoppingListItems(items);
  const lines = [`Shopping list — ${recipeName}`, ""];

  for (const group of groups) {
    lines.push(group.label);
    for (const item of group.items) {
      lines.push(`- ${item.label}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function formatShoppingListForCopy(
  recipeName: string,
  items: ParsedShoppingItem[] | string[]
): string {
  if (items.length === 0) {
    return `Shopping list — ${recipeName}`;
  }

  if (typeof items[0] === "string") {
    return formatGroupedShoppingList(
      recipeName,
      (items as string[]).map((label, index) =>
        parseShoppingIngredient(label, index)
      )
    );
  }

  return formatGroupedShoppingList(recipeName, items as ParsedShoppingItem[]);
}

export function slugifyRecipeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
