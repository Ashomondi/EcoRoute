import { useId } from 'react'

export default function Logo({ size = 28, className = '' }) {
  const gradId = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
      <rect x="20" y="8.5" width="8" height="4" rx="2" fill="#ffffff" opacity="0.85" />
      <rect x="15" y="12.5" width="18" height="5" rx="2.5" fill="#ffffff" />
      <path
        d="M16.5 19h15l-1.1 18.6a2.6 2.6 0 0 1-2.6 2.4H20.2a2.6 2.6 0 0 1-2.6-2.4L16.5 19z"
        fill="#ffffff"
      />
      <rect x="18.4" y="27.5" width="11.2" height="6.5" rx="3.25" fill="#0f766e" opacity="0.9" />
      <rect x="32" y="32.5" width="3.4" height="4.5" rx="1" fill="#ffffff" opacity="0.55" />
      <rect x="36.4" y="29.5" width="3.4" height="7.5" rx="1" fill="#ffffff" opacity="0.75" />
      <rect x="40.8" y="26.5" width="3.4" height="10.5" rx="1" fill="#ffffff" />
    </svg>
  )
}
