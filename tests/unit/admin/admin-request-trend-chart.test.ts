import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminRequestTrendChart } from "@/components/admin/admin-request-trend-chart";
import {
  TREND_CHART_HEIGHT,
  TREND_CHART_PADDING,
  TREND_CHART_WIDTH,
  TREND_MAX_BAR_WIDTH,
  TREND_MOBILE_CHART_HEIGHT,
  TREND_MOBILE_CHART_PADDING,
  TREND_MOBILE_CHART_WIDTH,
  TREND_MOBILE_PLOT_HEIGHT,
  TREND_PLOT_HEIGHT,
  TREND_ZERO_BAR_HEIGHT,
  buildRoundedTopBarPath,
  buildTrendBarChartGeometry,
  computeNiceYAxis,
  formatAveragePerDay,
  formatDistributionPercentage,
  formatTrendDateLong,
  resolveTrendChartKeyboardAction,
  sanitizeNonNegativeCount,
} from "@/lib/admin-dashboard-chart";
import type { AdminDashboardTrendPoint } from "@/server/admin/dashboard";

function createFourteenDaySeries(counts: number[]): AdminDashboardTrendPoint[] {
  return counts.map((count, index) => {
    const day = index + 1;
    const paddedDay = String(day).padStart(2, "0");
    return {
      date: `2026-11-${paddedDay}`,
      label: `${paddedDay}/11`,
      count,
    };
  });
}

describe("admin-dashboard-chart bar geometry & AdminRequestTrendChart", () => {
  it("tính toán hình học biểu đồ 14 cột chính xác, an toàn cho 0, đỉnh đơn, giá trị bằng nhau và số lớn > 1.000", () => {
    // Sanitize & format helpers
    expect(sanitizeNonNegativeCount(-3)).toBe(0);
    expect(sanitizeNonNegativeCount(Number.NaN)).toBe(0);
    expect(sanitizeNonNegativeCount(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizeNonNegativeCount(4.9)).toBe(4);

    expect(formatTrendDateLong("2026-11-13")).toBe("13/11/2026");
    expect(formatTrendDateLong("invalid-date")).toBe("invalid-date");

    expect(formatDistributionPercentage(0)).toBe("0%");
    expect(formatDistributionPercentage(Number.NaN)).toBe("0%");
    expect(formatDistributionPercentage(21.1)).toBe("21,1%");

    expect(formatAveragePerDay(0)).toBe("0");
    expect(formatAveragePerDay(Number.NaN)).toBe("0");
    expect(formatAveragePerDay(0.7)).toBe("0,7");
    expect(formatAveragePerDay(2)).toBe("2");

    // Integer Y-axis ticks (<= 4 labels)
    expect(computeNiceYAxis(0)).toEqual({ yMax: 3, ticks: [0, 1, 2, 3] });
    expect(computeNiceYAxis(3)).toEqual({ yMax: 3, ticks: [0, 1, 2, 3] });
    expect(computeNiceYAxis(8)).toEqual({ yMax: 9, ticks: [0, 3, 6, 9] });
    expect(computeNiceYAxis(15)).toEqual({ yMax: 15, ticks: [0, 5, 10, 15] });
    expect(computeNiceYAxis(17)).toEqual({ yMax: 30, ticks: [0, 10, 20, 30] });
    expect(computeNiceYAxis(24)).toEqual({ yMax: 30, ticks: [0, 10, 20, 30] });
    expect(computeNiceYAxis(75)).toEqual({ yMax: 75, ticks: [0, 25, 50, 75] });
    expect(computeNiceYAxis(120)).toEqual({ yMax: 150, ticks: [0, 50, 100, 150] });
    expect(computeNiceYAxis(1250)).toEqual({
      yMax: 1500,
      ticks: [0, 500, 1000, 1500],
    });
    expect(computeNiceYAxis(3000)).toEqual({
      yMax: 3000,
      ticks: [0, 1000, 2000, 3000],
    });

    // Empty input
    const emptyGeo = buildTrendBarChartGeometry([]);
    expect(emptyGeo.items).toEqual([]);
    expect(emptyGeo.totalRequests).toBe(0);
    expect(emptyGeo.activeDays).toBe(0);
    expect(emptyGeo.averagePerDay).toBe(0);
    expect(emptyGeo.maxCount).toBe(0);
    expect(emptyGeo.peakLabel).toBeNull();
    expect("linePath" in emptyGeo).toBe(false);
    expect("areaPath" in emptyGeo).toBe(false);

    // Rounded top path helper
    expect(buildRoundedTopBarPath(10, 20, 0, 10)).toBe("");
    expect(buildRoundedTopBarPath(10, 20, 20, 0)).toBe("");
    expect(buildRoundedTopBarPath(10, 20, 20, 40, 0)).toBe(
      "M 10 20 L 30 20 L 30 60 L 10 60 Z"
    );

    // Sparse dataset: total 10, peak 8 on one day, two days with 1, rest zero
    const sparseSeries = createFourteenDaySeries([
      0, 0, 1, 0, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0,
    ]);
    const sparseGeo = buildTrendBarChartGeometry(sparseSeries);

    // 1. Exactly 14 bar geometries
    expect(sparseGeo.items).toHaveLength(14);
    expect("linePath" in sparseGeo).toBe(false);
    expect("areaPath" in sparseGeo).toBe(false);

    // 2-4. Increasing x positions, stable widths/gaps, inside plot bounds
    const widths = new Set(sparseGeo.items.map((item) => item.width));
    expect(widths.size).toBe(1);
    const barWidth = sparseGeo.items[0]!.width;
    expect(barWidth).toBeGreaterThan(0);
    expect(barWidth).toBeLessThanOrEqual(TREND_MAX_BAR_WIDTH);

    const gaps: number[] = [];
    for (let index = 0; index < sparseGeo.items.length; index += 1) {
      const item = sparseGeo.items[index]!;
      expect(Number.isNaN(item.x)).toBe(false);
      expect(Number.isNaN(item.y)).toBe(false);
      expect(Number.isFinite(item.x)).toBe(true);
      expect(Number.isFinite(item.y)).toBe(true);
      expect(item.x).toBeGreaterThanOrEqual(TREND_CHART_PADDING.left);
      expect(item.x + item.width).toBeLessThanOrEqual(
        TREND_CHART_WIDTH - TREND_CHART_PADDING.right + 0.01
      );
      expect(item.y).toBeGreaterThanOrEqual(TREND_CHART_PADDING.top);
      expect(item.y + item.height).toBeCloseTo(sparseGeo.baselineY, 1);

      if (index > 0) {
        const prev = sparseGeo.items[index - 1]!;
        expect(item.x).toBeGreaterThan(prev.x);
        gaps.push(Math.round((item.x - (prev.x + prev.width)) * 10) / 10);
      }
    }
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(0.2);

    // 5. Zero values have safe baseline height = 2
    expect(sparseGeo.items[0]!.count).toBe(0);
    expect(sparseGeo.items[0]!.height).toBe(TREND_ZERO_BAR_HEIGHT);
    expect(sparseGeo.items[0]!.y).toBe(
      sparseGeo.baselineY - TREND_ZERO_BAR_HEIGHT
    );

    // 6. Spike & derived stats
    expect(sparseGeo.totalRequests).toBe(10);
    expect(sparseGeo.activeDays).toBe(3);
    expect(sparseGeo.averagePerDay).toBe(0.7);
    expect(sparseGeo.maxCount).toBe(8);
    expect(sparseGeo.peakLabel).toBe("06/11");
    expect(sparseGeo.peakFullDateLabel).toBe("06/11/2026");
    expect(sparseGeo.peakDayCount).toBe(1);
    expect(sparseGeo.items[5]!.isPeak).toBe(true);
    expect(sparseGeo.items[2]!.isPeak).toBe(false);

    // 9. Integer Y ticks, max 4 labels
    expect(sparseGeo.yTicks.length).toBeLessThanOrEqual(4);
    for (const tick of sparseGeo.yTicks) {
      expect(Number.isInteger(tick.value)).toBe(true);
    }

    // Equal values dataset
    const equalGeo = buildTrendBarChartGeometry(
      createFourteenDaySeries(new Array(14).fill(5))
    );
    expect(equalGeo.activeDays).toBe(14);
    expect(equalGeo.averagePerDay).toBe(5);
    expect(equalGeo.peakDayCount).toBe(14);
    const equalHeights = new Set(equalGeo.items.map((item) => item.height));
    expect(equalHeights.size).toBe(1);

    // Large values (> 1,000)
    const largeCounts = new Array(14).fill(0);
    largeCounts[3] = 1250;
    largeCounts[10] = 420;
    largeCounts[11] = 1;
    const largeGeo = buildTrendBarChartGeometry(
      createFourteenDaySeries(largeCounts)
    );
    expect(largeGeo.yMax).toBe(1500);
    expect(largeGeo.yTicks.every((t) => Number.isInteger(t.value))).toBe(true);
    expect(largeGeo.items[3]!.y).toBeGreaterThanOrEqual(TREND_CHART_PADDING.top);
    expect(largeGeo.items[11]!.height).toBeGreaterThanOrEqual(4);
    expect(
      largeGeo.items.every((item) => item.height <= TREND_PLOT_HEIGHT)
    ).toBe(true);

    // All zero dataset
    const zeroGeo = buildTrendBarChartGeometry(
      createFourteenDaySeries(new Array(14).fill(0))
    );
    expect(zeroGeo.activeDays).toBe(0);
    expect(zeroGeo.averagePerDay).toBe(0);
    expect(zeroGeo.maxCount).toBe(0);
    expect(zeroGeo.peakLabel).toBeNull();
    expect(
      zeroGeo.items.every((item) => item.height === TREND_ZERO_BAR_HEIGHT)
    ).toBe(true);

    // ViewBox dimensions check
    expect(TREND_CHART_WIDTH).toBeGreaterThan(TREND_CHART_HEIGHT);
  });

  it("hàm resolveTrendChartKeyboardAction xử lý đúng trạng thái active thực tế cho Enter/Space và điều hướng", () => {
    expect(resolveTrendChartKeyboardAction(null, "ArrowRight", 0)).toEqual({
      handled: false,
      nextIndex: null,
      focusIndex: null,
      clearTooltip: false,
      isActivationToggle: false,
    });

    // Enter activates an inactive focused bar (activeIndex=null, focusedIndex=5)
    expect(resolveTrendChartKeyboardAction(null, "Enter", 14, 5)).toEqual({
      handled: true,
      nextIndex: 5,
      focusIndex: 5,
      clearTooltip: false,
      isActivationToggle: true,
    });

    // Enter clears an active focused bar (activeIndex=5, focusedIndex=5)
    expect(resolveTrendChartKeyboardAction(5, "Enter", 14, 5)).toEqual({
      handled: true,
      nextIndex: null,
      focusIndex: 5,
      clearTooltip: true,
      isActivationToggle: true,
    });

    // Space toggles using focused bar even if another bar was active
    expect(resolveTrendChartKeyboardAction(2, " ", 14, 5)).toEqual({
      handled: true,
      nextIndex: 5,
      focusIndex: 5,
      clearTooltip: false,
      isActivationToggle: true,
    });
    expect(resolveTrendChartKeyboardAction(5, " ", 14, 5)).toEqual({
      handled: true,
      nextIndex: null,
      focusIndex: 5,
      clearTooltip: true,
      isActivationToggle: true,
    });

    expect(resolveTrendChartKeyboardAction(5, "ArrowRight", 14, 5).focusIndex).toBe(6);
    expect(resolveTrendChartKeyboardAction(5, "ArrowDown", 14, 5).focusIndex).toBe(6);
    expect(resolveTrendChartKeyboardAction(5, "ArrowLeft", 14, 5).focusIndex).toBe(4);
    expect(resolveTrendChartKeyboardAction(5, "ArrowUp", 14, 5).focusIndex).toBe(4);
    expect(resolveTrendChartKeyboardAction(5, "Home", 14, 5).focusIndex).toBe(0);
    expect(resolveTrendChartKeyboardAction(5, "End", 14, 5).focusIndex).toBe(13);
    expect(resolveTrendChartKeyboardAction(5, "Escape", 14, 5)).toEqual({
      handled: true,
      nextIndex: null,
      focusIndex: null,
      clearTooltip: true,
      isActivationToggle: false,
    });
  });

  it("render biểu đồ cột 14 ngày với header mới, không có đường/vùng diện tích cũ, roving tabindex, cột đỉnh vàng+chữ và bảng sr-only", () => {
    const sparseTrend = createFourteenDaySeries([
      0, 0, 1, 0, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0,
    ]);

    const html = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, { trend: sparseTrend })
    );

    // Header
    expect(html).toContain("XU HƯỚNG TIẾP NHẬN");
    expect(html).toContain("Yêu cầu theo ngày");
    expect(html).toContain("14 ngày gần nhất · theo múi giờ Việt Nam");
    expect(html).toContain("yêu cầu trong kỳ");
    expect(html).toContain("01/11 – 14/11");

    // Old line/area elements removed
    expect(html).not.toContain(
      "Di chuột hoặc nhấn Tab vào điểm dữ liệu để xem chi tiết từng ngày."
    );
    expect(html).not.toContain("Đỉnh 8/ngày");
    expect(html).not.toContain("trend-area-grad");

    // 14 interactive bar buttons + single initial tabindex=0
    expect(html.match(/role="button"/g)).toHaveLength(14);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(13);
    expect(html).not.toContain("aria-pressed");

    // Gold peak bar fill & non-color textual peak summary
    expect(html).toContain("#D9A441");
    expect(html).toContain("Ngày có dữ liệu");
    expect(html).toContain("3/14 ngày");
    expect(html).toContain("Trung bình/ngày");
    expect(html).toContain("0,7 yêu cầu");
    expect(html).toContain("Cao nhất");
    expect(html).toContain("8 yêu cầu · 06/11");
    expect(html).toContain('aria-label="Ngày 06/11/2026: 8 yêu cầu tư vấn (Cao nhất trong kỳ)"');

    // Screen reader SVG metadata + table
    expect(html).toContain("<title");
    expect(html).toContain("<desc");
    expect(html).toContain('<g aria-hidden="true">');
    expect(html).toContain('<table class="sr-only">');
    for (const point of sparseTrend) {
      expect(html).toContain(`<td>${formatTrendDateLong(point.date)}</td>`);
      expect(html).toContain(`<td>${point.count} yêu cầu</td>`);
    }
    expect(html).toContain("<td>Cao nhất trong kỳ</td>");

    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });

  it("render an toàn dữ liệu toàn 0, bằng nhau, nhiều đỉnh bằng nhau, spike lớn và tooltip", () => {
    const zeroHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries(new Array(14).fill(0)),
      })
    );
    expect(zeroHtml).toContain("Chưa ghi nhận yêu cầu mới trong 14 ngày gần đây.");
    expect(zeroHtml).toContain("0/14 ngày");
    expect(zeroHtml).toContain("0 yêu cầu");
    expect(zeroHtml.match(/role="button"/g)).toHaveLength(14);
    expect(zeroHtml).not.toContain("NaN");

    const equalHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries(new Array(14).fill(5)),
      })
    );
    expect(equalHtml).toContain("14/14 ngày");
    expect(equalHtml).toContain("5 yêu cầu (14/11 · 14 ngày)");
    expect(equalHtml).not.toContain("NaN");

    const multiPeakCounts = new Array(14).fill(1);
    multiPeakCounts[4] = 9;
    multiPeakCounts[10] = 9;
    const multiPeakHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries(multiPeakCounts),
      })
    );
    expect(multiPeakHtml).toContain("9 yêu cầu (11/11 · 2 ngày)");

    const spikeCounts = new Array(14).fill(0);
    spikeCounts[5] = 1250;
    const spikeHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries(spikeCounts),
        defaultActiveIndex: 5,
      })
    );
    expect(spikeHtml).toContain("1.250 yêu cầu tư vấn");
    expect(spikeHtml).toContain("06/11/2026");
    expect(spikeHtml).toContain("motion-reduce:transition-none");
    expect(spikeHtml).toContain("bg-card");
    expect(spikeHtml).not.toContain("NaN");
    expect(spikeHtml).not.toContain("Infinity");

    const rightEdgeTooltipHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries([0, 0, 1, 0, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0]),
        defaultActiveIndex: 13,
      })
    );
    expect(rightEdgeTooltipHtml).toContain("-translate-x-full");
    expect(rightEdgeTooltipHtml).toContain("14/11/2026");

    // Tall bar near right edge + short 5-day series + omitted focusedIndex helper fallback
    const shortGeo = buildTrendBarChartGeometry(
      createFourteenDaySeries([1, 2, 0, 3, 1]).slice(0, 5)
    );
    expect(shortGeo.items.every((item) => item.showXAxisLabel)).toBe(true);
    expect(resolveTrendChartKeyboardAction(5, "Enter", 14)).toEqual({
      handled: true,
      nextIndex: null,
      focusIndex: 5,
      clearTooltip: true,
      isActivationToggle: true,
    });

    const rightTallCounts = new Array(14).fill(0);
    rightTallCounts[12] = 1250;
    const rightTallTooltipHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries(rightTallCounts),
        defaultActiveIndex: 12,
      })
    );
    expect(rightTallTooltipHtml).toContain("-translate-x-full");
    expect(rightTallTooltipHtml).toContain("1.250 yêu cầu tư vấn");
  });

  it("fit toàn bộ 14 cột gọn trong viewport mobile 375px không cần cuộn ngang và chỉ hiển thị 4 nhãn trục X chọn lọc", () => {
    const sparseSeries = createFourteenDaySeries([
      0, 0, 1, 0, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0,
    ]);
    const mobileGeo = buildTrendBarChartGeometry(sparseSeries, "mobile");

    expect(mobileGeo.viewport).toBe("mobile");
    expect(mobileGeo.chartWidth).toBe(TREND_MOBILE_CHART_WIDTH);
    expect(mobileGeo.chartHeight).toBe(TREND_MOBILE_CHART_HEIGHT);
    expect(mobileGeo.plotHeight).toBe(TREND_MOBILE_PLOT_HEIGHT);
    expect(mobileGeo.items).toHaveLength(14);
    expect(mobileGeo.items[0]!.width).toBeGreaterThanOrEqual(10);
    expect(mobileGeo.items[0]!.width).toBeLessThanOrEqual(14);

    for (let index = 0; index < mobileGeo.items.length; index += 1) {
      const item = mobileGeo.items[index]!;
      expect(item.x).toBeGreaterThanOrEqual(TREND_MOBILE_CHART_PADDING.left);
      expect(item.x + item.width).toBeLessThanOrEqual(
        TREND_MOBILE_CHART_WIDTH - TREND_MOBILE_CHART_PADDING.right + 0.01
      );
      if (index > 0) {
        const prev = mobileGeo.items[index - 1]!;
        expect(item.x - (prev.x + prev.width)).toBeGreaterThanOrEqual(6);
      }
    }

    const visibleMobileLabels = mobileGeo.items
      .filter((item) => item.showXAxisLabel)
      .map((item) => item.label);
    expect(visibleMobileLabels).toEqual(["01/11", "05/11", "10/11", "14/11"]);

    // Short <= 5 day series shows all X labels on mobile too
    const shortMobileGeo = buildTrendBarChartGeometry(
      sparseSeries.slice(0, 5),
      "mobile"
    );
    expect(shortMobileGeo.items.every((item) => item.showXAxisLabel)).toBe(true);

    // SSR check on mobile viewport: no horizontal scrolling container or min-w-[648px]
    const mobileHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: sparseSeries,
        defaultViewport: "mobile",
        defaultActiveIndex: 5,
      })
    );
    expect(mobileHtml).toContain(
      `viewBox="0 0 ${TREND_MOBILE_CHART_WIDTH} ${TREND_MOBILE_CHART_HEIGHT}"`
    );
    expect(mobileHtml).not.toContain("min-w-[648px]");
    expect(mobileHtml).not.toContain("overflow-x-auto");
    expect(mobileHtml.match(/role="button"/g)).toHaveLength(14);
    expect(mobileHtml.match(/tabindex="0"/g)).toHaveLength(1);
    expect(mobileHtml.match(/tabindex="-1"/g)).toHaveLength(13);
    expect(mobileHtml).toContain("06/11/2026");
    expect(mobileHtml).toContain("-translate-x-1/2");

    // Mobile edge-clamped tall bar tooltips (left side index 1, right side index 11)
    const leftTallMobileHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries([0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        defaultViewport: "mobile",
        defaultActiveIndex: 1,
      })
    );
    expect(leftTallMobileHtml).toContain("translate-x-0");

    const rightTallMobileHtml = renderToStaticMarkup(
      React.createElement(AdminRequestTrendChart, {
        trend: createFourteenDaySeries([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0]),
        defaultViewport: "mobile",
        defaultActiveIndex: 11,
      })
    );
    expect(rightTallMobileHtml).toContain("-translate-x-full");
  });
});
