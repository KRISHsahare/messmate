import { MessDirectory } from "@/components/discovery/mess-directory";
import { BowlIcon, CompassIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { PageHeading } from "@/components/ui/page-heading";
import { Select } from "@/components/ui/select";
import { listMessDirectory } from "@/lib/data/discovery";

export const metadata = {
  title: "Mess directory",
  description: "Compare hostel messes by price, rating and today's menu.",
};

type SearchParams = Promise<{ q?: string; sort?: string; ids?: string }>;

const SORTS = [
  { value: "rating", label: "Highest rated" },
  { value: "price", label: "Lowest price" },
  { value: "name", label: "Name (A–Z)" },
];

export default async function MessesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 60);
  const sort =
    params.sort === "price" || params.sort === "name" ? params.sort : "rating";

  const { messes, unavailable } = await listMessDirectory({ search, sort });
  const initialSelected = (params.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Discover"
        title="Messes around you"
        description="Real ratings from the students who eat there, the price per meal, and what's cooking today. Tick two or three to compare them side by side."
      />

      <form
        action="/messes"
        method="get"
        className="grid gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200 sm:grid-cols-[1fr_14rem_auto]"
      >
        <Field
          id="mess-search"
          name="q"
          label="Search"
          type="search"
          defaultValue={search}
          placeholder="Mess name or area"
        />
        <Select
          id="mess-sort"
          name="sort"
          label="Sort by"
          defaultValue={sort}
          hint={
            <span className="text-xs font-semibold text-cocoa-400">
              Price sorts cheapest first.
            </span>
          }
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-14 w-full rounded-full bg-brand-500 px-6 font-bold text-white shadow-[var(--shadow-cta)] transition hover:bg-brand-600 focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none sm:w-auto"
          >
            Show messes
          </button>
        </div>
      </form>

      {unavailable ? (
        <EmptyState
          icon={<BowlIcon className="size-6" />}
          title="The directory isn't available"
          description="We couldn't reach the mess database. Check the Supabase configuration and try again."
        />
      ) : messes.length === 0 ? (
        <EmptyState
          icon={<CompassIcon className="size-6" />}
          title={search ? `No messes match “${search}”` : "No messes yet"}
          description={
            search
              ? "Try a shorter search, or clear it to see every mess."
              : "Once messes are added they'll show up here with their menus and ratings."
          }
        />
      ) : (
        <MessDirectory messes={messes} initialSelected={initialSelected} />
      )}
    </div>
  );
}
