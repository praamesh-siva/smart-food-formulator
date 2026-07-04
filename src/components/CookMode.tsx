"use client";

import { useEffect, useState } from "react";
import { useStepSpeech } from "@/hooks/useStepSpeech";

interface CookModeProps {
  recipeName: string;
  steps: string[];
  onClose: () => void;
}

function ControlIcon({
  type,
  className = "h-5 w-5",
}: {
  type: "prev" | "next" | "play" | "pause" | "repeat" | "close";
  className?: string;
}) {
  const size = 20;
  switch (type) {
    case "prev":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      );
    case "next":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      );
    case "play":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "pause":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      );
    case "repeat":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    case "close":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
  }
}

export function CookMode({ recipeName, steps, onClose }: CookModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex] ?? "";
  const totalSteps = steps.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= totalSteps - 1;

  const {
    speechState,
    speechSource,
    speechError,
    isSupported,
    togglePlayPause,
    repeat,
    cancel,
  } = useStepSpeech(currentStep, {
    stepNumber: currentIndex + 1,
    totalSteps,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleClose = () => {
    cancel();
    onClose();
  };

  const goPrevious = () => {
    cancel();
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    cancel();
    setCurrentIndex((index) => Math.min(totalSteps - 1, index + 1));
  };

  const playLabel =
    speechState === "loading"
      ? "Loading chef voice"
      : speechState === "speaking"
        ? "Pause step"
        : speechState === "paused"
          ? "Resume step"
          : "Play step";

  const isSpeechBusy = speechState === "loading";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-sage-900 via-sage-800 to-emerald-900"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cook-mode-title"
      aria-describedby="cook-mode-step"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgb(255 255 255 / 0.15) 0, transparent 45%), radial-gradient(circle at 80% 0%, rgb(255 255 255 / 0.08) 0, transparent 40%)",
        }}
        aria-hidden
      />

      <header className="relative flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-100/80">
            Cook mode
          </p>
          <h2
            id="cook-mode-title"
            className="font-display mt-1 truncate text-lg font-normal text-white sm:text-xl"
          >
            {recipeName}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/20 active:scale-[0.98]"
        >
          <ControlIcon type="close" className="h-4 w-4" />
          Exit
        </button>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100/80">
          Step {currentIndex + 1} of {totalSteps}
        </p>

        <div className="mt-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl sm:p-10">
          <p
            id="cook-mode-step"
            className="text-center text-xl font-medium leading-relaxed text-sage-900 sm:text-2xl sm:leading-relaxed lg:text-3xl lg:leading-snug"
          >
            {currentStep}
          </p>
        </div>

        {!isSupported && (
          <p className="mt-4 max-w-md text-center text-sm text-amber-100/90" role="status">
            Audio playback is not available in this browser. You can still
            follow steps on screen.
          </p>
        )}

        {speechSource === "cloud" && !speechError && (
          <p className="mt-4 text-center text-xs font-medium text-emerald-100/80" role="status">
            Chef voice powered by OpenAI
          </p>
        )}

        {speechError && (
          <p className="mt-4 max-w-md text-center text-sm text-amber-100/90" role="status">
            {speechError}
          </p>
        )}
      </main>

      <footer className="relative border-t border-white/10 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <div className="flex w-full flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={goPrevious}
              disabled={isFirst}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ControlIcon type="prev" className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              disabled={!isSupported || !currentStep.trim() || isSpeechBusy}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-sage-800 shadow-lg transition-all hover:bg-emerald-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={playLabel}
            >
              {isSpeechBusy ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin text-sage-600"
                    width="20"
                    height="20"
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
                  Loading…
                </>
              ) : (
                <>
                  <ControlIcon
                    type={speechState === "speaking" ? "pause" : "play"}
                    className="h-5 w-5"
                  />
                  {speechState === "speaking"
                    ? "Pause"
                    : speechState === "paused"
                      ? "Resume"
                      : "Play"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ControlIcon type="next" className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={repeat}
            disabled={!isSupported || !currentStep.trim() || isSpeechBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ControlIcon type="repeat" className="h-4 w-4" />
            Repeat step
          </button>
        </div>
      </footer>
    </div>
  );
}
