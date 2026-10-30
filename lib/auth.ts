// lib/auth.ts
//
// "지금 접속한 사람이 누구인가"를 알아내는 곳.
// 화면 코드가 Supabase의 세부사항을 몰라도 되도록 여기서 한 번 감싼다.
// (3차시에 데이터 함수를 lib/data로 뺀 것과 같은 이유다)

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
 * ★ getUser()를 쓰는 이유
 *   getSession()은 쿠키에 담긴 내용을 그대로 믿기 때문에 서버에서 쓰면 안 된다.
 *   쿠키는 사용자가 고칠 수 있으니, "나 42기야"라고 적어 보내면 그대로 믿어버린다.
 *   getUser()는 Supabase 인증 서버에 토큰이 진짜인지 물어보고 답을 받는다.
 *   매번 왕복이 한 번 생기지만, 그게 안전의 값이다.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
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
}

/**
 * 로그인이 반드시 필요한 화면에서 쓴다.
 * 로그인 안 했으면 로그인 화면으로 보내고, 했으면 그 사람 정보를 돌려준다.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
