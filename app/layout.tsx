// app/layout.tsx
// 모든 화면을 감싸는 틀. 각 page.tsx의 내용이 {children} 자리에 들어간다.

import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { IconLogo } from "@/app/_components/icons";
import NavLink from "@/app/_components/NavLink";
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
            {/* 로고는 메인 화면(/)으로 간다. 대부분의 사이트가 이렇게 하기 때문에
                사용자는 "처음으로 돌아가려면 로고"를 이미 알고 있다. */}
            <Link href="/" className="logo">
              <span className="logo-mark">
                <IconLogo size={16} />
              </span>
              상호 협력 학습 지원 시스템
            </Link>

            <nav className="site-nav" aria-label="주요 메뉴">
              <NavLink href="/questions">질문</NavLink>
              <NavLink href="/ranking">랭킹</NavLink>
              {user ? (
                <>
                  <NavLink href="/me">내 활동</NavLink>
                  {/* 관리자에게만 보인다. 메뉴를 숨기는 건 편의일 뿐이고,
                      실제로 막는 건 /admin 화면의 requireAdmin()이다 */}
                  {isAdmin(user) && <NavLink href="/admin">관리</NavLink>}
                  {/* 숫자만 덩그러니 있으면 무슨 숫자인지 모른다. 스크린 리더에는 "점"까지 읽히게 한다.
                      (aria-label은 <b>·<span> 같은 일반 요소에 쓰면 안 되는 속성이라 스크린 리더마다 무시하기도 한다.
                       그래서 화면에서만 숨긴 글자를 넣는 방법을 쓴다) */}
                  <span className="whoami">
                    {user.cohort}기 {user.name}
                    <b>
                      {user.totalScore}
                      <span className="sr-only">점</span>
                    </b>
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
                <NavLink href="/login">로그인</NavLink>
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
