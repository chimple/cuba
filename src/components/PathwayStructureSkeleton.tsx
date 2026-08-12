const PathwayStructureSkeleton = () => {
  const gradientId = 'pathwayFlowerSkeletonGradient';
  const petalAngles = [0, 60, 120, 180, 240, 300];
  // First flower transform is kept exactly as requested.
  // Coordinates adjusted slightly to keep flowers centered when scale is reduced.
  const flowerNodes = [
    { x: 16.5, y: 41.35, scale: 0.85 },
    { x: 166.1, y: 25.2, scale: 0.82 },
    { x: 277.7, y: 45.9, scale: 0.82 },
    { x: 390.8, y: 25.9, scale: 0.82 },
    { x: 510.9, y: 45.5, scale: 0.82 },
  ];

  const pathData = [
    'M70.8044 69.6535C101.195 69.6535 186.388 55.8228 200.836 54.9297',
    'M200.833 54.9282C215.281 54.0351 289.514 86.6065 312.431 86.6065',
    'M312.432 86.6051C335.35 86.6051 398.912 57.6055 420.543 57.6055',
    'M420.542 57.6055C440.969 57.6055 510.718 85.2651 535.628 85.2651',
    'M535.627 85.2676C560.537 85.2676 622.813 52.2534 640.25 55.3763',
  ];

  return (
    <div className="skeleton-pathway-wrapper">
      <svg
        className="skeleton-pathway-svg"
        width="95vw"
        viewBox="0 0 770 250"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="250"
            y2="0"
          >
            <stop offset="0%" stopColor="#cfd6db" />
            <stop offset="50%" stopColor="#eceff2" />
            <stop offset="100%" stopColor="#cfd6db" />
            <animate
              attributeName="x1"
              values="-250;770"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="0;1020"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </linearGradient>

          <mask id="pathwayMask">
            {/* Curved connection lines */}
            {pathData.map((d, i) => (
              <path
                key={`path-mask-${i}`}
                d={d}
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {flowerNodes.map((node, index) => (
              <g
                key={`flower-mask-group-${index}`}
                transform={`translate(${node.x} ${node.y}) scale(${node.scale})`}
              >
                {petalAngles.map((angle) => (
                  <ellipse
                    key={`petal-mask-${index}-${angle}`}
                    cx="38"
                    cy="12"
                    rx="11"
                    ry="18"
                    transform={`rotate(${angle} 38 38)`}
                    fill="white"
                    opacity="0.9"
                  />
                ))}
                <circle cx="38" cy="38" r="24" fill="white" />
                {/* Inner circle slightly less opaque for depth */}
                <circle cx="38" cy="38" r="17" fill="#cccccc" />
              </g>
            ))}

            {/* Reward block mask */}
            <g transform="translate(615 35)">
              <rect
                width="60"
                height="46"
                rx="12"
                fill="white"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          </mask>
        </defs>

        {/* Single shimmer rect masked by the entire pathway structure */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${gradientId})`}
          mask="url(#pathwayMask)"
        />
      </svg>
    </div>
  );
};

export default PathwayStructureSkeleton;
