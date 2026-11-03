"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MealComparison, TrendPoint } from "@/lib/data/admin";
import { MEAL_META } from "@/lib/meals";

const AXIS = { fontSize: 11, fill: "#a08a79", fontWeight: 700 };
const GRID = "#f7e3c6";

const SERIES = [
  { key: "breakfast", label: "Breakfast", color: "#f97316" },
  { key: "lunch", label: "Lunch", color: "#2f7a46" },
  { key: "dinner", label: "Dinner", color: "#2f5aa8" },
] as const;

const BAR_COLORS: Record<string, string> = {
  breakfast: "#f97316",
  lunch: "#2f7a46",
  dinner: "#2f5aa8",
};

function formatStars(value: unknown): string {
  if (value === null || value === undefined) return "no ratings";
  return `${Number(value).toFixed(1)} ★`;
}

function ChartFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
      <figcaption>
        <h2 className="text-base font-extrabold text-cocoa-900">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold text-cocoa-500">{description}</p>
      </figcaption>
      {children}
    </figure>
  );
}

/** Average stars per meal type for every day of the last 30 days. */
export function RatingTrendChart({ data }: { data: TrendPoint[] }) {
  const rated = data.some(
    (point) => point.breakfast !== null || point.lunch !== null || point.dinner !== null,
  );

  return (
    <ChartFrame
      title="Average rating, last 30 days"
      description="One line per meal type, averaged across every mess."
    >
      <div
        className="mt-3 h-64 w-full"
        role="img"
        aria-label={`Line chart of the average rating for breakfast, lunch and dinner over the last 30 days. ${
          rated ? "Higher is better." : "No ratings in this window yet."
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              minTickGap={12}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #f7e3c6",
                fontSize: 12,
                fontWeight: 700,
                color: "#3e2a1e",
              }}
              labelStyle={{ color: "#806a58", fontWeight: 700 }}
              formatter={(value) => formatStars(value)}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-cocoa-500">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {MEAL_META[series.key].label}
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/** Breakfast vs lunch vs dinner, averaged over the same 30-day window. */
export function MealComparisonChart({ data }: { data: MealComparison[] }) {
  const chartData = data.map((meal) => ({
    name: meal.label,
    mealType: meal.mealType,
    stars: meal.averageStars ?? 0,
    ratings: meal.ratingCount,
  }));

  const hasData = data.some((meal) => meal.averageStars !== null);

  return (
    <ChartFrame
      title="Breakfast vs lunch vs dinner"
      description="Which service students rate highest, over the last 30 days."
    >
      <div
        className="mt-3 h-64 w-full"
        role="img"
        aria-label={`Bar chart comparing the average rating of breakfast, lunch and dinner. ${
          hasData ? "" : "No ratings in this window yet."
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "#fff8ea" }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #f7e3c6",
                fontSize: 12,
                fontWeight: 700,
                color: "#3e2a1e",
              }}
              labelStyle={{ color: "#806a58", fontWeight: 700 }}
              formatter={(value, _name, item) => {
                const payload = item?.payload as { ratings?: number } | undefined;
                return [
                  `${Number(value).toFixed(1)} ★`,
                  `${payload?.ratings ?? 0} ratings`,
                ];
              }}
            />
            <Bar dataKey="stars" radius={[10, 10, 0, 0]} maxBarSize={72}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.mealType}
                  fill={BAR_COLORS[entry.mealType] ?? "#f97316"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 grid grid-cols-3 gap-2 text-xs font-bold text-cocoa-500">
        {data.map((meal) => (
          <li key={meal.mealType}>
            {meal.label}:{" "}
            <span className="text-cocoa-900">
              {meal.averageStars === null ? "–" : meal.averageStars.toFixed(1)}
            </span>{" "}
            <span className="font-semibold text-cocoa-400">
              ({meal.ratingCount})
            </span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}
