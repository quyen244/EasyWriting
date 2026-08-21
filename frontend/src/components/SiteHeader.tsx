"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LanguageSwitcher from "@/components/nav/LanguageSwitcher";
import MobileNav from "@/components/nav/MobileNav";
import NavMenu from "@/components/nav/NavMenu";
import { NAV_LINKS, NAV_MENUS } from "@/lib/navigation";

/**
 * The persistent public header.
 *
 * Three product menus (Grader / Mock Test / Practice) replace the old flat track links.
 * Most of what those menus contain does not exist yet and renders disabled — see
 * `lib/navigation.ts` for why the unbuilt entries are shown rather than hidden.
 *
 * Condenses on scroll: at rest it sits flush on the page with no seam, and past the
 * first scroll it picks up a hairline rule and a blurred ground so body text passing
 * underneath does not collide with the nav labels.
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-nav transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-b border-outline-variant bg-surface/90 backdrop-blur"
          : "border-b border-transparent bg-surface"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-container items-center justify-between gap-6 px-margin-mobile py-4"
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded bg-primary-container font-body text-[20px] font-bold leading-none text-on-primary-container"
          >
            W
          </span>
          <span className="font-body text-[20px] font-bold tracking-[-0.5px] text-on-surface">
            WriteWise
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_MENUS.map((menu) => (
            <NavMenu key={menu.label} menu={menu} />
          ))}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href!}
              className="py-2 font-body text-body-md font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:inline-block" />
          <Link
            href="/signin"
            className="hidden font-body text-body-md font-medium text-on-surface-variant transition-colors hover:text-on-surface sm:block"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-md bg-primary-container px-5 py-2.5 font-body text-body-md font-bold text-on-primary-container shadow-brutal-sm transition-transform hover:-translate-y-0.5 lg:block"
          >
            Free Try →
          </Link>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
