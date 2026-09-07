import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  </svg>
);
export const IconPlan = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 3h6l1 3H8l1-3z" />
    <rect x="5" y="6" width="14" height="15" rx="2" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);
export const IconBuild = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2l3 3-8 8-4 1 1-4 8-8z" />
    <path d="M14 5l3 3" />
    <path d="M4 21h16" />
  </svg>
);
export const IconUndo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10h10a5 5 0 010 10H9" />
    <path d="M7 5L3 10l4 5" />
  </svg>
);
export const IconRedo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 10H11a5 5 0 000 10h4" />
    <path d="M17 5l4 5-4 5" />
  </svg>
);
export const IconComment = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 01-8 8H7l-4 3 1-4.5A8 8 0 1121 12z" />
  </svg>
);
export const IconDoc = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h6M9 8h2" />
  </svg>
);
export const IconMermaid = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3v4a2 2 0 002 2h8a2 2 0 002-2V3" />
    <path d="M12 9v5" />
    <circle cx="8" cy="18" r="2.2" />
    <circle cx="16" cy="18" r="2.2" />
    <path d="M12 14l-3.2 2.4M12 14l3.2 2.4" />
  </svg>
);
export const IconExport = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 21h14" />
  </svg>
);
export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 16V4" />
    <path d="M7 9l5-5 5 5" />
    <rect x="4" y="16" width="16" height="4" rx="1" />
  </svg>
);
export const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
  </svg>
);
export const IconVideo = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="M15 10l6-3v10l-6-3" />
  </svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const IconFit = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
  </svg>
);
export const IconPaperclip = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 11.5L12.5 20a4 4 0 01-5.7-5.7L15 6a2.7 2.7 0 013.8 3.8l-8.2 8.2a1.3 1.3 0 01-1.9-1.9l7-7" />
  </svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
    <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
  </svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
export const IconSlack = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="2" width="6" height="8" rx="2" />
    <rect x="9" y="14" width="6" height="8" rx="2" />
    <rect x="2" y="9" width="8" height="6" rx="2" />
    <rect x="14" y="9" width="8" height="6" rx="2" />
  </svg>
);
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0115-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 01-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
  </svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.86L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.86a2 2 0 00-3.4 0z" />
  </svg>
);
export const IconClose = IconX;
