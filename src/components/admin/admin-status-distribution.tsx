import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusMetaIcon } from "@/components/admin/contact-status-badges";
import { CONTACT_STATUS_META } from "@/lib/admin-contact-presentation";
import { formatDistributionPercentage } from "@/lib/admin-dashboard-chart";
import { cn, formatNumber } from "@/lib/utils";
import {
  buildAdminContactsHref,
  type ContactSubmissionStatus,
} from "@/schemas/admin-contact";
import type { AdminDashboardStatusDistribution } from "@/server/admin/dashboard";

// Keep Tailwind utility classes directly inside src/components so Tailwind's
// content scanner emits every swatch and segment color into the stylesheet.
const STATUS_DISTRIBUTION_STYLES: Record<
  ContactSubmissionStatus,
  { barClassName: string; dotClassName: string }
> = {
  new: {
    barClassName: "bg-secondary",
    dotClassName: "bg-secondary border border-primary/20",
  },
  contacted: {
    barClassName: "bg-accent",
    dotClassName: "bg-accent border border-accent-dark/30",
  },
  resolved: {
    barClassName: "bg-primary",
    dotClassName: "bg-primary border border-primary-dark/30",
  },
  spam: {
    barClassName: "bg-stone-500",
    dotClassName: "bg-stone-500 border border-stone-600/30",
  },
};

interface AdminStatusDistributionProps {
  distribution: AdminDashboardStatusDistribution;
}

export function AdminStatusDistribution({
  distribution,
}: AdminStatusDistributionProps) {
  const hasData = distribution.total > 0;
  const nonZeroItems = distribution.items.filter((item) => item.count > 0);

  const summaryAriaLabel = hasData
    ? `Phân bổ trạng thái trên tổng ${formatNumber(distribution.total)} yêu cầu: ${distribution.items
        .map(
          (item) =>
            `${CONTACT_STATUS_META[item.status].label} ${formatNumber(item.count)} (${formatDistributionPercentage(item.percentage)})`
        )
        .join(", ")}`
    : "Chưa có yêu cầu tư vấn để hiển thị phân bổ trạng thái.";

  return (
    <section
      aria-labelledby="status-distribution-heading"
      className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <h2
            id="status-distribution-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Phân bổ trạng thái
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Tỷ trọng trên toàn bộ yêu cầu tư vấn đã tiếp nhận.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-muted-foreground">Tổng</p>
          <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
            {formatNumber(distribution.total)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {hasData ? (
          <div
            role="img"
            aria-label={summaryAriaLabel}
            className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full bg-stone-100"
          >
            {nonZeroItems.map((item) => {
              const distStyle = STATUS_DISTRIBUTION_STYLES[item.status];
              return (
                <span
                  key={item.status}
                  aria-hidden="true"
                  style={{ flexGrow: item.count, flexBasis: 0 }}
                  className={cn("h-full min-w-[4px]", distStyle.barClassName)}
                />
              );
            })}
          </div>
        ) : (
          <div
            role="status"
            className="rounded-lg border border-dashed border-border bg-cream/40 px-3.5 py-2.5 text-xs text-muted-foreground"
          >
            Chưa có yêu cầu tư vấn để tính tỷ trọng phân bổ.
          </div>
        )}
      </div>

      <ul className="mt-4 flex flex-1 flex-col justify-between divide-y divide-border/70">
        {distribution.items.map((item) => {
          const statusMeta = CONTACT_STATUS_META[item.status];
          const distStyle = STATUS_DISTRIBUTION_STYLES[item.status];
          const formattedCount = formatNumber(item.count);
          const formattedPercentage = formatDistributionPercentage(item.percentage);
          const href = buildAdminContactsHref({ status: item.status });

          return (
            <li key={item.status}>
              <Link
                href={href}
                className="focus-ring group flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-cream/50"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      distStyle.dotClassName
                    )}
                    aria-hidden="true"
                  />
                  <StatusMetaIcon
                    iconKey={statusMeta.icon}
                    className="text-muted-foreground group-hover:text-foreground"
                  />
                  <span className="truncate text-sm font-semibold text-foreground">
                    {statusMeta.label}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                  <span className="font-bold text-foreground">
                    {formattedCount}
                  </span>
                  <span className="min-w-[46px] text-right text-xs font-medium text-muted-foreground">
                    {formattedPercentage}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

