"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppChrome } from "@/components/AppChrome";
import { FormulationOutput } from "@/components/FormulationOutput";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";
import { formatSavedDate, modeLabel } from "@/lib/saved-recipes";

export default function SavedRecipesPage() {
  const { recipes, hydrated, deleteRecipe } = useSavedRecipes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId && !recipes.some((recipe) => recipe.id === selectedId)) {
      setSelectedId(null);
    }
  }, [recipes, selectedId]);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedId);

  return (
    <AppChrome activeNav="saved" savedCount={recipes.length}>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:py-11">
        <section className="mb-6 animate-fade-up sm:mb-8">
          <p className="section-eyebrow">Library</p>
          <h1 className="hero-title mt-1">Saved Recipes</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sage-600 sm:text-base">
            Reports you save are stored in this browser only. Open a saved
            recipe to review the full formulation report anytime.
          </p>
        </section>

        {!hydrated ? (
          <div className="card-panel p-8 text-center text-sm text-sage-500">
            Loading saved recipes…
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200/80 text-sage-600 shadow-sm">
              <svg
                className="h-6 w-6"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-semibold text-sage-800 sm:mt-5">
              No saved recipes yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sage-500">
              Generate a recipe on the Formulator page, then click{" "}
              <span className="font-semibold text-sage-700">Save recipe</span>{" "}
              to keep it here.
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex w-auto px-6">
              Go to Formulator
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {recipes.map((saved) => {
                const isSelected = saved.id === selectedId;
                return (
                  <article
                    key={saved.id}
                    className={`card-panel p-4 transition-all sm:p-5 ${
                      isSelected ? "ring-2 ring-sage-500/25" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-sage-900 sm:text-lg">
                          {saved.result.recipeName}
                        </h2>
                        <p className="mt-1 text-xs font-medium text-sage-500">
                          Saved {formatSavedDate(saved.savedAt)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-sage-50/80 px-3 py-2 ring-1 ring-sage-100">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-400">
                          Mode
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-sage-800">
                          {modeLabel(saved.result.mode)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-sage-50/80 px-3 py-2 ring-1 ring-sage-100">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-400">
                          Goal
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-sage-800">
                          {saved.result.goalLabel}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedId(isSelected ? null : saved.id)
                        }
                        className="btn-secondary"
                      >
                        {isSelected ? "Hide report" : "View report"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteRecipe(saved.id);
                          if (selectedId === saved.id) {
                            setSelectedId(null);
                          }
                        }}
                        className="btn-danger-ghost"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedRecipe && (
              <section className="scroll-mt-24 animate-fade-in">
                <FormulationOutput result={selectedRecipe.result} />
              </section>
            )}
          </div>
        )}
      </main>
    </AppChrome>
  );
}
