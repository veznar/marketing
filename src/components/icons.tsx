type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const IconFlame = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3c1.2 4.2-3.8 6.1-3.8 10.4a5.8 5.8 0 0 0 11.6 0c0-2.6-1.2-4.4-2.5-6-.3 1.7-1.1 2.6-2.3 3.2.6-3.6 0-5.8-3-7.6z" />
    <path d="M12 20.5a3 3 0 0 1-3-3c0-1.7 1.3-2.6 3-4 1.7 1.4 3 2.3 3 4a3 3 0 0 1-3 3z" />
  </svg>
);

export const IconBot = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="5" y="9" width="14" height="10" rx="2" />
    <path d="M12 9V5.5" />
    <circle cx="12" cy="4.5" r="1" />
    <circle cx="9.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    <path d="M9.5 16.5h5" />
  </svg>
);

export const IconTarget = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconRoute = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="5.5" cy="18.5" r="2" />
    <circle cx="18.5" cy="5.5" r="2" />
    <path d="M7.5 18.5H14a4 4 0 0 0 4-4V7.5" />
    <path d="M15.5 10L18 7.5 20.5 10" />
  </svg>
);

export const IconShield = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3l7 2.8V11c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V5.8z" />
    <path d="M9 11.5l2.2 2.2L15.5 9" />
  </svg>
);

export const IconDoc = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 12h6M9.5 15.5h6M9.5 8.5H12" />
  </svg>
);

export const IconDownload = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4v10M8 10.5l4 4 4-4" />
    <path d="M5 19.5h14" />
  </svg>
);

export const IconCopy = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M5 15V5h10" />
  </svg>
);

export const IconCheck = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const IconArrow = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const IconPlay = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const IconReset = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 5v5.5h5.5" />
    <path d="M4.6 10.5a8 8 0 1 1 1.7 5" />
  </svg>
);

export const IconGauge = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 15.5a8 8 0 1 1 16 0" />
    <path d="M12 15.5l4.2-5.2" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M4 19.5h16" />
  </svg>
);

export const IconWrench = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14.9 6.1a4.2 4.2 0 0 0-5.8 5L4 16.2V20h3.8l5.1-5.1a4.2 4.2 0 0 0 5-5.8l-2.7 2.7-2.3-.6-.6-2.3z" />
  </svg>
);

export const IconMedal = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="9" r="5" />
    <path d="M8.7 13.2L7 21l5-2.4L17 21l-1.7-7.8" />
    <path d="M12 6.6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" />
  </svg>
);

export const IconSend = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 11.5L20 4l-7.5 16-2.7-6.3z" />
    <path d="M9.8 13.7L20 4" />
  </svg>
);

export const IconSpark = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />
  </svg>
);

export const LogoMark = ({ className }: P) => (
  <svg viewBox="0 0 32 32" className={className}>
    <path
      d="M16 2l12 7v14l-12 7-12-7V9z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M16 8c.9 3.6-3.2 5.2-3.2 8.9a4.9 4.9 0 0 0 9.8 0c0-2.2-1-3.7-2.1-5-.3 1.4-1 2.2-2 2.7.5-3 0-4.9-2.5-6.6z"
      fill="#FF7A1F"
    />
  </svg>
);
