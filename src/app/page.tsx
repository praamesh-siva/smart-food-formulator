"use client";

import { useEffect, useRef, useState } from "react";
import { ConstraintsPanel } from "@/components/ConstraintsPanel";
import { FormulationOutput } from "@/components/FormulationOutput";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import {
  generatePlaceholderFormulation,
  OPTIMIZATION_GOALS,
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
import { SAMPLE_RECIPES } from "@/lib/samples";

export default function Home() {
  const [recipe, setRecipe] = useState("");
  const [goal, setGoal] = useState<OptimizationGoal>("allergen-free");
  const [output, setOutput] = useState<FormulationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const outputRef = useRef<HTMLElement>(null);
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

  const handleGenerate = async () => {
    if (!recipe.trim()) {
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

    const trimmedRecipe = recipe.trim();
    userCancelledRef.current = false;
    generateAbortRef.current?.abort();

    const controller = new AbortController();
    generateAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch("/api/reformulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: trimmedRecipe, goal }),
        signal: controller.signal,
      });

      const payload = await parseJsonResponse(response);

      if (!payload) {
        setOutput({
          ...generatePlaceholderFormulation(trimmedRecipe, goal),
          source: "fallback",
        });
        setApiNotice(
          "Could not read the reformulation response. Showing placeholder formulation."
        );
        return;
      }

      if (response.ok && isOpenAiPayload(payload)) {
        const data = parseReformulateApiResponse(payload);
        if (data) {
          setOutput(
            apiResponseToFormulationResult(data, trimmedRecipe, goal, "openai")
          );
          setApiNotice(null);
          return;
        }
      }

      if (response.ok && isFallbackPayload(payload)) {
        const data = parseReformulateApiResponse(payload);
        if (data) {
          setOutput(
            apiResponseToFormulationResult(data, trimmedRecipe, goal, "fallback")
          );
          setApiNotice(
            getPayloadError(payload) ??
              "AI reformulation unavailable. Showing placeholder formulation."
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

      setOutput({
        ...generatePlaceholderFormulation(trimmedRecipe, goal),
        source: "fallback",
      });
      setApiNotice(
        apiError
          ? friendlyReformulateError(apiError)
          : "Could not reach the reformulation service. Showing placeholder formulation."
      );
    } catch (err) {
      if (userCancelledRef.current) {
        return;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        setOutput({
          ...generatePlaceholderFormulation(trimmedRecipe, goal),
          source: "fallback",
        });
        setApiNotice(
          "The reformulation request timed out. Showing placeholder formulation."
        );
        return;
      }

      setOutput({
        ...generatePlaceholderFormulation(trimmedRecipe, goal),
        source: "fallback",
      });
      setApiNotice(
        "Could not reach the reformulation service. Showing placeholder formulation."
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
    setOutput(null);
    setInputError(null);
    setApiNotice(null);
    setGoal("allergen-free");
    setShowSampleMenu(false);
  };

  const loadSample = (content: string) => {
    setRecipe(content);
    setOutput(null);
    setInputError(null);
    setApiNotice(null);
    setShowSampleMenu(false);
  };

  const hasInput = recipe.trim().length > 0 || output !== null;

  return (
    <div className="app-shell">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-hero-mesh"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(148 163 184 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -left-24 top-32 -z-10 h-72 w-72 rounded-full bg-sage-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-16 top-64 -z-10 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl"
        aria-hidden
      />

      <header className="glass-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-600 to-sage-700 text-white shadow-glow">
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
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.377-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-sage-900">
                Smart Food Formulator
              </p>
              <p className="text-xs font-medium text-sage-500 hidden sm:block">
                Constraint-driven recipe reformulation
              </p>
            </div>
          </div>
          <span className="badge-accent">Powered by OpenAI</span>
        </div>
      </header>

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
            Paste a recipe, choose an optimization goal, and generate an
            OpenAI-powered reformulation—tailored for allergen-free, vegan,
            sugar reduction, cost, protein, or calorie targets.
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

              <div className="mt-5 space-y-4 border-t border-sage-100 pt-5 sm:mt-6 sm:space-y-5 sm:pt-6">
                <div>
                  <p className="section-eyebrow mb-3">Step 2</p>
                  <label htmlFor="goal" className="field-label">
                    Optimization goal
                  </label>
                  <div className="relative">
                    <select
                      id="goal"
                      value={goal}
                      onChange={(e) =>
                        setGoal(e.target.value as OptimizationGoal)
                      }
                      className="input-select"
                    >
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
                      Generate formulation
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
              {!isGenerating && output && <FormulationOutput result={output} />}
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
                    Add a recipe or load a sample, then generate your
                    OpenAI-powered reformulation.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-[4.75rem]">
              <ConstraintsPanel goal={goal} onGoalChange={setGoal} />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-6 border-t border-sage-200/80 bg-white/70 py-6 backdrop-blur-sm sm:mt-8 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium leading-relaxed text-sage-600">
            OpenAI-powered recipe reformulation for dietary, nutrition, allergen,
            cost, protein, and calorie goals.
          </p>
          <p className="mt-2 text-xs text-sage-400">
            Smart Food Formulator · AI Formulation Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
