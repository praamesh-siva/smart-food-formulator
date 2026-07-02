"use client";

import { useEffect, useRef, useState } from "react";
import type { FormulationResult } from "@/lib/formulation";

interface FormulationOutputProps {
  result: FormulationResult;
  onSave?: () => void;
  saveState?: "idle" | "saved";
}

const SECTION_HEADINGS = [
  { number: "01", title: "Reformulated Ingredients", icon: "list" },
  { number: "02", title: "Updated Method", icon: "steps" },
  { number: "03", title: "Key Substitutions", icon: "swap" },
  { number: "04", title: "Food Science Analysis", icon: "science" },
  { number: "05", title: "Sensory & Quality Outlook", icon: "result" },
] as const;

function SectionIcon({ type }: { type: string }) {
  const className = "h-4 w-4";
  const size = 16;
  switch (type) {
    case "list":
      return (
        <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "steps":
      return (
        <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "swap":
      return (
        <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "science":
      return (
        <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8v4.172a2 2 0 00.586 1.414l2.828 2.828a2 2 0 010 2.828l-2.828 2.828a2 2 0 01-2.828 0l-2.828-2.828a2 2 0 00-2.828 0l-2.828 2.828a2 2 0 01-2.828 0l-2.828-2.828a2 2 0 00-1.414-.586V4" />
        </svg>
      );
    default:
      return (
        <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function SectionHeading({
  number,
  title,
  icon,
}: {
  number: string;
  title: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-sage-100 pb-3">
      <span className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-sage-400">
        {number}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-700 ring-1 ring-sage-200/70">
          <SectionIcon type={icon} />
        </span>
        <h3 className="text-sm font-bold leading-snug tracking-tight text-sage-900 sm:text-[15px]">
          {title}
        </h3>
      </div>
    </div>
  );
}

function formatFormulationForCopy(result: FormulationResult): string {
  const isCreate = result.mode === "create-from-ingredients";
  const meta = result.recipeMetadata;
  const lines: string[] = [
    result.recipeName,
    `Goal: ${result.goalLabel}`,
  ];

  if (meta) {
    lines.push(
      `Servings: ${meta.servings}`,
      `Prep time: ${meta.prepTime}`,
      `Cook time: ${meta.cookTime}`,
      `Difficulty: ${meta.difficulty}`
    );
  }

  lines.push(
    "",
    isCreate ? "Ingredients" : "Ingredients",
    ...result.reformulatedIngredients.map((item) => `- ${item}`),
    "",
    "Method",
    ...result.updatedMethod.map((step, i) => `${i + 1}. ${step}`)
  );

  if (result.missingOptionalIngredients && result.missingOptionalIngredients.length > 0) {
    lines.push("", "Suggested optional ingredients");
    for (const item of result.missingOptionalIngredients) {
      lines.push(`- ${item.ingredient} → ${item.substitute}`);
    }
  }

  if (result.keySubstitutions.length > 0) {
    lines.push("", "Substitutions");
    for (const sub of result.keySubstitutions) {
      lines.push(`${sub.original} → ${sub.replacement}`);
      lines.push(`  ${sub.rationale}`);
    }
  }

  if (result.foodScienceNotes.length > 0) {
    lines.push("", "Food Science Notes");
    result.foodScienceNotes.forEach((note, i) => {
      lines.push(`${i + 1}. ${note}`);
    });
  }

  lines.push("", "Expected Result", result.expectedResult);

  return lines.join("\n");
}

export function FormulationOutput({
  result,
  onSave,
  saveState = "idle",
}: FormulationOutputProps) {
  const isCreate = result.mode === "create-from-ingredients";
  const ingredientsTitle = isCreate ? "Recipe Ingredients" : "Reformulated Ingredients";
  const methodTitle = isCreate ? "Cooking Method" : "Updated Method";
  const meta = result.recipeMetadata;
  const hasSubstitutions = result.keySubstitutions.length > 0;
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(formatFormulationForCopy(result));
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-sage-200/80 bg-white shadow-card">
      <div className="relative overflow-hidden border-b border-sage-700/20 bg-gradient-to-br from-sage-800 via-sage-700 to-emerald-800 px-4 py-5 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, rgb(255 255 255 / 0.2) 0, transparent 42%), radial-gradient(circle at 85% 0%, rgb(255 255 255 / 0.1) 0, transparent 38%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-100/90">
                {isCreate ? "Recipe Report" : "Formulation Report"}
              </p>
              <h2 className="font-display mt-1.5 text-2xl font-normal leading-tight tracking-tight text-white sm:text-3xl">
                {result.recipeName}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saveState === "saved"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-[0.98] disabled:cursor-default disabled:opacity-80"
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
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                    {saveState === "saved" ? "Saved" : "Save recipe"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-[0.98]"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy report
              </button>
              </div>
              {copied && (
                <span className="text-xs font-semibold text-emerald-100" role="status">
                  Copied!
                </span>
              )}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-black/15 p-3 ring-1 ring-white/10 sm:grid-cols-4">
            <div className="sm:px-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                Servings
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {meta?.servings ?? "3–4"}
              </dd>
            </div>
            <div className="sm:px-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                Prep time
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {meta?.prepTime ?? "10 min"}
              </dd>
            </div>
            <div className="sm:px-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                Cook time
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {meta?.cookTime ?? "20 min"}
              </dd>
            </div>
            <div className="sm:px-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                Difficulty
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {meta?.difficulty ?? "Easy"}
              </dd>
            </div>
          </dl>

          <dl className="mt-2 grid grid-cols-1 gap-2 rounded-xl bg-black/10 p-3 ring-1 ring-white/10 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-white/10">
            <div className="sm:px-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                {isCreate ? "Cooking goal" : "Optimization goal"}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {result.goalLabel}
              </dd>
            </div>
            <div className="sm:px-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-sage-200/80">
                Report status
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {result.source === "openai"
                  ? "OpenAI generated"
                  : result.source === "fallback"
                    ? "Backup formulation"
                    : "Complete"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-gradient-to-b from-sage-50/40 to-white p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Ingredients */}
          <section className="report-section">
            <SectionHeading
              number={SECTION_HEADINGS[0].number}
              title={ingredientsTitle}
              icon={SECTION_HEADINGS[0].icon}
            />
            <ul className="mt-4 divide-y divide-sage-100 rounded-xl border border-sage-100/80 bg-sage-50/30">
              {result.reformulatedIngredients.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 px-3.5 py-2.5 text-sm leading-relaxed text-sage-800 sm:px-4 sm:py-3"
                >
                  <span
                    className="mt-0.5 w-5 shrink-0 font-mono text-[11px] font-bold text-sage-400"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Method */}
          <section className="report-section">
            <SectionHeading
              number={SECTION_HEADINGS[1].number}
              title={methodTitle}
              icon={SECTION_HEADINGS[1].icon}
            />
            <ol className="mt-4 space-y-2">
              {result.updatedMethod.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-sage-100/90 bg-sage-50/30 px-3.5 py-2.5 sm:px-4 sm:py-3"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sage-700 text-[11px] font-bold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-sage-700 pt-0.5">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Substitutions */}
        {hasSubstitutions && (
        <section className="report-section mt-4 sm:mt-5">
          <SectionHeading
            number={SECTION_HEADINGS[2].number}
            title={SECTION_HEADINGS[2].title}
            icon={SECTION_HEADINGS[2].icon}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.keySubstitutions.map((sub, i) => (
              <div
                key={i}
                className="rounded-xl border border-sage-100 bg-white p-3.5 sm:p-4"
              >
                <p className="report-section-label">Substitution {i + 1}</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sage-400">
                      Original
                    </p>
                    <p className="mt-0.5 text-sm text-sage-500 line-through decoration-sage-300">
                      {sub.original}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sage-400" aria-hidden>
                    <span className="h-px flex-1 bg-sage-200" />
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="h-px flex-1 bg-sage-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sage-400">
                      Replacement
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-sage-900">
                      {sub.replacement}
                    </p>
                  </div>
                </div>
                <p className="report-divider mt-3 pt-3 text-sm leading-relaxed text-sage-600">
                  <span className="font-semibold text-sage-700">Rationale: </span>
                  {sub.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>
        )}

        {result.missingOptionalIngredients &&
          result.missingOptionalIngredients.length > 0 && (
            <section className="report-section mt-4 sm:mt-5 border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-white">
              <SectionHeading
                number="03b"
                title="Suggested Optional Ingredients"
                icon="swap"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.missingOptionalIngredients.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-100/90 bg-white p-3.5 sm:p-4"
                  >
                    <p className="report-section-label">Optional item {i + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-sage-900">
                      {item.ingredient}
                    </p>
                    <p className="report-divider mt-3 pt-3 text-sm leading-relaxed text-sage-600">
                      <span className="font-semibold text-sage-700">
                        Substitute:{" "}
                      </span>
                      {item.substitute}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        <div className="mt-4 grid gap-4 sm:mt-5 lg:grid-cols-2 lg:gap-5">
          {/* Food Science Notes */}
          <section className="report-section border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white">
            <SectionHeading
              number={SECTION_HEADINGS[3].number}
              title={SECTION_HEADINGS[3].title}
              icon={SECTION_HEADINGS[3].icon}
            />
            <ul className="mt-4 space-y-2">
              {result.foodScienceNotes.map((note, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-amber-100/80 bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80">
                    Finding {i + 1}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-sage-700">
                    {note}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Expected Result */}
          <section className="report-section border-sage-200/80 bg-gradient-to-br from-white to-sage-50/50">
            <SectionHeading
              number={SECTION_HEADINGS[4].number}
              title={SECTION_HEADINGS[4].title}
              icon={SECTION_HEADINGS[4].icon}
            />
            <div className="mt-4 rounded-xl border border-sage-200/70 bg-white p-3.5 sm:p-4">
              <p className="text-sm leading-relaxed text-sage-700 sm:text-[15px]">
                {result.expectedResult}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sage-700">
                Texture
              </span>
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sage-700">
                Flavor
              </span>
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sage-700">
                Structure
              </span>
            </div>
          </section>
        </div>

        {(result.originalRecipeReference || result.restrictionsReference) && (
          <section className="report-divider mt-4 pt-4 sm:mt-5 sm:pt-5">
            <p className="report-section-label mb-2">Appendix</p>
            {result.originalRecipeReference && (
              <>
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-sage-200/90 bg-white px-3.5 py-3 text-left shadow-sm transition-all hover:border-sage-300 hover:bg-sage-50/50 active:scale-[0.995] sm:px-4 sm:py-3.5"
                  aria-expanded={showOriginal}
                >
                  <span className="text-sm font-semibold text-sage-800">
                    {isCreate
                      ? "Available ingredients reference"
                      : "Original recipe reference"}
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-sage-500 transition-transform duration-200 ${
                      showOriginal ? "rotate-180" : ""
                    }`}
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showOriginal && (
                  <div className="mt-2.5 rounded-xl border border-sage-200/90 bg-sage-50/60 p-3.5 sm:p-4">
                    <p className="text-sm leading-relaxed text-sage-600 whitespace-pre-wrap">
                      {result.originalRecipeReference}
                    </p>
                  </div>
                )}
              </>
            )}
            {result.restrictionsReference && (
              <div
                className={`rounded-xl border border-sage-200/90 bg-sage-50/60 p-3.5 sm:p-4 ${result.originalRecipeReference ? "mt-2.5" : ""}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-sage-400">
                  Dietary restrictions
                </p>
                <p className="mt-1 text-sm leading-relaxed text-sage-600 whitespace-pre-wrap">
                  {result.restrictionsReference}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
