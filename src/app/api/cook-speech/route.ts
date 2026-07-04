import { NextResponse } from "next/server";
import {
  cookSpeechErrorMessage,
  synthesizeChefSpeech,
} from "@/lib/chef-speech-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const body = (await request.json()) as { text?: string };

    if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json(
        { error: "Speech text is required." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error: cookSpeechErrorMessage(
            "OpenAI API key is not configured."
          ),
        },
        { status: 503 }
      );
    }

    const audio = await synthesizeChefSpeech(body.text, apiKey);

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not generate chef speech.";
    console.error("[cook-speech] Error:", message);

    return NextResponse.json(
      { error: cookSpeechErrorMessage(message) },
      { status: 502 }
    );
  }
}
