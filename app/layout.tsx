// app/layout.tsx
// 모든 화면을 감싸는 틀. 각 page.tsx의 내용이 {children} 자리에 들어간다.
//
// 6차시부터 async 함수가 되었다. 헤더에 "지금 누가 로그인했는지"를
// 보여주려면 서버에서 그 정보를 가져와야 하기 때문이다.

import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
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
      <body>
        <header className="site-header">
          <Link href="/questions" className="logo">
            상호 협력 학습 지원 시스템
          </Link>

          <nav>
            <Link href="/questions">질문</Link>
            <Link href="/ranking">랭킹</Link>
            {user ? (
              <>
                <Link href="/me">내 활동</Link>
                {/* 계획서의 익명 원칙: 질문 목록에는 기수만 나오지만,
                    헤더는 "나 자신"에게 보이는 자리라 이름까지 보여준다 */}
                <span className="whoami">
                  {user.cohort}기 {user.name}
                  <b>{user.totalScore}점</b>
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
        </header>

        <main className="container">{children}</main>
      </body>
    </html>
  );
}
