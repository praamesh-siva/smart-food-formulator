"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormulationResult } from "@/lib/formulation-types";
import {
  deleteSavedRecipe,
  loadSavedRecipes,
  saveRecipeToStorage,
  SAVED_RECIPES_STORAGE_KEY,
  type SavedRecipe,
} from "@/lib/saved-recipes";

export function useSavedRecipes() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setRecipes(loadSavedRecipes());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_RECIPES_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const saveRecipe = useCallback(
    (result: FormulationResult) => {
      const entry = saveRecipeToStorage(result);
      refresh();
      return entry;
    },
    [refresh]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      deleteSavedRecipe(id);
      refresh();
    },
    [refresh]
  );

  return {
    recipes,
    hydrated,
    saveRecipe,
    deleteRecipe,
    refresh,
  };
}
