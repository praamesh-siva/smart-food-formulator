"use client";

import { useEffect, useRef, useState } from "react";
import type { FormulationResult } from "@/lib/formulation";

interface FormulationOutputProps {
  result: FormulationResult;
}

const SECTION_HEADINGS = [
  { title: "Ingredients", icon: "list" },
  { title: "Method", icon: "steps" },
  { title: "Substitutions", icon: "swap" },
  { title: "Food Science Notes", icon: "science" },
  { title: "Expected Result", icon: "result" },
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
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-600">
        <SectionIcon type={icon} />
      </span>
      <h3 className="text-base font-semibold text-sage-900">{title}</h3>
    </div>
  );
}

function formatFormulationForCopy(result: FormulationResult): string {
  const lines: string[] = [
    result.recipeName,
    `Goal: ${result.goalLabel}`,
    "",
    "Ingredients",
    ...result.reformulatedIngredients.map((item) => `- ${item}`),
    "",
    "Method",
    ...result.updatedMethod.map((step, i) => `${i + 1}. ${step}`),
  ];

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

export function FormulationOutput({ result }: FormulationOutputProps) {
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
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-sage-200/80 bg-white shadow-lg shadow-sage-900/5">
      <div className="border-b border-sage-100 bg-gradient-to-br from-sage-600 to-sage-700 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sage-200">
              Reformulated output
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {result.recipeName}
            </h2>
            {result.source && (
              <p className="mt-1 text-xs font-medium text-sage-200/80">
                {result.source === "openai" ? "AI generated" : "Fallback mode"}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyOutput}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
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
                Copy output
              </button>
              <span className="inline-flex shrink-0 items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
                {result.goalLabel}
              </span>
            </div>
            {copied && (
              <span className="text-xs font-medium text-sage-100" role="status">
                Copied!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Ingredients */}
          <section className="rounded-xl border border-sage-100 bg-sage-50/40 p-5 sm:p-6">
            <SectionHeading title={SECTION_HEADINGS[0].title} icon={SECTION_HEADINGS[0].icon} />
            <ul className="mt-5 space-y-2.5">
              {result.reformulatedIngredients.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-white px-4 py-3 text-sm leading-relaxed text-sage-800 shadow-sm ring-1 ring-sage-100"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Method */}
          <section className="rounded-xl border border-sage-100 bg-sage-50/40 p-5 sm:p-6">
            <SectionHeading title={SECTION_HEADINGS[1].title} icon={SECTION_HEADINGS[1].icon} />
            <ol className="mt-5 space-y-3">
              {result.updatedMethod.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-sage-100"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sage-600 text-xs font-bold text-white"
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
        <section className="mt-6 rounded-xl border border-sage-100 bg-sage-50/40 p-5 sm:mt-8 sm:p-6">
          <SectionHeading title={SECTION_HEADINGS[2].title} icon={SECTION_HEADINGS[2].icon} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.keySubstitutions.map((sub, i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100"
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-sage-400">
                    Original
                  </p>
                  <p className="text-sm text-sage-500 line-through decoration-sage-300">
                    {sub.original}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-sage-400">
                    Replacement
                  </p>
                  <p className="text-sm font-semibold text-sage-900">
                    {sub.replacement}
                  </p>
                </div>
                <p className="mt-3 border-t border-sage-100 pt-3 text-sm leading-relaxed text-sage-600">
                  {sub.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-8">
          {/* Food Science Notes */}
          <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 sm:p-6">
            <SectionHeading title={SECTION_HEADINGS[3].title} icon={SECTION_HEADINGS[3].icon} />
            <ul className="mt-5 space-y-3">
              {result.foodScienceNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-white/80 px-4 py-3 text-sm leading-relaxed text-sage-700 ring-1 ring-amber-100"
                >
                  <span className="shrink-0 font-bold text-amber-600" aria-hidden>
                    {i + 1}.
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Expected Result */}
          <section className="rounded-xl border border-sage-200 bg-gradient-to-br from-white to-sage-50 p-5 sm:p-6">
            <SectionHeading title={SECTION_HEADINGS[4].title} icon={SECTION_HEADINGS[4].icon} />
            <p className="mt-5 text-sm leading-relaxed text-sage-700 sm:text-base">
              {result.expectedResult}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-600">
                Texture
              </span>
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-600">
                Flavor
              </span>
              <span className="rounded-md bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-600">
                Structure
              </span>
            </div>
          </section>
        </div>

        {result.originalRecipeReference && (
          <section className="mt-6 border-t border-sage-100 pt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-sage-200 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-sage-50"
              aria-expanded={showOriginal}
            >
              <span className="text-sm font-semibold text-sage-800">
                Original recipe reference
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
              <div className="mt-3 rounded-xl border border-sage-200 bg-sage-50/50 p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-sage-600 whitespace-pre-wrap">
                  {result.originalRecipeReference}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
