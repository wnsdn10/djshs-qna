// lib/data/questions.ts
//
// 화면이 쓰는 질문 데이터 함수들.
// 3차시: 배열 → 5차시: Supabase 조회 → 6차시: 작성자 연결까지.
// 그동안 함수의 이름과 돌려주는 모양은 거의 그대로였고, 그래서 화면 코드는 조금만 바뀌었다.

import { createClient } from "@/lib/supabase/server";

/** 질문 상태 — 목록의 배지 색이 여기 연결된다 */
export type QuestionStatus = "unanswered" | "answered" | "resolved";

/** 질문 유형 — 계획서의 개념 / 문제 / 연구·보고서 */
export type QuestionType = "concept" | "problem" | "research";

/** 공개 범위 — 전체 / 선배에게만 (실제로 걸러내는 건 8차시 RLS에서) */
export type Visibility = "all" | "seniors";

export type Question = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  qType: QuestionType;
  visibility: Visibility;
  status: QuestionStatus;
  /** 누가 썼는지. 채택 버튼을 보여줄지 판단하는 데 쓴다 */
  authorId: string | null;
  /** 화면에는 "43기"처럼 기수만 보인다. 이름은 익명 */
  authorCohort: number;
  answerCount: number;
  createdAt: string;
};

/** 질문을 새로 만들 때 받는 값. 나머지 필드는 서버와 DB가 정한다. */
export type NewQuestionInput = {
  title: string;
  body: string;
  tags: string[];
  qType: QuestionType;
  visibility: Visibility;
  /** 누가 썼는지. 화면엔 안 보이지만 DB에는 항상 남긴다 (계획서 5번 대비책) */
  authorId: string;
  authorCohort: number;
};

// ---------------------------------------------------------------
// DB의 한 줄(row)을 화면이 쓰는 Question 모양으로 바꾼다.
// DB는 author_cohort 처럼 밑줄로, TypeScript는 authorCohort 처럼 대문자로 쓴다.
// 그 차이를 여기 한 곳에서만 흡수하면 화면 코드가 DB 사정을 몰라도 된다.
// ---------------------------------------------------------------
type QuestionRow = {
  id: string;
  title: string;
  body: string;
  tags: string[] | null;
  q_type: QuestionType;
  visibility: Visibility;
  status: QuestionStatus;
  author_id: string | null;
  author_cohort: number | null;
  answer_count: number;
  created_at: string;
};

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    qType: row.q_type,
    visibility: row.visibility,
    status: row.status,
    authorId: row.author_id,
    authorCohort: row.author_cohort ?? 0,
    answerCount: row.answer_count,
    createdAt: row.created_at.slice(0, 10),
  };
}

/** 질문 목록을 최신순으로 가져온다 */
export async function getQuestions(): Promise<Question[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  // ★ Supabase는 실패해도 예외를 던지지 않고 error 객체를 돌려준다.
  //   이걸 확인하지 않으면 "에러도 없이 빈 배열"만 보게 된다. (RLS 문제가 대표적)
  if (error) {
    throw new Error(`질문 목록을 불러오지 못했습니다: ${error.message}`);
  }

  return (data as QuestionRow[]).map(toQuestion);
}

// id가 uuid 모양인지 검사하는 정규식
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 질문 하나를 id로 찾는다. 없으면 null */
export async function getQuestion(id: string): Promise<Question | null> {
  // uuid 모양이 아니면 DB에 물어볼 것도 없이 "없는 질문"이다.
  // (uuid 컬럼에 "999" 같은 값을 비교하면 Postgres가 형식 에러를 낸다)
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle(); // 0개면 null, 1개면 그 행. single()은 0개일 때 에러가 난다.

  if (error) {
    throw new Error(`질문을 불러오지 못했습니다: ${error.message}`);
  }

  return data ? toQuestion(data as QuestionRow) : null;
}

/** 질문을 새로 등록한다 */
export async function createQuestion(
  input: NewQuestionInput
): Promise<Question> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      title: input.title,
      body: input.body,
      tags: input.tags,
      q_type: input.qType,
      visibility: input.visibility,
      author_id: input.authorId,
      author_cohort: input.authorCohort,
      // id · status · answer_count · created_at 은 DB가 기본값으로 채운다
    })
    .select()
    .single(); // 방금 넣은 행을 돌려받는다

  if (error) {
    throw new Error(`질문을 등록하지 못했습니다: ${error.message}`);
  }

  return toQuestion(data as QuestionRow);
}
