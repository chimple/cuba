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
  { left: '4%', top: '34%', rotate: '12deg', delay: '30ms', color: '#f26122' },
  {
    left: '10%',
    top: '12%',
    rotate: '-26deg',
    delay: '180ms',
    color: '#a348ff',
  },
  {
    left: '14%',
    top: '82%',
    rotate: '32deg',
    delay: '280ms',
    color: '#16c7d9',
  },
  {
    left: '21%',
    top: '52%',
    rotate: '-16deg',
    delay: '90ms',
    color: '#f2488f',
  },
  {
    left: '29%',
    top: '18%',
    rotate: '22deg',
    delay: '150ms',
    color: '#69bf34',
  },
  {
    left: '33%',
    top: '84%',
    rotate: '-20deg',
    delay: '320ms',
    color: '#f7c436',
  },
  {
    left: '40%',
    top: '56%',
    rotate: '18deg',
    delay: '210ms',
    color: '#16c7d9',
  },
  {
    left: '46%',
    top: '12%',
    rotate: '-30deg',
    delay: '50ms',
    color: '#f26122',
  },
  {
    left: '51%',
    top: '82%',
    rotate: '14deg',
    delay: '260ms',
    color: '#f2488f',
  },
  {
    left: '59%',
    top: '34%',
    rotate: '-12deg',
    delay: '120ms',
    color: '#69bf34',
  },
  {
    left: '63%',
    top: '20%',
    rotate: '26deg',
    delay: '340ms',
    color: '#f7c436',
  },
  {
    left: '69%',
    top: '82%',
    rotate: '-24deg',
    delay: '240ms',
    color: '#a348ff',
  },
  {
    left: '76%',
    top: '44%',
    rotate: '10deg',
    delay: '100ms',
    color: '#16c7d9',
  },
  {
    left: '81%',
    top: '14%',
    rotate: '-18deg',
    delay: '300ms',
    color: '#f26122',
  },
  {
    left: '87%',
    top: '80%',
    rotate: '28deg',
    delay: '160ms',
    color: '#f2488f',
  },
  {
    left: '94%',
    top: '26%',
    rotate: '-14deg',
    delay: '230ms',
    color: '#69bf34',
  },
  {
    left: '48%',
    top: '48%',
    rotate: '36deg',
    delay: '370ms',
    color: '#f7c436',
  },
  {
    left: '25%',
    top: '38%',
    rotate: '-32deg',
    delay: '190ms',
    color: '#a348ff',
  },
];

const CONFETTI_CLOUDS = [
  { left: '18%', top: '16%', size: '4.8rem', rotate: '-12deg' },
  { left: '52%', top: '25%', size: '5.6rem', rotate: '18deg' },
  { left: '78%', top: '18%', size: '5.2rem', rotate: '-8deg' },
  { left: '70%', top: '58%', size: '6rem', rotate: '10deg' },
  { left: '12%', top: '60%', size: '4.6rem', rotate: '14deg' },
  { left: '34%', top: '12%', size: '4.2rem', rotate: '8deg' },
  { left: '60%', top: '72%', size: '4.8rem', rotate: '-14deg' },
  { left: '86%', top: '52%', size: '4.4rem', rotate: '12deg' },
];

interface StickerBookConfettiProps {
  isDropConfetti: boolean;
}

const StickerBookConfetti: React.FC<StickerBookConfettiProps> = ({
  isDropConfetti,
}) => {
  return (
    <div
      className={`StickerBookPreviewModal-confetti ${
        isDropConfetti ? 'StickerBookPreviewModal-confetti--drop' : ''
      }`}
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
      {CONFETTI_PIECES.map((piece, index) => (
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
      ))}
    </div>
  );
};

export default StickerBookConfetti;
