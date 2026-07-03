"use client";

import { useRef, useState } from "react";
import type { DetectedIngredientsResponse } from "@/lib/ingredient-detection";
import { validateImageFile } from "@/lib/ingredient-detection";

interface IngredientPhotoCaptureProps {
  onDetected: (result: DetectedIngredientsResponse) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function IngredientPhotoCapture({
  onDetected,
  onError,
  disabled = false,
}: IngredientPhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const detectFromFile = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setIsDetecting(true);
    onError("");

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/detect-ingredients", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as DetectedIngredientsResponse & {
        error?: string;
        source?: string;
      };

      if (!response.ok) {
        onError(payload.error ?? "Could not detect ingredients from the photo.");
        return;
      }

      const mainCount = payload.ingredients?.length ?? 0;
      const optionalCount = payload.optionalIngredients?.length ?? 0;

      if (mainCount === 0 && optionalCount === 0) {
        onError(
          payload.error ??
            payload.notes ??
            "No ingredients were detected. Try a clearer photo with labels or items visible."
        );
        return;
      }

      onDetected({
        ingredients: payload.ingredients ?? [],
        optionalIngredients: payload.optionalIngredients ?? [],
        ...(payload.notes ? { notes: payload.notes } : {}),
      });
    } catch {
      onError("Could not reach the ingredient detection service.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await detectFromFile(file);
  };

  const clearPreview = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  return (
    <div className="mb-4 rounded-xl border border-dashed border-sage-300/70 bg-gradient-to-b from-sage-50/50 to-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="field-label">Camera ingredient detection</p>
          <p className="mt-1 text-xs leading-relaxed text-sage-600 sm:text-sm">
            Take or upload a photo. Clear main ingredients are added to your
            list; condiments, sauces, and spices appear as optional items you
            can choose to keep.
          </p>
        </div>
        {previewUrl && !isDetecting && (
          <button
            type="button"
            onClick={clearPreview}
            className="btn-danger-ghost shrink-0 self-start"
          >
            Clear photo
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-sage-200/90 bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded ingredients preview"
            className="max-h-44 w-full rounded-lg object-cover object-center"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || isDetecting}
          onClick={() => cameraInputRef.current?.click()}
          className="btn-secondary"
        >
          {isDetecting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-sage-500"
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
              Detecting…
            </>
          ) : (
            <>
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
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.125 13.875a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                />
              </svg>
              Take photo
            </>
          )}
        </button>

        <button
          type="button"
          disabled={disabled || isDetecting}
          onClick={() => uploadInputRef.current?.click()}
          className="btn-secondary"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3"
            />
          </svg>
          Upload photo
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
