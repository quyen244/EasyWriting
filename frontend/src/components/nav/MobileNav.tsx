"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import LanguageSwitcher from "@/components/nav/LanguageSwitcher";
import DisabledLink from "@/components/ui/DisabledLink";
import { EASE_EDITORIAL } from "@/lib/motion";
import { NAV_LINKS, NAV_MENUS } from "@/lib/navigation";

/**
 * The small-screen navigation.
 *
 * The header previously had none at all — the desktop link row just wrapped onto more
 * lines, which pushed the hero down the page on a phone. This replaces that with a
 * sheet: menus become always-open sections rather than accordions, because with only
 * three of them a second tap to reveal three links each is friction for nothing.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // The sheet covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open navigation"
        className="flex size-10 items-center justify-center rounded-md border-2 border-ink bg-surface-container-lowest"
      >
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="block h-[2px] w-5 bg-on-surface" />
          <span className="block h-[2px] w-5 bg-on-surface" />
          <span className="block h-[2px] w-3.5 bg-on-surface" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-overlay bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: EASE_EDITORIAL }}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto flex h-full w-[min(22rem,88vw)] flex-col overflow-y-auto border-l-2 border-ink bg-surface px-6 pb-10 pt-5"
            >
              <div className="mb-8 flex items-center justify-between">
                <LanguageSwitcher />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="flex size-10 items-center justify-center rounded-md border-2 border-ink"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <nav aria-label="Mobile" className="flex flex-1 flex-col gap-8">
                {NAV_MENUS.map((menu) => (
                  <div key={menu.label}>
                    <p className="mb-3 border-b border-outline-variant pb-2 font-body text-mono-caps uppercase text-on-surface-variant">
                      {menu.label}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {menu.items.map((item) => (
                        <li key={item.label}>
                          <DisabledLink
                            {...item}
                            className="block py-2 font-body text-body-md font-medium text-on-surface"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <ul className="flex flex-col gap-1 border-t border-outline-variant pt-6">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      <DisabledLink
                        {...link}
                        className="block py-2 font-body text-body-lg font-bold text-on-surface"
                      />
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-10 flex flex-col gap-3">
                <Link
                  href="/signin"
                  className="rounded-md border-2 border-ink px-6 py-3 text-center font-body text-body-md font-bold text-on-surface"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-primary-container px-6 py-3 text-center font-body text-body-md font-bold text-on-primary-container shadow-brutal-sm"
                >
                  Free Try →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
