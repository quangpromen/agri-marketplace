import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hookRuntime = vi.hoisted(() => ({
  stateCursor: 0,
  states: [] as unknown[],
  refCursor: 0,
  refs: [] as Array<{ current: unknown }>,
  effectCursor: 0,
  effects: [] as Array<{
    fn: () => void | (() => void);
    deps?: unknown[];
    cleanup?: void | (() => void);
    needsRun: boolean;
  }>,
  pathname: "/admin",
  markAllAction: vi.fn(),
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

  const mockUseEffect = vi.fn(
    (fn: () => void | (() => void), deps?: unknown[]) => {
      const slot = hookRuntime.effectCursor++;
      const prev = hookRuntime.effects[slot];
      const depsChanged =
        !prev ||
        !deps ||
        !prev.deps ||
        deps.length !== prev.deps.length ||
        deps.some((value, idx) => !Object.is(value, prev.deps![idx]));

      hookRuntime.effects[slot] = {
        fn,
        deps,
        cleanup: prev?.cleanup,
        needsRun: depsChanged,
      };
    }
  );

  return {
    ...actual,
    default: {
      ...actual,
      useId: () => ":bell:",
      useRef: mockUseRef,
      useState: mockUseState,
      useEffect: mockUseEffect,
    },
    useId: () => ":bell:",
    useRef: mockUseRef,
    useState: mockUseState,
    useEffect: mockUseEffect,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => hookRuntime.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/actions/admin-notifications", () => ({
  markAllAdminNotificationsSeenAction: hookRuntime.markAllAction,
}));

import { AdminNotificationBell } from "@/components/admin/admin-notification-bell";
import type {
  AdminNotificationItem,
  AdminNotificationSummary,
} from "@/schemas/admin-notifications";

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

function getTextContent(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }
  if (React.isValidElement(node)) {
    return getTextContent((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

function makeItem(index: number): AdminNotificationItem {
  const suffix = String(index).padStart(2, "0");
  const id = `550e8400-e29b-41d4-a716-4466554400${suffix}`;
  return {
    id,
    customerName: `Khách hàng ${index}`,
    serviceLabel: "Mua nông sản / Hộp rau gia đình",
    createdAt: `2026-11-14T09:${suffix}:00.000Z`,
    relativeTime: `${index} phút trước`,
    detailUrl: `/admin/lien-he/${id}`,
  };
}

function makeSummary(
  unreadCount: number,
  itemCount: number = Math.min(unreadCount, 5),
  serverTime: string = "2026-11-14T10:00:00.000Z"
): AdminNotificationSummary {
  return {
    unreadCount,
    items: Array.from({ length: itemCount }, (_, i) => makeItem(i + 1)),
    serverTime,
  };
}

function createFakeDocument(initialVisibility: "visible" | "hidden" = "visible") {
  let visibilityState = initialVisibility;
  const listeners = new Map<string, Set<(event: unknown) => void>>();

  return {
    get visibilityState() {
      return visibilityState;
    },
    setVisibilityState(next: "visible" | "hidden") {
      visibilityState = next;
    },
    addEventListener: vi.fn((type: string, listener: (event: unknown) => void) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(listener);
    }),
    removeEventListener: vi.fn(
      (type: string, listener: (event: unknown) => void) => {
        listeners.get(type)?.delete(listener);
      }
    ),
    dispatch(type: string, event: unknown = {}) {
      for (const listener of Array.from(listeners.get(type) ?? [])) {
        listener(event);
      }
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

function setupRender(props: {
  initialSummary?: AdminNotificationSummary;
  pollIntervalMs?: number;
} = {}) {
  const bellFocusSpy = vi.fn();
  let isInsideContainer = false;

  const renderNow = () => {
    hookRuntime.stateCursor = 0;
    hookRuntime.refCursor = 0;
    hookRuntime.effectCursor = 0;
    const tree = AdminNotificationBell(props);

    const rootDiv = findElements(tree, (el) => el.type === "div")[0];
    const containerRefFn = (
      rootDiv as unknown as {
        ref?: { current: unknown } | ((node: unknown) => void);
      }
    )?.ref;
    const mockContainerEl = {
      contains: () => isInsideContainer,
    };
    if (containerRefFn && typeof containerRefFn === "object") {
      containerRefFn.current = mockContainerEl;
    }

    const buttons = findElements(tree, (el) => el.type === "button");
    const bellButton = buttons[0]!;
    const bellRefObj = (
      bellButton as unknown as {
        ref?: { current: unknown };
      }
    ).ref;
    if (bellRefObj && typeof bellRefObj === "object") {
      bellRefObj.current = {
        focus: bellFocusSpy,
        getBoundingClientRect: () => ({ bottom: 64 }),
      };
    }

    const markAllButton = buttons[1] ?? null;
    const panelSection = findElements(tree, (el) => el.type === "section")[0] ?? null;
    const liveRegion = findElements(
      tree,
      (el) =>
        el.type === "p" &&
        (el.props as { "aria-live"?: string })["aria-live"] === "polite"
    )[0]!;
    const links = findElements(
      tree,
      (el) =>
        el.type === "a" ||
        typeof (el.props as { href?: unknown })?.href === "string"
    );

    return {
      tree,
      bellButton,
      markAllButton,
      panelSection,
      liveRegion,
      liveText: getTextContent(liveRegion),
      links,
      html: renderToStaticMarkup(tree),
    };
  };

  const flushEffects = () => {
    for (const effect of hookRuntime.effects) {
      if (effect.needsRun) {
        if (typeof effect.cleanup === "function") {
          effect.cleanup();
        }
        effect.needsRun = false;
        effect.cleanup = effect.fn();
      }
    }
  };

  const unmount = () => {
    for (const effect of hookRuntime.effects) {
      if (typeof effect.cleanup === "function") {
        effect.cleanup();
        effect.cleanup = undefined;
      }
    }
  };

  return {
    renderNow,
    flushEffects,
    unmount,
    bellFocusSpy,
    setInsideContainer: (inside: boolean) => {
      isInsideContainer = inside;
    },
  };
}

describe("AdminNotificationBell component & polling behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hookRuntime.stateCursor = 0;
    hookRuntime.states = [];
    hookRuntime.refCursor = 0;
    hookRuntime.refs = [];
    hookRuntime.effectCursor = 0;
    hookRuntime.effects = [];
    hookRuntime.pathname = "/admin";
    hookRuntime.markAllAction.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ẩn badge khi unreadCount = 0, hiển thị đúng số lượng 1..99 và 99+ khi vượt quá 99", () => {
    const zeroView = setupRender({ initialSummary: makeSummary(0, 0) }).renderNow();
    expect(zeroView.bellButton.props["aria-label"]).toBe(
      "Thông báo yêu cầu tư vấn, không có thông báo mới"
    );
    expect(zeroView.bellButton.props["aria-expanded"]).toBe(false);
    expect(zeroView.html).not.toContain("99+");
    expect(findElements(zeroView.bellButton, (el) => el.type === "span")).toHaveLength(
      0
    );

    hookRuntime.states = [];
    const fiveView = setupRender({ initialSummary: makeSummary(5, 5) }).renderNow();
    expect(fiveView.bellButton.props["aria-label"]).toBe(
      "Thông báo yêu cầu tư vấn, 5 yêu cầu mới chưa xem"
    );
    expect(getTextContent(fiveView.bellButton)).toBe("5");

    hookRuntime.states = [];
    const ninetyNineView = setupRender({
      initialSummary: makeSummary(99, 5),
    }).renderNow();
    expect(getTextContent(ninetyNineView.bellButton)).toBe("99");

    hookRuntime.states = [];
    const cappedView = setupRender({
      initialSummary: makeSummary(150, 5),
    }).renderNow();
    expect(getTextContent(cappedView.bellButton)).toBe("99+");
    expect(cappedView.bellButton.props["aria-label"]).toBe(
      "Thông báo yêu cầu tư vấn, 150 yêu cầu mới chưa xem"
    );
  });

  it("mở/đóng dropdown, hiển thị tối đa 5 mục, empty state, liên kết /admin/lien-he?status=new, Escape trả focus và click ra ngoài đóng panel", () => {
    const fakeDoc = createFakeDocument("visible");
    vi.stubGlobal("document", fakeDoc);

    const harness = setupRender({
      initialSummary: {
        unreadCount: 8,
        // Cố tình truyền 6 mục để kiểm tra lớp client cũng giới hạn tối đa 5
        items: Array.from({ length: 6 }, (_, i) => makeItem(i + 1)),
        serverTime: "2026-11-14T10:00:00.000Z",
      },
    });

    let view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).toBeNull();

    // Click mở dropdown
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    harness.flushEffects();

    expect(view.panelSection).not.toBeNull();
    expect(view.bellButton.props["aria-expanded"]).toBe(true);
    expect(view.bellButton.props["aria-controls"]).toBe(
      view.panelSection!.props.id
    );

    const detailLinks = view.links.filter((link) =>
      String(link.props.href).startsWith("/admin/lien-he/")
    );
    expect(detailLinks).toHaveLength(5);
    expect(
      view.links.some(
        (link) => link.props.href === "/admin/lien-he?status=new"
      )
    ).toBe(true);
    expect(view.html).toContain("Khách hàng 1");
    expect(view.html).toContain("Khách hàng 5");
    expect(view.html).not.toContain("Khách hàng 6");
    expect(view.html).toContain("Hiển thị 5 mới nhất trong 8 yêu cầu chưa xem");

    // Click bên trong container giữ nguyên trạng thái mở
    harness.setInsideContainer(true);
    fakeDoc.dispatch("mousedown", { target: {} });
    view = harness.renderNow();
    expect(view.panelSection).not.toBeNull();

    // Click bên ngoài container đóng panel
    harness.setInsideContainer(false);
    fakeDoc.dispatch("mousedown", { target: {} });
    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).toBeNull();

    // Mở lại và nhấn Escape -> đóng panel + trả focus về nút chuông
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).not.toBeNull();

    const preventDefault = vi.fn();
    fakeDoc.dispatch("keydown", { key: "Escape", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(harness.bellFocusSpy).toHaveBeenCalledTimes(1);

    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).toBeNull();
    harness.unmount();

    // Kiểm tra empty state khi unreadCount = 0
    hookRuntime.states = [];
    hookRuntime.effects = [];
    hookRuntime.refs = [];
    const emptyHarness = setupRender({ initialSummary: makeSummary(0, 0) });
    let emptyView = emptyHarness.renderNow();
    emptyHarness.flushEffects();
    (emptyView.bellButton.props as { onClick: () => void }).onClick();
    emptyView = emptyHarness.renderNow();
    expect(emptyView.html).toContain("Không có yêu cầu tư vấn mới.");
    expect(emptyView.markAllButton?.props.disabled).toBe(true);
    emptyHarness.unmount();
  });

  it("xử lý trạng thái pending/disabled khi đánh dấu đã xem, cập nhật UI khi thành công và giữ trạng thái khi lỗi", async () => {
    const fakeDoc = createFakeDocument("visible");
    vi.stubGlobal("document", fakeDoc);

    let resolveAction!: (value: { status: "success"; lastSeenAt: string }) => void;
    hookRuntime.markAllAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        })
    );

    const harness = setupRender({ initialSummary: makeSummary(3, 3) });
    let view = harness.renderNow();
    harness.flushEffects();

    // Mở dropdown và bấm Đánh dấu tất cả đã xem
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    expect(view.markAllButton?.props.disabled).toBe(false);

    const clickPromise = (
      view.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();

    // Trong lúc đang pending -> nút bị disabled và có text đang cập nhật
    view = harness.renderNow();
    expect(view.markAllButton?.props.disabled).toBe(true);
    expect(view.markAllButton?.props["aria-busy"]).toBe(true);
    expect(view.html).toContain("Đang cập nhật...");

    // Bấm lần nữa khi đang pending sẽ bị chặn
    await (
      view.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();
    expect(hookRuntime.markAllAction).toHaveBeenCalledTimes(1);

    resolveAction({
      status: "success",
      lastSeenAt: "2026-11-14T10:10:00.000Z",
    });
    await clickPromise;

    view = harness.renderNow();
    expect(view.html).toContain("Không có yêu cầu tư vấn mới.");
    expect(view.markAllButton?.props.disabled).toBe(true);
    expect(findElements(view.bellButton, (el) => el.type === "span")).toHaveLength(
      0
    );

    harness.unmount();

    // Kịch bản mark-all thất bại -> hiển thị thông báo lỗi chung và không xóa thông báo hiện có
    hookRuntime.states = [];
    hookRuntime.effects = [];
    hookRuntime.refs = [];
    hookRuntime.markAllAction.mockResolvedValueOnce({
      status: "error",
      message: "Không thể đánh dấu tất cả đã xem lúc này.",
    });

    const errHarness = setupRender({ initialSummary: makeSummary(2, 2) });
    let errView = errHarness.renderNow();
    errHarness.flushEffects();
    (errView.bellButton.props as { onClick: () => void }).onClick();
    errView = errHarness.renderNow();
    await (
      errView.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();
    errView = errHarness.renderNow();

    expect(errView.html).toContain("Không thể đánh dấu tất cả đã xem lúc này.");
    expect(errView.html).toContain("Khách hàng 1");
    expect(getTextContent(errView.bellButton)).toBe("2");
    errHarness.unmount();
  });

  it("polling theo chu kỳ 30s, không gửi request trùng lặp, tạm dừng khi ẩn tab, làm mới ngay khi hiện tab và dọn dẹp khi unmount", async () => {
    const fakeDoc = createFakeDocument("visible");
    vi.stubGlobal("document", fakeDoc);

    let resolveSlowFetch!: (response: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSlowFetch = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const harness = setupRender({ initialSummary: makeSummary(2, 2) });
    let view = harness.renderNow();
    harness.flushEffects();

    // Sau 30s, kích hoạt poll đầu tiên
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/notifications",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      })
    );

    // Sau 30s tiếp theo khi request trước CHƯA xong -> KHÔNG gửi request chồng chéo
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Hoàn tất poll với cùng unreadCount = 2 -> KHÔNG phát thông báo screen reader lặp lại
    resolveSlowFetch({
      ok: true,
      json: async () => makeSummary(2, 2, "2026-11-14T10:01:00.000Z"),
    });
    await Promise.resolve();
    await Promise.resolve();

    view = harness.renderNow();
    expect(view.liveText).toBe("");

    // Poll tiếp theo tăng từ 2 -> 5 -> phát thông báo qua aria-live="polite"
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(5, 5, "2026-11-14T10:02:00.000Z"),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("5");
    expect(view.liveText).toContain("Có 3 yêu cầu tư vấn mới");
    expect(view.liveText).toContain("5 yêu cầu chưa xem");

    // Poll tiếp theo vẫn là 5 -> xóa announcement để không đọc lặp lại
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(5, 5, "2026-11-14T10:03:00.000Z"),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    view = harness.renderNow();
    expect(view.liveText).toBe("");

    // Poll lỗi tạm thời (500 hoặc lỗi mạng) -> giữ nguyên trạng thái thành công trước đó (5)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Internal" }),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    fetchMock.mockRejectedValueOnce(new Error("Network offline"));
    await vi.advanceTimersByTimeAsync(30_000);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("5");

    // Ẩn tab -> tạm dừng polling hoàn toàn
    fakeDoc.setVisibilityState("hidden");
    fakeDoc.dispatch("visibilitychange");
    const callsBeforeHidden = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(90_000);
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeHidden);

    // Hiện lại tab -> làm mới ngay lập tức
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(6, 5, "2026-11-14T10:05:00.000Z"),
    });
    fakeDoc.setVisibilityState("visible");
    fakeDoc.dispatch("visibilitychange");
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeHidden + 1);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("6");
    expect(view.liveText).toContain("Có 1 yêu cầu tư vấn mới");

    // Unmount -> gỡ listener, dừng interval và bỏ qua kết quả đến muộn
    let resolveLateFetch!: (response: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLateFetch = resolve;
        })
    );
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fakeDoc.listenerCount("visibilitychange")).toBe(1);

    harness.unmount();
    expect(fakeDoc.listenerCount("visibilitychange")).toBe(0);

    resolveLateFetch({
      ok: true,
      json: async () => makeSummary(99, 5, "2026-11-14T10:06:00.000Z"),
    });
    await Promise.resolve();
    await Promise.resolve();
    // Unread count vẫn là 6, không cập nhật sau khi unmount
    expect(getTextContent(harness.renderNow().bellButton)).toBe("6");
  });

  it("bảo vệ quyền riêng tư: không render email/SĐT/message/token, escape XSS và không dùng dangerouslySetInnerHTML", () => {
    const fakeDoc = createFakeDocument("visible");
    vi.stubGlobal("document", fakeDoc);

    const summaryWithXssAndExtraFields = {
      unreadCount: 1,
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440099",
          customerName: "Khách <script>alert(1)</script>",
          serviceLabel: "Mua nông sản / Hộp rau gia đình",
          createdAt: "2026-11-14T09:50:00.000Z",
          relativeTime: "10 phút trước",
          detailUrl: "/admin/lien-he/550e8400-e29b-41d4-a716-446655440099",
          email: "private-customer@example.com",
          phone: "0988777666",
          message: "NOI_DUNG_BI_MAT_KHACH_HANG",
          sessionToken: "secret_session_tok",
        } as unknown as AdminNotificationItem,
      ],
      serverTime: "2026-11-14T10:00:00.000Z",
    };

    const harness = setupRender({ initialSummary: summaryWithXssAndExtraFields });
    let view = harness.renderNow();
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();

    expect(view.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(view.html).not.toContain("<script>alert(1)</script>");
    expect(view.html).not.toContain("private-customer@example.com");
    expect(view.html).not.toContain("0988777666");
    expect(view.html).not.toContain("NOI_DUNG_BI_MAT_KHACH_HANG");
    expect(view.html).not.toContain("secret_session_tok");
    harness.unmount();

    const componentSource = readFileSync(
      join(process.cwd(), "src/components/admin/admin-notification-bell.tsx"),
      "utf8"
    );
    expect(componentSource).not.toContain("dangerouslySetInnerHTML");
  });

  it("tải dữ liệu ban đầu khi không có initialSummary (không đọc announcement), đóng panel khi điều hướng, đồng bộ initialSummary mới và xử lý lỗi bất ngờ khi mark-all", async () => {
    const fakeDoc = createFakeDocument("visible");
    const resizeListeners = new Set<() => void>();
    vi.stubGlobal("document", fakeDoc);
    vi.stubGlobal("window", {
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "resize") resizeListeners.add(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "resize") resizeListeners.delete(listener);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(4, 4, "2026-11-14T10:00:00.000Z"),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Mount không truyền initialSummary -> fetch ngay lúc mount nhưng KHÔNG đọc announcement lần đầu
    const harness = setupRender({});
    let view = harness.renderNow();
    harness.flushEffects();
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("4");
    expect(view.liveText).toBe("");

    // Mở panel, kích hoạt resize để cập nhật mobilePanelTop, sau đó click link đóng panel
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).not.toBeNull();
    resizeListeners.forEach((fn) => fn());

    const detailLink = view.links.find((link) =>
      String(link.props.href).startsWith("/admin/lien-he/")
    )!;
    (detailLink.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).toBeNull();

    // Đổi pathname khi panel đang mở cũng tự đóng panel
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    harness.flushEffects();
    expect(view.panelSection).not.toBeNull();
    hookRuntime.pathname = "/admin/lien-he";
    view = harness.renderNow();
    harness.flushEffects();
    view = harness.renderNow();
    expect(view.panelSection).toBeNull();

    // Payload JSON sai định dạng không làm mất state hiện tại (4)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unreadCount: 1, items: [{ id: "bad", email: "leak@x.com" }] }),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("4");

    // Khi mark-all ném exception bất ngờ -> giữ nguyên 4 và hiển thị lỗi an toàn
    hookRuntime.markAllAction.mockRejectedValueOnce(new Error("Network dropped"));
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    await (
      view.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();
    view = harness.renderNow();
    expect(view.html).toContain("Không thể đánh dấu tất cả đã xem lúc này.");
    expect(getTextContent(view.bellButton)).toBe("4");

    harness.unmount();
  });

  it("chống race condition giữa polling và mark-all theo đúng thứ tự xác định và khôi phục polling sau khi xong", async () => {
    const fakeDoc = createFakeDocument("visible");
    vi.stubGlobal("document", fakeDoc);

    let resolvePreMutationPoll!: (response: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    let firstPollAborted = false;

    const fetchMock = vi.fn((_url: unknown, init?: RequestInit) => {
      const signal = init?.signal;
      if (signal) {
        signal.addEventListener("abort", () => {
          firstPollAborted = true;
        });
      }

      return new Promise<{ ok: boolean; json: () => Promise<unknown> }>(
        (resolve) => {
          resolvePreMutationPoll = resolve;
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    let resolveMarkAll!: (value: {
      status: "success" | "error";
      lastSeenAt?: string;
      message?: string;
    }) => void;
    hookRuntime.markAllAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveMarkAll = resolve;
        })
    );

    // 1. Khởi tạo với unreadCount = 3
    const harness = setupRender({ initialSummary: makeSummary(3, 3) });
    let view = harness.renderNow();
    harness.flushEffects();
    expect(getTextContent(view.bellButton)).toBe("3");

    // Kích hoạt 1 poll trước mutation để mô phỏng response trễ về sau khi mark-all xong
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Mở panel và bắt đầu 2. mark-all (giữ promise pending)
    (view.bellButton.props as { onClick: () => void }).onClick();
    view = harness.renderNow();
    const markAllPromise = (
      view.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();

    view = harness.renderNow();
    expect(view.markAllButton?.props.disabled).toBe(true);
    expect(firstPollAborted).toBe(true);

    // 3. Chạy timer 30s trong lúc mutation vẫn pending
    await vi.advanceTimersByTimeAsync(30_000);

    // 4. Không có poll mới nào được phép chạy khi mark-all đang pending
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getTextContent(harness.renderNow().bellButton)).toBe("3");

    // 5. Mark-all hoàn tất thành công -> về 0
    resolveMarkAll({
      status: "success",
      lastSeenAt: "2026-11-14T10:05:00.000Z",
    });
    await markAllPromise;

    view = harness.renderNow();
    expect(view.html).toContain("Không có yêu cầu tư vấn mới.");
    expect(findElements(view.bellButton, (el) => el.type === "span")).toHaveLength(
      0
    );

    // 6. Poll cũ (epoch trước mutation) trả về muộn unreadCount = 3
    resolvePreMutationPoll({
      ok: true,
      json: async () => makeSummary(3, 3, "2026-11-14T10:04:00.000Z"),
    });
    await Promise.resolve();
    await Promise.resolve();

    // 7. UI vẫn giữ nguyên unreadCount = 0
    view = harness.renderNow();
    expect(view.html).toContain("Không có yêu cầu tư vấn mới.");
    expect(findElements(view.bellButton, (el) => el.type === "span")).toHaveLength(
      0
    );

    // 8. Chạy một poll hợp lệ sau đó chứa 1 yêu cầu thực sự mới
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(1, 1, "2026-11-14T10:06:00.000Z"),
    });
    await vi.advanceTimersByTimeAsync(30_000);

    // 9. unreadCount trở thành 1 và thông báo qua live region
    expect(fetchMock).toHaveBeenCalledTimes(2);
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("1");
    expect(view.liveText).toContain("Có 1 yêu cầu tư vấn mới");
    expect(view.liveText).toContain("1 yêu cầu chưa xem");

    // Kiểm tra thêm: khi mark-all thất bại vẫn giữ summary trước đó và tiếp tục polling bình thường
    let rejectOrFailMarkAll!: (value: { status: "error"; message: string }) => void;
    hookRuntime.markAllAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          rejectOrFailMarkAll = resolve;
        })
    );
    const pendingFailPromise = (
      view.markAllButton!.props as { onClick: () => Promise<void> }
    ).onClick();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    rejectOrFailMarkAll({
      status: "error",
      message: "Lỗi tạm thời khi đánh dấu đã xem.",
    });
    await pendingFailPromise;
    view = harness.renderNow();
    expect(getTextContent(view.bellButton)).toBe("1");
    expect(view.html).toContain("Lỗi tạm thời khi đánh dấu đã xem.");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeSummary(2, 2, "2026-11-14T10:07:00.000Z"),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getTextContent(harness.renderNow().bellButton)).toBe("2");

    harness.unmount();
  });
});
