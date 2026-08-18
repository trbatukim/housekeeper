import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#21192F',
          borderRadius: 12,
        }}
      >
        <svg width="36" height="32" viewBox="0 0 40 36" fill="none">
          <polygon points="20,0 4,16 36,16" fill="#a98bff" />
          <rect x="8" y="16" width="24" height="20" fill="#a98bff" />
          <path d="M15 36 V27 Q15 24 18 24 H22 Q25 24 25 27 V36 Z" fill="#21192F" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
