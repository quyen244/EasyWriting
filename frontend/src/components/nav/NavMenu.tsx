"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import DisabledLink from "@/components/ui/DisabledLink";
import { SNAP } from "@/lib/motion";
import type { NavMenu as NavMenuData } from "@/lib/navigation";

/**
 * One header dropdown, built as a disclosure rather than an ARIA menu.
 *
 * `role="menu"` is for application menus, where arrow keys are the only way to move and
 * Tab exits the whole widget. This is a list of navigation links, so it stays a button
 * that expands a `<ul>` — screen readers announce it as "expanded/collapsed", Tab walks
 * the links as usual, and arrow keys are an addition rather than a replacement.
 *
 * Unavailable entries go through `DisabledLink`, which renders them as
 * `<span aria-disabled="true">` — so they never take focus and arrow-key navigation
 * skips them without any special handling here.
 */
export default function NavMenu({ menu }: { menu: NavMenuData }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set when the pointer opened the panel and the reader has not clicked yet. Without
  // it, a mouse user who hovers (which opens) and then clicks (which toggles) closes
  // the menu they were reaching for.
  const openedByHover = useRef(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => cancelClose, [cancelClose]);

  // Outside click. Only listened for while open, so the page carries no idle handler.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const links = () =>
    Array.from(wrapper.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);

  const closeAndRefocus = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeAndRefocus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const items = links();
      if (!items.length) return;
      const at = items.indexOf(document.activeElement as HTMLAnchorElement);
      const next =
        event.key === "ArrowDown"
          ? at < 0
            ? 0
            : (at + 1) % items.length
          : at <= 0
            ? items.length - 1
            : at - 1;
      items[next]?.focus();
    }
  };

  return (
    <div
      ref={wrapper}
      className="relative"
      onKeyDown={onKeyDown}
      // Hover-to-open, but only for a real mouse: on touch the pointerenter fires
      // alongside the tap and would open then immediately re-toggle the panel.
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelClose();
        if (!open) openedByHover.current = true;
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelClose();
        // A short grace period so a diagonal move from the trigger into the panel does
        // not cross dead space and close it.
        closeTimer.current = setTimeout(() => {
          openedByHover.current = false;
          setOpen(false);
        }, 130);
      }}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          // A click on a panel the pointer already opened pins it rather than
          // dismissing it; every other click toggles.
          if (open && openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          openedByHover.current = false;
          setOpen((v) => !v);
        }}
        className="group flex items-center gap-1.5 py-2 font-body text-body-md font-medium text-on-surface-variant transition-colors hover:text-on-surface aria-expanded:text-on-surface"
      >
        {menu.label}
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          animate={{ rotate: open ? 180 : 0 }}
          transition={SNAP}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={SNAP}
            className="absolute left-0 top-full z-nav w-max min-w-[248px] origin-top-left pt-3"
          >
            <ul className="overflow-hidden rounded-lg border-2 border-ink bg-surface-container-lowest p-2 shadow-brutal-sm">
              {menu.items.map((item) => (
                <li key={item.label}>
                  <DisabledLink
                    {...item}
                    className="block rounded px-3 py-2.5 font-body text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                  />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
