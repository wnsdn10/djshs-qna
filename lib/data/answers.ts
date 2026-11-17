// lib/data/answers.ts
//
// 답변 데이터 함수들. questions.ts와 같은 구조다.
//
// ★ 점수를 더하는 코드가 여기 없다는 점에 주목할 것.
//   점수는 전부 DB 트리거가 계산한다 (docs/schema-7-answers.sql).
//   앱에서도 더하고 트리거에서도 더하면 점수가 두 배가 되기 때문이다.
//   "한 가지 일은 한 곳에서만" — 그게 어디인지 정해두는 게 설계다.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Judgement } from "@/lib/ai/judge";

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
  /**
   * 유형 이름표. 12차시부터는 AI 점수에서 DB가 계산한다 (1~2 자료 제보, 3~5 방향 제시, 6~8 전체 답변).
   * 0점 답변과 "판정 대기" 답변은 null.
   */
  contribType: ContribType | null;
  /** AI가 매긴 점수 0~8 (12차시). 판정 대기거나 12차시 전 답변이면 null */
  aiScore: number | null;
  /** 이 답변으로 받은 점수 (채택 +5 제외). 판정 대기면 null */
  points: number | null;
  /** AI 판정을 아직 못 받은 답변 */
  pending: boolean;
  /** 9~11차시 답변: 작성자가 고른 유형, AI가 판정한 유형. 12차시부터는 null */
  claimedType: ContribType | null;
  aiType: ContribType | null;
  aiReason: string | null;
  isAccepted: boolean;
  createdAt: string;
};

export const CONTRIB_LABEL: Record<ContribType, string> = {
  info: "자료 제보",
  direction: "방향 제시",
  full: "전체 답변",
};

/**
 * 기여 유형마다 "어떤 답변이 여기에 해당하는지" 한 줄 설명.
 * 답변 폼과 메인 화면에서 쓰므로 여기 한 곳에 둔다.
 * (각 화면에 따로 적어두면 한쪽만 고쳐지는 일이 생긴다)
 */
export const CONTRIB_HELP: Record<ContribType, string> = {
  info: "참고할 자료나 링크를 알려줌",
  direction: "어디를 보면 될지 방향을 짚어줌",
  full: "질문을 끝까지 해결해줌",
};

/**
 * 12차시 전 점수표 (유형 → 점수). 옛 답변의 점수를 보여줄 때만 쓴다.
 * 실제 계산은 DB의 contrib_points() 함수가 한다.
 */
export const CONTRIB_POINTS: Record<ContribType, number> = {
  info: 1,
  direction: 3,
  full: 8,
};

/** 채택되면 추가로 받는 점수 */
export const ACCEPT_POINTS = 5;

/**
 * 점수를 부호와 함께 표시한다. +8, −13
 * 11차시에 삭제로 회수된 점수(음수)가 생기면서 필요해졌다. 그냥 "+{점수}"로 쓰면 "+-13"이 된다.
 * 빼기 기호는 하이픈(-)이 아니라 수학 기호 −(U+2212)를 쓴다. 숫자와 폭이 맞아 줄이 덜 흔들린다.
 */
export function signedPoints(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

// ---------------------------------------------------------------
// 12차시: AI가 매기는 점수 범위와 구간
// ---------------------------------------------------------------

/** AI 점수 최댓값. DB 제약(answers_ai_score_range)과 Gemini 지시(lib/ai/judge.ts)에도 같은 숫자가 쓰인다 */
export const SCORE_MAX = 8;

/**
 * 점수 구간 — 화면 표시용. 실제 구간 계산은 DB의 score_band() 함수가 한다.
 * 답변 폼과 메인 화면에서 "AI가 이 기준으로 매긴다"를 보여줄 때 쓴다.
 * 0점은 구간이 없다 (질문과 상관없거나 정보가 없는 답).
 */
export const SCORE_BANDS: { type: ContribType; min: number; max: number }[] = [
  { type: "info", min: 1, max: 2 },
  { type: "direction", min: 3, max: 5 },
  { type: "full", min: 6, max: SCORE_MAX },
];

type AnswerRow = {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  contrib_type: ContribType | null;
  ai_score: number | null;
  claimed_type: ContribType | null;
  ai_type: ContribType | null;
  ai_reason: string | null;
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
    aiScore: row.ai_score,
    // 받은 점수: 12차시 답변은 AI 점수, 그 전 답변은 유형 점수표
    points:
      row.ai_score !== null
        ? row.ai_score
        : row.contrib_type !== null
          ? CONTRIB_POINTS[row.contrib_type]
          : null,
    // 점수도 유형도 없으면 아직 판정을 못 받은 것 (0점 답변은 ai_score가 0이라 여기 안 걸린다)
    pending: row.ai_score === null && row.contrib_type === null,
    claimedType: row.claimed_type,
    aiType: row.ai_type,
    aiReason: row.ai_reason,
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
  /** 반드시 로그인 정보(getCurrentUser)에서 온 값이어야 한다. 아래 설명 참고 */
  authorId: string;
  body: string;
  /** Gemini 판정. 실패했으면 null → "판정 대기"로 저장 */
  judgement: Judgement | null;
};

/**
 * 답변을 등록한다. 점수 기록과 질문 상태 변경은 DB 트리거가 이어서 처리한다.
 *
 * ★ secret 키 클라이언트(createAdminClient)로 저장한다 (9차시부터).
 *   학생 계정은 answers에 insert 할 권한이 없다. AI 판정을 건너뛰는 길을 막기 위해서다.
 *
 *   대신 RLS가 "본인 이름으로만 쓰기"를 확인해 주지 않는다 (secret 키는 RLS를 건너뛴다).
 *   그래서 authorId를 폼에서 받지 않고 서버가 로그인 정보로 넣는다는 약속이 중요하다.
 *   이 함수를 부르는 곳은 addAnswerAction 하나뿐이고, 거기서 user.id를 넣는다.
 *
 * ★ 12차시: 학생이 고른 유형이 없다. AI 점수(ai_score)만 저장한다.
 *   유형 이름표(contrib_type)는 보내지 않는다 — DB 트리거가 점수에서 계산한다 (schema-12).
 *   AI가 실패했으면 ai_score를 비워서(null) "판정 대기"로 저장한다. 그때는 0점이고,
 *   관리자가 나중에 다시 판정하면 그때 점수가 적립된다.
 */
export async function createAnswer(
  input: NewAnswerInput
): Promise<{ score: number | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("answers").insert({
    question_id: input.questionId,
    author_id: input.authorId,
    body: input.body,
    ai_score: input.judgement?.score ?? null, // 점수 트리거는 이 칸을 본다
    ai_reason: input.judgement?.reason ?? null,
  });

  if (error) {
    throw new Error(`답변을 등록하지 못했습니다: ${error.message}`);
  }

  return { score: input.judgement?.score ?? null };
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
