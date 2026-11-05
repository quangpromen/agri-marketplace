"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItemProps {
  id: string;
  title: string;
  content: string;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  defaultOpenId?: string;
  className?: string;
}

export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={cn("divide-y divide-border rounded-xl border border-border bg-card", className)}
    >
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `accordion-trigger-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div key={item.id} className="overflow-hidden">
            <h3>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="focus-ring flex min-h-[52px] w-full items-center justify-between p-4 text-left font-medium text-foreground transition-all hover:bg-muted/40 sm:p-5"
              >
                <span className="pr-4 text-base font-semibold sm:text-lg">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-primary transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className={cn(
                "px-4 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground sm:px-5 sm:text-base",
                !isOpen && "hidden"
              )}
            >
              <p>{item.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
