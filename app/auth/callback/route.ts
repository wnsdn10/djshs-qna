// app/auth/callback/route.ts  →  주소: /auth/callback
//
// 구글 로그인이 끝나고 돌아오는 자리.
//
// page.tsx가 아니라 route.ts인 것에 주의. 화면을 그리는 게 아니라
// "요청을 받아서 처리하고 다른 데로 보내는" 역할이라 라우트 핸들러로 만든다.
//
// 흐름:
//   1. 사용자가 "학교 계정으로 로그인"을 누른다
//   2. 구글 로그인 화면으로 간다
//   3. 로그인하면 구글 → Supabase → 여기로 돌아온다 (주소에 code가 붙어서)
//   4. 그 code를 진짜 로그인 세션으로 바꾼다
//   5. 질문 목록으로 보낸다

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseSchoolEmail } from "@/lib/cohort";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // 사용자가 구글 화면에서 취소했거나 잘못 들어온 경우
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();

  // ★ 임시 코드를 세션으로 교환한다.
  //   이 과정에서 로그인 쿠키가 심어지고, 그 순간 DB의 트리거가 돌아
  //   profiles 행이 자동으로 만들어진다. (처음 로그인하는 사람이면)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // 학교 이메일이 아니면 DB 트리거가 예외를 던지므로 여기로 온다
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // ★ 두 번째 방어선 — 앱에서도 이메일 형식을 확인한다.
  //   구글의 "내부" 설정과 DB 트리거가 이미 막고 있지만,
  //   둘 중 하나가 잘못 설정되는 날을 대비해 여기서도 본다.
  //   (설정은 사람이 바꾸다 실수할 수 있고, 코드는 그대로 남는다)
  const email = data.user?.email ?? "";
  if (parseSchoolEmail(email) === null) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  return NextResponse.redirect(`${origin}/questions`);
}
