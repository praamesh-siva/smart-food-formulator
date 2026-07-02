"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AppChromeProps {
  children: ReactNode;
  activeNav?: "formulator" | "saved";
  savedCount?: number;
}

export function AppChrome({
  children,
  activeNav = "formulator",
  savedCount = 0,
}: AppChromeProps) {
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
          <Link href="/" className="flex items-center gap-3.5 transition-opacity hover:opacity-90">
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
              <p className="hidden text-xs font-medium text-sage-500 sm:block">
                Constraint-driven recipe reformulation
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav
              className="flex items-center gap-1 rounded-xl border border-sage-200/90 bg-white/80 p-1 shadow-sm"
              aria-label="Main"
            >
              <Link
                href="/"
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeNav === "formulator"
                    ? "bg-sage-600 text-white shadow-sm"
                    : "text-sage-600 hover:bg-sage-50 hover:text-sage-900"
                }`}
              >
                Formulator
              </Link>
              <Link
                href="/saved"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeNav === "saved"
                    ? "bg-sage-600 text-white shadow-sm"
                    : "text-sage-600 hover:bg-sage-50 hover:text-sage-900"
                }`}
              >
                Saved Recipes
                {savedCount > 0 && (
                  <span
                    className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeNav === "saved"
                        ? "bg-white/20 text-white"
                        : "bg-sage-100 text-sage-700"
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </Link>
            </nav>
            <span className="badge-accent hidden sm:inline-flex">Powered by OpenAI</span>
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-6 border-t border-sage-200/80 bg-white/70 py-6 backdrop-blur-sm sm:mt-8 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium leading-relaxed text-sage-600">
            OpenAI-powered recipe reformulation and pantry-based recipe creation
            for dietary, nutrition, allergen, cost, protein, and calorie goals.
          </p>
          <p className="mt-2 text-xs text-sage-400">
            Smart Food Formulator · AI Formulation Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
