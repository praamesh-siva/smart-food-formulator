export const CHEF_TTS_MODEL = "gpt-4o-mini-tts";
export const CHEF_TTS_VOICE = "cedar";
export const CHEF_TTS_INSTRUCTIONS =
  "Speak like a warm, charismatic chef guiding a home cook through a recipe. Sound confident, encouraging, and natural—not robotic. Use a relaxed, conversational pace with light enthusiasm, as if you're right beside them in the kitchen.";

export function formatChefNarration(
  step: string,
  stepNumber: number,
  totalSteps: number,
  variant: "normal" | "repeat" = "normal"
): string {
  const cleaned = step.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  if (variant === "repeat") {
    return `Let's go over that once more. ${cleaned}`;
  }

  const openers = [
    `Alright, step ${stepNumber} of ${totalSteps}.`,
    `Here we go. Step ${stepNumber}.`,
    `Next up. Step ${stepNumber}.`,
    `Okay chef, step ${stepNumber}.`,
  ];

  const opener = openers[(stepNumber - 1) % openers.length];
  return `${opener} ${cleaned}`;
}

export function narrationCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}
