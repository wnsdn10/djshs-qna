"use client";
//
// app/_components/NavLink.tsx
//
// 헤더 메뉴의 링크 하나. 지금 보고 있는 화면이면 "여기 있다"고 표시한다.
//
// ★ 왜 이 파일만 'use client'인가
//   "지금 주소가 무엇인가"는 usePathname()으로 알아내는데, 이건 브라우저에서
//   주소가 바뀔 때마다 다시 계산되어야 하는 값이라 클라이언트 컴포넌트에서만 쓸 수 있다.
//   layout.tsx 전체를 클라이언트로 바꾸면 getCurrentUser() 같은 서버 코드를 못 쓰게 되므로,
//   주소가 필요한 이 작은 조각만 떼어냈다. ("경계"를 최대한 좁게)
//
// ★ aria-current="page"
//   화면에 밑줄로 보여주는 것과 별개로, 스크린 리더에게 "현재 페이지"라고 알려주는 속성이다.
//   CSS도 이 속성을 보고 스타일을 입힌다 — 표시와 의미를 한 곳에서 같이 관리한다.

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // /questions/abc 를 보고 있을 때도 "질문" 메뉴가 켜져 있어야 하므로
  // 정확히 같은지만 보지 않고, 그 아래 주소인지도 본다.
  // ("/questionsXYZ" 같은 엉뚱한 주소까지 맞지 않도록 "/"를 붙여 비교한다)
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
