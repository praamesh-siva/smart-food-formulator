const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MAIN_INGREDIENTS = 12;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export interface DetectedIngredientsResponse {
  ingredients: string[];
  optionalIngredients: string[];
  notes?: string;
}

export interface DetectIngredientsApiPayload extends DetectedIngredientsResponse {
  source: "openai" | "fallback";
  error?: string;
}

const OPTIONAL_ITEM_PATTERNS = [
  /\bmustard\b/i,
  /\bsoy sauce\b/i,
  /\bfish sauce\b/i,
  /\boyster sauce\b/i,
  /\bhot sauce\b/i,
  /\bsriracha\b/i,
  /\bketchup\b/i,
  /\bmayonnaise\b/i,
  /\bmayo\b/i,
  /\bbarbecue sauce\b/i,
  /\bbbq sauce\b/i,
  /\bvinegar\b/i,
  /\bworcestershire\b/i,
  /\bpickle\b/i,
  /\bpickled\b/i,
  /\brelish\b/i,
  /\bcapers\b/i,
  /\bcanned fruit\b/i,
  /\bfruit cocktail\b/i,
  /\bpeaches?\b.*\bsyrup\b/i,
  /\bpears?\b.*\bsyrup\b/i,
  /\bjam\b/i,
  /\bjelly\b/i,
  /\bhoney\b/i,
  /\bmaple syrup\b/i,
  /\bvanilla extract\b/i,
  /\bsalad dressing\b/i,
  /\branch\b/i,
  /\bseasoning\b/i,
  /\bspice mix\b/i,
  /\bspices\b/i,
  /\bbouillon\b/i,
  /\bstock cube\b/i,
  /\bcinnamon\b/i,
  /\bcumin\b/i,
  /\bpaprika\b/i,
  /\boregano\b/i,
  /\bbasil\b/i,
  /\bthyme\b/i,
  /\brosemary\b/i,
  /\bturmeric\b/i,
  /\bchili powder\b/i,
  /\bcurry powder\b/i,
  /\bnutmeg\b/i,
  /\bblack pepper\b/i,
  /\bground pepper\b/i,
  /\bcayenne\b/i,
  /\bred pepper flakes\b/i,
  /\bolive oil spray\b/i,
];

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string): string {
  return normalizeName(value).toLowerCase();
}

function dedupeNames(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const name = normalizeName(item);
    if (!name) continue;
    const key = normalizeKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }

  return result;
}

export function isOptionalDetectedItem(name: string): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return true;
  if (/^(maybe|possibly|uncertain|unclear)\b/i.test(normalized)) return true;
  return OPTIONAL_ITEM_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function finalizeDetectedIngredients(
  ingredients: string[],
  optionalIngredients: string[] = []
): DetectedIngredientsResponse {
  const main: string[] = [];
  const optional: string[] = [];

  for (const item of dedupeNames(ingredients)) {
    if (isOptionalDetectedItem(item)) {
      optional.push(item);
    } else {
      main.push(item);
    }
  }

  for (const item of dedupeNames(optionalIngredients)) {
    optional.push(item);
  }

  const cappedMain = main.slice(0, MAX_MAIN_INGREDIENTS);
  const overflow = main.slice(MAX_MAIN_INGREDIENTS);
  const mainKeys = new Set(cappedMain.map(normalizeKey));

  const filteredOptional = dedupeNames([...optional, ...overflow]).filter(
    (item) => !mainKeys.has(normalizeKey(item))
  );

  return {
    ingredients: cappedMain,
    optionalIngredients: filteredOptional,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map(normalizeName)
    .filter(Boolean);
}

export function parseDetectedIngredientsResponse(
  value: unknown
): DetectedIngredientsResponse | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  const mainRaw =
    data.ingredients ?? data.mainIngredients ?? data.main_ingredients;
  const optionalRaw =
    data.optionalIngredients ??
    data.optional_ingredients ??
    data.optionalDetectedItems ??
    data.optional_detected_items;

  if (!Array.isArray(mainRaw) && !Array.isArray(optionalRaw)) {
    return null;
  }

  const finalized = finalizeDetectedIngredients(
    parseStringArray(mainRaw),
    parseStringArray(optionalRaw)
  );

  const notes =
    typeof data.notes === "string"
      ? data.notes.trim()
      : typeof data.note === "string"
        ? data.note.trim()
        : undefined;

  if (
    finalized.ingredients.length === 0 &&
    finalized.optionalIngredients.length === 0
  ) {
    return null;
  }

  return {
    ...finalized,
    ...(notes ? { notes } : {}),
  };
}

export function mergeIngredientLines(
  existingText: string,
  detected: string[]
): string {
  const lines = existingText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const item of detected) {
    const trimmed = normalizeName(item);
    if (!trimmed) continue;
    if (lines.some((line) => normalizeKey(line) === normalizeKey(trimmed))) {
      continue;
    }
    lines.push(trimmed);
  }

  return lines.join("\n");
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please upload a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 8 MB or smaller.";
  }
  return null;
}

export { MAX_IMAGE_BYTES, MAX_MAIN_INGREDIENTS, ALLOWED_IMAGE_TYPES };
