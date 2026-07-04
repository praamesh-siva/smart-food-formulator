import {
  CHEF_TTS_INSTRUCTIONS,
  CHEF_TTS_MODEL,
  CHEF_TTS_VOICE,
} from "@/lib/chef-speech";

const MAX_TTS_INPUT_CHARS = 4096;

async function readOpenAIError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (body.error?.message) return body.error.message;
  } catch {
    // ignore
  }
  return `OpenAI speech request failed (${response.status})`;
}

export async function synthesizeChefSpeech(
  text: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const input = text.trim().slice(0, MAX_TTS_INPUT_CHARS);
  if (!input) {
    throw new Error("Speech text is required.");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHEF_TTS_MODEL,
      voice: CHEF_TTS_VOICE,
      input,
      instructions: CHEF_TTS_INSTRUCTIONS,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(await readOpenAIError(response));
  }

  return response.arrayBuffer();
}

export function cookSpeechErrorMessage(error: string): string {
  const lower = error.toLowerCase();

  if (lower.includes("not configured")) {
    return "Chef voice is unavailable (API key not configured).";
  }
  if (lower.includes("quota") || lower.includes("billing")) {
    return "Chef voice is unavailable right now (API quota exceeded).";
  }
  if (lower.includes("invalid_api_key") || lower.includes("incorrect api key")) {
    return "Chef voice is unavailable (invalid API key).";
  }
  if (lower.includes("rate limit")) {
    return "Chef voice is busy right now. Try again shortly.";
  }

  return "Chef voice is unavailable right now.";
}
