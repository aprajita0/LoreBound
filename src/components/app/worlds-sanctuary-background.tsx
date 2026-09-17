const stars = [
  [4, 9, 1, 0.62],
  [9, 19, 1, 0.44],
  [15, 7, 2, 0.7],
  [21, 27, 1, 0.36],
  [28, 13, 1, 0.55],
  [35, 5, 1, 0.42],
  [43, 24, 1, 0.5],
  [50, 11, 1, 0.4],
  [58, 18, 2, 0.62],
  [64, 6, 1, 0.38],
  [70, 28, 1, 0.48],
  [76, 12, 1, 0.52],
  [82, 20, 2, 0.6],
  [88, 7, 1, 0.4],
  [94, 15, 1, 0.58],
  [98, 30, 1, 0.34],
  [2, 38, 1, 0.36],
  [7, 55, 1, 0.42],
  [96, 48, 2, 0.46],
  [92, 66, 1, 0.34],
  [4, 74, 1, 0.3],
  [11, 87, 1, 0.38],
  [86, 82, 1, 0.28],
  [97, 88, 1, 0.4],
  [78, 35, 1, 0.34],
] as const;

const motes = [
  [6, 46],
  [10, 74],
  [89, 32],
  [94, 57],
  [80, 80],
] as const;

/** Decorative animated backdrop for the My Worlds library. */
export function WorldsSanctuaryBackground() {
  return (
    <div className="worlds-sanctuary" aria-hidden="true">
      <div className="worlds-sanctuary__sky" />

      <div className="worlds-sanctuary__atmosphere worlds-sanctuary__atmosphere--left" />
      <div className="worlds-sanctuary__atmosphere worlds-sanctuary__atmosphere--right" />
      <div className="worlds-sanctuary__atmosphere worlds-sanctuary__atmosphere--lower" />

      <svg
        className="worlds-sanctuary__aurora"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="aurora-far-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#38b6a5" stopOpacity="0" />
            <stop offset="24%" stopColor="#38b6a5" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#6574d9" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#9470c7" stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id="aurora-middle-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#62d6bd" stopOpacity="0" />
            <stop offset="35%" stopColor="#62d6bd" stopOpacity="0.56" />
            <stop offset="72%" stopColor="#7e77df" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#bc76b4" stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id="aurora-near-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#deb978" stopOpacity="0" />
            <stop offset="30%" stopColor="#76c9b5" stopOpacity="0.42" />
            <stop offset="72%" stopColor="#8a77d4" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#c77fbd" stopOpacity="0" />
          </linearGradient>

          <filter
            id="aurora-soft"
            x="-30%"
            y="-40%"
            width="160%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0025 0.007"
              numOctaves="2"
              seed="8"
              result="auroraNoise"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="auroraNoise"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="B"
              result="distortedAurora"
            />

            <feGaussianBlur
              in="distortedAurora"
              stdDeviation="38"
            />
          </filter>
        </defs>

        <g filter="url(#aurora-soft)">
          <path
            className="worlds-sanctuary__aurora-ribbon worlds-sanctuary__aurora-ribbon--far"
            stroke="url(#aurora-far-gradient)"
            d="M-180 245C40 72 236 98 411 219C562 324 698 246 823 137C984-4 1183 13 1584 247"
          />

          <path
            className="worlds-sanctuary__aurora-ribbon worlds-sanctuary__aurora-ribbon--middle"
            stroke="url(#aurora-middle-gradient)"
            d="M-205 370C39 185 245 214 430 334C596 441 735 322 866 218C1044 78 1230 107 1580 323"
          />

          <path
            className="worlds-sanctuary__aurora-ribbon worlds-sanctuary__aurora-ribbon--near"
            stroke="url(#aurora-near-gradient)"
            d="M-160 465C76 318 263 341 430 438C605 541 744 458 895 348C1082 211 1263 255 1588 447"
          />
        </g>
      </svg>

      <div className="worlds-sanctuary__stars">
        {stars.map(([left, top, size, opacity], index) => {
          const isPulsing = [2, 5, 8, 11, 14, 18, 22].includes(index);

          return (
            <span
              key={`${left}-${top}`}
              className={[
                "worlds-sanctuary__star",
                `star--${index + 1}`,
                isPulsing ? "is-pulsing" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
              }}
            />
          );
        })}
      </div>

      <div className="worlds-sanctuary__motes">
        {motes.map(([left, top], index) => (
          <span
            key={`${left}-${top}`}
            className={`worlds-sanctuary__mote mote--${index + 1}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
            }}
          />
        ))}
      </div>

      <div className="worlds-sanctuary__calm-center" />
      <div className="worlds-sanctuary__vignette" />
    </div>
  );
}