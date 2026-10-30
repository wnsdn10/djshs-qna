// lib/data/answers.ts
//
// 답변 데이터 함수들. questions.ts와 같은 구조다.
//
// ★ 점수를 더하는 코드가 여기 없다는 점에 주목할 것.
//   점수는 전부 DB 트리거가 계산한다 (docs/schema-7-answers.sql).
//   앱에서도 더하고 트리거에서도 더하면 점수가 두 배가 되기 때문이다.
//   "한 가지 일은 한 곳에서만" — 그게 어디인지 정해두는 게 설계다.

import { createClient } from "@/lib/supabase/server";

/** 기여 유형 — 계획서의 자료 제보 / 방향 제시 / 전체 답변 */
export type ContribType = "info" | "direction" | "full";

export type Answer = {
  id: string;
  questionId: string;
  authorId: string;
  /** 답변에는 기수와 이름이 함께 보인다 (질문은 기수만) */
  authorName: string;
  authorCohort: number;
  body: string;
  contribType: ContribType;
  isAccepted: boolean;
  createdAt: string;
};

export const CONTRIB_LABEL: Record<ContribType, string> = {
  info: "자료 제보",
  direction: "방향 제시",
  full: "전체 답변",
};

/** 화면에 표시할 점수. 실제 계산은 DB의 contrib_points() 함수가 한다. */
export const CONTRIB_POINTS: Record<ContribType, number> = {
  info: 1,
  direction: 3,
  full: 8,
};

/** 채택되면 추가로 받는 점수 */
export const ACCEPT_POINTS = 5;

type AnswerRow = {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  contrib_type: ContribType;
  is_accepted: boolean;
  created_at: string;
  // profiles 테이블을 함께 가져온 결과
  profiles: { name: string; cohort: number | null } | null;
};

function toAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    authorName: row.profiles?.name ?? "알 수 없음",
    authorCohort: row.profiles?.cohort ?? 0,
    body: row.body,
    contribType: row.contrib_type,
    isAccepted: row.is_accepted,
    createdAt: row.created_at.slice(0, 10),
  };
}

/** 한 질문의 답변 목록. 채택된 답변이 맨 위로 온다. */
export async function getAnswers(questionId: string): Promise<Answer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("answers")
    // ★ profiles(...)는 조인이다.
    //   answers.author_id가 profiles를 가리키고 있어서 Supabase가 알아서 연결해준다.
    //   이게 없으면 작성자 이름을 보여주려고 답변 수만큼 추가 조회를 하게 된다.
    .select("*, profiles(name, cohort)")
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`답변을 불러오지 못했습니다: ${error.message}`);
  }

  return (data as AnswerRow[]).map(toAnswer);
}

export type NewAnswerInput = {
  questionId: string;
  authorId: string;
  body: string;
  contribType: ContribType;
};

/** 답변을 등록한다. 점수 기록과 질문 상태 변경은 DB 트리거가 이어서 처리한다. */
export async function createAnswer(input: NewAnswerInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("answers").insert({
    question_id: input.questionId,
    author_id: input.authorId,
    body: input.body,
    contrib_type: input.contribType,
  });

  if (error) {
    throw new Error(`답변을 등록하지 못했습니다: ${error.message}`);
  }
}

/**
 * 답변을 채택한다.
 *
 * 권한 검사를 코드로 쓰지 않은 이유: RLS 정책이 "질문 작성자만 update 가능"을
 * 이미 걸어두었다. 남의 질문의 답변을 채택하려 하면 DB가 거부한다.
 */
export async function acceptAnswer(answerId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("answers")
    .update({ is_accepted: true })
    .eq("id", answerId);

  if (error) {
    throw new Error(`채택하지 못했습니다: ${error.message}`);
  }
}
