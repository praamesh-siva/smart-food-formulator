"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelBrowserSpeech,
  isBrowserSpeechSupported,
  speakWithBrowser,
} from "@/lib/chef-speech-browser";
import {
  formatChefNarration,
  narrationCacheKey,
} from "@/lib/chef-speech";

export type StepSpeechState = "idle" | "loading" | "speaking" | "paused";
export type SpeechSource = "cloud" | "browser" | null;

interface UseStepSpeechOptions {
  stepNumber?: number;
  totalSteps?: number;
}

const audioUrlCache = new Map<string, string>();

async function fetchChefSpeechAudio(text: string): Promise<string> {
  const cacheKey = narrationCacheKey(text);
  const cached = audioUrlCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch("/api/cook-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let message = "Could not load chef voice.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  audioUrlCache.set(cacheKey, url);
  return url;
}

export function prefetchChefSpeech(text: string): void {
  const cacheKey = narrationCacheKey(text);
  if (!text.trim() || audioUrlCache.has(cacheKey)) return;
  void fetchChefSpeechAudio(text).catch(() => {
    // Prefetch failures are non-blocking.
  });
}

export function useStepSpeech(text: string, options: UseStepSpeechOptions = {}) {
  const { stepNumber = 1, totalSteps = 1 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const usingBrowserRef = useRef(false);
  const [speechState, setSpeechState] = useState<StepSpeechState>("idle");
  const [speechSource, setSpeechSource] = useState<SpeechSource>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (typeof Audio !== "undefined" || isBrowserSpeechSupported());

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onpause = null;
    }
    audioRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    stopAudio();
    cancelBrowserSpeech();
    utteranceRef.current = null;
    usingBrowserRef.current = false;
    setSpeechState("idle");
    setSpeechSource(null);
  }, [stopAudio]);

  const speakWithCloud = useCallback(
    async (variant: "normal" | "repeat") => {
      if (!text.trim()) return;

      const narration = formatChefNarration(
        text,
        stepNumber,
        totalSteps,
        variant
      );
      if (!narration) return;

      cancel();
      setSpeechError(null);
      setSpeechState("loading");

      try {
        const audioUrl = await fetchChefSpeechAudio(narration);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        usingBrowserRef.current = false;
        setSpeechSource("cloud");

        audio.onplay = () => setSpeechState("speaking");
        audio.onpause = () => {
          if (!audio.ended && audio.currentTime > 0) {
            setSpeechState("paused");
          }
        };
        audio.onended = () => {
          stopAudio();
          setSpeechState("idle");
          setSpeechSource(null);
        };
        audio.onerror = () => {
          stopAudio();
          setSpeechState("idle");
          setSpeechSource(null);
          setSpeechError("Could not play chef voice audio.");
        };

        await audio.play();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load chef voice.";

        if (!isBrowserSpeechSupported()) {
          setSpeechError(message);
          setSpeechState("idle");
          return;
        }

        usingBrowserRef.current = true;
        setSpeechSource("browser");
        setSpeechError(`${message} Using browser voice instead.`);

        const utterance = speakWithBrowser(narration, {
          onStart: () => setSpeechState("speaking"),
          onEnd: () => {
            utteranceRef.current = null;
            usingBrowserRef.current = false;
            setSpeechState("idle");
            setSpeechSource(null);
          },
          onError: () => {
            utteranceRef.current = null;
            usingBrowserRef.current = false;
            setSpeechState("idle");
            setSpeechSource(null);
          },
        });

        utteranceRef.current = utterance;
        if (!utterance) {
          setSpeechState("idle");
        }
      }
    },
    [text, stepNumber, totalSteps, cancel, stopAudio]
  );

  const speak = useCallback(() => {
    void speakWithCloud("normal");
  }, [speakWithCloud]);

  const pause = useCallback(() => {
    if (usingBrowserRef.current && isBrowserSpeechSupported()) {
      window.speechSynthesis.pause();
      setSpeechState("paused");
      return;
    }

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setSpeechState("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (usingBrowserRef.current && isBrowserSpeechSupported()) {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      void audio.play();
      setSpeechState("speaking");
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (speechState === "loading") return;

    if (speechState === "speaking") {
      pause();
    } else if (speechState === "paused") {
      resume();
    } else {
      speak();
    }
  }, [speechState, pause, resume, speak]);

  const repeat = useCallback(() => {
    void speakWithCloud("repeat");
  }, [speakWithCloud]);

  useEffect(() => {
    const narration = formatChefNarration(text, stepNumber, totalSteps);
    prefetchChefSpeech(narration);
  }, [text, stepNumber, totalSteps]);

  useEffect(() => {
    cancel();
  }, [text, stepNumber, cancel]);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    speechState,
    speechSource,
    speechError,
    isSupported,
    speak,
    pause,
    resume,
    togglePlayPause,
    repeat,
    cancel,
  };
}
