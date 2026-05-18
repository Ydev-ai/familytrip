/**
 * 먹 일러스트 — 인라인 SVG. 외부 이미지 의존 없이 한지 위에 얹어 마스터피스 톤.
 * 모두 currentColor 사용 — 부모에서 text-ink-900 등으로 색 제어.
 */

export function InkMountain({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id="brush-rough" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g
        filter="url(#brush-rough)"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 원경 산 */}
        <path
          d="M0 175 Q 60 130 110 150 T 220 140 T 340 145 T 460 130 T 600 155"
          strokeWidth="1.1"
          opacity="0.45"
        />
        {/* 중경 산 */}
        <path
          d="M0 200 Q 80 145 150 170 T 290 158 T 430 165 T 600 145"
          strokeWidth="1.6"
          opacity="0.7"
        />
        {/* 근경 산 */}
        <path
          d="M0 230 Q 90 175 180 200 T 360 188 T 540 200 T 600 195"
          strokeWidth="2.4"
        />
        {/* 소나무 한 그루 */}
        <g transform="translate(420 175)" strokeWidth="1.6">
          <path d="M0 30 L 0 -5" />
          <path d="M0 0 Q -20 -10 -28 -22 M0 0 Q 22 -8 30 -22 M0 -10 Q -12 -22 -18 -34 M0 -12 Q 14 -20 22 -32" />
        </g>
        {/* 새 두 마리 */}
        <g strokeWidth="1.2" opacity="0.8">
          <path d="M140 90 q 6 -4 12 0 q 6 -4 12 0" />
          <path d="M210 70 q 5 -3 10 0 q 5 -3 10 0" />
        </g>
      </g>
    </svg>
  );
}

export function InkSun({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="currentColor"
        opacity="0.85"
      />
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
}

/** 두루마리 위쪽 장식 — 가로 산수 */
export function ScrollHeaderArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M0 60 Q 100 30 200 50 T 400 45 T 600 50 T 800 40"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <path
          d="M0 72 Q 120 50 240 65 T 480 58 T 720 65 T 800 60"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
}

/** Day 1 — 저녁/달/모닥불 한 폭의 brush sketch */
export function InkNightScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id="brush-night" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence baseFrequency="0.9" numOctaves="2" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
      </defs>
      {/* 달 */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4">
        <circle cx="40" cy="28" r="11" opacity="0.85" />
        <path d="M37 22 q 5 4 0 12" opacity="0.65" />
      </g>
      {/* 별 */}
      <g fill="currentColor" opacity="0.7">
        <circle cx="70" cy="14" r="0.9" />
        <circle cx="92" cy="22" r="0.7" />
        <circle cx="58" cy="40" r="0.6" />
        <circle cx="108" cy="10" r="0.8" />
      </g>
      {/* 산 능선 + 모닥불 */}
      <g
        filter="url(#brush-night)"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 70 Q 60 50 110 60 T 220 55" strokeWidth="1.6" opacity="0.75" />
        {/* 모닥불 — 작은 삼각형 */}
        <g transform="translate(168 60)" strokeWidth="1.4">
          <path d="M-6 8 L 0 -6 L 6 8 Z" />
          <path d="M-3 4 q 3 -4 6 0" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

/** Day 2 — 떠오르는 해 + 새 */
export function InkMorningScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id="brush-morning" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence baseFrequency="0.85" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
      </defs>
      {/* 해 */}
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="42" cy="46" r="14" opacity="0.55" />
        <path d="M28 70 L 56 70" strokeWidth="0.8" opacity="0.45" />
        <path d="M22 60 L 62 60" strokeWidth="0.6" opacity="0.4" />
      </g>
      {/* 능선 */}
      <g
        filter="url(#brush-morning)"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 60 Q 50 40 100 55 T 220 48" strokeWidth="1.6" opacity="0.75" />
        <path d="M0 72 Q 60 56 130 64 T 220 60" strokeWidth="1.8" />
      </g>
      {/* 새 두 마리 */}
      <g
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      >
        <path d="M130 22 q 6 -5 12 0 q 6 -5 12 0" />
        <path d="M170 14 q 5 -4 10 0 q 5 -4 10 0" />
      </g>
    </svg>
  );
}

/** 세로 두루마리 잉크 라인 */
export function VerticalInkLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 4 200"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <line
        x1="2"
        y1="0"
        x2="2"
        y2="200"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="1 4"
      />
    </svg>
  );
}
