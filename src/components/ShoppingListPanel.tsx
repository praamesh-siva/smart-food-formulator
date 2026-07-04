"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  canShareShoppingList,
  downloadShoppingListText,
  GROCERY_RETAILERS,
  openRetailerSearch,
  shareShoppingList,
  type GroceryRetailer,
} from "@/lib/grocery-export";
import {
  extractShoppingListItems,
  formatGroupedShoppingList,
  groupShoppingListItems,
  type ParsedShoppingItem,
} from "@/lib/shopping-list";

interface ShoppingListPanelProps {
  recipeName: string;
  ingredients: string[];
  onClose: () => void;
}

export function ShoppingListPanel({
  recipeName,
  ingredients,
  onClose,
}: ShoppingListPanelProps) {
  const [items, setItems] = useState<ParsedShoppingItem[]>(() =>
    extractShoppingListItems(ingredients)
  );
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "shared" | "copied" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupedItems = useMemo(() => groupShoppingListItems(items), [items]);
  const exportText = useMemo(
    () => formatGroupedShoppingList(recipeName, items),
    [recipeName, items]
  );
  const shareAvailable = canShareShoppingList();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
    };
  }, []);

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setError(null);
    setShareStatus("idle");
  };

  const handleCopyList = async () => {
    if (items.length === 0) return;

    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setShareStatus("idle");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the shopping list.");
    }
  };

  const handleDownloadList = () => {
    if (items.length === 0) return;
    downloadShoppingListText(recipeName, exportText);
    setError(null);
  };

  const handleShareList = async () => {
    if (items.length === 0) return;

    const result = await shareShoppingList(recipeName, exportText);
    setShareStatus(result);
    setCopied(false);

    if (result === "failed") {
      setError("Could not share the shopping list on this device.");
      return;
    }

    setError(null);
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
    shareTimeoutRef.current = setTimeout(() => setShareStatus("idle"), 2000);
  };

  const handleOpenRetailer = (retailer: GroceryRetailer) => {
    if (items.length === 0) return;
    openRetailerSearch(retailer, items);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sage-950/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-title"
      onClick={onClose}
    >
      <div
        className="animate-fade-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-sage-200/90 bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-sage-100 bg-gradient-to-br from-sage-800 via-sage-700 to-emerald-800 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-100/90">
                Smart shopping list
              </p>
              <h2
                id="shopping-list-title"
                className="font-display mt-1 text-xl font-normal leading-tight text-white sm:text-2xl"
              >
                {recipeName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
                Review ingredients by aisle, remove what you already have, then
                copy, download, share, or open your list at a retailer.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white/10 p-2 text-white ring-1 ring-white/20 transition-all hover:bg-white/20"
              aria-label="Close shopping list"
            >
              <svg
                className="h-5 w-5"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-14rem)] overflow-y-auto px-5 py-4 sm:px-6">
          {items.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm font-semibold text-sage-800">
                No ingredients left in your list
              </p>
              <p className="mt-2 text-sm text-sage-500">
                Close this panel and add ingredients back from the recipe, or
                generate a new recipe.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => (
                <section
                  key={group.category}
                  className="rounded-xl border border-sage-100/90 bg-sage-50/40"
                >
                  <div className="border-b border-sage-100 px-4 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sage-500">
                      {group.label}
                    </p>
                  </div>
                  <ul className="divide-y divide-sage-100">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 px-4 py-3"
                      >
                        <p className="text-sm font-medium leading-relaxed text-sage-900">
                          {item.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="btn-danger-ghost shrink-0 px-2.5 py-1.5 text-xs"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-5 rounded-xl border border-sage-100 bg-white p-4">
              <p className="report-section-label">Shop at a retailer</p>
              <p className="mt-1 text-xs leading-relaxed text-sage-600 sm:text-sm">
                Opens the retailer in a new tab with a search for your list. No
                login is required inside Smart Food Formulator.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {GROCERY_RETAILERS.map((retailer) => (
                  <button
                    key={retailer.id}
                    type="button"
                    onClick={() => handleOpenRetailer(retailer.id)}
                    className="btn-secondary"
                  >
                    {retailer.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="alert-notice mt-4" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-sage-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={handleCopyList}
              disabled={items.length === 0}
              className="btn-secondary justify-center sm:min-w-[9.5rem]"
            >
              {copied ? "Copied!" : "Copy list"}
            </button>
            <button
              type="button"
              onClick={handleDownloadList}
              disabled={items.length === 0}
              className="btn-secondary justify-center sm:min-w-[9.5rem]"
            >
              Download .txt
            </button>
            <button
              type="button"
              onClick={handleShareList}
              disabled={items.length === 0}
              className="btn-secondary justify-center sm:min-w-[9.5rem]"
            >
              {shareStatus === "shared"
                ? "Shared!"
                : shareStatus === "copied"
                  ? "Copied for share"
                  : shareAvailable
                    ? "Share list"
                    : "Share / copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
