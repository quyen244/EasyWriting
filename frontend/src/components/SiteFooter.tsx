import Link from "next/link";

/**
 * Shared public footer (002 T050).
 *
 * The disclaimer is repeated here, not only in the FAQ: FR-015 requires the "not an
 * official IELTS result" statement to be unambiguous, and a visitor who never opens the
 * FAQ should still meet it.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
        <p className="font-display text-headline-sm text-on-surface">WriteWise</p>
        <p className="mt-stack-sm max-w-2xl font-body text-body-sm text-on-surface-variant">
          Band scores are AI-generated estimates for practice only. They are not official
          or certified IELTS results, and IELTS is not affiliated with WriteWise.
        </p>

        <div className="mt-stack-md flex flex-wrap gap-6">
          <Link href="/faq" className="font-body text-body-sm text-on-surface-variant hover:text-on-surface">
            FAQ
          </Link>
          <Link href="/signin" className="font-body text-body-sm text-on-surface-variant hover:text-on-surface">
            Sign in
          </Link>
        </div>

        <p className="mt-stack-md font-body text-body-sm text-on-surface-variant">
          © {year} WriteWise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
