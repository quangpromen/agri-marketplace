import type { AdminDashboardTrendPoint } from "@/server/admin/dashboard";

export const TREND_CHART_WIDTH = 680;
export const TREND_CHART_HEIGHT = 210;
export const TREND_CHART_PADDING = {
  top: 16,
  right: 8,
  bottom: 28,
  left: 40,
} as const;

export const TREND_PLOT_WIDTH =
  TREND_CHART_WIDTH - TREND_CHART_PADDING.left - TREND_CHART_PADDING.right;
export const TREND_PLOT_HEIGHT =
  TREND_CHART_HEIGHT - TREND_CHART_PADDING.top - TREND_CHART_PADDING.bottom;

export const TREND_MAX_BAR_WIDTH = 22;
export const TREND_ZERO_BAR_HEIGHT = 2;
export const TREND_MIN_POSITIVE_BAR_HEIGHT = 4;

export type TrendBarYAxisTick = {
  value: number;
  y: number;
};

export type TrendBarPlotItem = {
  index: number;
  date: string;
  label: string;
  fullDateLabel: string;
  count: number;
  x: number;
  y: number;
  width: number;
  height: number;
  slotX: number;
  slotWidth: number;
  isPeak: boolean;
  showXAxisLabel: boolean;
};

export type TrendBarGeometry = {
  items: TrendBarPlotItem[];
  yTicks: TrendBarYAxisTick[];
  yMax: number;
  totalRequests: number;
  activeDays: number;
  averagePerDay: number;
  maxCount: number;
  peakLabel: string | null;
  peakFullDateLabel: string | null;
  peakDayCount: number;
  baselineY: number;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const percentageFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const averageFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sanitizeNonNegativeCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

export function formatTrendDateLong(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(isoDate.trim());
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatDistributionPercentage(percentage: number): string {
  const safeValue =
    Number.isFinite(percentage) && percentage > 0 ? percentage : 0;
  return `${percentageFormatter.format(safeValue)}%`;
}

export function formatAveragePerDay(average: number): string {
  const safeValue = Number.isFinite(average) && average > 0 ? average : 0;
  return averageFormatter.format(safeValue);
}

/**
 * Generates at most 4 integer Y-axis ticks across 3 equal intervals starting at 0.
 */
export function computeNiceYAxis(maxCount: number): {
  yMax: number;
  ticks: number[];
} {
  const safeMax = sanitizeNonNegativeCount(maxCount);

  if (safeMax <= 3) {
    return {
      yMax: 3,
      ticks: [0, 1, 2, 3],
    };
  }

  let step: number;
  if (safeMax <= 15) {
    step = Math.ceil(safeMax / 3);
  } else {
    const rawStep = safeMax / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const fraction = rawStep / magnitude;
    const niceFraction =
      fraction <= 1
        ? 1
        : fraction <= 2
          ? 2
          : fraction <= 2.5
            ? 2.5
            : fraction <= 5
              ? 5
              : 10;
    step = Math.max(1, Math.round(niceFraction * magnitude));
  }

  const yMax = step * 3;
  return {
    yMax,
    ticks: [0, step, step * 2, yMax],
  };
}

function shouldShowXAxisLabel(index: number, total: number): boolean {
  if (total <= 6) {
    return true;
  }
  if (index === 0 || index === total - 1) {
    return true;
  }
  return index % 3 === 0 && total - 1 - index >= 2;
}

/**
 * Builds an SVG path string for a vertical bar with rounded top corners and a flat baseline.
 */
export function buildRoundedTopBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 4
): string {
  if (width <= 0 || height <= 0) {
    return "";
  }

  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (safeRadius === 0) {
    return `M ${x} ${y} L ${roundCoord(x + width)} ${y} L ${roundCoord(x + width)} ${roundCoord(y + height)} L ${x} ${roundCoord(y + height)} Z`;
  }

  const right = roundCoord(x + width);
  const bottom = roundCoord(y + height);
  const arcLeft = roundCoord(x + safeRadius);
  const arcRight = roundCoord(right - safeRadius);
  const arcTop = roundCoord(y + safeRadius);

  return `M ${x} ${arcTop} Q ${x} ${y} ${arcLeft} ${y} L ${arcRight} ${y} Q ${right} ${y} ${right} ${arcTop} L ${right} ${bottom} L ${x} ${bottom} Z`;
}

/**
 * Computes deterministic bar-chart geometry, integer Y ticks, and summary metrics.
 */
export function buildTrendBarChartGeometry(
  rawPoints: ReadonlyArray<AdminDashboardTrendPoint>
): TrendBarGeometry {
  const sanitizedCounts = rawPoints.map((point) =>
    sanitizeNonNegativeCount(point.count)
  );
  const totalRequests = sanitizedCounts.reduce((acc, value) => acc + value, 0);
  const activeDays = sanitizedCounts.filter((value) => value > 0).length;
  const maxCount = sanitizedCounts.reduce(
    (acc, value) => (value > acc ? value : acc),
    0
  );

  const { yMax, ticks } = computeNiceYAxis(maxCount);
  const baselineY = roundCoord(TREND_CHART_PADDING.top + TREND_PLOT_HEIGHT);

  const yTicks: TrendBarYAxisTick[] = ticks.map((value) => {
    const ratio = yMax > 0 ? value / yMax : 0;
    return {
      value,
      y: roundCoord(baselineY - ratio * TREND_PLOT_HEIGHT),
    };
  });

  const pointCount = rawPoints.length;
  if (pointCount === 0) {
    return {
      items: [],
      yTicks,
      yMax,
      totalRequests: 0,
      activeDays: 0,
      averagePerDay: 0,
      maxCount: 0,
      peakLabel: null,
      peakFullDateLabel: null,
      peakDayCount: 0,
      baselineY,
    };
  }

  const slotWidth = TREND_PLOT_WIDTH / pointCount;
  const barWidth = roundCoord(
    Math.min(TREND_MAX_BAR_WIDTH, Math.max(8, slotWidth * 0.56))
  );

  let latestPeakIndex = -1;
  let peakDayCount = 0;

  const items: TrendBarPlotItem[] = rawPoints.map((point, index) => {
    const safeCount = sanitizedCounts[index] ?? 0;
    const isPeak = maxCount > 0 && safeCount === maxCount;
    if (isPeak) {
      latestPeakIndex = index;
      peakDayCount += 1;
    }

    const slotX = roundCoord(TREND_CHART_PADDING.left + index * slotWidth);
    const barX = roundCoord(slotX + (slotWidth - barWidth) / 2);

    const barHeight =
      safeCount > 0
        ? Math.min(
            TREND_PLOT_HEIGHT,
            Math.max(
              TREND_MIN_POSITIVE_BAR_HEIGHT,
              roundCoord((safeCount / yMax) * TREND_PLOT_HEIGHT)
            )
          )
        : TREND_ZERO_BAR_HEIGHT;

    const barY = roundCoord(baselineY - barHeight);

    return {
      index,
      date: point.date,
      label: point.label,
      fullDateLabel: formatTrendDateLong(point.date),
      count: safeCount,
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight,
      slotX,
      slotWidth: roundCoord(slotWidth),
      isPeak,
      showXAxisLabel: shouldShowXAxisLabel(index, pointCount),
    };
  });

  const latestPeak =
    latestPeakIndex >= 0 ? items[latestPeakIndex] ?? null : null;

  return {
    items,
    yTicks,
    yMax,
    totalRequests,
    activeDays,
    averagePerDay: Math.round((totalRequests / pointCount) * 10) / 10,
    maxCount,
    peakLabel: latestPeak?.label ?? null,
    peakFullDateLabel: latestPeak?.fullDateLabel ?? null,
    peakDayCount,
    baselineY,
  };
}

export type TrendChartKeyboardAction = {
  handled: boolean;
  nextIndex: number | null;
  focusIndex: number | null;
  clearTooltip: boolean;
  isActivationToggle: boolean;
};

export function resolveTrendChartKeyboardAction(
  activeIndex: number | null,
  key: string,
  totalPoints: number,
  focusedIndex: number | null = null
): TrendChartKeyboardAction {
  if (totalPoints <= 0) {
    return {
      handled: false,
      nextIndex: null,
      focusIndex: null,
      clearTooltip: false,
      isActivationToggle: false,
    };
  }

  const baseIndex =
    focusedIndex !== null && focusedIndex >= 0 && focusedIndex < totalPoints
      ? focusedIndex
      : activeIndex !== null && activeIndex >= 0 && activeIndex < totalPoints
        ? activeIndex
        : 0;

  switch (key) {
    case "ArrowRight":
    case "ArrowDown": {
      const nextIndex = Math.min(totalPoints - 1, baseIndex + 1);
      return {
        handled: true,
        nextIndex,
        focusIndex: nextIndex,
        clearTooltip: false,
        isActivationToggle: false,
      };
    }
    case "ArrowLeft":
    case "ArrowUp": {
      const nextIndex = Math.max(0, baseIndex - 1);
      return {
        handled: true,
        nextIndex,
        focusIndex: nextIndex,
        clearTooltip: false,
        isActivationToggle: false,
      };
    }
    case "Home":
      return {
        handled: true,
        nextIndex: 0,
        focusIndex: 0,
        clearTooltip: false,
        isActivationToggle: false,
      };
    case "End": {
      const lastIndex = totalPoints - 1;
      return {
        handled: true,
        nextIndex: lastIndex,
        focusIndex: lastIndex,
        clearTooltip: false,
        isActivationToggle: false,
      };
    }
    case "Escape":
      return {
        handled: true,
        nextIndex: null,
        focusIndex: null,
        clearTooltip: true,
        isActivationToggle: false,
      };
    case "Enter":
    case " ": {
      const shouldClear = activeIndex === baseIndex;
      return {
        handled: true,
        nextIndex: shouldClear ? null : baseIndex,
        focusIndex: baseIndex,
        clearTooltip: shouldClear,
        isActivationToggle: true,
      };
    }
    default:
      return {
        handled: false,
        nextIndex: activeIndex,
        focusIndex: null,
        clearTooltip: false,
        isActivationToggle: false,
      };
  }
}
