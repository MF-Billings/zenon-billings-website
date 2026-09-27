// One copy of every filter definition, rendered once in the root layout.
// Defining these per-bloom would duplicate identical turbulence maps a dozen
// times over, and each one is expensive to rasterise.
export default function PaperDefs() {
  return (
    <svg className="paper-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <filter id="bloom-edge" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
    </svg>
  )
}
