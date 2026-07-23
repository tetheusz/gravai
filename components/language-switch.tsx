"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";

type Variant = "dark" | "light";

export function LanguageSwitch({ variant = "dark" }: { variant?: Variant }) {
  const { locale, setLocale } = useLocale();

  const options: Locale[] = ["en", "pt"];

  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-full border text-[11px] font-semibold uppercase tracking-[0.08em]",
        variant === "dark"
          ? "border-white/15 text-slate-400"
          : "border-border text-muted-foreground",
      )}
      role="group"
      aria-label="Language"
    >
      {options.map((option) => {
        const active = locale === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              active
                ? variant === "dark"
                  ? "bg-[#b7ff5a] text-[#07110b]"
                  : "bg-primary text-primary-foreground"
                : variant === "dark"
                  ? "hover:text-white"
                  : "hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
