// lib/auth.ts
//
// "지금 접속한 사람이 누구인가"를 알아내는 곳.
// 화면 코드가 Supabase의 세부사항을 몰라도 되도록 여기서 한 번 감싼다.

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  // 기수·번호·점수는 우리가 만든 profiles에 있으므로 한 번 더 조회한다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, cohort, student_no, total_score")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    cohort: profile.cohort,
    studentNo: profile.student_no,
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
