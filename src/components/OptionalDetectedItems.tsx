"use client";

interface OptionalDetectedItemsProps {
  items: string[];
  onAdd: (item: string) => void;
  onDismiss: (item: string) => void;
}

export function OptionalDetectedItems({
  items,
  onAdd,
  onDismiss,
}: OptionalDetectedItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="field-label">Optional detected items</p>
          <p className="mt-1 text-xs leading-relaxed text-sage-600 sm:text-sm">
            These condiments, sauces, spices, and uncertain items from your
            photo are not used in your recipe unless you add them. Tap + to move
            an item into your main ingredient list, or × to remove it from this
            list.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="inline-flex items-center overflow-hidden rounded-full border border-amber-200/90 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="px-3 py-2 text-xs font-semibold text-sage-800 transition-colors hover:bg-amber-50 sm:text-sm"
              aria-label={`Add ${item} to main ingredient list`}
            >
              + {item}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(item)}
              className="border-l border-amber-200/90 px-2.5 py-2 text-sage-400 transition-colors hover:bg-amber-50 hover:text-sage-700"
              aria-label={`Dismiss ${item}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
