"use client";

/**
 * The authenticated layout: sidebar, content column, optional contextual panel.
 *
 * Rendered *inside* the auth guard, never around it, so protected chrome never reaches
 * the DOM for a visitor who is not signed in.
 *
 * Breakpoints, and what changes at each:
 *  - `lg` and up: the sidebar is a persistent column and the drawer does not exist.
 *  - below `lg`: a top bar with a menu button; the sidebar becomes an overlay drawer.
 *  - `xl` and up: a page may place its contextual panel beside the content. Below that
 *    the panel falls under the content, because a 320px column and a readable measure do
 *    not both fit.
 */

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { CloseIcon, MenuIcon } from "@/components/app/AppIcon";
import Sidebar from "@/components/app/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

interface Props {
  children: ReactNode;
  /** Optional right-hand panel: help, criteria, next steps. */
  aside?: ReactNode;
  /** Exam-style screens opt out of the panel column and the page's own padding rhythm. */
  variant?: "default" | "focus";
}

export default function AppShell({ children, aside, variant = "default" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, signOut } = useAuth();
  const { t } = useLocale();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // Even a failed sign-out ends the local session, so the destination is the same.
      router.replace("/signin");
    }
  }, [router, signOut]);

  // Escape closes the drawer and returns focus to the control that opened it — without
  // that return, a keyboard user lands back at the top of the document.
  useEffect(() => {
    if (!drawerOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const email = account?.email ?? "";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen shrink-0 border-e border-outline-variant bg-surface-container-low p-4 lg:block">
        <Sidebar
          pathname={pathname}
          email={email}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-nav flex items-center justify-between gap-3 border-b border-outline-variant bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-label={t("nav.openMenu")}
          className="flex size-10 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <MenuIcon />
        </button>
        <span className="font-body text-[18px] font-bold tracking-[-0.5px] text-on-surface">
          WriteWise
        </span>
        {/* Balances the menu button so the wordmark stays optically centred. */}
        <span aria-hidden="true" className="size-10" />
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-overlay lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.navigation")}
            className="absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col bg-surface-container-low p-4 shadow-card"
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="flex size-10 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <CloseIcon />
              </button>
            </div>
            <Sidebar
              pathname={pathname}
              email={email}
              onSignOut={handleSignOut}
              signingOut={signingOut}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <main
        id="main"
        className={
          variant === "focus"
            ? "min-w-0"
            : "min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
        }
      >
        {variant === "focus" ? (
          children
        ) : aside ? (
          <div className="mx-auto grid w-full max-w-[1180px] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{children}</div>
            <div className="min-w-0 xl:sticky xl:top-10 xl:self-start">{aside}</div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        )}
      </main>
    </div>
  );
}
