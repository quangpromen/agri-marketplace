import React from "react";
import { Container } from "@/components/ui/container";

const METRIC_SKELETON_KEYS = ["m1", "m2", "m3", "m4", "m5"] as const;
const TREND_BAR_SKELETONS = [
  { key: "b1", heightClass: "h-10" },
  { key: "b2", heightClass: "h-20" },
  { key: "b3", heightClass: "h-6" },
  { key: "b4", heightClass: "h-24" },
  { key: "b5", heightClass: "h-14" },
  { key: "b6", heightClass: "h-36" },
  { key: "b7", heightClass: "h-16" },
  { key: "b8", heightClass: "h-12" },
  { key: "b9", heightClass: "h-28" },
  { key: "b10", heightClass: "h-8" },
  { key: "b11", heightClass: "h-20" },
  { key: "b12", heightClass: "h-14" },
  { key: "b13", heightClass: "h-24" },
  { key: "b14", heightClass: "h-10" },
] as const;
const TREND_INSIGHT_SKELETON_KEYS = ["i1", "i2", "i3"] as const;
const STATUS_SKELETON_KEYS = ["s1", "s2", "s3", "s4"] as const;
const RECENT_SKELETON_KEYS = ["r1", "r2", "r3", "r4", "r5"] as const;

export default function AdminDashboardLoading() {
  return (
    <Container
      role="status"
      aria-live="polite"
      aria-label="Đang tải tổng quan vận hành"
      className="space-y-6 sm:space-y-7"
    >
      <span className="sr-only">Đang tải dữ liệu tổng quan vận hành...</span>

      <div
        aria-hidden="true"
        className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-md bg-muted/80 motion-safe:animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-muted/70 motion-safe:animate-pulse" />
          <div className="h-3.5 w-60 rounded bg-muted/60 motion-safe:animate-pulse" />
        </div>
        <div className="h-11 w-full rounded-full bg-muted/80 motion-safe:animate-pulse sm:w-48" />
      </div>

      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {METRIC_SKELETON_KEYS.map((key, index) => (
          <div
            key={key}
            className={
              index === 0
                ? "rounded-xl border border-border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1"
                : "rounded-xl border border-border bg-card p-4 shadow-sm"
            }
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-muted/70 motion-safe:animate-pulse" />
                <div className="h-8 w-16 rounded bg-muted/85 motion-safe:animate-pulse" />
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted/70 motion-safe:animate-pulse" />
            </div>
            <div className="mt-3 border-t border-border/60 pt-2.5">
              <div className="h-3 w-28 rounded bg-muted/60 motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:col-span-8">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-muted/65 motion-safe:animate-pulse" />
              <div className="h-5 w-40 rounded bg-muted/85 motion-safe:animate-pulse" />
              <div className="h-3.5 w-56 max-w-full rounded bg-muted/60 motion-safe:animate-pulse" />
            </div>
            <div className="space-y-1.5 sm:text-right">
              <div className="h-7 w-28 rounded bg-muted/85 motion-safe:animate-pulse sm:ml-auto" />
              <div className="h-3 w-20 rounded bg-muted/60 motion-safe:animate-pulse sm:ml-auto" />
            </div>
          </div>

          <div className="mt-4 flex h-[200px] items-end gap-2 border-b border-border/80 px-2 pb-2 sm:h-[220px] sm:gap-3">
            {TREND_BAR_SKELETONS.map((bar) => (
              <div
                key={bar.key}
                className="flex flex-1 items-end justify-center"
              >
                <div
                  className={`w-full max-w-[22px] rounded-t-sm bg-muted/75 motion-safe:animate-pulse ${bar.heightClass}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border/70 pt-3.5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/70">
            {TREND_INSIGHT_SKELETON_KEYS.map((key) => (
              <div key={key} className="space-y-1.5 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                <div className="h-3 w-24 rounded bg-muted/60 motion-safe:animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted/80 motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:col-span-4">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-muted/80 motion-safe:animate-pulse" />
              <div className="h-4 w-48 rounded bg-muted/60 motion-safe:animate-pulse" />
            </div>
            <div className="h-7 w-12 rounded bg-muted/80 motion-safe:animate-pulse" />
          </div>
          <div className="mt-4 h-3.5 w-full rounded-full bg-muted/80 motion-safe:animate-pulse" />
          <div className="mt-5 space-y-3">
            {STATUS_SKELETON_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <div className="h-4 w-24 rounded bg-muted/70 motion-safe:animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted/70 motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-6 w-40 rounded bg-muted/80 motion-safe:animate-pulse" />
            <div className="h-4 w-64 max-w-full rounded bg-muted/60 motion-safe:animate-pulse" />
          </div>
          <div className="h-11 w-40 rounded-full bg-muted/80 motion-safe:animate-pulse" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border/80">
            {RECENT_SKELETON_KEYS.map((key) => (
              <div
                key={key}
                className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-44 rounded bg-muted/80 motion-safe:animate-pulse" />
                  <div className="h-3.5 w-56 rounded bg-muted/60 motion-safe:animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 rounded-full bg-muted/70 motion-safe:animate-pulse" />
                  <div className="h-6 w-20 rounded-full bg-muted/70 motion-safe:animate-pulse" />
                  <div className="h-11 w-28 rounded-full bg-muted/80 motion-safe:animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

