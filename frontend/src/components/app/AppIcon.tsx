/**
 * Sidebar and shell icons.
 *
 * Stroke icons on `currentColor`, sized by the caller, and every one `aria-hidden`: the
 * label beside each already carries the meaning, so an icon with an accessible name
 * would make a screen reader announce the same word twice.
 *
 * Kept separate from `ui/Icon.tsx`, which transcribes the marketing page's icon set from
 * the design reference. These are product chrome and answer to different needs.
 */

import type { AppNavIcon } from "@/lib/navigation";

type Props = { className?: string };

function Svg({ className = "size-5", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const PATHS: Record<AppNavIcon, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />,
  grader: (
    <>
      <path d="M5 3.5h9l5 5V20a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 20V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14 3.5V9h5M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  practice: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </>
  ),
  mock: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.7 9.4a2.4 2.4 0 1 1 3.2 2.3c-.6.2-.9.8-.9 1.4v.4" />
      <path d="M12 16.8h.01" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  writing: <path d="M15.2 5.2 18.8 8.8M17 3.5a2.5 2.5 0 0 1 3.5 3.5L7.5 20H4v-3.5Z" />,
  speaking: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
    </>
  ),
};

export default function AppIcon({ name, className }: { name: AppNavIcon } & Props) {
  return <Svg className={className}>{PATHS[name]}</Svg>;
}

/** Chevron for expandable groups. Rotated by the caller. */
export function ChevronIcon({ className = "size-4" }: Props) {
  return (
    <Svg className={className}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function MenuIcon({ className = "size-6" }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function CloseIcon({ className = "size-6" }: Props) {
  return (
    <Svg className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function LogOutIcon({ className = "size-4" }: Props) {
  return (
    <Svg className={className}>
      <path d="M14 8V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V16M10 12h9m0 0-3-3m3 3-3 3" />
    </Svg>
  );
}
