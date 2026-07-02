import type { AppMode, FormulationResult } from "./formulation-types";

export const SAVED_RECIPES_STORAGE_KEY = "smart-food-formulator-saved-recipes";

export interface SavedRecipe {
  id: string;
  savedAt: string;
  result: FormulationResult;
}

function isSavedRecipe(value: unknown): value is SavedRecipe {
  if (!value || typeof value !== "object") return false;
  const entry = value as SavedRecipe;
  return (
    typeof entry.id === "string" &&
    typeof entry.savedAt === "string" &&
    typeof entry.result === "object" &&
    entry.result !== null &&
    typeof entry.result.recipeName === "string"
  );
}

export function modeLabel(mode?: AppMode): string {
  return mode === "create-from-ingredients"
    ? "Create from ingredients"
    : "Reformulate recipe";
}

export function formatSavedDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function loadSavedRecipes(): SavedRecipe[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSavedRecipe)
      .sort(
        (a, b) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
  } catch {
    return [];
  }
}

function createSavedRecipeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveRecipeToStorage(result: FormulationResult): SavedRecipe {
  const entry: SavedRecipe = {
    id: createSavedRecipeId(),
    savedAt: new Date().toISOString(),
    result,
  };

  const existing = loadSavedRecipes();
  const next = [entry, ...existing];

  try {
    window.localStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable
  }

  return entry;
}

export function deleteSavedRecipe(id: string): void {
  const next = loadSavedRecipes().filter((recipe) => recipe.id !== id);

  try {
    window.localStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getSavedRecipeById(id: string): SavedRecipe | null {
  return loadSavedRecipes().find((recipe) => recipe.id === id) ?? null;
}
