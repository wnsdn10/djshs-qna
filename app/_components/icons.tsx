// app/_components/icons.tsx
//
// 아이콘은 이모지가 아니라 SVG로 쓴다.
//   - 이모지는 기기·OS마다 모양과 색이 달라서 디자인이 깨진다
//   - 스크린 리더가 "웃는 얼굴"처럼 읽어버린다
//   - 색과 크기를 글자에 맞출 수 없다
//
// 여기 아이콘은 전부 currentColor를 쓰므로 글자색을 따라간다.
// 장식용이라 aria-hidden을 붙였다 — 옆에 이미 글자가 있으면
// 스크린 리더가 같은 내용을 두 번 읽을 필요가 없다.

type Props = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export function IconSearch({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconCheck({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconCheckCircle({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function IconPlus({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconArrowLeft({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function IconArrowRight({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** 답변 쓰기 — 메인 화면 "사용 방법" 2단계 */
export function IconPencil({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

/** 점수·랭킹 — 메인 화면 "사용 방법" 4단계 */
export function IconTrophy({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4M8.5 20h7M10 17h4" />
    </svg>
  );
}

/** 펼침 표시 — <details>의 열림/닫힘 */
export function IconChevronDown({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconAlert({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </svg>
  );
}

export function IconLock({ size = 14, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export function IconMessage({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconInbox({ size = 32, className }: Props) {
  return (
    <svg {...base(size)} className={className} strokeWidth={1.3}>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M4.3 6.5 3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-1.3-6.5A2 2 0 0 0 17.75 5H6.25a2 2 0 0 0-1.95 1.5z" />
    </svg>
  );
}

/** 로고 자리의 표시 — 묻고 답하는 두 말풍선 */
export function IconLogo({ size = 16, className }: Props) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="M17 11a2 2 0 0 1-2 2H9l-3.5 3V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2z" />
      <path d="M19 9h.5a2 2 0 0 1 2 2v9l-3-2.5h-5" />
    </svg>
  );
}
