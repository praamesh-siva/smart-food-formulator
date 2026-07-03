import { NextResponse } from "next/server";
import {
  parseDetectedIngredientsResponse,
  type DetectIngredientsApiPayload,
} from "@/lib/ingredient-detection";

export const runtime = "nodejs";

const DETECT_INGREDIENTS_PROMPT = `You are a food ingredient recognition assistant. Analyze the photo and sort visible food into two lists for a home cook building a recipe.

Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "ingredients": ["main ingredient 1", "main ingredient 2"],
  "optionalIngredients": ["optional item 1", "optional item 2"],
  "notes": "optional brief note about visibility or uncertainty"
}

Rules for "ingredients" (main list — max 12 items):
- Include only clear, usable main ingredients for building a recipe: proteins, eggs, dairy, vegetables, fresh fruit, grains, pasta, rice, flour, bread, beans, lentils, tofu, cheese, milk, butter, cooking oil, onions, garlic, potatoes, canned tomatoes (for cooking), frozen vegetables, etc.
- Limit to the 8–12 most useful main items if more are visible.
- Use simple names only—no measurements.
- Do NOT put condiments, sauces, spices, pickles, or uncertain items in this list.

Rules for "optionalIngredients":
- Put condiments, sauces, spices, seasonings, and uncertain/partially visible items here.
- Always include items like mustard, soy sauce, pickles, relish, ketchup, mayo, hot sauce, vinegar, jam, canned fruit, salad dressing, and individual spices here—not in the main list.
- Use cautious wording for uncertain items (e.g., "Possible hot sauce bottle").

General:
- Do not invent items that are not visible or strongly implied.
- Return empty arrays when nothing fits a category.
- Keep notes to one short sentence when helpful; otherwise use an empty string.`;

async function readOpenAIError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (body.error?.message) return body.error.message;
  } catch {
    // ignore
  }
  return `OpenAI request failed (${response.status})`;
}

async function detectWithOpenAI(
  dataUrl: string,
  apiKey: string
): Promise<
  | { ok: true; data: DetectIngredientsApiPayload }
  | { ok: false; error: string }
> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DETECT_INGREDIENTS_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify food in this photo. Put clear main recipe ingredients in ingredients (max 12). Put condiments, sauces, spices, and uncertain items in optionalIngredients only.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await readOpenAIError(response) };
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, error: "OpenAI returned an empty response." };
  }

  try {
    const parsed = parseDetectedIngredientsResponse(JSON.parse(content));
    if (!parsed) {
      return { ok: false, error: "OpenAI returned an invalid ingredient list." };
    }

    return {
      ok: true,
      data: {
        source: "openai",
        ingredients: parsed.ingredients,
        optionalIngredients: parsed.optionalIngredients,
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      },
    };
  } catch {
    return { ok: false, error: "OpenAI returned malformed JSON." };
  }
}

function fallbackPayload(error: string): DetectIngredientsApiPayload {
  const lower = error.toLowerCase();
  let message = "Could not detect ingredients from the photo.";

  if (lower.includes("not configured")) {
    message = error;
  } else if (lower.includes("quota") || lower.includes("billing")) {
    message = "Ingredient detection is unavailable right now (API quota exceeded).";
  } else if (lower.includes("invalid_api_key") || lower.includes("incorrect api key")) {
    message = "Ingredient detection is unavailable (invalid API key).";
  } else if (lower.includes("rate limit")) {
    message = "Ingredient detection is busy right now. Try again shortly.";
  }

  return {
    source: "fallback",
    ingredients: [],
    optionalIngredients: [],
    error: message,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file." },
        { status: 400 }
      );
    }

    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 8 MB or smaller." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        fallbackPayload(
          "OpenAI API key is not configured. Ingredient detection is unavailable."
        )
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type};base64,${buffer.toString("base64")}`;

    const result = await detectWithOpenAI(dataUrl, apiKey);
    if (result.ok) {
      return NextResponse.json(result.data);
    }

    console.error("[detect-ingredients] OpenAI error:", result.error);
    return NextResponse.json(fallbackPayload(result.error));
  } catch (err) {
    console.error("[detect-ingredients] Unhandled error:", err);
    return NextResponse.json(
      fallbackPayload("Something went wrong while detecting ingredients.")
    );
  }
}
