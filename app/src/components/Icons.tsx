/** Small inline SVG icons. Decorative: always paired with visible text or an accessible name. */
import type { ReactNode } from 'react';

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ?? 'h-5 w-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ArrowDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4v16M5 13l7 7 7-7" />
    </Svg>
  );
}

export function ArrowUpIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 20V4M5 11l7-7 7 7" />
    </Svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </Svg>
  );
}

export function ArrowLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 12H4M11 5l-7 7 7 7" />
    </Svg>
  );
}

export function EqualIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 9h14M5 15h14" />
    </Svg>
  );
}

export function NotEqualIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 9h14M5 15h14M16 4 8 20" />
    </Svg>
  );
}

export function InfoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4M12 17h.01" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  );
}

export function CrossIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export function CopyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Svg>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 5v14l11-7L7 5z" />
    </Svg>
  );
}

export function ResetIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </Svg>
  );
}

export function SlidersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </Svg>
  );
}

export function TrendIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </Svg>
  );
}

export function PercentIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </Svg>
  );
}

export function SwapIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" />
    </Svg>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </Svg>
  );
}

export function BasketIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 9h18l-2 11H5L3 9z" />
      <path d="m8 9 4-6 4 6M9 13v4M15 13v4" />
    </Svg>
  );
}

export function RouteIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M7 6h7a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7" />
    </Svg>
  );
}

export function TelescopeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m4 14 13-6 2 4-13 6-2-4z" />
      <path d="M10 15l-2 6M12 14l3 7" />
    </Svg>
  );
}

export function LabIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-10V3" />
      <path d="M7 15h10" />
    </Svg>
  );
}

export function TableIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </Svg>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3z" />
      <path d="M12 8v5M12 16h.01" />
    </Svg>
  );
}

export function ApproxIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 9c2.5-2 5.5 2 8 0s5.5-2 8 0M4 15c2.5-2 5.5 2 8 0s5.5-2 8 0" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </Svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" />
    </Svg>
  );
}

export function CompareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  );
}

export function QuizIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" />
    </Svg>
  );
}

export function MathIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 5H7l5 7-5 7h11" />
    </Svg>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" />
    </Svg>
  );
}
