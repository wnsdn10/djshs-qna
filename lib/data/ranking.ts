// lib/data/ranking.ts
//
// 랭킹과 내 활동 화면이 쓰는 데이터 함수들.

import { createClient } from "@/lib/supabase/server";

export type RankRow = {
  userId: string;
  name: string;
  cohort: number;
  points: number;
};

/** 과목별 랭킹에 쓸 과목 목록 */
export const SUBJECTS = ["수학", "물리", "화학", "생명", "정보"] as const;

/**
 * 전체 랭킹.
 *
 * profiles.total_score 하나만 보면 되므로 단순하다.
 * 7차시에 트리거로 합계를 미리 더해둔 덕분이다 —
 * 그게 없었으면 매번 score_logs를 전부 더해야 했다.
 */
export async function getOverallRanking(limit = 30): Promise<RankRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, cohort, total_score")
    .order("total_score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`랭킹을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((r) => ({
    userId: r.id as string,
    name: (r.name as string) || "이름 없음",
    cohort: (r.cohort as number | null) ?? 0,
    points: (r.total_score as number) ?? 0,
  }));
}

/**
 * 과목별 랭킹.
 *
 * score_logs → answers → questions 를 타고 가서 태그를 확인해야 하므로
 * DB 안의 함수(subject_ranking)를 부른다. rpc는 "DB에 만들어둔 함수 실행"이라는 뜻.
 */
export async function getSubjectRanking(subject: string): Promise<RankRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("subject_ranking", { subject });

  if (error)
    throw new Error(`과목별 랭킹을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    userId: r.user_id as string,
    name: (r.name as string) || "이름 없음",
    cohort: (r.cohort as number | null) ?? 0,
    points: Number(r.points ?? 0),
  }));
}

// ---------------------------------------------------------------
// 내 활동
// ---------------------------------------------------------------

export type MyQuestion = {
  id: string;
  title: string;
  status: string;
  answerCount: number;
  createdAt: string;
};

export type MyAnswer = {
  id: string;
  questionId: string;
  questionTitle: string;
  contribType: string;
  isAccepted: boolean;
  createdAt: string;
};

export type ScoreLog = {
  id: string;
  reason: string;
  points: number;
  createdAt: string;
};

export async function getMyQuestions(userId: string): Promise<MyQuestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("id, title, status, answer_count, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`내 질문을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    status: r.status as string,
    answerCount: (r.answer_count as number) ?? 0,
    createdAt: (r.created_at as string).slice(0, 10),
  }));
}

export async function getMyAnswers(userId: string): Promise<MyAnswer[]> {
  const supabase = await createClient();

  // questions(...)는 조인. 답변만 보여주면 어느 질문의 답변인지 알 수 없으므로
  // 질문 제목을 같이 가져온다.
  const { data, error } = await supabase
    .from("answers")
    .select("id, question_id, contrib_type, is_accepted, created_at, questions(title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`내 답변을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    questionId: r.question_id as string,
    questionTitle:
      ((r.questions as { title?: string } | null)?.title as string) ??
      "(삭제된 질문)",
    contribType: r.contrib_type as string,
    isAccepted: r.is_accepted as boolean,
    createdAt: (r.created_at as string).slice(0, 10),
  }));
}

export async function getMyScoreLogs(userId: string): Promise<ScoreLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("score_logs")
    .select("id, reason, points, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`점수 내역을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    reason: r.reason as string,
    points: (r.points as number) ?? 0,
    createdAt: (r.created_at as string).slice(0, 10),
  }));
}
