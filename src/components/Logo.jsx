export default function Logo({ size = 36, withText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PassPoint"
      >
        <defs>
          <linearGradient id="ppRing" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="55%" stopColor="#1E3A8A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="url(#ppRing)"
          strokeWidth="6"
          fill="white"
        />
        {/* Graduation cap */}
        <path d="M14 28 L32 20 L50 28 L32 36 Z" fill="#1E3A8A" />
        <path d="M22 32 L22 40 Q32 46 42 40 L42 32" fill="#1E3A8A" />
        {/* Compass needle */}
        <path d="M32 14 L36 32 L32 28 Z" fill="#F59E0B" />
        <path d="M32 50 L28 32 L32 36 Z" fill="#1E3A8A" />
        <circle cx="32" cy="32" r="2.5" fill="white" stroke="#1E3A8A" strokeWidth="1.5" />
      </svg>
      {withText && (
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-brand-blue">Pass</span>
          <span className="text-brand-orange">Point</span>
        </span>
      )}
    </div>
  );
}
