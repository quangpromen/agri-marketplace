import React from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  type LucideIcon,
  MailCheck,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type BadgeIconKey,
  CONTACT_STATUS_META,
  EMAIL_STATUS_META,
} from "@/lib/admin-contact-presentation";
import { cn } from "@/lib/utils";
import type {
  ContactSubmissionStatus,
  EmailDeliveryStatus,
} from "@/schemas/admin-contact";

const badgeIcons: Record<BadgeIconKey, LucideIcon> = {
  sparkles: Sparkles,
  "phone-call": PhoneCall,
  "check-circle": CheckCircle2,
  ban: Ban,
  clock: Clock,
  "mail-check": MailCheck,
  "alert-triangle": AlertTriangle,
};

export function ContactStatusBadge({
  status,
  className,
}: {
  status: ContactSubmissionStatus;
  className?: string;
}) {
  const meta = CONTACT_STATUS_META[status];
  const Icon = badgeIcons[meta.icon];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap", meta.badgeClassName, className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
      <span>{meta.label}</span>
    </Badge>
  );
}

export function EmailStatusBadge({
  status,
  className,
}: {
  status: EmailDeliveryStatus;
  className?: string;
}) {
  const meta = EMAIL_STATUS_META[status];
  const Icon = badgeIcons[meta.icon];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap", meta.badgeClassName, className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
      <span>{meta.label}</span>
    </Badge>
  );
}
