// lib/data/admin.ts
//
// 관리자 화면(/admin)이 쓰는 데이터 함수들. (10차시)
//
// ★ 여기 함수는 전부 secret 키(createAdminClient)로 읽는다 — RLS를 건너뛴다.
//   학생 화면에서는 남의 점수 내역·이메일을 못 보게 막아뒀지만(schema-10),
//   관리자는 전체를 봐야 하기 때문이다.
//
//   그래서 이 파일의 함수는 반드시 requireAdmin()을 통과한 화면에서만 부른다.
//   다른 화면에서 부르면 막아둔 데이터가 그대로 새어 나간다.
//
// 학교 안 서비스라 학생 수가 수백 명 수준이다. 그래서 필요한 표를 통째로 가져와서
// 앱에서 세는 방식으로 썼다 (Supabase는 한 번에 최대 1000줄을 돌려준다).
// 사람이 수천 명으로 늘면 DB 함수로 옮겨야 한다.

import { createAdminClient } from "@/lib/supabase/admin";
import type { ContribType } from "@/lib/data/answers";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  cohort: number | null;
  studentNo: number | null;
  totalScore: number;
  questionCount: number;
  answerCount: number;
  acceptedCount: number;
  /** AI 판정으로 본인이 고른 것보다 낮게 기록된 답변 수. 많으면 "높게 고르는" 습관이 있다는 뜻 */
  loweredCount: number;
  /** 가입한 날 (YYYY-MM-DD) */
  joinedAt: string;
  /** 마지막으로 로그인한 때 (YYYY-MM-DD HH:mm, 한국 시간). 기록이 없으면 null */
  lastSignInAt: string | null;
};

export type AdminTotals = {
  users: number;
  questions: number;
  answers: number;
  /** AI가 유형을 낮춘 답변 */
  lowered: number;
  /** AI 판정을 받지 못한 답변 (Gemini 실패) — 0이 아니면 키·한도를 확인할 것 */
  aiFailed: number;
};

/** "2026-11-01T09:30:00Z" → "2026-11-01 18:30" (한국 시간) */
function toKst(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // 서버(Vercel)는 UTC로 돌아간다. 시간대를 지정하지 않으면 9시간 어긋나 보인다.
  return new Intl.DateTimeFormat("sv-SE", {
    // sv-SE(스웨덴식)는 "2026-11-01 18:30" 모양을 그대로 만들어 준다. 날짜를 직접 조립하지 않아도 된다
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** 사용자 전체 + 사람별 활동 수 + 전체 합계 */
export async function getAdminUsers(): Promise<{
  users: AdminUserRow[];
  totals: AdminTotals;
}> {
  const supabase = createAdminClient();

  // 서로 기다릴 필요가 없는 조회 4개를 동시에 보낸다
  const [profilesRes, questionsRes, answersRes, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, cohort, student_no, total_score, created_at"),
    supabase.from("questions").select("author_id"),
    supabase
      .from("answers")
      .select("author_id, contrib_type, claimed_type, ai_type, is_accepted"),
    // ★ 마지막 로그인 시각은 profiles가 아니라 Supabase 인증 쪽(auth.users)에 있다.
    //   auth.admin 은 secret 키로만 쓸 수 있는 관리용 API다.
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesRes.error) throw new Error(`사용자 목록: ${profilesRes.error.message}`);
  if (questionsRes.error) throw new Error(`질문 집계: ${questionsRes.error.message}`);
  if (answersRes.error) throw new Error(`답변 집계: ${answersRes.error.message}`);
  if (authRes.error) throw new Error(`로그인 기록: ${authRes.error.message}`);

  // id → 마지막 로그인
  const lastSignIn = new Map<string, string | null>();
  for (const u of authRes.data.users) {
    lastSignIn.set(u.id, u.last_sign_in_at ?? null);
  }

  // 사람별로 센다. Map에 "없으면 0"으로 시작해서 하나씩 더한다
  const qCount = new Map<string, number>();
  for (const q of questionsRes.data) {
    if (q.author_id) qCount.set(q.author_id, (qCount.get(q.author_id) ?? 0) + 1);
  }

  const aCount = new Map<string, number>();
  const accCount = new Map<string, number>();
  const lowCount = new Map<string, number>();
  let lowered = 0;
  let aiFailed = 0;

  for (const a of answersRes.data as {
    author_id: string;
    contrib_type: ContribType;
    claimed_type: ContribType | null;
    ai_type: ContribType | null;
    is_accepted: boolean;
  }[]) {
    aCount.set(a.author_id, (aCount.get(a.author_id) ?? 0) + 1);
    if (a.is_accepted) accCount.set(a.author_id, (accCount.get(a.author_id) ?? 0) + 1);

    // 9차시 전 답변(claimed_type 없음)은 판정 대상이 아니었으므로 세지 않는다
    if (a.claimed_type === null) continue;
    if (a.ai_type === null) aiFailed++;
    else if (a.contrib_type !== a.claimed_type) {
      lowered++;
      lowCount.set(a.author_id, (lowCount.get(a.author_id) ?? 0) + 1);
    }
  }

  const users: AdminUserRow[] = profilesRes.data.map((p) => ({
    id: p.id as string,
    name: (p.name as string) || "이름 없음",
    email: p.email as string,
    cohort: p.cohort as number | null,
    studentNo: p.student_no as number | null,
    totalScore: (p.total_score as number) ?? 0,
    questionCount: qCount.get(p.id) ?? 0,
    answerCount: aCount.get(p.id) ?? 0,
    acceptedCount: accCount.get(p.id) ?? 0,
    loweredCount: lowCount.get(p.id) ?? 0,
    joinedAt: (p.created_at as string).slice(0, 10),
    lastSignInAt: toKst(lastSignIn.get(p.id)),
  }));

  // 최근에 들어온 사람이 위로. 한 번도 기록이 없으면 맨 아래
  users.sort((a, b) => (b.lastSignInAt ?? "").localeCompare(a.lastSignInAt ?? ""));

  return {
    users,
    totals: {
      users: users.length,
      questions: questionsRes.data.length,
      answers: answersRes.data.length,
      lowered,
      aiFailed,
    },
  };
}

export type AdminScoreLog = {
  id: string;
  userId: string;
  who: string;
  reason: string;
  points: number;
  questionId: string | null;
  questionTitle: string | null;
  at: string;
};

/** 최근 점수 기록 — "지금 서비스에서 무슨 일이 일어나고 있나"를 한눈에 */
export async function getRecentScoreLogs(limit = 30): Promise<AdminScoreLog[]> {
  const supabase = createAdminClient();

  // 조인 두 단계: 점수 → 누구(profiles), 점수 → 답변 → 질문 제목
  const { data, error } = await supabase
    .from("score_logs")
    .select(
      "id, user_id, reason, points, created_at, profiles(name, cohort), answers(question_id, questions(title))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`최근 점수 기록: ${error.message}`);

  return (data ?? []).map((r: Record<string, unknown>) => {
    const prof = r.profiles as { name?: string; cohort?: number } | null;
    const ans = r.answers as {
      question_id?: string;
      questions?: { title?: string } | null;
    } | null;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      who: prof ? `${prof.cohort ?? "?"}기 ${prof.name || "이름 없음"}` : "(알 수 없음)",
      reason: r.reason as string,
      points: (r.points as number) ?? 0,
      questionId: ans?.question_id ?? null,
      questionTitle: ans?.questions?.title ?? null,
      at: toKst(r.created_at as string) ?? "",
    };
  });
}

// ---------------------------------------------------------------
// 한 사람의 활동 전부
// ---------------------------------------------------------------

export type AdminUserDetail = {
  user: AdminUserRow;
  questions: {
    id: string;
    title: string;
    status: string;
    visibility: string;
    answerCount: number;
    createdAt: string;
  }[];
  answers: {
    id: string;
    questionId: string;
    questionTitle: string;
    body: string;
    contribType: ContribType;
    claimedType: ContribType | null;
    aiType: ContribType | null;
    aiReason: string | null;
    isAccepted: boolean;
    createdAt: string;
  }[];
  logs: { id: string; reason: string; points: number; at: string }[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  // uuid 모양이 아니면 DB에 물어볼 필요도 없다 (questions.ts와 같은 이유)
  if (!UUID_RE.test(userId)) return null;

  const supabase = createAdminClient();

  const [profileRes, authRes, qRes, aRes, logRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, cohort, student_no, total_score, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(userId),
    supabase
      .from("questions")
      .select("id, title, status, visibility, answer_count, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("answers")
      .select(
        "id, question_id, body, contrib_type, claimed_type, ai_type, ai_reason, is_accepted, created_at, questions(title)"
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("score_logs")
      .select("id, reason, points, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (profileRes.error) throw new Error(`사용자: ${profileRes.error.message}`);
  if (!profileRes.data) return null;
  if (qRes.error) throw new Error(`질문: ${qRes.error.message}`);
  if (aRes.error) throw new Error(`답변: ${aRes.error.message}`);
  if (logRes.error) throw new Error(`점수 내역: ${logRes.error.message}`);

  const p = profileRes.data;
  const answers = (aRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    questionId: r.question_id as string,
    questionTitle:
      (r.questions as { title?: string } | null)?.title ?? "(삭제된 질문)",
    body: r.body as string,
    contribType: r.contrib_type as ContribType,
    claimedType: r.claimed_type as ContribType | null,
    aiType: r.ai_type as ContribType | null,
    aiReason: r.ai_reason as string | null,
    isAccepted: r.is_accepted as boolean,
    createdAt: toKst(r.created_at as string) ?? "",
  }));

  return {
    user: {
      id: p.id,
      name: p.name || "이름 없음",
      email: p.email,
      cohort: p.cohort,
      studentNo: p.student_no,
      totalScore: p.total_score ?? 0,
      questionCount: qRes.data?.length ?? 0,
      answerCount: answers.length,
      acceptedCount: answers.filter((a) => a.isAccepted).length,
      loweredCount: answers.filter(
        (a) => a.claimedType !== null && a.aiType !== null && a.contribType !== a.claimedType
      ).length,
      joinedAt: (p.created_at as string).slice(0, 10),
      // 인증 쪽 조회가 실패해도(계정만 지워진 경우 등) 화면은 보여준다
      lastSignInAt: toKst(authRes.data?.user?.last_sign_in_at),
    },
    questions: (qRes.data ?? []).map((q) => ({
      id: q.id as string,
      title: q.title as string,
      status: q.status as string,
      visibility: q.visibility as string,
      answerCount: (q.answer_count as number) ?? 0,
      createdAt: toKst(q.created_at as string) ?? "",
    })),
    answers,
    logs: (logRes.data ?? []).map((l) => ({
      id: l.id as string,
      reason: l.reason as string,
      points: (l.points as number) ?? 0,
      at: toKst(l.created_at as string) ?? "",
    })),
  };
}
