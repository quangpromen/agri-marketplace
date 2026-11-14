import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hookRuntime = vi.hoisted(() => ({
  stateCursor: 0,
  states: [] as unknown[],
  refCursor: 0,
  refs: [] as Array<{ current: unknown }>,
  effectCursor: 0,
  effects: [] as Array<{
    fn: () => void | (() => void);
    cleanup?: void | (() => void);
  }>,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  const mockUseState = vi.fn((initial: unknown) => {
    const slot = hookRuntime.stateCursor++;
    if (!(slot in hookRuntime.states)) {
      hookRuntime.states[slot] =
        typeof initial === "function" ? (initial as () => unknown)() : initial;
    }
    const setter = vi.fn((next: unknown) => {
      const prev = hookRuntime.states[slot];
      hookRuntime.states[slot] =
        typeof next === "function"
          ? (next as (prevValue: unknown) => unknown)(prev)
          : next;
    });
    return [hookRuntime.states[slot], setter];
  });

  const mockUseRef = vi.fn((initial: unknown) => {
    const slot = hookRuntime.refCursor++;
    if (!(slot in hookRuntime.refs)) {
      hookRuntime.refs[slot] = { current: initial };
    }
    return hookRuntime.refs[slot];
  });

  const mockUseEffect = vi.fn((fn: () => void | (() => void)) => {
    const slot = hookRuntime.effectCursor++;
    hookRuntime.effects[slot] = {
      ...hookRuntime.effects[slot],
      fn,
    };
  });

  return {
    ...actual,
    default: {
      ...actual,
      useId: () => ":r1:",
      useRef: mockUseRef,
      useState: mockUseState,
      useEffect: mockUseEffect,
    },
    useId: () => ":r1:",
    useRef: mockUseRef,
    useState: mockUseState,
    useEffect: mockUseEffect,
  };
});

import { AdminRequestTrendChart } from "@/components/admin/admin-request-trend-chart";
import type { AdminDashboardTrendPoint } from "@/server/admin/dashboard";

function findElements(
  node: React.ReactNode,
  predicate: (element: React.ReactElement) => boolean
): React.ReactElement[] {
  const results: React.ReactElement[] = [];

  const visit = (current: React.ReactNode) => {
    if (
      !current ||
      typeof current === "boolean" ||
      typeof current === "string" ||
      typeof current === "number"
    ) {
      return;
    }
    if (Array.isArray(current)) {
      for (const child of current) {
        visit(child);
      }
      return;
    }
    if (React.isValidElement(current)) {
      if (predicate(current)) {
        results.push(current);
      }
      const props = current.props as { children?: React.ReactNode };
      if (props?.children) {
        visit(props.children);
      }
    }
  };

  visit(node);
  return results;
}

type BarHandlers = {
  tabIndex: number;
  "aria-label": string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: (event?: { relatedTarget?: unknown }) => void;
  onClick: () => void;
  onKeyDown: (event: { key: string; preventDefault: () => void }) => void;
};

describe("AdminRequestTrendChart real interactive handlers", () => {
  const sparseTrend: AdminDashboardTrendPoint[] = Array.from(
    { length: 14 },
    (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return {
        date: `2026-11-${day}`,
        label: `${day}/11`,
        count: index === 5 ? 8 : index === 2 || index === 8 ? 1 : 0,
      };
    }
  );

  const renderChart = (
    trend: AdminDashboardTrendPoint[] = sparseTrend,
    defaultActiveIndex: number | null = null
  ) => {
    hookRuntime.stateCursor = 0;
    hookRuntime.refCursor = 0;
    hookRuntime.effectCursor = 0;
    const tree = AdminRequestTrendChart({ trend, defaultActiveIndex });

    const bars = findElements(
      tree,
      (el) =>
        el.type === "rect" &&
        (el.props as { role?: string }).role === "button"
    );

    const liveParagraphs = findElements(
      tree,
      (el) =>
        el.type === "p" &&
        (el.props as { "aria-live"?: string })["aria-live"] === "polite"
    );
    const liveAnnouncement = String(
      (liveParagraphs[0]?.props as { children?: string } | undefined)
        ?.children ?? ""
    );

    const tooltipNodes = findElements(
      tree,
      (el) =>
        el.type === "div" &&
        (el.props as { className?: string }).className?.includes("pointer-events-none") ===
          true
    );

    const focusSpies: Array<ReturnType<typeof vi.fn>> = [];
    const handlers = bars.map((bar) => {
      const focusSpy = vi.fn();
      focusSpies.push(focusSpy);
      const refFn = (bar as unknown as { ref?: (node: unknown) => void }).ref;
      if (typeof refFn === "function") {
        refFn({ focus: focusSpy });
      }
      return bar.props as BarHandlers;
    });

    return { tree, bars, handlers, focusSpies, liveAnnouncement, tooltipNodes };
  };

  beforeEach(() => {
    hookRuntime.stateCursor = 0;
    hookRuntime.states = [];
    hookRuntime.refCursor = 0;
    hookRuntime.refs = [];
    hookRuntime.effectCursor = 0;
    hookRuntime.effects = [];
  });

  it("xử lý hover, mouseLeave (unpinned/pinned), focus, blur, click toggle, roving tabindex và điều hướng mũi tên/Home/End/Escape", () => {
    let view = renderChart();

    // 14 bars & roving tabindex: 1 element with tabIndex=0 (latest day), 13 with tabIndex=-1
    expect(view.handlers).toHaveLength(14);
    expect(view.handlers.filter((h) => h.tabIndex === 0)).toHaveLength(1);
    expect(view.handlers[13]!.tabIndex).toBe(0);
    expect(view.tooltipNodes).toHaveLength(0);

    // 1. Hover activates a bar
    view.handlers[5]!.onMouseEnter();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn (Cao nhất trong kỳ)");

    // 2a. Unpinned mouseLeave clears tooltip
    view.handlers[5]!.onMouseLeave();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);
    expect(view.liveAnnouncement).toBe("");

    // 13a & 2b. Click pins bar and hover+mouseLeave falls back to pinned bar; remains inspectable after blur
    view.handlers[5]!.onClick();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.handlers[5]!.tabIndex).toBe(0);
    expect(view.handlers.filter((h) => h.tabIndex === 0)).toHaveLength(1);

    view.handlers[2]!.onMouseEnter();
    view = renderChart();
    expect(view.liveAnnouncement).toContain("03/11/2026: 1 yêu cầu tư vấn");

    view.handlers[2]!.onMouseLeave();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");

    view.handlers[5]!.onBlur();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);

    // 13b. Second click clears pinned selection
    view.handlers[5]!.onClick();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);

    // 3-7. Focus, ArrowRight, ArrowLeft, Home, End + roving tabIndex
    view.handlers[3]!.onFocus();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.handlers[3]!.tabIndex).toBe(0);
    expect(view.liveAnnouncement).toContain("04/11/2026");

    const preventDefault = vi.fn();
    view.handlers[3]!.onKeyDown({ key: "ArrowRight", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(view.focusSpies[4]).toHaveBeenCalledTimes(1);
    view = renderChart();
    expect(view.handlers[4]!.tabIndex).toBe(0);
    expect(view.handlers.filter((h) => h.tabIndex === 0)).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("05/11/2026");

    view.handlers[4]!.onKeyDown({ key: "ArrowLeft", preventDefault });
    expect(view.focusSpies[3]).toHaveBeenCalledTimes(1);
    view = renderChart();
    expect(view.handlers[3]!.tabIndex).toBe(0);

    view.handlers[3]!.onKeyDown({ key: "Home", preventDefault });
    expect(view.focusSpies[0]).toHaveBeenCalledTimes(1);
    view = renderChart();
    expect(view.handlers[0]!.tabIndex).toBe(0);
    expect(view.liveAnnouncement).toContain("01/11/2026");

    view.handlers[0]!.onKeyDown({ key: "End", preventDefault });
    expect(view.focusSpies[13]).toHaveBeenCalledTimes(1);
    view = renderChart();
    expect(view.handlers[13]!.tabIndex).toBe(0);
    expect(view.liveAnnouncement).toContain("14/11/2026");

    // 12. Escape closes tooltip without losing roving tabStop on current bar
    view.handlers[13]!.onKeyDown({ key: "Escape", preventDefault });
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);
    expect(view.handlers[13]!.tabIndex).toBe(0);
    expect(view.liveAnnouncement).toBe("");

    // Unhandled key leaves state & preventDefault untouched
    preventDefault.mockClear();
    view.handlers[13]!.onKeyDown({ key: "Tab", preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("gọi thực tế handler onKeyDown cho Enter và Space để bật/tắt đúng trạng thái thanh đang focus", () => {
    let view = renderChart();
    const preventDefault = vi.fn();

    // Focus bar 5 -> activates bar 5
    view.handlers[5]!.onFocus();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");

    // 9. Enter clears active focused bar 5
    view.handlers[5]!.onKeyDown({ key: "Enter", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);
    expect(view.liveAnnouncement).toBe("");

    // 8. Enter activates inactive focused bar 5
    view.handlers[5]!.onKeyDown({ key: "Enter", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(2);
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");

    // 11. Space clears active focused bar 5
    view.handlers[5]!.onKeyDown({ key: " ", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(3);
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);
    expect(view.liveAnnouncement).toBe("");

    // 10. Space activates inactive focused bar 5
    view.handlers[5]!.onKeyDown({ key: " ", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(4);
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");

    // Blur keeps Enter/Space-pinned bar 5 inspectable
    view.handlers[5]!.onBlur();
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");
  });

  it("không bị lỗi khi dữ liệu rỗng hoặc defaultActiveIndex ngoài phạm vi", () => {
    const emptyView = renderChart([], 5);
    expect(emptyView.handlers).toHaveLength(0);
    expect(emptyView.tooltipNodes).toHaveLength(0);
    expect(emptyView.liveAnnouncement).toBe("");
  });

  it("giữ focusedIndex khi blur sang thanh khác bên trong cùng nhóm cột và xóa khi blur ra ngoài", () => {
    let view = renderChart();
    const groups = findElements(
      view.tree,
      (el) =>
        el.type === "g" &&
        (el.props as { role?: string }).role === "list"
    );
    const innerSibling = { id: "bar-6" };
    const outsideNode = { id: "outside" };
    const groupRef = (
      groups[0] as unknown as {
        ref?: ((node: unknown) => void) | { current: unknown };
      }
    ).ref;
    const mockGroupEl = {
      contains: (target: unknown) => target === innerSibling,
    };
    if (typeof groupRef === "function") {
      groupRef(mockGroupEl);
    } else if (groupRef && typeof groupRef === "object" && "current" in groupRef) {
      groupRef.current = mockGroupEl;
    }

    view.handlers[5]!.onFocus();
    view = renderChart();
    expect(view.liveAnnouncement).toContain("06/11/2026: 8 yêu cầu tư vấn");

    // Moving focus to another bar inside barsGroupRef keeps focused state active until next focus/outside blur
    view.handlers[5]!.onBlur({ relatedTarget: innerSibling });
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(1);

    // Moving focus outside barsGroupRef clears unpinned focus state
    view.handlers[5]!.onBlur({ relatedTarget: outsideNode });
    view = renderChart();
    expect(view.tooltipNodes).toHaveLength(0);
    expect(view.liveAnnouncement).toBe("");
  });

  it("chuyển đổi responsive sang layout mobile qua matchMedia và giữ nguyên tương tác bàn phím/tooltip", () => {
    let matchesMobile = true;
    const listeners = new Set<() => void>();
    const addEventListener = vi.fn((_event: string, listener: () => void) => {
      listeners.add(listener);
    });
    const removeEventListener = vi.fn(
      (_event: string, listener: () => void) => {
        listeners.delete(listener);
      }
    );

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({
        get matches() {
          return matchesMobile;
        },
        addEventListener,
        removeEventListener,
      })),
    });

    try {
      let view = renderChart();
      for (const effect of hookRuntime.effects) {
        effect.cleanup = effect.fn();
      }
      view = renderChart();

      const mobileSvg = findElements(view.tree, (el) => el.type === "svg")[0]!;
      expect((mobileSvg.props as { viewBox: string }).viewBox).toBe(
        "0 0 304 204"
      );

      // Keyboard navigation & tooltip work identically in mobile view
      const preventDefault = vi.fn();
      view.handlers[5]!.onFocus();
      view = renderChart();
      expect(view.tooltipNodes).toHaveLength(1);
      view.handlers[5]!.onKeyDown({ key: "Enter", preventDefault });
      view = renderChart();
      expect(view.tooltipNodes).toHaveLength(0);
      view.handlers[5]!.onKeyDown({ key: "Enter", preventDefault });
      view = renderChart();
      expect(view.tooltipNodes).toHaveLength(1);

      // Crossing >= 640px switches back to desktop viewBox
      matchesMobile = false;
      Array.from(listeners).forEach((listener) => listener());
      view = renderChart();
      const desktopSvg = findElements(
        view.tree,
        (el) => el.type === "svg"
      )[0]!;
      expect((desktopSvg.props as { viewBox: string }).viewBox).toBe(
        "0 0 680 210"
      );

      // Cleanup detaches listener and legacy matchMedia without addEventListener is safe
      for (const effect of hookRuntime.effects) {
        if (typeof effect.cleanup === "function") {
          effect.cleanup();
        }
      }
      expect(removeEventListener).toHaveBeenCalledTimes(1);

      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: false })),
      });
      const legacyCleanup = hookRuntime.effects[0]!.fn();
      expect(legacyCleanup).toBeUndefined();

      vi.stubGlobal("window", undefined);
      expect(hookRuntime.effects[0]!.fn()).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
