// SproutIcon.jsx
export default function SproutIcon({ size = 56, color = "#22c55e" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow"
    >
      {/* moeda/solo */}
      <ellipse cx="32" cy="50" rx="16" ry="6" fill="#1f2937" opacity="0.35" />
      <rect x="24" y="32" width="16" height="16" rx="3" fill="#ca8a04" />
      <rect x="24" y="30" width="16" height="4" rx="2" fill="#eab308" />
      {/* caule */}
      <path
        d="M32 46 C32 38, 31 30, 31 24"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* folha esquerda */}
      <path
        d="M31 28 C24 28, 18 24, 16 18 C23 18, 28 20, 31 24 Z"
        fill={color}
      />
      {/* folha direita */}
      <path
        d="M33 26 C40 26, 46 23, 48 17 C41 17, 36 19, 33 22 Z"
        fill={color}
      />
    </svg>
  );
}
