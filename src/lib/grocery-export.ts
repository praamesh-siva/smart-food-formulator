import type { ParsedShoppingItem } from "@/lib/shopping-list";

export type GroceryRetailer = "instacart" | "walmart" | "amazon-fresh";

export interface GroceryRetailerOption {
  id: GroceryRetailer;
  label: string;
  description: string;
}

export const GROCERY_RETAILERS: GroceryRetailerOption[] = [
  {
    id: "instacart",
    label: "Open in Instacart",
    description: "Search your list on Instacart in a new tab.",
  },
  {
    id: "walmart",
    label: "Open in Walmart",
    description: "Search your list on Walmart in a new tab.",
  },
  {
    id: "amazon-fresh",
    label: "Open in Amazon Fresh",
    description: "Search your list on Amazon Fresh in a new tab.",
  },
];

function buildSearchQuery(items: ParsedShoppingItem[]): string {
  return items
    .map((item) => item.searchName)
    .slice(0, 10)
    .join(" ");
}

export function buildRetailerSearchUrl(
  retailer: GroceryRetailer,
  items: ParsedShoppingItem[]
): string {
  const query = encodeURIComponent(buildSearchQuery(items));

  switch (retailer) {
    case "instacart":
      return `https://www.instacart.com/store/s?k=${query}`;
    case "walmart":
      return `https://www.walmart.com/search?q=${query}`;
    case "amazon-fresh":
      return `https://www.amazon.com/s?k=${query}&i=amazonfresh`;
  }
}

export function openRetailerSearch(
  retailer: GroceryRetailer,
  items: ParsedShoppingItem[]
): void {
  if (items.length === 0) return;
  const url = buildRetailerSearchUrl(retailer, items);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadShoppingListText(
  recipeName: string,
  text: string
): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "shopping-list"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareShoppingList(
  recipeName: string,
  text: string
): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `Shopping list — ${recipeName}`,
        text,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function canShareShoppingList(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
