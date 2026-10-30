"use server";
//
// 로그인 / 로그아웃.
//
// 이메일+비밀번호 방식은 6차시 중간에 걷어냈다. 이유는 보고서에 쓸 만하다:
//   - 학교 계정이 Google Workspace라서, 구글 로그인이면 "그 계정의 진짜 주인"만 들어온다.
//     이메일 방식은 Confirm email을 꺼둔 상태라 존재하지 않는 주소로도 가입이 됐다.
//   - 학생이 비밀번호를 새로 만들 필요가 없어 가입 문턱이 사라진다.
//   - 우리가 비밀번호를 아예 보관하지 않으므로 유출 위험 자체가 없다.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** 학교 Google Workspace 도메인 */
export const SCHOOL_DOMAIN = "djshs.djsch.kr";

/**
 * 구글(학교 계정) 로그인.
 *
 * 가입과 로그인이 나뉘어 있지 않다. 처음 들어온 사람이면 그 자리에서
 * 계정과 프로필이 만들어지고, 이미 있으면 그냥 로그인된다.
 */
export async function googleLoginAction() {
  const supabase = await createClient();

  // 돌아올 주소를 만든다. 로컬에서는 http://localhost:3000,
  // 배포본에서는 https://djshs-qna.vercel.app 이 된다.
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        // hd = hosted domain. 구글 계정 선택 화면에서 학교 계정만 보여준다.
        // ★ 이건 "편의"일 뿐 보안 장치가 아니다. 사용자가 주소를 고쳐 보낼 수 있다.
        //   진짜 방어는 세 겹이다:
        //     1) Google Cloud의 OAuth 대상이 "내부" → 조직 밖 계정은 로그인 자체가 안 됨
        //     2) app/auth/callback 에서 이메일 형식을 다시 검사
        //     3) DB 트리거가 또 검사 → 통과 못 하면 가입이 통째로 취소됨
        hd: SCHOOL_DOMAIN,
      },
    },
  });

  if (error || !data.url) redirect("/login?error=oauth");

  // 구글 로그인 화면으로 보낸다
  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
