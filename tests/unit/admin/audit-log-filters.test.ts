import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hookRuntime = vi.hoisted(() => ({
  stateCursor: 0,
  states: [] as unknown[],
  effectCursor: 0,
  effects: [] as Array<{ fn: () => void; deps?: unknown[] }>,
  push: vi.fn(),
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

  const mockUseEffect = vi.fn((fn: () => void, deps?: unknown[]) => {
    const slot = hookRuntime.effectCursor++;
    hookRuntime.effects[slot] = { fn, deps };
  });

  const mockUseTransition = vi.fn(() => [
    false,
    (callback: () => void) => callback(),
  ]);

  return {
    ...actual,
    default: {
      ...actual,
      useState: mockUseState,
      useEffect: mockUseEffect,
      useTransition: mockUseTransition,
    },
    useState: mockUseState,
    useEffect: mockUseEffect,
    useTransition: mockUseTransition,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hookRuntime.push }),
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

import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import type { AdminAuditFilters } from "@/schemas/admin-audit";

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

function renderFilters(filters: AdminAuditFilters) {
  hookRuntime.stateCursor = 0;
  hookRuntime.effectCursor = 0;
  return AuditLogFilters({ filters });
}

describe("AuditLogFilters interactive controls", () => {
  beforeEach(() => {
    hookRuntime.stateCursor = 0;
    hookRuntime.states = [];
    hookRuntime.effectCursor = 0;
    hookRuntime.effects = [];
    hookRuntime.push.mockReset();
  });

  it("điều hướng sạch khi thay đổi action, result, period và submit form", () => {
    const tree1 = renderFilters({});
    const selects = findElements(tree1, (el) => el.type === "select");
    expect(selects).toHaveLength(3);

    const actionSelect = selects.find(
      (el) => el.props.id === "audit-filter-action"
    )!;
    const resultSelect = selects.find(
      (el) => el.props.id === "audit-filter-result"
    )!;
    const periodSelect = selects.find(
      (el) => el.props.id === "audit-filter-period"
    )!;

    // Chọn action
    (
      actionSelect.props as {
        onChange: (event: { target: { value: string } }) => void;
      }
    ).onChange({ target: { value: "auth.login_failed" } });
    expect(hookRuntime.push).toHaveBeenLastCalledWith(
      "/admin/audit-logs?action=auth.login_failed"
    );

    // Re-render rồi chọn result -> giữ action
    const tree2 = renderFilters({});
    const resultSelect2 = findElements(
      tree2,
      (el) => el.type === "select" && el.props.id === "audit-filter-result"
    )[0]!;
    (
      resultSelect2.props as {
        onChange: (event: { target: { value: string } }) => void;
      }
    ).onChange({ target: { value: "failure" } });
    expect(hookRuntime.push).toHaveBeenLastCalledWith(
      "/admin/audit-logs?action=auth.login_failed&result=failure"
    );

    // Re-render rồi chọn period -> giữ action + result
    const tree3 = renderFilters({});
    const periodSelect3 = findElements(
      tree3,
      (el) => el.type === "select" && el.props.id === "audit-filter-period"
    )[0]!;
    (
      periodSelect3.props as {
        onChange: (event: { target: { value: string } }) => void;
      }
    ).onChange({ target: { value: "24h" } });
    expect(hookRuntime.push).toHaveBeenLastCalledWith(
      "/admin/audit-logs?action=auth.login_failed&result=failure&period=24h"
    );

    // Submit form
    const tree4 = renderFilters({
      action: "auth.login_failed",
      result: "failure",
      period: "24h",
    });
    const form = findElements(tree4, (el) => el.type === "form")[0]!;
    const preventDefault = vi.fn();
    (
      form.props as { onSubmit: (event: { preventDefault: () => void }) => void }
    ).onSubmit({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(hookRuntime.push).toHaveBeenLastCalledWith(
      "/admin/audit-logs?action=auth.login_failed&result=failure&period=24h"
    );

    // Chạy useEffect đồng bộ state khi props thay đổi
    hookRuntime.effects[0]?.fn();
    expect(periodSelect).toBeDefined();
    expect(resultSelect).toBeDefined();
  });
});
