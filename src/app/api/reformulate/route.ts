import { NextResponse } from "next/server";
import {
  generateFallbackApiResponse,
  friendlyReformulateError,
  parseReformulateApiResponse,
  type ReformulateApiPayload,
  type ReformulateApiResponse,
} from "@/lib/reformulate-response";
import {
  OPTIMIZATION_GOALS,
  type OptimizationGoal,
} from "@/lib/formulation-types";

export const runtime = "nodejs";

const VALID_GOALS = new Set<OptimizationGoal>(
  OPTIMIZATION_GOALS.map((g) => g.value)
);

const SYSTEM_PROMPT = `You are an expert food formulation scientist. Reformulate recipes according to the user's optimization goal.

Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "title": "recipe title",
  "ingredients": ["ingredient line 1", "ingredient line 2"],
  "method": ["step 1", "step 2"],
  "substitutions": [
    {
      "original": "original ingredient",
      "replacement": "replacement ingredient",
      "rationale": "brief food science reason"
    }
  ],
  "foodScienceNotes": ["note 1", "note 2"],
  "expectedResult": "description of texture, flavor, and eating experience"
}

Rules:
- Keep the original recipe title when possible.
- Preserve original quantities unless a substitution requires a change.
- Method steps must match the recipe type (bowl, bake, sauté, grill, etc.)—never use generic baking dry/wet mixing for savory dishes, bowls, or proteins like salmon.
- List only meaningful substitutions in the substitutions array.
- Provide 2–4 food science notes and a concise expected result.`;

type OpenAIAttempt =
  | { ok: true; data: ReformulateApiResponse }
  | { ok: false; error: string };

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

async function callOpenAI(
  recipe: string,
  goalLabel: string,
  apiKey: string
): Promise<OpenAIAttempt> {
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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Original recipe:\n${recipe}\n\nOptimization goal: ${goalLabel}\n\nReformulate this recipe for the stated goal.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
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
    const parsed = parseReformulateApiResponse(JSON.parse(content));
    if (!parsed) {
      return { ok: false, error: "OpenAI returned an invalid recipe structure." };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: "OpenAI returned malformed JSON." };
  }
}

function fallbackPayload(
  recipe: string,
  goal: OptimizationGoal,
  error: string
): ReformulateApiPayload {
  return {
    source: "fallback",
    error: friendlyReformulateError(error),
    ...generateFallbackApiResponse(recipe, goal),
  };
}

export async function POST(request: Request) {
  try {
    return await handleReformulate(request);
  } catch (err) {
    console.error("[reformulate] Unhandled error:", err);
    return NextResponse.json(
      {
        source: "fallback",
        error:
          "Something went wrong while reformulating. Showing placeholder formulation.",
        title: "Your Recipe",
        ingredients: ["See original recipe reference below."],
        method: ["Prepare ingredients per the original recipe."],
        substitutions: [],
        foodScienceNotes: [],
        expectedResult: "",
      } satisfies ReformulateApiPayload,
      { status: 200 }
    );
  }
}

async function handleReformulate(request: Request) {
  let body: { recipe?: string; goal?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const recipe = body.recipe?.trim() ?? "";
  const goal = body.goal as OptimizationGoal;

  if (!recipe) {
    return NextResponse.json({ error: "Recipe is required" }, { status: 400 });
  }

  if (!goal || !VALID_GOALS.has(goal)) {
    return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  }

  const goalLabel =
    OPTIMIZATION_GOALS.find((g) => g.value === goal)?.label ?? goal;
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      fallbackPayload(
        recipe,
        goal,
        "OpenAI API key is not configured. Showing placeholder formulation."
      )
    );
  }

  try {
    const result = await callOpenAI(recipe, goalLabel, apiKey);
    if (result.ok) {
      const payload: ReformulateApiPayload = {
        source: "openai",
        ...result.data,
      };
      return NextResponse.json(payload);
    }

    console.error("[reformulate] OpenAI error:", result.error);
    return NextResponse.json(
      fallbackPayload(recipe, goal, result.error)
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown OpenAI connection error";
    console.error("[reformulate] OpenAI exception:", message);
    return NextResponse.json(fallbackPayload(recipe, goal, message));
  }
}
