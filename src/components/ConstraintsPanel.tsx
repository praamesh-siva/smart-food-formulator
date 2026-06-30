import {
  CONSTRAINT_INFO,
  OPTIMIZATION_GOALS,
  type OptimizationGoal,
} from "@/lib/formulation";

interface ConstraintsPanelProps {
  goal: OptimizationGoal;
  onGoalChange: (goal: OptimizationGoal) => void;
}

export function ConstraintsPanel({ goal, onGoalChange }: ConstraintsPanelProps) {
  const constraint = CONSTRAINT_INFO[goal];

  return (
    <section
      id="constraints"
      className="rounded-2xl border border-sage-200/80 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-sage-900 sm:text-xl">
          Formulation constraints
        </h2>
        <p className="mt-2 text-sm text-sage-600 sm:text-base">
          Each goal applies evidence-based food science principles. Select a
          constraint to preview how reformulation will be guided.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {OPTIMIZATION_GOALS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => onGoalChange(g.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              goal === g.value
                ? "border-sage-500 bg-sage-50 font-semibold text-sage-900 ring-2 ring-sage-500/20 shadow-sm"
                : "border-sage-200 bg-white text-sage-600 hover:border-sage-300 hover:bg-sage-50"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-sage-100 bg-gradient-to-br from-sage-50/80 to-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-sage-900">
          {constraint.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-sage-600">
          {constraint.description}
        </p>
        <ul className="mt-5 space-y-3">
          {constraint.principles.map((principle, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-sage-700">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700"
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
