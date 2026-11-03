/**
 * Rupee formatting for the mess directory. Prices are stored as numeric on the
 * mess, so they arrive back as strings from PostgREST in some drivers.
 */
export function formatPrice(pricePerMeal: number | string | null | undefined): string {
  const value =
    typeof pricePerMeal === "string" ? Number(pricePerMeal) : pricePerMeal;

  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Price not listed";
  }

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)}`;
}

/** "₹62 / meal · ₹1,860 / month" style estimate used on the detail page. */
export function monthlyEstimate(
  pricePerMeal: number | string | null | undefined,
  mealsPerDay = 2,
): string | null {
  const value =
    typeof pricePerMeal === "string" ? Number(pricePerMeal) : pricePerMeal;

  if (value === null || value === undefined || Number.isNaN(value) || value <= 0) {
    return null;
  }

  const daysInMonth = new Date(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() + 1,
    0,
  ).getUTCDate();

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value * mealsPerDay * daysInMonth)}`;
}
