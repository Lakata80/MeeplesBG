import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'MeeplesBG — Настолни игри в България'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:     'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'sans-serif',
          color:          'white',
          position:       'relative',
        }}
      >
        {/* Фон — декоративни кръгове */}
        <div
          style={{
            position:     'absolute',
            top:          -80,
            right:        -80,
            width:        400,
            height:       400,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.05)',
          }}
        />
        <div
          style={{
            position:     'absolute',
            bottom:       -60,
            left:         -60,
            width:        300,
            height:       300,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.05)',
          }}
        />

        {/* Съдържание */}
        <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 24 }}>🎲</div>
        <div
          style={{
            fontSize:      72,
            fontWeight:    900,
            letterSpacing: '-2px',
            marginBottom:  16,
          }}
        >
          MeeplesBG
        </div>
        <div
          style={{
            fontSize:   30,
            opacity:    0.85,
            textAlign:  'center',
            maxWidth:   800,
            lineHeight: 1.4,
          }}
        >
          Настолни игри в България
        </div>

        {/* Долна лента */}
        <div
          style={{
            position:   'absolute',
            bottom:     40,
            display:    'flex',
            gap:        32,
            fontSize:   18,
            opacity:    0.7,
          }}
        >
          <span>🔍 Търси игри</span>
          <span>·</span>
          <span>⭐ Топ класации</span>
          <span>·</span>
          <span>💬 Форум</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
