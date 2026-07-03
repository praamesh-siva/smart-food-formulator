"use client";

import { useEffect, useRef, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import { ConstraintsPanel } from "@/components/ConstraintsPanel";
import { FormulationOutput } from "@/components/FormulationOutput";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { IngredientPhotoCapture } from "@/components/IngredientPhotoCapture";
import { OptionalDetectedItems } from "@/components/OptionalDetectedItems";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";
import {
  mergeIngredientLines,
  type DetectedIngredientsResponse,
} from "@/lib/ingredient-detection";
import {
  generatePlaceholderCreateFromIngredients,
  generatePlaceholderFormulation,
  OPTIMIZATION_GOALS,
  type AppMode,
  type FormulationResult,
  type OptimizationGoal,
} from "@/lib/formulation";
import {
  apiResponseToFormulationResult,
  friendlyReformulateError,
  getPayloadError,
  isFallbackPayload,
  isOpenAiPayload,
  parseJsonResponse,
  parseReformulateApiResponse,
} from "@/lib/reformulate-response";
import { PANTRY_STAPLES, SAMPLE_RECIPES } from "@/lib/samples";

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>("reformulate");
  const [recipe, setRecipe] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [goal, setGoal] = useState<OptimizationGoal>("allergen-free");
  const [createGoal, setCreateGoal] = useState<OptimizationGoal | "">("");
  const [useOnlyMyIngredients, setUseOnlyMyIngredients] = useState(false);
  const [output, setOutput] = useState<FormulationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [detectNotice, setDetectNotice] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [optionalDetectedItems, setOptionalDetectedItems] = useState<string[]>(
    []
  );
  const outputRef = useRef<HTMLElement>(null);
  const { recipes: savedRecipes, saveRecipe } = useSavedRecipes();
  const sampleMenuRef = useRef<HTMLDivElement>(null);
  const generateAbortRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);

  const stopGenerating = () => {
    userCancelledRef.current = true;
    generateAbortRef.current?.abort();
    generateAbortRef.current = null;
    setIsGenerating(false);
  };

  useEffect(() => {
    if (!showSampleMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        sampleMenuRef.current &&
        !sampleMenuRef.current.contains(e.target as Node)
      ) {
        setShowSampleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSampleMenu]);

  useEffect(() => {
    setSaveState("idle");
  }, [output]);

  const handleSaveRecipe = () => {
    if (!output) return;
    saveRecipe(output);
    setSaveState("saved");
  };

  const handleGenerate = async () => {
    const isCreate = appMode === "create-from-ingredients";
    const trimmedRecipe = recipe.trim();
    const trimmedIngredients = ingredients.trim();
    const trimmedRestrictions = restrictions.trim();

    if (isCreate) {
      if (!trimmedIngredients) {
        stopGenerating();
        setInputError("Please list the ingredients you have on hand.");
        setOutput(null);
        setApiNotice(null);
        return;
      }
    } else if (!trimmedRecipe) {
      stopGenerating();
      setInputError("Please paste a recipe first.");
      setOutput(null);
      setApiNotice(null);
      return;
    }

    setInputError(null);
    setApiNotice(null);
    setIsGenerating(true);
    setOutput(null);

    userCancelledRef.current = false;
    generateAbortRef.current?.abort();

    const controller = new AbortController();
    generateAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const reference = isCreate ? trimmedIngredients : trimmedRecipe;
    const activeGoal = isCreate ? createGoal || null : goal;

    const requestBody = isCreate
      ? {
          mode: "create-from-ingredients" as const,
          ingredients: trimmedIngredients,
          restrictions: trimmedRestrictions,
          useOnlyMyIngredients,
          ...(createGoal ? { goal: createGoal } : {}),
        }
      : { recipe: trimmedRecipe, goal };

    const fallbackResult = (): FormulationResult =>
      isCreate
        ? generatePlaceholderCreateFromIngredients(
            trimmedIngredients,
            trimmedRestrictions,
            activeGoal,
            useOnlyMyIngredients
          )
        : {
            ...generatePlaceholderFormulation(trimmedRecipe, goal),
            source: "fallback",
          };

    try {
      const response = await fetch("/api/reformulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const payload = await parseJsonResponse(response);

      if (!payload) {
        setOutput(fallbackResult());
        setApiNotice(
          isCreate
            ? "Could not read the recipe response. Showing placeholder recipe."
            : "Could not read the reformulation response. Showing placeholder formulation."
        );
        return;
      }

      if (response.ok && isOpenAiPayload(payload)) {
        const data = parseReformulateApiResponse(payload);
        if (data) {
          setOutput(
            apiResponseToFormulationResult(
              data,
              reference,
              activeGoal,
              "openai",
              appMode,
              isCreate ? trimmedRestrictions || null : null
            )
          );
          setApiNotice(null);
          return;
        }
      }

      if (response.ok && isFallbackPayload(payload)) {
        const data = parseReformulateApiResponse(payload);
        if (data) {
          setOutput(
            apiResponseToFormulationResult(
              data,
              reference,
              activeGoal,
              "fallback",
              appMode,
              isCreate ? trimmedRestrictions || null : null
            )
          );
          setApiNotice(
            getPayloadError(payload) ??
              (isCreate
                ? "AI recipe generation unavailable. Showing placeholder recipe."
                : "AI reformulation unavailable. Showing placeholder formulation.")
          );
          return;
        }
      }

      const apiError =
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as { error?: string }).error === "string"
          ? (payload as { error: string }).error
          : null;

      setOutput(fallbackResult());
      setApiNotice(
        apiError
          ? friendlyReformulateError(apiError)
          : isCreate
            ? "Could not reach the recipe service. Showing placeholder recipe."
            : "Could not reach the reformulation service. Showing placeholder formulation."
      );
    } catch (err) {
      if (userCancelledRef.current) {
        return;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        setOutput(fallbackResult());
        setApiNotice(
          isCreate
            ? "The recipe request timed out. Showing placeholder recipe."
            : "The reformulation request timed out. Showing placeholder formulation."
        );
        return;
      }

      setOutput(fallbackResult());
      setApiNotice(
        isCreate
          ? "Could not reach the recipe service. Showing placeholder recipe."
          : "Could not reach the reformulation service. Showing placeholder formulation."
      );
    } finally {
      clearTimeout(timeoutId);
      if (generateAbortRef.current === controller) {
        generateAbortRef.current = null;
      }
      setIsGenerating(false);
      if (!userCancelledRef.current) {
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  };

  const handleClear = () => {
    stopGenerating();
    setRecipe("");
    setIngredients("");
    setRestrictions("");
    setOutput(null);
    setInputError(null);
    setApiNotice(null);
    setGoal("allergen-free");
    setCreateGoal("");
    setUseOnlyMyIngredients(false);
    setDetectNotice(null);
    setDetectError(null);
    setOptionalDetectedItems([]);
    setShowSampleMenu(false);
  };

  const loadSample = (content: string) => {
    setRecipe(content);
    setOutput(null);
    setInputError(null);
    setApiNotice(null);
    setShowSampleMenu(false);
  };

  const ingredientLines = ingredients
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const isStapleSelected = (staple: string) =>
    ingredientLines.some(
      (line) => line.toLowerCase() === staple.toLowerCase()
    );

  const togglePantryStaple = (staple: string) => {
    const lines = [...ingredientLines];
    const index = lines.findIndex(
      (line) => line.toLowerCase() === staple.toLowerCase()
    );

    if (index >= 0) {
      lines.splice(index, 1);
    } else {
      lines.push(staple);
    }

    const next = lines.join("\n");
    setIngredients(next);
    setOutput(null);
    if (next.trim()) {
      setInputError(null);
    } else {
      setInputError("Please list the ingredients you have on hand.");
    }
    setApiNotice(null);
  };

  const switchMode = (mode: AppMode) => {
    stopGenerating();
    setAppMode(mode);
    setOutput(null);
    setInputError(null);
    setApiNotice(null);
    setDetectNotice(null);
    setDetectError(null);
    setOptionalDetectedItems([]);
  };

  const handleDetectedIngredients = (result: DetectedIngredientsResponse) => {
    if (result.ingredients.length > 0) {
      setIngredients((current) =>
        mergeIngredientLines(current, result.ingredients)
      );
    }

    setOptionalDetectedItems(result.optionalIngredients);
    setOutput(null);
    setInputError(null);
    setDetectError(null);
    setApiNotice(null);

    const mainCount = result.ingredients.length;
    const optionalCount = result.optionalIngredients.length;

    if (mainCount > 0) {
      setDetectNotice(
        result.notes
          ? `Added ${mainCount} main ingredient${mainCount === 1 ? "" : "s"} from your photo. ${optionalCount > 0 ? `${optionalCount} optional item${optionalCount === 1 ? "" : "s"} listed below.` : ""} ${result.notes}`.trim()
          : `Added ${mainCount} main ingredient${mainCount === 1 ? "" : "s"} from your photo.${optionalCount > 0 ? ` ${optionalCount} optional item${optionalCount === 1 ? "" : "s"} listed below.` : ""}`
      );
    } else {
      setDetectNotice(
        result.notes
          ? `No main ingredients were auto-added. Review ${optionalCount} optional item${optionalCount === 1 ? "" : "s"} below. ${result.notes}`
          : `No main ingredients were auto-added. Review ${optionalCount} optional item${optionalCount === 1 ? "" : "s"} below and tap to add any you want.`
      );
    }
  };

  const handleAddOptionalDetectedItem = (item: string) => {
    setIngredients((current) => mergeIngredientLines(current, [item]));
    setOptionalDetectedItems((current) =>
      current.filter((entry) => entry !== item)
    );
    setOutput(null);
    setInputError(null);
    setDetectNotice(`Added "${item}" to your ingredient list.`);
    setDetectError(null);
  };

  const handleDismissOptionalDetectedItem = (item: string) => {
    setOptionalDetectedItems((current) =>
      current.filter((entry) => entry !== item)
    );
  };

  const handleDetectError = (message: string) => {
    if (!message) {
      setDetectError(null);
      return;
    }
    setDetectError(message);
    setDetectNotice(null);
  };

  const panelGoal =
    appMode === "reformulate" ? goal : createGoal || null;

  const handlePanelGoalChange = (value: OptimizationGoal) => {
    if (appMode === "reformulate") {
      setGoal(value);
    } else {
      setCreateGoal(value);
    }
  };

  const hasInput =
    appMode === "reformulate"
      ? recipe.trim().length > 0 || output !== null
      : ingredients.trim().length > 0 ||
        restrictions.trim().length > 0 ||
        output !== null;

  return (
    <AppChrome activeNav="formulator" savedCount={savedRecipes.length}>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:py-11">
        <section className="mb-6 animate-fade-up text-center sm:mb-8">
          <div className="badge-pill mb-3 sm:mb-4">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            OpenAI-powered formulation
          </div>
          <h1 className="hero-title">
            Reformulate recipes with{" "}
            <span className="hero-gradient-text">smart constraints</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-balance text-sm leading-relaxed text-sage-600 sm:mt-4 sm:text-base lg:text-lg">
            Reformulate an existing recipe or build a new one from ingredients
            on hand—powered by OpenAI for allergen-free, vegan, sugar
            reduction, cost, protein, and calorie goals.
          </p>
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
            {OPTIMIZATION_GOALS.map((g) => (
              <span key={g.value} className="goal-chip">
                {g.label}
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8">
          <div className="space-y-5 sm:space-y-6 lg:col-span-3">
            <section className="card-panel-interactive p-4 sm:p-6 lg:p-7">
              <div
                className="mode-tabs mb-5 sm:mb-6"
                role="tablist"
                aria-label="Formulation mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={appMode === "reformulate"}
                  className={`mode-tab ${appMode === "reformulate" ? "mode-tab-active" : ""}`}
                  onClick={() => switchMode("reformulate")}
                >
                  Reformulate Recipe
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appMode === "create-from-ingredients"}
                  className={`mode-tab ${appMode === "create-from-ingredients" ? "mode-tab-active" : ""}`}
                  onClick={() => switchMode("create-from-ingredients")}
                >
                  Create From Ingredients
                </button>
              </div>

              {appMode === "reformulate" ? (
                <>
              <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="section-eyebrow">Step 1</p>
                  <h2 className="section-title mt-1">Recipe input</h2>
                  <p className="section-subtitle">
                    Ingredients, quantities, and method
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative" ref={sampleMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowSampleMenu((v) => !v)}
                      className="btn-secondary"
                      aria-expanded={showSampleMenu}
                      aria-haspopup="listbox"
                    >
                      <svg
                        className="h-4 w-4 text-sage-500"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Sample recipe
                    </button>
                    {showSampleMenu && (
                      <div className="dropdown-panel" role="listbox">
                        {SAMPLE_RECIPES.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => loadSample(sample.content)}
                            className="w-full rounded-xl px-3.5 py-3 text-left transition-all hover:bg-sage-50"
                          >
                            <p className="text-sm font-bold text-sage-900">
                              {sample.label}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-sage-500">
                              {sample.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {hasInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="btn-danger-ghost"
                    >
                      <svg
                        className="h-4 w-4"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="recipe"
                rows={11}
                value={recipe}
                onChange={(e) => {
                  const value = e.target.value;
                  setRecipe(value);
                  if (!value.trim()) {
                    stopGenerating();
                    setOutput(null);
                    setInputError("Please paste a recipe first.");
                    setApiNotice(null);
                  } else if (inputError) {
                    setInputError(null);
                  }
                  if (apiNotice) setApiNotice(null);
                }}
                placeholder="Paste your recipe here…

Example:
Blueberry Muffins
2 cups flour
½ cup sugar
2 eggs
½ cup butter…"
                className="input-textarea"
              />
                </>
              ) : (
                <>
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="section-eyebrow">Step 1</p>
                      <h2 className="section-title mt-1">Ingredients on hand</h2>
                      <p className="section-subtitle">
                        List ingredient names only—no measurements needed
                      </p>
                    </div>
                    {hasInput && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="btn-danger-ghost shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <IngredientPhotoCapture
                    disabled={isGenerating}
                    onDetected={handleDetectedIngredients}
                    onError={handleDetectError}
                  />

                  {detectNotice && (
                    <p
                      className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm font-medium leading-relaxed text-emerald-800"
                      role="status"
                    >
                      {detectNotice}
                    </p>
                  )}

                  {detectError && (
                    <p className="alert-notice mb-4" role="alert">
                      {detectError}
                    </p>
                  )}

                  <OptionalDetectedItems
                    items={optionalDetectedItems}
                    onAdd={handleAddOptionalDetectedItem}
                    onDismiss={handleDismissOptionalDetectedItem}
                  />

                  <div className="mb-4">
                    <p className="field-label mb-2.5">Kitchen staples</p>
                    <div className="flex flex-wrap gap-2">
                      {PANTRY_STAPLES.map((staple) => {
                        const selected = isStapleSelected(staple);
                        return (
                          <button
                            key={staple}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => togglePantryStaple(staple)}
                            className={`pantry-staple ${selected ? "pantry-staple-active" : ""}`}
                          >
                            {staple}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-sage-500">
                      Tap a staple to add it to your list. Tap again to remove.
                    </p>
                  </div>

                  <textarea
                    id="ingredients"
                    rows={7}
                    value={ingredients}
                    onChange={(e) => {
                      const value = e.target.value;
                      setIngredients(value);
                      if (!value.trim()) {
                        stopGenerating();
                        setOutput(null);
                        setInputError(
                          "Please list the ingredients you have on hand."
                        );
                        setApiNotice(null);
                      } else if (inputError) {
                        setInputError(null);
                      }
                      if (apiNotice) setApiNotice(null);
                      if (detectNotice || detectError) {
                        setDetectNotice(null);
                        setDetectError(null);
                      }
                      if (optionalDetectedItems.length > 0) {
                        setOptionalDetectedItems([]);
                      }
                    }}
                    placeholder="List ingredients you have on hand…

Example:
Eggs
Flour
Butter
Onions
Garlic
Rice"
                    className="input-textarea"
                  />

                  <div className="mt-4 sm:mt-5">
                    <label htmlFor="restrictions" className="field-label">
                      Dietary restrictions or allergies
                    </label>
                    <textarea
                      id="restrictions"
                      rows={3}
                      value={restrictions}
                      onChange={(e) => {
                        setRestrictions(e.target.value);
                        if (apiNotice) setApiNotice(null);
                      }}
                      placeholder="e.g. nut-free, dairy-free, gluten-free, no shellfish…"
                      className="input-textarea min-h-[88px]"
                    />
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-sage-200/90 bg-sage-50/40 px-4 py-3.5 transition-colors hover:border-sage-300 hover:bg-sage-50/70">
                    <input
                      type="checkbox"
                      checked={useOnlyMyIngredients}
                      onChange={(e) => {
                        setUseOnlyMyIngredients(e.target.checked);
                        if (apiNotice) setApiNotice(null);
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-sage-300 text-sage-600 focus:ring-sage-500"
                    />
                    <span>
                      <span className="block text-sm font-bold text-sage-900">
                        Use only my ingredients
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-sage-600">
                        Strict mode: the recipe will not suggest optional
                        add-ons outside your list (water allowed for cooking).
                      </span>
                    </span>
                  </label>
                </>
              )}

              <div className="mt-5 space-y-4 border-t border-sage-100 pt-5 sm:mt-6 sm:space-y-5 sm:pt-6">
                <div>
                  <p className="section-eyebrow mb-3">Step 2</p>
                  <label
                    htmlFor={appMode === "reformulate" ? "goal" : "create-goal"}
                    className="field-label"
                  >
                    {appMode === "reformulate"
                      ? "Optimization goal"
                      : "Cooking goal (optional)"}
                  </label>
                  <div className="relative">
                    <select
                      id={appMode === "reformulate" ? "goal" : "create-goal"}
                      value={appMode === "reformulate" ? goal : createGoal}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (appMode === "reformulate") {
                          setGoal(value as OptimizationGoal);
                        } else {
                          setCreateGoal(
                            value ? (value as OptimizationGoal) : ""
                          );
                        }
                      }}
                      className="input-select"
                    >
                      {appMode === "create-from-ingredients" && (
                        <option value="">No specific goal (balanced recipe)</option>
                      )}
                      {OPTIMIZATION_GOALS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sage-400">
                      <svg
                        className="h-5 w-5"
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="section-eyebrow mb-3">Step 3</p>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-primary"
                  >
                  {isGenerating ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {appMode === "create-from-ingredients"
                        ? "Generate recipe"
                        : "Generate formulation"}
                    </>
                  )}
                  </button>
                  {inputError && (
                    <p className="alert-notice mt-3" role="alert">
                      {inputError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section ref={outputRef} className="scroll-mt-24">
              {apiNotice && !isGenerating && (
                <p className="alert-notice mb-3 sm:mb-4" role="alert">
                  {apiNotice}
                </p>
              )}
              {isGenerating && <GeneratingLoader />}
              {!isGenerating && output && (
                <FormulationOutput
                  result={output}
                  onSave={handleSaveRecipe}
                  saveState={saveState}
                />
              )}
              {!isGenerating && !output && (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="mt-4 text-base font-semibold text-sage-800 sm:mt-5">
                    Your formulation will appear here
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sage-500">
                    {appMode === "create-from-ingredients"
                      ? "List your ingredients and optional restrictions, then generate a complete recipe."
                      : "Add a recipe or load a sample, then generate your OpenAI-powered reformulation."}
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-[4.75rem]">
              <ConstraintsPanel
                goal={panelGoal}
                onGoalChange={handlePanelGoalChange}
                mode={appMode}
              />
            </div>
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
