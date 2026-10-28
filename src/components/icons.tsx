import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconDownload(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function IconMenu(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function IconClose(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function IconShield(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 2.5 4.5 5.4v5.7c0 4.7 3.2 8.5 7.5 10.4 4.3-1.9 7.5-5.7 7.5-10.4V5.4L12 2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconChevronUp(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

export function IconChevronDown(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconArrowRight(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowUpRight(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function IconBook(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H10a2 2 0 0 1 2 2v15a1.6 1.6 0 0 0-1.6-1.6H4V4.5Z" />
      <path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H14a2 2 0 0 0-2 2v15a1.6 1.6 0 0 1 1.6-1.6H20V4.5Z" />
    </svg>
  );
}

export function IconBulb(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function IconAlert(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconBrain(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M9.5 3.5A2.8 2.8 0 0 0 6.7 6.3 2.6 2.6 0 0 0 5 8.8c0 .8.3 1.5.9 2A2.7 2.7 0 0 0 5 13a2.7 2.7 0 0 0 1.6 2.5A2.6 2.6 0 0 0 9 18.6c.4 1 1.3 1.7 2.4 1.8V3.9c-.6-.3-1.2-.4-1.9-.4Z" />
      <path d="M14.5 3.5a2.8 2.8 0 0 1 2.8 2.8 2.6 2.6 0 0 1 1.7 2.5c0 .8-.3 1.5-.9 2A2.7 2.7 0 0 1 19 13a2.7 2.7 0 0 1-1.6 2.5A2.6 2.6 0 0 1 15 18.6c-.4 1-1.3 1.7-2.4 1.8V3.9c.6-.3 1.2-.4 1.9-.4Z" />
    </svg>
  );
}

export function IconStar(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m12 3.5 2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.6l5.9-.8L12 3.5Z" />
    </svg>
  );
}

export function IconSparkle(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9 12 3.5Z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </svg>
  );
}

export function IconPrint(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M7 8V3h10v5" />
      <path d="M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  );
}

export function IconFilePdf(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 16.5h1.2a1.3 1.3 0 0 0 0-2.6H8.5v4.6" />
      <path d="M14 13.9v4.6h.8a1.4 1.4 0 0 0 1.4-1.4v-1.8a1.4 1.4 0 0 0-1.4-1.4H14Z" />
    </svg>
  );
}

export function IconFileWord(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="m8 13 1.4 4.6L11 14l1.6 3.6L14 13" />
    </svg>
  );
}

export function IconTarget(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconClipboard(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="2.5" width="6" height="4" rx="1.2" />
      <path d="m8.8 13.5 1.9 1.9 3.9-4" />
    </svg>
  );
}

export function IconCheck(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconQuote(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M9.6 5C6.5 6.3 4.5 9 4.5 12.4V19h6.2v-6.6H7.4c.1-1.9 1-3.3 2.9-4.2L9.6 5Zm9.4 0c-3.1 1.3-5.1 4-5.1 7.4V19h6.2v-6.6h-3.3c.1-1.9 1-3.3 2.9-4.2L19 5Z" />
    </svg>
  );
}

export function IconUsers(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.3a3.2 3.2 0 0 1 0 5.4" />
      <path d="M17.5 14.4a5.5 5.5 0 0 1 3 5.6" />
    </svg>
  );
}

export function IconLayers(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12.5 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

export function IconClock(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconList(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

export function IconSearch(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Learning Hub icon set                                               */
/* ------------------------------------------------------------------ */

export function IconHome(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m4 10.5 8-6.5 8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function IconDashboard(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function IconTrophy(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5.5v1.5A3.5 3.5 0 0 0 9 10" />
      <path d="M16 5h2.5v1.5A3.5 3.5 0 0 1 15 10" />
      <path d="M12 12v3" />
      <path d="M9 20h6" />
      <path d="M10 20v-2.5h4V20" />
    </svg>
  );
}

export function IconSettings(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.06a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 4.62 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.62 1.7 1.7 0 0 0 10 3.06V3a2 2 0 1 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.06a1.7 1.7 0 0 0 1.54 1.03H21a2 2 0 1 1 0 4h-.06a1.7 1.7 0 0 0-1.54 1.03Z" />
    </svg>
  );
}

export function IconCloud(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M7 18h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.2 9.5 4.25 4.25 0 0 0 7 18Z" />
    </svg>
  );
}

export function IconRefresh(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 9" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 15" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

export function IconCopy(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </svg>
  );
}

export function IconPlay(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function IconChevronLeft(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}

export function IconChevronRight(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m10 6 6 6-6 6" />
    </svg>
  );
}

export function IconPlus(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconTrash(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h16" />
      <path d="M9 7V4.8h6V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconTrend(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m4 16 5-5 3.5 3.5L20 8" />
      <path d="M15 8h5v5" />
    </svg>
  );
}

export function IconAward(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="9" r="5" />
      <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
    </svg>
  );
}

export function IconUser(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconCheckCircle(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </svg>
  );
}

export function IconFilter(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

export function IconExternal(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
