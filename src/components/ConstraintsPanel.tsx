import {
  CONSTRAINT_INFO,
  OPTIMIZATION_GOALS,
  type AppMode,
  type OptimizationGoal,
} from "@/lib/formulation";

interface ConstraintsPanelProps {
  goal: OptimizationGoal | null;
  onGoalChange: (goal: OptimizationGoal) => void;
  mode: AppMode;
}

const CREATE_GENERAL_GUIDANCE = {
  title: "Pantry-first recipe design",
  description:
    "Recipes are built from ingredients you list, with optional goals and strict respect for dietary restrictions.",
  principles: [
    "Prioritize ingredients already on hand; only assume basic staples like salt, pepper, and water unless restricted.",
    "List missing optional items with practical substitutes when a pantry gap would improve the dish.",
    "Match cooking method to what you have—bakes, skillets, one-pot meals, or bowls.",
    "When a cooking goal is selected, apply the same food-science principles as recipe reformulation.",
  ],
};

export function ConstraintsPanel({
  goal,
  onGoalChange,
  mode,
}: ConstraintsPanelProps) {
  const constraint = goal ? CONSTRAINT_INFO[goal] : CREATE_GENERAL_GUIDANCE;
  const isCreate = mode === "create-from-ingredients";

  return (
    <section
      id="constraints"
      className="card-panel overflow-hidden p-4 sm:p-6"
    >
      <div className="mb-5 border-b border-sage-100 pb-4 sm:mb-6 sm:pb-5">
        <p className="section-eyebrow">Guidance</p>
        <h2 className="section-title mt-1.5">Formulation constraints</h2>
        <p className="section-subtitle">
          {isCreate
            ? "Optional goals and restrictions guide how recipes are composed from your pantry."
            : "Each goal applies evidence-based food science principles. Select a constraint to preview how reformulation will be guided."}
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {OPTIMIZATION_GOALS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => onGoalChange(g.value)}
            className={`rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
              goal === g.value
                ? "border-sage-500 bg-gradient-to-br from-sage-50 to-white font-bold text-sage-900 shadow-sm ring-2 ring-sage-500/20"
                : "border-sage-200/90 bg-white font-semibold text-sage-600 hover:border-sage-300 hover:bg-sage-50/80 hover:shadow-sm active:scale-[0.99]"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-sage-100 bg-gradient-to-br from-sage-50/90 via-white to-sage-50/40 p-4 shadow-inset sm:mt-6 sm:p-5">
        <div className="mb-4 inline-flex rounded-full bg-sage-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage-700">
          {goal ? "Active constraint" : "Default approach"}
        </div>
        <h3 className="font-display text-xl tracking-tight text-sage-900">
          {constraint.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-sage-600">
          {constraint.description}
        </p>
        <ul className="mt-5 space-y-3">
          {constraint.principles.map((principle, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl bg-white/80 px-3.5 py-3 text-sm leading-relaxed text-sage-700 ring-1 ring-sage-100"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-sage-500 to-sage-600 text-xs font-bold text-white shadow-sm"
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{principle}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
