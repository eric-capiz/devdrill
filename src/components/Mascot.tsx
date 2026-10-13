export function Mascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Dev Drill buzzer bot mascot"
    >
      <rect
        x="8"
        y="58"
        width="14"
        height="30"
        rx="7"
        fill="#7c3aed"
        transform="rotate(12 15 73)"
      />
      <rect
        x="98"
        y="58"
        width="14"
        height="30"
        rx="7"
        fill="#7c3aed"
        transform="rotate(-12 105 73)"
      />
      <circle cx="60" cy="66" r="42" fill="#7c3aed" />
      <circle
        cx="60"
        cy="66"
        r="42"
        fill="none"
        stroke="#221d33"
        strokeWidth="4"
      />
      <rect x="55" y="12" width="10" height="16" rx="4" fill="#221d33" />
      <ellipse
        cx="60"
        cy="12"
        rx="16"
        ry="10"
        fill="#ec4899"
        stroke="#221d33"
        strokeWidth="4"
      />
      <ellipse cx="54" cy="9" rx="5" ry="3" fill="#ffffff" opacity="0.55" />
      <circle cx="45" cy="60" r="9" fill="#ffffff" />
      <circle cx="75" cy="60" r="9" fill="#ffffff" />
      <circle cx="46.5" cy="61.5" r="4" fill="#221d33" />
      <circle cx="73.5" cy="61.5" r="4" fill="#221d33" />
      <circle cx="48" cy="60" r="1.4" fill="#ffffff" />
      <circle cx="75" cy="60" r="1.4" fill="#ffffff" />
      <circle cx="34" cy="74" r="5" fill="#ec4899" opacity="0.75" />
      <circle cx="86" cy="74" r="5" fill="#ec4899" opacity="0.75" />
      <path
        d="M48 78 Q60 88 72 78"
        stroke="#221d33"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="47"
        y="93"
        width="26"
        height="11"
        rx="5.5"
        fill="#fbbf24"
        stroke="#221d33"
        strokeWidth="3"
      />
    </svg>
  );
}
