// lib/data/questions.ts
//
// ★ 5차시 — 로드맵 "결정 C"의 보상을 회수하는 순간
//
// 이 파일의 함수 "안"만 Supabase 조회로 바뀌었다.
// 함수의 이름, 매개변수, 돌려주는 타입은 3차시와 똑같다.
// 그래서 app/questions/page.tsx 같은 화면 코드는 한 줄도 고치지 않았다.
//
// 바뀐 것: MOCK 배열이 사라지고 DB 조회가 들어왔다.
// 안 바뀐 것: getQuestions() / getQuestion(id) / createQuestion(input) 의 모양.

import { getSupabase } from "@/lib/supabase/server";

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
};

// ---------------------------------------------------------------
// DB의 한 줄(row)을 화면이 쓰는 Question 모양으로 바꾼다.
//
// DB는 author_cohort 처럼 밑줄로 쓰고(SQL의 관습),
// TypeScript는 authorCohort 처럼 대문자로 쓴다(JS의 관습).
// 이 차이를 여기 한 곳에서만 흡수하면 화면 코드가 DB 사정을 몰라도 된다.
// ---------------------------------------------------------------
type QuestionRow = {
  id: string;
  title: string;
  body: string;
  tags: string[] | null;
  q_type: QuestionType;
  visibility: Visibility;
  status: QuestionStatus;
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
    authorCohort: row.author_cohort ?? 0,
    answerCount: row.answer_count,
    // DB는 "2026-09-02T00:00:00+00:00" 처럼 시각까지 주므로 날짜만 자른다
    createdAt: row.created_at.slice(0, 10),
  };
}

/** 질문 목록을 최신순으로 가져온다 */
export async function getQuestions(): Promise<Question[]> {
  const supabase = getSupabase();

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

  const supabase = getSupabase();

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
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      title: input.title,
      body: input.body,
      tags: input.tags,
      q_type: input.qType,
      visibility: input.visibility,
      // 작성자는 6차시에 로그인한 사용자로 바뀐다. 지금은 고정값.
      author_cohort: 42,
      // id · status · answer_count · created_at 은 DB가 기본값으로 채운다
    })
    .select()
    .single(); // 방금 넣은 행을 돌려받는다

  if (error) {
    throw new Error(`질문을 등록하지 못했습니다: ${error.message}`);
  }

  return toQuestion(data as QuestionRow);
}
