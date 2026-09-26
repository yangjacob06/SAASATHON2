/**
 * The icon set. Deliberately tiny: one arrow in two orientations plus the
 * marks the marketing page needs. Everything is a 1.6px stroke on a 24-grid
 * so icons sit at the same optical weight as the UI type beside them.
 */

type IconProps = { className?: string; size?: number };

function svg(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
}

export function ArrowUpRight({ className = "", size = 15 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ArrowRight({ className = "", size = 15 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function Check({ className = "", size = 14 }: IconProps) {
  return (
    <svg {...svg(size, className)} strokeWidth={2}>
      <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function Document({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function Compass({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </svg>
  );
}

export function Timeline({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M5 4v16M5 8h8a3 3 0 0 1 0 6H9" />
      <circle cx="17" cy="8" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

export function Lock({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2" />
    </svg>
  );
}

export function Building({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M4 21V6.5L12 3l8 3.5V21M4 21h16M9 21v-4.5h6V21" />
      <path d="M8.5 9h1.5M14 9h1.5M8.5 12.5H10M14 12.5h1.5" />
    </svg>
  );
}

export function Spark({ className = "", size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 3.5v3M20 5h-3" />
    </svg>
  );
}

export function Pin({ className = "", size = 14 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Clock({ className = "", size = 14 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.2 2" />
    </svg>
  );
}
