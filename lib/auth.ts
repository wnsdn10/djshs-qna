// lib/auth.ts
//
// "지금 접속한 사람이 누구인가"를 알아내는 곳.
// 화면 코드가 Supabase의 세부사항을 몰라도 되도록 여기서 한 번 감싼다.

import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseSchoolEmail } from "@/lib/cohort";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  cohort: number | null;
  studentNo: number | null;
  totalScore: number;
};

/**
 * 로그인한 사람의 정보를 가져온다. 로그인 안 했으면 null.
 *
 * ★ React의 cache()로 감쌌다 — 성능에서 가장 중요한 한 줄이다.
 *
 *   이 함수는 한 페이지를 그리는 동안 여러 번 불린다.
 *     layout.tsx  → 헤더에 "42기 김준우 · 12점"을 띄우려고
 *     page.tsx    → 채택 버튼을 보여줄지 판단하려고
 *   그때마다 Auth 서버 왕복 + DB 조회가 일어나면 두 배로 느려진다.
 *
 *   cache()는 "같은 요청을 처리하는 동안에는 한 번만 실행하고,
 *   두 번째부터는 첫 결과를 그대로 돌려준다". 다음 요청이 오면 다시 실행되므로
 *   로그인 상태가 낡은 채로 남지는 않는다.
 *
 * ★ getUser()를 쓰는 이유
 *   getSession()은 쿠키에 담긴 내용을 그대로 믿기 때문에 서버에서 쓰면 안 된다.
 *   쿠키는 사용자가 고칠 수 있으니, "나 42기야"라고 적어 보내면 그대로 믿어버린다.
 *   getUser()는 Supabase 인증 서버에 토큰이 진짜인지 물어보고 답을 받는다.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // auth.users에는 이메일과 비밀번호만 있다.
  // 이름·기수·점수는 우리가 만든 profiles에 있으므로 한 번 더 조회한다.
  //
  // ★ 10차시: email, student_no 는 profiles에서 읽지 않는다.
  //   schema-10에서 학생 계정이 profiles의 email·student_no 열을 읽지 못하게 막았다
  //   (남의 이메일과 번호를 한꺼번에 가져가지 못하게).
  //   내 이메일은 방금 getUser()로 받은 "인증된" 값에 있고, 번호는 그 이메일에서 계산된다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, cohort, total_score")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  // ★ 이메일은 profiles가 아니라 인증 서버가 확인해 준 값(user.email)을 쓴다.
  //   아래 isAdmin()이 이메일로 관리자를 가리기 때문이다.
  //   profiles 쪽 값은 DB 행일 뿐이라, 혹시라도 수정할 길이 열리면 "관리자 이메일"로 바꿔
  //   관리자 행세를 할 수 있다. (실제로 schema-10 전에는 학생이 자기 profiles 행을 고칠 수 있었다)
  //   user.email은 구글 로그인으로 확인된 값이라 학생이 바꿀 수 없다.
  const email = (user.email ?? "").toLowerCase();

  return {
    id: profile.id,
    email,
    name: profile.name,
    cohort: profile.cohort,
    // 번호는 이메일(42th16 → 16)에서 계산한다. lib/cohort.ts의 그 함수
    studentNo: parseSchoolEmail(email)?.studentNo ?? null,
    totalScore: profile.total_score,
  };
});

/**
 * 로그인이 반드시 필요한 화면에서 쓴다.
 * 로그인 안 했으면 로그인 화면으로 보내고, 했으면 그 사람 정보를 돌려준다.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// ---------------------------------------------------------------
// 관리자 (10차시)
// ---------------------------------------------------------------

/**
 * 관리자 이메일 목록. 지금은 만든 사람 한 명.
 *
 * 환경변수가 아니라 코드에 둔 이유: 비밀이 아니고(프로젝트 문서 CLAUDE.md에도 적혀 있다),
 * 바뀔 일이 거의 없고, 코드에 있으면 "누가 관리자인가"가 리뷰에서 바로 보인다.
 * 누구를 추가하려면 여기 한 줄을 넣고 배포하면 된다.
 */
const ADMIN_EMAILS = ["42th2505@djshs.djsch.kr"];

/** 이 사람이 관리자인가. 헤더에 "관리" 메뉴를 보여줄지 정할 때 쓴다 */
export function isAdmin(user: CurrentUser | null): boolean {
  return user !== null && ADMIN_EMAILS.includes(user.email);
}

/**
 * 관리자만 들어올 수 있는 화면에서 쓴다.
 *
 * 관리자가 아니면 "권한 없음"이 아니라 404(없는 페이지)를 보여준다.
 * "권한이 없습니다"라고 하면 "여기 뭔가 있구나"를 알려주는 셈이다.
 *
 * ★ 이 검사가 관리자 화면의 유일한 문이다.
 *   관리자 화면은 secret 키(RLS를 건너뜀)로 전체 데이터를 읽는다. 그래서 DB가 대신 막아주지 않는다.
 *   대신 secret 키는 서버에만 있어서, 브라우저에서 이 데이터에 닿는 길은 이 화면뿐이다.
 *   즉 "서버에서 이 함수를 통과해야만 데이터를 읽는다"가 지켜지면 안전하다.
 *   lib/data/admin.ts의 함수를 다른 화면에서 부르지 말 것.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  return user;
}
