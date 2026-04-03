import React from 'react';

const CONFETTI_PIECES = [
  { left: '6%', top: '18%', rotate: '-18deg', delay: '0ms', color: '#f2488f' },
  {
    left: '12%',
    top: '42%',
    rotate: '22deg',
    delay: '120ms',
    color: '#16c7d9',
  },
  {
    left: '18%',
    top: '62%',
    rotate: '-34deg',
    delay: '60ms',
    color: '#f7c436',
  },
  {
    left: '24%',
    top: '28%',
    rotate: '16deg',
    delay: '200ms',
    color: '#a348ff',
  },
  {
    left: '31%',
    top: '54%',
    rotate: '-12deg',
    delay: '80ms',
    color: '#69bf34',
  },
  {
    left: '38%',
    top: '16%',
    rotate: '28deg',
    delay: '140ms',
    color: '#f26122',
  },
  {
    left: '44%',
    top: '38%',
    rotate: '-24deg',
    delay: '40ms',
    color: '#f2488f',
  },
  {
    left: '49%',
    top: '68%',
    rotate: '12deg',
    delay: '160ms',
    color: '#16c7d9',
  },
  {
    left: '56%',
    top: '24%',
    rotate: '-30deg',
    delay: '20ms',
    color: '#f7c436',
  },
  {
    left: '61%',
    top: '48%',
    rotate: '18deg',
    delay: '180ms',
    color: '#a348ff',
  },
  {
    left: '67%',
    top: '14%',
    rotate: '-16deg',
    delay: '70ms',
    color: '#69bf34',
  },
  {
    left: '72%',
    top: '60%',
    rotate: '26deg',
    delay: '130ms',
    color: '#f26122',
  },
  {
    left: '78%',
    top: '30%',
    rotate: '-20deg',
    delay: '110ms',
    color: '#16c7d9',
  },
  {
    left: '84%',
    top: '50%',
    rotate: '14deg',
    delay: '170ms',
    color: '#f2488f',
  },
  {
    left: '89%',
    top: '22%',
    rotate: '-28deg',
    delay: '90ms',
    color: '#f7c436',
  },
  { left: '8%', top: '74%', rotate: '18deg', delay: '150ms', color: '#69bf34' },
  {
    left: '16%',
    top: '8%',
    rotate: '-22deg',
    delay: '210ms',
    color: '#16c7d9',
  },
  {
    left: '27%',
    top: '70%',
    rotate: '12deg',
    delay: '240ms',
    color: '#f26122',
  },
  {
    left: '35%',
    top: '46%',
    rotate: '-14deg',
    delay: '100ms',
    color: '#f7c436',
  },
  {
    left: '42%',
    top: '78%',
    rotate: '30deg',
    delay: '260ms',
    color: '#a348ff',
  },
  {
    left: '53%',
    top: '10%',
    rotate: '-18deg',
    delay: '70ms',
    color: '#f2488f',
  },
  {
    left: '58%',
    top: '58%',
    rotate: '24deg',
    delay: '190ms',
    color: '#69bf34',
  },
  {
    left: '65%',
    top: '74%',
    rotate: '-10deg',
    delay: '230ms',
    color: '#16c7d9',
  },
  { left: '74%', top: '8%', rotate: '16deg', delay: '250ms', color: '#f26122' },
  {
    left: '82%',
    top: '68%',
    rotate: '-26deg',
    delay: '140ms',
    color: '#a348ff',
  },
  {
    left: '92%',
    top: '42%',
    rotate: '20deg',
    delay: '220ms',
    color: '#69bf34',
  },
];

const CONFETTI_CLOUDS = [
  { left: '18%', top: '16%', size: '4.8rem', rotate: '-12deg' },
  { left: '52%', top: '25%', size: '5.6rem', rotate: '18deg' },
  { left: '78%', top: '18%', size: '5.2rem', rotate: '-8deg' },
  { left: '70%', top: '58%', size: '6rem', rotate: '10deg' },
  { left: '12%', top: '60%', size: '4.6rem', rotate: '14deg' },
];

const DENSE_CONFETTI_PIECES = [
  ...CONFETTI_PIECES,
  ...CONFETTI_PIECES.map((p) => ({
    ...p,
    left: `${(parseFloat(p.left) + 33) % 100}%`,
    top: `${(parseFloat(p.top) + 25) % 100}%`,
    rotate: `${parseInt(p.rotate) * -1 - 15}deg`,
  })),
  ...CONFETTI_PIECES.map((p) => ({
    ...p,
    left: `${(parseFloat(p.left) + 61) % 100}%`,
    top: `${(parseFloat(p.top) + 48) % 100}%`,
    rotate: `${parseInt(p.rotate) + 34}deg`,
    delay: `${parseInt(p.delay) + 110}ms`,
  })),
];

interface StickerBookConfettiProps {
  isDropConfetti: boolean;
  containerPos?: { x: number; y: number; size: number };
}

const StickerBookConfetti: React.FC<StickerBookConfettiProps> = ({
  isDropConfetti,
  containerPos,
}) => {
  const containerStyle: React.CSSProperties | undefined =
    isDropConfetti && containerPos
      ? ({
          inset: 'auto',
          left: containerPos.x - containerPos.size * 1.2,
          top: containerPos.y - containerPos.size * 1.65,
          width: containerPos.size * 2.4,
          height: containerPos.size * 2.1,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 10,
        } as React.CSSProperties)
      : !isDropConfetti && containerPos
        ? ({
            inset: 'auto',
            left: containerPos.x - containerPos.size * 2,
            top: containerPos.y - containerPos.size * 2,
            width: containerPos.size * 4,
            height: containerPos.size * 4,
            '--drop-rise': `${containerPos.size}px`,
            '--drop-burst-settle': `${Math.max(10, containerPos.size * 0.18)}px`,
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 10,
          } as React.CSSProperties)
        : undefined;
  return (
    <div
      className={`StickerBookPreviewModal-confetti ${
        isDropConfetti ? 'StickerBookPreviewModal-confetti--drop' : ''
      }`}
      style={containerStyle}
      data-testid="StickerBookPreviewModal-confetti"
    >
      {CONFETTI_CLOUDS.map((cloud, index) => (
        <span
          key={`cloud-${index}`}
          className="StickerBookPreviewModal-confetti-cloud"
          style={
            {
              '--cloud-left': cloud.left,
              '--cloud-top': cloud.top,
              '--cloud-size': cloud.size,
              '--cloud-rotate': cloud.rotate,
            } as React.CSSProperties
          }
        />
      ))}
      {isDropConfetti ? (
        <div className="StickerBookPreviewModal-confetti-drop-container">
          <span className="StickerBookPreviewModal-confetti-drop-seed" />
          <svg
            viewBox="0 0 400 400"
            className="StickerBookPreviewModal-confetti-drop-svg"
            style={{ overflow: 'visible' }}
            aria-hidden="true"
          >
            <g className="StickerBookPreviewModal-confetti-drop-explode">
              {[1, -1].map((scaleX, index) => (
                <g
                  key={`drop-side-${index}`}
                  transform={`translate(200, 200) scale(${scaleX}, 1)`}
                >
                  <path
                    d="M 30 -160 Q 40 -140 30 -120 M 40 -140 Q 55 -155 60 -170"
                    stroke="#EE5A30"
                    strokeWidth="4.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 80 -120 C 110 -90 60 -50 90 -20"
                    stroke="#F4B846"
                    strokeWidth="5.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 30 70 C 60 100 20 140 50 170"
                    stroke="#F4B846"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 100 Q 20 130 30 160"
                    stroke="#36848A"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 200 Q 40 240 60 280"
                    stroke="#EE5A30"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="15" cy="-140" r="5" fill="#7B384A" />
                  <circle cx="100" cy="50" r="6" fill="#7B384A" />
                  <circle cx="25" cy="-10" r="7" fill="#F4B846" />
                  <circle cx="80" cy="-60" r="6" fill="#F4B846" />
                  <g transform="translate(20, -70) rotate(-15)">
                    <rect x="-4" y="-8" width="8" height="16" fill="#36848A" />
                  </g>
                  <g transform="translate(30, -50) rotate(15)">
                    <rect x="-4" y="-6" width="8" height="12" fill="#EE5A30" />
                  </g>
                  <g transform="translate(80, -20) rotate(30)">
                    <rect x="-4" y="-8" width="8" height="16" fill="#36848A" />
                  </g>
                  <g transform="translate(40, -100) rotate(45)">
                    <rect x="-4" y="-8" width="8" height="16" fill="#F4B846" />
                  </g>
                  <g transform="translate(90, -100) rotate(-20)">
                    <rect
                      x="-5"
                      y="-10"
                      width="10"
                      height="20"
                      fill="#EE5A30"
                    />
                  </g>
                  <g transform="translate(130, -90) rotate(5)">
                    <rect x="-4" y="-8" width="8" height="16" fill="#EE5A30" />
                  </g>
                  <g transform="translate(40, 30) rotate(-45)">
                    <rect x="-4" y="-8" width="8" height="16" fill="#F4B846" />
                  </g>
                  <g transform="translate(70, 70) rotate(45)">
                    <rect x="-6" y="-6" width="12" height="12" fill="#F4B846" />
                  </g>
                </g>
              ))}
              <circle cx="200" cy="220" r="6" fill="#36848A" />
              <g transform="translate(200, 200)">
                <rect
                  x="-20"
                  y="-150"
                  width="10"
                  height="6"
                  fill="#EE5A30"
                  transform="rotate(-15)"
                />
                <rect
                  x="10"
                  y="-150"
                  width="10"
                  height="6"
                  fill="#EE5A30"
                  transform="rotate(15)"
                />
                <polygon points="-8,-100 8,-100 0,-90" fill="#36848A" />
              </g>
            </g>
          </svg>
        </div>
      ) : (
        DENSE_CONFETTI_PIECES.map((piece, index) => (
          <span
            key={`piece-${index}`}
            className="StickerBookPreviewModal-confetti-piece"
            style={
              {
                '--piece-left': piece.left,
                '--piece-top': piece.top,
                '--piece-rotate': piece.rotate,
                '--piece-delay': piece.delay,
                '--piece-color': piece.color,
              } as React.CSSProperties
            }
          />
        ))
      )}
    </div>
  );
};

export default StickerBookConfetti;
