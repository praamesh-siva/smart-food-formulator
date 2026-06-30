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
- Provide 2–4 food science notes and a concise expected result.

Allergen-free goal (when optimization goal is Allergen-free):
- NEVER suggest tree-nut milks (almond, cashew, hazelnut) or nut-based flours as default substitutes.
- For dairy milk: prefer rice milk; use certified gluten-free oat milk only when appropriate and label it as such; coconut milk only with a note that coconut is classified as a tree nut by the FDA.
- Avoid soy milk unless no other option applies.
- For eggs in baking: prefer aquafaba or commercial egg replacer; use flax/chia only when seed allergies are not a concern and note that limitation.
- Replace wheat flour with certified gluten-free 1:1 baking flour blends.
- Remove or replace nuts, peanuts, dairy, eggs, and gluten-containing ingredients with safer alternatives.
- Include a food science note reminding users to verify ingredient labels and cross-contamination risk.

Cost optimization goal (when optimization goal is Cost optimization):
- For blueberry muffins and similar bakes: suggest frozen blueberries instead of fresh (fold in frozen, do not thaw).
- Replace butter with vegetable oil or a lower-cost neutral oil; note slightly reduced richness.
- For milk: prefer skim milk or reconstituted dry milk over whole milk; water is acceptable only with an explicit note that the crumb will be less rich and tender.
- Keep inexpensive base ingredients (flour, sugar, salt, baking powder/soda) unchanged unless there is a clear functional reason to swap them.

High protein goal (when optimization goal is High protein):
- First identify where the recipe already has protein (eggs, dairy, meat, flour) and where gains are realistic.
- Prioritize Greek yogurt, extra egg whites, vanilla whey protein powder, cottage cheese, lean poultry, or partial whey flour replacement—match swaps to the recipe type.
- For muffins, cookies, and pancakes: replace about 25% of flour with vanilla whey protein powder, never all of it; warn that excess protein powder makes baked goods dry and dense.
- When using Greek yogurt or protein powder, suggest moisture-balancing steps (retain some milk, add 1–2 tbsp extra liquid if batter is stiff, do not over-mix).
- Whole wheat flour may add fiber and slightly more protein but explain it is not a major protein boost.
- Include a short protein rationale in foodScienceNotes explaining which substitutions increase protein the most.

Low calorie goal (when optimization goal is Low calorie):
- First identify the biggest calorie sources: butter/oil, sugar, full-fat dairy, chocolate, nuts, and oversized portions of calorie-dense ingredients.
- For blueberry muffins and similar bakes: reduce sugar moderately (e.g., 1 cup sugar → ½ to ¾ cup sugar), not an extreme cut that makes the product bland.
- Replace most butter/oil with a moisture-supporting lower-calorie blend—unsweetened applesauce, plain nonfat Greek yogurt, or mashed banana—keeping only 1–2 tbsp oil when needed for texture and browning.
- Use skim milk or other lower-calorie milk instead of whole milk or buttermilk when appropriate.
- Use egg whites where appropriate; if removing yolks, note that richness and tenderness may decrease and compensate with yogurt or applesauce in the wet mix.
- Avoid a dry, bland result: suggest flavor-support options such as extra vanilla, cinnamon, lemon zest, or a modest handful of extra blueberries.
- Include a short calorie rationale in foodScienceNotes explaining which swaps reduce calories the most (fat and sugar first).
- Note quality tradeoffs: lighter texture, less richness, slightly less browning, or a softer dome compared with the full-fat original.`;

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
