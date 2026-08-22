"use client";

/**
 * The product's primary navigation.
 *
 * Rendered twice — as a persistent column on desktop and inside the mobile drawer — from
 * one component, because two copies of a nav tree drift and the one that drifts is
 * always the one you are not looking at.
 *
 * Group expansion is seeded from the current route rather than reset on navigation: a
 * learner inside Practice → Writing must not have Practice collapse under them when they
 * open an exercise.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import AppIcon, { ChevronIcon, LogOutIcon } from "@/components/app/AppIcon";
import PreferenceControls from "@/components/app/PreferenceControls";
import { useLocale } from "@/hooks/useLocale";
import { APP_NAV, activeNavId, type AppNavItem } from "@/lib/navigation";

interface Props {
  pathname: string;
  email: string;
  onSignOut: () => void;
  signingOut: boolean;
  /** Set by the drawer so choosing a destination closes it. */
  onNavigate?: () => void;
}

function groupContaining(navId: string | null): string | null {
  if (!navId) return null;
  const group = APP_NAV.find((item) =>
    item.children?.some((child) => child.id === navId),
  );
  return group?.id ?? null;
}

export default function Sidebar({
  pathname,
  email,
  onSignOut,
  signingOut,
  onNavigate,
}: Props) {
  const { t } = useLocale();
  const activeId = activeNavId(pathname);
  const [openGroup, setOpenGroup] = useState<string | null>(() => groupContaining(activeId));

  // Route changes open the group the learner has just entered. Deliberately additive:
  // it never closes a group the learner opened by hand.
  useEffect(() => {
    const group = groupContaining(activeNavId(pathname));
    if (group) setOpenGroup(group);
  }, [pathname]);

  return (
    <div className="flex h-full flex-col gap-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex shrink-0 items-center gap-2 px-2"
        aria-label={t("brand.name")}
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded bg-accent-peach font-body text-[20px] font-bold leading-none text-on-primary-fixed"
        >
          W
        </span>
        <span className="font-body text-[20px] font-bold tracking-[-0.5px] text-on-surface">
          WriteWise
        </span>
      </Link>

      <nav aria-label={t("nav.navigation")} className="flex-1 overflow-y-auto">
        <p className="px-2 pb-2 text-mono-caps uppercase text-on-surface-variant">
          {t("nav.navigation")}
        </p>
        <ul className="flex flex-col gap-0.5">
          {APP_NAV.map((item) =>
            item.children ? (
              <NavGroup
                key={item.id}
                item={item}
                activeId={activeId}
                open={openGroup === item.id}
                onToggle={() => setOpenGroup((current) => (current === item.id ? null : item.id))}
                onNavigate={onNavigate}
              />
            ) : (
              <li key={item.id}>
                <NavRow item={item} active={activeId === item.id} onNavigate={onNavigate} />
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-outline-variant pt-4">
        <p className="px-2 text-mono-caps uppercase text-on-surface-variant">
          {t("nav.account")}
        </p>
        <Link
          href="/account"
          onClick={onNavigate}
          aria-current={activeId === "account" || undefined}
          className={`mt-1 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-container ${
            activeId === "account" ? "bg-surface-container" : ""
          }`}
        >
          <AppIcon name="account" className="size-5 shrink-0 text-on-surface-variant" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-body-sm font-medium text-on-surface">
              {t("nav.account")}
            </span>
            <span className="block truncate font-body text-[12px] text-on-surface-variant">
              {email}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 font-body text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-60"
        >
          <LogOutIcon className="size-5 shrink-0" />
          {signingOut ? t("account.signingOut") : t("nav.logOut")}
        </button>

        <PreferenceControls className="mt-3 px-2" />
      </div>
    </div>
  );
}

const ROW_BASE =
  "flex w-full items-center gap-3 rounded-md px-2 py-2 font-body text-body-sm transition-colors";
const ROW_IDLE = "text-on-surface-variant hover:bg-surface-container hover:text-on-surface";
/**
 * The active row is marked by a filled ground *and* a rule down its leading edge.
 * Colour alone would leave the current page invisible to anyone who cannot distinguish
 * the two surfaces, which on a cream ground is a small difference to begin with.
 */
const ROW_ACTIVE =
  "bg-surface-container font-semibold text-on-surface shadow-[inset_2px_0_0_0_rgb(var(--color-primary))]";

function NavRow({
  item,
  active,
  onNavigate,
  nested = false,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const { t } = useLocale();

  return (
    <Link
      href={item.href ?? "/"}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${ROW_BASE} ${active ? ROW_ACTIVE : ROW_IDLE} ${nested ? "ps-9" : ""}`}
    >
      {!nested && <AppIcon name={item.icon} className="size-5 shrink-0" />}
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

function NavGroup({
  item,
  activeId,
  open,
  onToggle,
  onNavigate,
}: {
  item: AppNavItem;
  activeId: string | null;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useLocale();
  const panelId = `nav-group-${item.id}`;
  const containsActive = item.children?.some((child) => child.id === activeId) ?? false;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${ROW_BASE} ${containsActive && !open ? ROW_ACTIVE : ROW_IDLE}`}
      >
        <AppIcon name={item.icon} className="size-5 shrink-0" />
        <span className="flex-1 truncate text-start">{t(item.labelKey)}</span>
        <ChevronIcon
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="sr-only">
          {open ? t("nav.collapse", { label: t(item.labelKey) }) : t("nav.expand", { label: t(item.labelKey) })}
        </span>
      </button>

      {open && (
        <ul id={panelId} className="mt-0.5 flex flex-col gap-0.5">
          {item.children?.map((child) => (
            <li key={child.id}>
              <NavRow
                item={child}
                active={activeId === child.id}
                onNavigate={onNavigate}
                nested
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
