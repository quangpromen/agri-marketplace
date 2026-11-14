"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";
import { markAllAdminNotificationsSeenAction } from "@/actions/admin-notifications";
import {
  formatAdminDateTime,
  formatNotificationBadgeCount,
} from "@/lib/admin-contact-presentation";
import { cn, formatNumber } from "@/lib/utils";
import { buildAdminContactsHref } from "@/schemas/admin-contact";
import {
  ADMIN_NOTIFICATIONS_API_PATH,
  ADMIN_NOTIFICATION_BADGE_CAP,
  ADMIN_NOTIFICATION_DROPDOWN_LIMIT,
  ADMIN_NOTIFICATION_POLL_INTERVAL_MS,
  type AdminNotificationSummary,
  parseAdminNotificationSummary,
} from "@/schemas/admin-notifications";

export interface AdminNotificationBellProps {
  initialSummary?: AdminNotificationSummary;
  pollIntervalMs?: number;
}

const EMPTY_NOTIFICATION_SUMMARY: AdminNotificationSummary = {
  unreadCount: 0,
  items: [],
  serverTime: "",
};

const NEW_CONTACTS_HREF = buildAdminContactsHref({ status: "new" });

export function AdminNotificationBell({
  initialSummary,
  pollIntervalMs = ADMIN_NOTIFICATION_POLL_INTERVAL_MS,
}: AdminNotificationBellProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const panelId = `admin-notifications-panel-${safeId}`;
  const panelTitleId = `admin-notifications-title-${safeId}`;
  const pathname = usePathname() ?? "";

  const [summary, setSummary] = useState<AdminNotificationSummary>(
    initialSummary ?? EMPTY_NOTIFICATION_SUMMARY
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingSeen, setIsMarkingSeen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [mobilePanelTop, setMobilePanelTop] = useState(116);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const mutationInProgressRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const requestEpochRef = useRef(0);
  const hasHydratedRef = useRef(Boolean(initialSummary));
  const lastUnreadCountRef = useRef(initialSummary?.unreadCount ?? 0);
  const lastInitialServerTimeRef = useRef(initialSummary?.serverTime ?? "");
  const lastServerTimeRef = useRef(initialSummary?.serverTime ?? "");
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!initialSummary || mutationInProgressRef.current) {
      return;
    }

    if (initialSummary.serverTime === lastInitialServerTimeRef.current) {
      return;
    }

    lastInitialServerTimeRef.current = initialSummary.serverTime;

    const incomingTimeMs = Date.parse(initialSummary.serverTime);
    const currentTimeMs = Date.parse(lastServerTimeRef.current);

    if (
      !lastServerTimeRef.current ||
      !Number.isFinite(currentTimeMs) ||
      (Number.isFinite(incomingTimeMs) && incomingTimeMs >= currentTimeMs)
    ) {
      hasHydratedRef.current = true;
      lastUnreadCountRef.current = initialSummary.unreadCount;
      lastServerTimeRef.current = initialSummary.serverTime;
      setSummary(initialSummary);
      setLiveAnnouncement("");
    }
  }, [initialSummary]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    isMountedRef.current = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopPollingTimer = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const pollNotifications = async () => {
      if (!isMountedRef.current || mutationInProgressRef.current) {
        return;
      }

      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }

      if (inFlightRef.current) {
        return;
      }

      if (typeof fetch !== "function") {
        return;
      }

      const controller =
        typeof AbortController === "function" ? new AbortController() : null;
      activeControllerRef.current = controller;
      inFlightRef.current = true;
      const pollEpoch = requestEpochRef.current;

      try {
        const response = await fetch(ADMIN_NOTIFICATIONS_API_PATH, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
          ...(controller ? { signal: controller.signal } : {}),
        });

        if (
          !isMountedRef.current ||
          controller?.signal.aborted ||
          pollEpoch !== requestEpochRef.current ||
          mutationInProgressRef.current
        ) {
          return;
        }

        if (!response.ok) {
          return;
        }

        const rawPayload: unknown = await response.json();

        if (
          !isMountedRef.current ||
          controller?.signal.aborted ||
          pollEpoch !== requestEpochRef.current ||
          mutationInProgressRef.current
        ) {
          return;
        }

        const nextSummary = parseAdminNotificationSummary(rawPayload);
        if (!nextSummary) {
          return;
        }

        if (!hasHydratedRef.current) {
          hasHydratedRef.current = true;
          lastUnreadCountRef.current = nextSummary.unreadCount;
          lastServerTimeRef.current = nextSummary.serverTime;
          setSummary(nextSummary);
          setLiveAnnouncement("");
          return;
        }

        const previousCount = lastUnreadCountRef.current;
        if (nextSummary.unreadCount > previousCount) {
          const addedCount = nextSummary.unreadCount - previousCount;
          setLiveAnnouncement(
            `Có ${formatNumber(addedCount)} yêu cầu tư vấn mới. Hiện có ${formatNumber(nextSummary.unreadCount)} yêu cầu chưa xem.`
          );
        } else {
          setLiveAnnouncement("");
        }

        lastUnreadCountRef.current = nextSummary.unreadCount;
        lastServerTimeRef.current = nextSummary.serverTime;
        setSummary(nextSummary);
      } catch {
        // Giữ nguyên trạng thái hiển thị thành công gần nhất khi polling lỗi tạm thời.
      } finally {
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
          inFlightRef.current = false;
        }
      }
    };

    const startPollingTimer = () => {
      stopPollingTimer();
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        intervalId = setInterval(() => {
          void pollNotifications();
        }, pollIntervalMs);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") {
        return;
      }

      if (document.visibilityState === "visible") {
        void pollNotifications();
        startPollingTimer();
      } else {
        stopPollingTimer();
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        inFlightRef.current = false;
      }
    };

    if (
      !hasHydratedRef.current &&
      (typeof document === "undefined" ||
        document.visibilityState === "visible")
    ) {
      void pollNotifications();
    }

    startPollingTimer();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      requestEpochRef.current += 1;
      stopPollingTimer();
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      inFlightRef.current = false;

      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [pollIntervalMs]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const syncMobilePosition = () => {
      const rect = bellButtonRef.current?.getBoundingClientRect?.();
      if (rect && Number.isFinite(rect.bottom) && rect.bottom > 0) {
        setMobilePanelTop(Math.round(rect.bottom + 8));
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        bellButtonRef.current?.focus();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", syncMobilePosition);
      window.addEventListener("scroll", syncMobilePosition, { passive: true });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
      if (
        typeof window !== "undefined" &&
        typeof window.removeEventListener === "function"
      ) {
        window.removeEventListener("resize", syncMobilePosition);
        window.removeEventListener("scroll", syncMobilePosition);
      }
    };
  }, [isOpen]);

  const handleTogglePanel = () => {
    if (!isOpen) {
      const rect = bellButtonRef.current?.getBoundingClientRect?.();
      if (rect && Number.isFinite(rect.bottom) && rect.bottom > 0) {
        setMobilePanelTop(Math.round(rect.bottom + 8));
      }
      setActionError(null);
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllSeen = async () => {
    if (
      mutationInProgressRef.current ||
      isMarkingSeen ||
      summary.unreadCount === 0
    ) {
      return;
    }

    mutationInProgressRef.current = true;
    setIsMarkingSeen(true);
    setActionError(null);

    // Vô hiệu hóa epoch trước mutation và hủy mọi poll đang chạy để không ghi đè state mới.
    requestEpochRef.current += 1;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    inFlightRef.current = false;

    try {
      const result = await markAllAdminNotificationsSeenAction();

      // Tiếp tục tăng epoch sau khi mutation kết thúc để chặn mọi response stale đến muộn.
      requestEpochRef.current += 1;

      if (!isMountedRef.current) {
        return;
      }

      if (result.status === "success") {
        const nextServerTime = result.lastSeenAt ?? lastServerTimeRef.current;
        hasHydratedRef.current = true;
        lastUnreadCountRef.current = 0;
        lastServerTimeRef.current = nextServerTime;
        setLiveAnnouncement("");
        setSummary({
          unreadCount: 0,
          items: [],
          serverTime: nextServerTime,
        });
        return;
      }

      setActionError(
        result.message ??
          "Không thể đánh dấu tất cả đã xem lúc này. Vui lòng thử lại."
      );
    } catch {
      requestEpochRef.current += 1;
      if (isMountedRef.current) {
        setActionError(
          "Không thể đánh dấu tất cả đã xem lúc này. Vui lòng thử lại."
        );
      }
    } finally {
      mutationInProgressRef.current = false;
      if (isMountedRef.current) {
        setIsMarkingSeen(false);
      }
    }
  };

  const badgeText = formatNotificationBadgeCount(
    summary.unreadCount,
    ADMIN_NOTIFICATION_BADGE_CAP
  );
  const hasUnread = summary.unreadCount > 0;
  const visibleItems = summary.items.slice(0, ADMIN_NOTIFICATION_DROPDOWN_LIMIT);
  const bellAriaLabel = hasUnread
    ? `Thông báo yêu cầu tư vấn, ${formatNumber(summary.unreadCount)} yêu cầu mới chưa xem`
    : "Thông báo yêu cầu tư vấn, không có thông báo mới";

  return (
    <div ref={containerRef} className="relative">
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </p>

      <button
        ref={bellButtonRef}
        type="button"
        aria-label={bellAriaLabel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleTogglePanel}
        className={cn(
          "focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors motion-reduce:transition-none",
          isOpen
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-cream/60"
        )}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {badgeText ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground tabular-nums"
          >
            {badgeText}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          id={panelId}
          aria-labelledby={panelTitleId}
          style={
            {
              "--mobile-panel-top": `${mobilePanelTop}px`,
            } as React.CSSProperties
          }
          className={cn(
            "z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-lg",
            "max-sm:fixed max-sm:inset-x-4 max-sm:top-[var(--mobile-panel-top,116px)] max-sm:max-h-[calc(100vh-8.5rem)]",
            "sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:max-h-[460px] sm:w-[392px]"
          )}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-cream/35 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2
                id={panelTitleId}
                className="text-sm font-bold tracking-tight text-foreground"
              >
                Thông báo mới
              </h2>
              {hasUnread ? (
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary-dark tabular-nums">
                  {formatNumber(summary.unreadCount)} chưa xem
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleMarkAllSeen()}
              disabled={isMarkingSeen || !hasUnread}
              aria-busy={isMarkingSeen}
              aria-label={
                isMarkingSeen ? "Đang đánh dấu tất cả đã xem" : undefined
              }
              className="focus-ring inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent motion-reduce:transition-none"
            >
              <CheckCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {isMarkingSeen ? "Đang cập nhật..." : "Đánh dấu tất cả đã xem"}
              </span>
            </button>
          </div>

          {actionError ? (
            <div
              role="alert"
              className="shrink-0 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive"
            >
              {actionError}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
                <div className="mb-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream text-primary">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Không có yêu cầu tư vấn mới.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yêu cầu tư vấn mới gửi từ website sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.detailUrl}
                      onClick={() => setIsOpen(false)}
                      className="focus-ring group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-cream/50 motion-reduce:transition-none"
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent ring-2 ring-accent/25"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {item.customerName}
                          </p>
                          <span className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums">
                            {item.relativeTime}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.serviceLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground/85 tabular-nums">
                          <time dateTime={item.createdAt}>
                            {formatAdminDateTime(item.createdAt)}
                          </time>
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-border/80 bg-cream/35 px-4 py-2.5">
            {summary.unreadCount > visibleItems.length ? (
              <p className="mb-1.5 px-2 text-[11px] text-muted-foreground tabular-nums">
                Hiển thị {visibleItems.length} mới nhất trong{" "}
                {formatNumber(summary.unreadCount)} yêu cầu chưa xem
              </p>
            ) : null}
            <Link
              href={NEW_CONTACTS_HREF}
              onClick={() => setIsOpen(false)}
              className="focus-ring inline-flex min-h-[40px] w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 motion-reduce:transition-none"
            >
              <span>Xem yêu cầu tư vấn mới</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
