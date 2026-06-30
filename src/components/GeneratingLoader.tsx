"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Parsing recipe structure",
  "Mapping ingredient functions",
  "Applying formulation constraints",
  "Balancing texture and flavor",
  "Finalizing formulation",
];

export function GeneratingLoader() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-sage-200/80 bg-white shadow-lg shadow-sage-900/5"
      role="status"
      aria-live="polite"
      aria-label="Generating formulation"
    >
      <div className="border-b border-sage-100 bg-gradient-to-r from-sage-50 to-white px-6 py-5 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border-2 border-sage-200"
              aria-hidden
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-sage-600 border-t-transparent animate-spin"
              aria-hidden
            />
            <svg
              className="h-5 w-5 text-sage-600"
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
            <p className="text-sm font-semibold text-sage-900">
              Generating formulation
            </p>
            <p className="text-sm text-sage-500">
              Applying food science constraints to your recipe…
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <ul className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-sage-50 border border-sage-200"
                    : "border border-transparent"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isDone
                      ? "bg-sage-600 text-white"
                      : isActive
                        ? "bg-sage-600 text-white animate-pulse"
                        : "bg-sage-100 text-sage-400"
                  }`}
                  aria-hidden
                >
                  {isDone ? (
                    <svg
                      className="h-3.5 w-3.5"
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-sm ${
                    isActive || isDone
                      ? "font-medium text-sage-800"
                      : "text-sage-400"
                  }`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sage-100">
          <div
            className="h-full rounded-full bg-sage-600 transition-all duration-500 ease-out"
            style={{
              width: `${((activeStep + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
