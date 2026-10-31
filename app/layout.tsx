// app/layout.tsx
// 모든 화면을 감싸는 틀. 각 page.tsx의 내용이 {children} 자리에 들어간다.

import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { IconLogo } from "@/app/_components/icons";
import "./globals.css";

export const metadata: Metadata = {
  title: "상호 협력 학습 지원 시스템",
  description: "학교 안에서 묻고 답하는 공간",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <head>
        {/* 글꼴은 미리 연결해두면 받아오는 시간이 줄어든다.
            IBM Plex Sans KR: 한글이 있고 화면용으로 설계된 서체.
            IBM Plex Mono: 점수·날짜 같은 숫자용. 자릿수가 바뀌어도 폭이 흔들리지 않는다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {/* 키보드만 쓰는 사람이 메뉴를 건너뛰고 본문으로 갈 수 있게.
            평소에는 화면 밖에 있다가 Tab을 누르면 나타난다. */}
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>

        <header className="site-header">
          <div className="header-inner">
            <Link href="/questions" className="logo">
              <span className="logo-mark">
                <IconLogo size={16} />
              </span>
              상호 협력 학습 지원 시스템
            </Link>

            <nav className="site-nav" aria-label="주요 메뉴">
              <Link href="/questions">질문</Link>
              <Link href="/ranking">랭킹</Link>
              {user ? (
                <>
                  <Link href="/me">내 활동</Link>
                  <span className="whoami">
                    {user.cohort}기 {user.name}
                    <b>{user.totalScore}</b>
                  </span>
                  {/* 로그아웃은 "무언가를 바꾸는 동작"이라 링크가 아니라 버튼이어야 한다.
                      링크는 주소만 눌러도 실행되므로 이런 데 쓰면 안 된다. */}
                  <form action={logoutAction}>
                    <button type="submit" className="linkbtn">
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login">로그인</Link>
              )}
            </nav>
          </div>
        </header>

        <main id="main" className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
