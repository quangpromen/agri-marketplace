"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  buildRoundedTopBarPath,
  buildTrendBarChartGeometry,
  formatAveragePerDay,
  resolveTrendChartKeyboardAction,
  type TrendChartViewportVariant,
} from "@/lib/admin-dashboard-chart";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminDashboardTrendPoint } from "@/server/admin/dashboard";

interface AdminRequestTrendChartProps {
  trend: AdminDashboardTrendPoint[];
  defaultActiveIndex?: number | null;
  defaultViewport?: TrendChartViewportVariant;
}

export function AdminRequestTrendChart({
  trend,
  defaultActiveIndex = null,
  defaultViewport = "desktop",
}: AdminRequestTrendChartProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const headingId = `trend-heading-${safeId}`;
  const subtitleId = `trend-subtitle-${safeId}`;
  const svgTitleId = `trend-svg-title-${safeId}`;
  const svgDescId = `trend-svg-desc-${safeId}`;

  const [viewport, setViewport] =
    useState<TrendChartViewportVariant>(defaultViewport);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = () => {
      setViewport(mediaQuery.matches ? "mobile" : "desktop");
    };

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }
    return undefined;
  }, []);

  const isMobileLayout = viewport === "mobile";
  const geometry = buildTrendBarChartGeometry(trend, viewport);
  const pointCount = geometry.items.length;

  const validDefaultIndex =
    defaultActiveIndex !== null &&
    defaultActiveIndex >= 0 &&
    defaultActiveIndex < pointCount
      ? defaultActiveIndex
      : null;

  const initialTabStopIndex =
    validDefaultIndex ?? (pointCount > 0 ? pointCount - 1 : 0);

  const [pinnedIndex, setPinnedIndex] = useState<number | null>(
    validDefaultIndex
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [dismissedFocusIndex, setDismissedFocusIndex] = useState<number | null>(
    null
  );
  const [tabStopIndex, setTabStopIndex] = useState<number>(initialTabStopIndex);

  const barRefs = useRef<Array<SVGRectElement | null>>([]);
  const barsGroupRef = useRef<SVGGElement | null>(null);

  const visibleFocusIndex =
    focusedIndex !== null && dismissedFocusIndex !== focusedIndex
      ? focusedIndex
      : null;

  const rawActiveIndex = hoveredIndex ?? visibleFocusIndex ?? pinnedIndex;
  const activeItem =
    rawActiveIndex !== null &&
    rawActiveIndex >= 0 &&
    rawActiveIndex < pointCount
      ? geometry.items[rawActiveIndex] ?? null
      : null;

  const safeTabStopIndex =
    pointCount > 0
      ? Math.min(Math.max(0, tabStopIndex), pointCount - 1)
      : -1;

  const firstItem = geometry.items[0] ?? null;
  const lastItem =
    pointCount > 0 ? geometry.items[pointCount - 1] ?? null : null;

  const rangeLabel =
    firstItem && lastItem ? `${firstItem.label} – ${lastItem.label}` : null;

  const peakSummaryText =
    geometry.maxCount > 0 && geometry.peakLabel
      ? geometry.peakDayCount > 1
        ? `${formatNumber(geometry.maxCount)} yêu cầu (${geometry.peakLabel} · ${geometry.peakDayCount} ngày)`
        : `${formatNumber(geometry.maxCount)} yêu cầu · ${geometry.peakLabel}`
      : "0 yêu cầu";

  const svgDescription =
    pointCount > 0
      ? geometry.maxCount > 0 && geometry.peakFullDateLabel
        ? `Biểu đồ cột thể hiện tổng cộng ${formatNumber(geometry.totalRequests)} yêu cầu tư vấn trong ${pointCount} ngày gần nhất từ ${firstItem?.fullDateLabel ?? ""} đến ${lastItem?.fullDateLabel ?? ""}, cao nhất ${formatNumber(geometry.maxCount)} yêu cầu vào ngày ${geometry.peakFullDateLabel}.`
        : `Biểu đồ cột thể hiện 0 yêu cầu tư vấn trong ${pointCount} ngày gần nhất từ ${firstItem?.fullDateLabel ?? ""} đến ${lastItem?.fullDateLabel ?? ""}.`
      : "Chưa có dữ liệu xu hướng yêu cầu tư vấn.";

  const liveAnnouncement = activeItem
    ? `Ngày ${activeItem.fullDateLabel}: ${formatNumber(activeItem.count)} yêu cầu tư vấn${activeItem.isPeak ? " (Cao nhất trong kỳ)" : ""}`
    : "";

  const handleBarKeyDown = (
    event: React.KeyboardEvent<SVGRectElement>,
    barIndex: number
  ) => {
    const action = resolveTrendChartKeyboardAction(
      activeItem?.index ?? null,
      event.key,
      pointCount,
      barIndex
    );

    if (!action.handled) {
      return;
    }

    event.preventDefault();

    if (action.clearTooltip && !action.isActivationToggle) {
      setPinnedIndex(null);
      setHoveredIndex(null);
      setDismissedFocusIndex(barIndex);
      return;
    }

    if (action.isActivationToggle) {
      if (action.nextIndex === null) {
        setPinnedIndex(null);
        setHoveredIndex(null);
        setDismissedFocusIndex(barIndex);
      } else {
        setTabStopIndex(action.nextIndex);
        setFocusedIndex(action.nextIndex);
        setPinnedIndex(action.nextIndex);
        setDismissedFocusIndex(null);
      }
      return;
    }

    if (action.focusIndex !== null) {
      setHoveredIndex(null);
      setDismissedFocusIndex(null);
      setTabStopIndex(action.focusIndex);
      setFocusedIndex(action.focusIndex);
      barRefs.current[action.focusIndex]?.focus();
    }
  };

  const getTooltipPositionStyle = () => {
    if (!activeItem) {
      return null;
    }

    const isTallBar = activeItem.y < geometry.chartHeight * 0.33;
    if (isTallBar) {
      if (isMobileLayout) {
        if (activeItem.index <= 4) {
          return {
            style: {
              left: `${((activeItem.x + activeItem.width + 6) / geometry.chartWidth) * 100}%`,
              top: `${Math.max(4, Math.round((activeItem.y / geometry.chartHeight) * 100))}%`,
            },
            alignClass: "translate-x-0",
          };
        }

        if (activeItem.index >= pointCount - 5) {
          return {
            style: {
              left: `${((activeItem.x - 6) / geometry.chartWidth) * 100}%`,
              top: `${Math.max(4, Math.round((activeItem.y / geometry.chartHeight) * 100))}%`,
            },
            alignClass: "-translate-x-full",
          };
        }

        return {
          style: {
            left: "50%",
            top: `${Math.max(4, Math.round((activeItem.y / geometry.chartHeight) * 100))}%`,
          },
          alignClass: "-translate-x-1/2",
        };
      }

      const placeOnLeft = activeItem.index >= pointCount - 4;
      return {
        style: {
          left: placeOnLeft
            ? `${((activeItem.x - 8) / geometry.chartWidth) * 100}%`
            : `${((activeItem.x + activeItem.width + 8) / geometry.chartWidth) * 100}%`,
          top: `${Math.max(4, Math.round((activeItem.y / geometry.chartHeight) * 100))}%`,
        },
        alignClass: placeOnLeft ? "-translate-x-full" : "translate-x-0",
      };
    }

    const edgeThreshold = isMobileLayout ? 4 : 2;
    const isLeftEdge = activeItem.index < edgeThreshold;
    const isRightEdge = activeItem.index >= pointCount - edgeThreshold;
    const leftValue = isLeftEdge
      ? activeItem.x
      : isRightEdge
        ? activeItem.x + activeItem.width
        : activeItem.x + activeItem.width / 2;

    return {
      style: {
        left: `${(leftValue / geometry.chartWidth) * 100}%`,
        bottom: `${Math.min(
          86,
          Math.round(
            ((geometry.chartHeight - activeItem.y + 8) / geometry.chartHeight) *
              100
          )
        )}%`,
      },
      alignClass: isLeftEdge
        ? "translate-x-0"
        : isRightEdge
          ? "-translate-x-full"
          : "-translate-x-1/2",
    };
  };

  const tooltipPlacement = getTooltipPositionStyle();

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            XU HƯỚNG TIẾP NHẬN
          </p>
          <h2
            id={headingId}
            className="mt-0.5 text-lg font-bold tracking-tight text-foreground"
          >
            Yêu cầu theo ngày
          </h2>
          <p
            id={subtitleId}
            className="mt-0.5 text-xs text-muted-foreground sm:text-sm"
          >
            14 ngày gần nhất · theo múi giờ Việt Nam
          </p>
        </div>

        <div className="sm:text-right">
          <p className="flex flex-wrap items-baseline gap-1.5 sm:justify-end">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatNumber(geometry.totalRequests)}
            </span>
            <span className="text-xs font-medium text-muted-foreground sm:text-sm">
              yêu cầu trong kỳ
            </span>
          </p>
          {rangeLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {rangeLabel}
            </p>
          ) : null}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </p>

      <div className="mt-3 w-full">
        <div className="relative w-full">
          {geometry.totalRequests === 0 && pointCount > 0 ? (
            <p className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center px-2 sm:px-4">
              <span className="rounded-full border border-border bg-cream/90 px-3 py-1 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
                Chưa ghi nhận yêu cầu mới trong 14 ngày gần đây.
              </span>
            </p>
          ) : null}

          {activeItem && tooltipPlacement ? (
            <div
              aria-hidden="true"
              style={tooltipPlacement.style}
              className={cn(
                "pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground shadow-md transition-opacity duration-150 motion-reduce:transition-none sm:px-3 sm:py-2 sm:text-xs",
                tooltipPlacement.alignClass
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    activeItem.isPeak ? "bg-accent" : "bg-primary"
                  )}
                />
                <span className="font-bold text-foreground tabular-nums">
                  {activeItem.fullDateLabel}
                </span>
                {activeItem.isPeak ? (
                  <span className="text-[11px] font-semibold text-accent-dark">
                    · Cao nhất
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 pl-3.5 font-medium text-muted-foreground tabular-nums">
                {formatNumber(activeItem.count)} yêu cầu tư vấn
              </p>
            </div>
          ) : null}

          <svg
            viewBox={`0 0 ${geometry.chartWidth} ${geometry.chartHeight}`}
            role="group"
            aria-labelledby={svgTitleId}
            aria-describedby={svgDescId}
            className="block h-auto w-full select-none"
          >
            <title id={svgTitleId}>
              Biểu đồ cột yêu cầu tư vấn theo ngày trong 14 ngày gần nhất
            </title>
            <desc id={svgDescId}>{svgDescription}</desc>

            <g aria-hidden="true">
              {geometry.yTicks.map((tick) => {
                const isBaseline = tick.value === 0;
                return (
                  <g key={tick.value}>
                    <line
                      x1={geometry.padding.left}
                      y1={tick.y}
                      x2={geometry.chartWidth - geometry.padding.right}
                      y2={tick.y}
                      stroke={isBaseline ? "#D6D1C4" : "#EAE5DA"}
                      strokeWidth={1}
                    />
                    <text
                      x={geometry.padding.left - (isMobileLayout ? 6 : 8)}
                      y={tick.y + 4}
                      textAnchor="end"
                      fill="#64776A"
                      fontSize={isMobileLayout ? "11" : "11.5"}
                      fontWeight="500"
                    >
                      {formatNumber(tick.value)}
                    </text>
                  </g>
                );
              })}

              {geometry.items.map((item) => {
                const isActive = activeItem?.index === item.index;
                const isFocused = focusedIndex === item.index;
                const focusInset = isMobileLayout ? 3 : 4;

                const barPath = buildRoundedTopBarPath(
                  item.x,
                  item.y,
                  item.width,
                  item.height,
                  item.count > 0 ? 4 : 1
                );

                const barFill =
                  item.count === 0
                    ? isActive || isFocused
                      ? "#78716C"
                      : "#D6D1C4"
                    : item.isPeak
                      ? isActive || isFocused
                        ? "#B98727"
                        : "#D9A441"
                      : isActive || isFocused
                        ? "#224229"
                        : "#315C3B";

                return (
                  <g key={`vis-${item.date}`}>
                    {isFocused ? (
                      <rect
                        x={item.x - focusInset}
                        y={geometry.padding.top + 1}
                        width={item.width + focusInset * 2}
                        height={geometry.plotHeight - 2}
                        rx={6}
                        fill="#315C3B"
                        fillOpacity={0.04}
                        stroke="#315C3B"
                        strokeWidth={1.75}
                      />
                    ) : null}

                    {barPath ? (
                      <path
                        d={barPath}
                        fill={barFill}
                        stroke={
                          isActive || isFocused ? "#17261C" : "transparent"
                        }
                        strokeWidth={isActive || isFocused ? 1.25 : 0}
                      />
                    ) : null}

                    {item.showXAxisLabel ? (
                      <text
                        x={
                          item.index === 0
                            ? item.x
                            : item.index === pointCount - 1
                              ? item.x + item.width
                              : item.x + item.width / 2
                        }
                        y={geometry.baselineY + (isMobileLayout ? 17 : 19)}
                        textAnchor={
                          item.index === 0
                            ? "start"
                            : item.index === pointCount - 1
                              ? "end"
                              : "middle"
                        }
                        fill={isActive || isFocused ? "#17261C" : "#64776A"}
                        fontSize={isMobileLayout ? "11" : "11.5"}
                        fontWeight={isActive || isFocused ? "700" : "500"}
                      >
                        {item.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>

            <g
              ref={barsGroupRef}
              role="list"
              aria-label="Dữ liệu yêu cầu từng ngày trong 14 ngày gần nhất"
            >
              {geometry.items.map((item) => {
                const isTabStop = safeTabStopIndex === item.index;
                const ariaLabel = `Ngày ${item.fullDateLabel}: ${formatNumber(item.count)} yêu cầu tư vấn${item.isPeak ? " (Cao nhất trong kỳ)" : ""}`;

                return (
                  <g key={item.date} role="listitem">
                    <rect
                      ref={(element) => {
                        barRefs.current[item.index] = element;
                      }}
                      x={item.slotX}
                      y={geometry.padding.top}
                      width={item.slotWidth}
                      height={geometry.plotHeight}
                      rx={6}
                      fill="transparent"
                      tabIndex={isTabStop ? 0 : -1}
                      role="button"
                      aria-label={ariaLabel}
                      className="cursor-pointer focus:outline-none"
                      onMouseEnter={() => setHoveredIndex(item.index)}
                      onMouseLeave={() =>
                        setHoveredIndex((prev) =>
                          prev === item.index ? null : prev
                        )
                      }
                      onFocus={() => {
                        setTabStopIndex(item.index);
                        setFocusedIndex(item.index);
                        setDismissedFocusIndex(null);
                      }}
                      onBlur={(event) => {
                        const nextFocusTarget =
                          (event?.relatedTarget as Node | null) ?? null;
                        if (
                          !nextFocusTarget ||
                          !barsGroupRef.current?.contains(nextFocusTarget)
                        ) {
                          setFocusedIndex(null);
                          setDismissedFocusIndex(null);
                        }
                      }}
                      onClick={() => {
                        setTabStopIndex(item.index);
                        if (pinnedIndex === item.index) {
                          setPinnedIndex(null);
                          setHoveredIndex(null);
                          setDismissedFocusIndex(item.index);
                        } else {
                          setPinnedIndex(item.index);
                          setDismissedFocusIndex(null);
                        }
                      }}
                      onKeyDown={(event) => handleBarKeyDown(event, item.index)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 divide-y divide-border/70 border-t border-border/70 pt-3 text-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="pb-2 sm:pb-0 sm:pr-4">
          <dt className="font-medium text-muted-foreground">Ngày có dữ liệu</dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {formatNumber(geometry.activeDays)}/{formatNumber(pointCount)} ngày
          </dd>
        </div>
        <div className="py-2 sm:px-4 sm:py-0">
          <dt className="font-medium text-muted-foreground">Trung bình/ngày</dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {formatAveragePerDay(geometry.averagePerDay)} yêu cầu
          </dd>
        </div>
        <div className="pt-2 sm:pl-4 sm:pt-0">
          <dt className="font-medium text-muted-foreground">Cao nhất</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-foreground tabular-nums">
            {geometry.maxCount > 0 ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
            ) : null}
            <span>{peakSummaryText}</span>
          </dd>
        </div>
      </dl>

      <table className="sr-only">
        <caption>Bảng số liệu yêu cầu tư vấn 14 ngày gần nhất</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Số lượng yêu cầu</th>
            <th scope="col">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {geometry.items.map((item) => (
            <tr key={`sr-${item.date}`}>
              <td>{item.fullDateLabel}</td>
              <td>{formatNumber(item.count)} yêu cầu</td>
              <td>{item.isPeak ? "Cao nhất trong kỳ" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
