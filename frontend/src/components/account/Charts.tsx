"use client";

/**
 * The progress visualisations.
 *
 * Hand-built SVG rather than a charting library: four small charts do not justify a
 * dependency, and a library's defaults would arrive with their own colours, fonts and
 * spacing — the fastest way to make one screen look like it came from a different
 * product.
 *
 * Two rules every chart here follows:
 *
 *  1. **Colour comes from tokens, never literals.** Charts are the most common place a
 *     dark theme breaks, because chart colour is usually written as hex.
 *  2. **Every chart carries a text summary.** A chart that exists only as pixels is a
 *     chart a screen-reader user does not have. The summary is the data, not a caption.
 */

import { useLocale } from "@/hooks/useLocale";
import { BAND_MAX, criterionLabel, type CriterionAverage, type WeeklyVolume } from "@/lib/api";

/** Bands below 4 never appear in practice; starting the axis there wastes half the box. */
const TREND_MIN = 4;

function ChartFrame({
  title,
  hint,
  summary,
  children,
}: {
  title: string;
  hint?: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <figcaption>
        <h3 className="font-display text-headline-sm text-on-surface">{title}</h3>
        {hint && (
          <p className="mt-1 font-body text-body-sm text-on-surface-variant">{hint}</p>
        )}
      </figcaption>
      <div className="mt-4">{children}</div>
      {/* The chart's data in words. Visually hidden, not absent. */}
      <p className="sr-only">{summary}</p>
    </figure>
  );
}

export function BandTrendChart({
  points,
}: {
  points: { date: string; band: number; result_id: string }[];
}) {
  const { t, formatBand, formatDate } = useLocale();

  if (points.length === 0) return null;

  const width = 640;
  const height = 200;
  const padding = { top: 16, right: 12, bottom: 28, left: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const x = (index: number) =>
    padding.left +
    (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (band: number) =>
    padding.top +
    innerHeight -
    ((band - TREND_MIN) / (BAND_MAX - TREND_MIN)) * innerHeight;

  const line = points.map((point, index) => `${x(index)},${y(point.band)}`).join(" ");
  const gridBands = [5, 6, 7, 8, 9];

  return (
    <ChartFrame
      title={t("account.bandTrend")}
      hint={t("account.bandTrendHelp")}
      summary={t("chart.trendSummary", {
        first: formatBand(points[0].band),
        last: formatBand(points[points.length - 1].band),
        count: points.length,
        oldest: formatDate(points[0].date),
        newest: formatDate(points[points.length - 1].date),
      })}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[200px] w-full min-w-[420px]"
          role="img"
          aria-label={t("account.bandTrend")}
        >
          {gridBands.map((band) => (
            <g key={band}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(band)}
                y2={y(band)}
                className="stroke-outline-variant"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y(band) + 4}
                textAnchor="end"
                className="fill-on-surface-variant font-body text-[10px]"
              >
                {band}
              </text>
            </g>
          ))}

          <polyline
            points={line}
            fill="none"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={point.result_id}
              cx={x(index)}
              cy={y(point.band)}
              r="4"
              className="fill-surface-container-lowest stroke-primary"
              strokeWidth="2.5"
            />
          ))}
        </svg>
      </div>
    </ChartFrame>
  );
}

export function CriteriaComparisonChart({ averages }: { averages: CriterionAverage[] }) {
  const { t, locale, formatBand } = useLocale();
  if (averages.length === 0) return null;

  return (
    <ChartFrame
      title={t("account.criterionAverages")}
      summary={t("chart.criteriaSummary", {
        values: averages
          .map((item) => `${criterionLabel(item.code, locale)} ${formatBand(item.average)}`)
          .join("; "),
      })}
    >
      <ul className="flex flex-col gap-3">
        {averages.map((item) => (
          <li key={item.code}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-body text-body-sm text-on-surface">
                {criterionLabel(item.code, locale)}
              </span>
              <span className="font-body text-body-sm tabular-nums text-on-surface-variant">
                {formatBand(item.average)}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
            >
              <span
                className="block h-full rounded-full bg-secondary"
                style={{ width: `${(item.average / BAND_MAX) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

export function WritingVolumeChart({ weeks }: { weeks: WeeklyVolume[] }) {
  const { t, formatNumber, formatDate } = useLocale();
  if (weeks.length === 0) return null;

  const peak = Math.max(...weeks.map((week) => week.words), 1);

  return (
    <ChartFrame
      title={t("account.writingVolume")}
      hint={t("account.writingVolumeHelp")}
      summary={t("chart.volumeSummary", {
        values: weeks
          .map((week) => `${formatDate(week.week_start)}: ${formatNumber(week.words)}`)
          .join("; "),
      })}
    >
      <ul className="flex h-40 items-end gap-2">
        {weeks.map((week) => (
          <li key={week.week_start} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-body text-[10px] tabular-nums text-on-surface-variant">
              {formatNumber(week.words)}
            </span>
            <span
              aria-hidden="true"
              className="w-full rounded-t bg-accent-peach"
              style={{ height: `${Math.max(4, (week.words / peak) * 100)}%` }}
            />
            <span className="truncate font-body text-[10px] text-on-surface-variant">
              {week.week_start.slice(5)}
            </span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/**
 * The consistency grid: one square per day, filled on days with any activity.
 *
 * Anchored to today and counting backwards, so the rightmost square is always "today"
 * regardless of when the fixture data happens to end.
 */
export function ConsistencyGrid({ activeDays, days = 56 }: { activeDays: string[]; days?: number }) {
  const { t } = useLocale();
  const active = new Set(activeDays);

  const cells: { date: string; active: boolean }[] = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    cells.push({ date: iso, active: active.has(iso) });
  }

  const activeCount = cells.filter((cell) => cell.active).length;

  // The current streak, counted backwards from today.
  let streak = 0;
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    if (!cells[index].active) break;
    streak += 1;
  }

  return (
    <ChartFrame
      title={t("account.consistency")}
      hint={t("account.consistencyHelp", { days })}
      summary={t("chart.consistencySummary", { active: activeCount, total: days })}
    >
      <div className="flex flex-wrap gap-1.5">
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={cell.date}
            aria-hidden="true"
            className={`size-3.5 rounded-sm ${
              cell.active ? "bg-tertiary" : "bg-surface-container-high"
            }`}
          />
        ))}
      </div>
      {streak > 0 && (
        <p className="mt-3 font-body text-body-sm text-on-surface-variant">
          {t("account.consistencyStreak", { count: streak })}
        </p>
      )}
    </ChartFrame>
  );
}
