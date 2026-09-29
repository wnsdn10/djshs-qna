// lib/data/questions.ts
//
// ★ 이 파일이 로드맵 "결정 C"의 핵심이다.
//
// 지금은 아래 MOCK 배열을 그대로 돌려주지만,
// 5차시에는 함수 "안"만 Supabase 쿼리로 바꾼다.
// 화면(page.tsx)은 이 함수만 부르므로 그때 화면 코드는 한 줄도 안 고쳐도 된다.
//
// 그래서 지금 당장은 필요 없어 보여도 async를 붙여 둔다.
// DB 조회는 시간이 걸리는 작업이라 반드시 async가 되는데,
// 미리 async로 만들어 두면 5차시에 함수의 "모양"이 바뀌지 않는다.

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

/** 질문을 새로 만들 때 받는 값. 나머지 필드는 서버가 정한다. */
export type NewQuestionInput = {
  title: string;
  body: string;
  tags: string[];
  qType: QuestionType;
  visibility: Visibility;
};

const MOCK: Question[] = [
  {
    id: "1",
    title: "실험에서 오차가 너무 커요",
    body: "5회 반복측정했는데 오차가 너무 커요. 오차 분석을 한다고 해도 그대로 써도 될까요?",
    tags: ["물리", "R&E"],
    qType: "research",
    visibility: "all",
    status: "unanswered",
    authorCohort: 42,
    answerCount: 0,
    createdAt: "2026-09-02",
  },
  {
    id: "2",
    title: "이거 어떻게 푸나요",
    body: "치환적분으로 풀려고 했는데 중간에 막혔습니다. 어디서부터 잘못됐는지 모르겠어요.",
    tags: ["수학", "미적분"],
    qType: "problem",
    visibility: "all",
    status: "unanswered",
    authorCohort: 43,
    answerCount: 0,
    createdAt: "2026-09-01",
  },
  {
    id: "3",
    title: "오비탈 개념이 이해가 안돼요",
    body: "s, p 오비탈 모양이 왜 그렇게 생겼는지 이해가 안 갑니다. 그냥 외워야 하나요?",
    tags: ["화학", "오비탈"],
    qType: "concept",
    visibility: "all",
    status: "answered",
    authorCohort: 43,
    answerCount: 3,
    createdAt: "2026-08-30",
  },
  {
    id: "4",
    title: "보고서 참고문헌 형식 질문",
    body: "R&E 보고서 쓰는데 참고문헌을 어떤 형식으로 적어야 하는지 정해진 게 있나요?",
    tags: ["기타", "R&E"],
    qType: "research",
    visibility: "seniors",
    status: "resolved",
    authorCohort: 43,
    answerCount: 2,
    createdAt: "2026-08-28",
  },
  {
    id: "5",
    title: "PCR 실험 결과가 안 나와요",
    body: "밴드가 아예 안 보입니다. 프라이머 문제일까요 아니면 온도 조건일까요?",
    tags: ["생명", "R&E"],
    qType: "research",
    visibility: "all",
    status: "unanswered",
    authorCohort: 43,
    answerCount: 0,
    createdAt: "2026-08-27",
  },
  {
    id: "6",
    title: "재귀함수 시간복잡도 계산법",
    body: "점화식은 세웠는데 거기서 O표기로 넘어가는 과정이 헷갈립니다.",
    tags: ["정보", "알고리즘"],
    qType: "concept",
    visibility: "all",
    status: "answered",
    authorCohort: 42,
    answerCount: 1,
    createdAt: "2026-08-25",
  },
];

/** 질문 목록을 최신순으로 가져온다 */
export async function getQuestions(): Promise<Question[]> {
  return [...MOCK].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 질문 하나를 id로 찾는다. 없으면 null */
export async function getQuestion(id: string): Promise<Question | null> {
  return MOCK.find((q) => q.id === id) ?? null;
}

/**
 * 질문을 새로 등록한다.
 *
 * ★ 지금은 서버 프로그램의 메모리(위 MOCK 배열)에 넣을 뿐이다.
 *   어느 파일에도 저장하지 않으므로 서버를 껐다 켜면 사라진다.
 *   5차시에 이 함수 안이 Supabase insert로 바뀌면 진짜로 남는다.
 */
export async function createQuestion(input: NewQuestionInput): Promise<Question> {
  const question: Question = {
    id: String(Date.now()),
    title: input.title,
    body: input.body,
    tags: input.tags,
    qType: input.qType,
    visibility: input.visibility,
    // 아래 값들은 사용자가 정하는 게 아니라 서버가 정한다
    status: "unanswered",
    answerCount: 0,
    // 작성자는 6차시에 로그인을 붙이면 실제 사용자로 바뀐다. 지금은 고정값.
    authorCohort: 42,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  MOCK.unshift(question);
  return question;
}
