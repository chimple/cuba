import { useStickerBookConfetti } from '../../hooks/useStickerBookConfetti';

const StickerBookConfetti = (props: Parameters<typeof useStickerBookConfetti>[0]) => {
  const viewProps = useStickerBookConfetti(props);

  const {
    CONFETTI_CLOUDS,
    DENSE_CONFETTI_PIECES,
    containerStyle,
    isDropConfetti,
  } = viewProps;

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
