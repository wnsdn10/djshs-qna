// app/layout.tsx
// 모든 화면을 감싸는 틀. 각 page.tsx의 내용이 {children} 자리에 들어간다.
// 헤더를 여기 한 번만 쓰면 6개 화면 전부에 나타난다.

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "상호 협력 학습 지원 시스템",
  description: "학교 안에서 묻고 답하는 공간",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          {/* <a>가 아니라 <Link>를 쓴다.
              <a>는 페이지 전체를 다시 받아오고, <Link>는 바뀐 부분만 갈아끼운다. */}
          <Link href="/questions" className="logo">
            상호 협력 학습 지원 시스템
          </Link>
          <nav>
            <Link href="/questions">질문</Link>
            <Link href="/ranking">랭킹</Link>
            <Link href="/me">내 활동</Link>
            <Link href="/login">로그인</Link>
          </nav>
        </header>

        {/* 여기에 각 화면의 내용이 들어온다 */}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
