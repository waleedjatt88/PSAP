// Just the marker — no hand. Drawn horizontally with the nib at the exact
// left-center of its own box (0%, 50%), so a caller can position it with
// plain `left`/`top` and rotate it with `transformOrigin: "0% 50%"`
// without the nib ever drifting off its measured target point.
export default function MarkerPen({ className, style }) {
  return (
    <svg
      viewBox="0 0 140 40"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mp-barrel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
      </defs>
      {/* Nib, tip exactly at (0, 20) */}
      <path d="M0 20 L26 10 L26 30 Z" fill="#1F2937" />
      {/* Barrel */}
      <rect x="26" y="8" width="90" height="24" rx="7" fill="url(#mp-barrel)" />
      {/* Metal band + cap */}
      <rect x="100" y="8" width="14" height="24" fill="#D1D5DB" />
      <rect x="114" y="8" width="26" height="24" rx="6" fill="#2E1065" />
    </svg>
  );
}
