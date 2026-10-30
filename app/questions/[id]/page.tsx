// app/questions/[id]/page.tsx  →  주소: /questions/<uuid>
//
// 서버 컴포넌트. 주소에서 id를 꺼내 질문 하나와 그 답변들을 가져온다.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/data/questions";
import type { QuestionStatus, QuestionType } from "@/lib/data/questions";
import { getAnswers, CONTRIB_LABEL } from "@/lib/data/answers";
import { getCurrentUser } from "@/lib/auth";
import { acceptAnswerAction } from "./actions";
import AnswerForm from "./_components/AnswerForm";

const STATUS_LABEL: Record<QuestionStatus, string> = {
  unanswered: "미답변",
  answered: "답변 있음",
  resolved: "해결됨",
};

const TYPE_LABEL: Record<QuestionType, string> = {
  concept: "개념",
  problem: "문제",
  research: "연구·보고서",
};

const ERROR_MESSAGE: Record<string, string> = {
  body: "답변 내용을 입력하세요.",
  type: "기여 유형을 골라주세요.",
};

// 접속할 때마다 DB를 다시 읽는다
export const dynamic = "force-dynamic";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // ★ Next.js 16 함정
  //   params는 Promise다. await 없이 params.id를 읽으면 에러가 난다:
  //     "params is a Promise and must be unwrapped with await or React.use()"
  const { id } = await params;
  const { error } = await searchParams;

  // ★ 셋을 동시에 요청한다.
  //   하나씩 await하면 앞의 것이 끝나야 다음이 시작되므로 기다리는 시간이 쌓인다.
  //   Promise.all은 셋을 함께 보내고 가장 느린 하나만큼만 기다린다.
  //   (질문이 없는 경우 답변 조회가 헛일이 되지만, 그런 경우는 드물다)
  const [question, answers, user] = await Promise.all([
    getQuestion(id),
    getAnswers(id),
    getCurrentUser(),
  ]);

  if (!question) notFound();

  const isQuestionAuthor = user !== null && user.id === question.authorId;
  const hasAccepted = answers.some((a) => a.isAccepted);

  return (
    <article className="q-detail">
      <div className="q-detail-head">
        <span className={`badge badge-${question.status}`}>
          {STATUS_LABEL[question.status]}
        </span>
        <span className="q-card-tags">
          {question.tags.map((t) => `#${t}`).join(" ")}
        </span>
        <span className="q-card-meta">{TYPE_LABEL[question.qType]}</span>
        {question.visibility === "seniors" && (
          <span className="lock">선배 전용</span>
        )}
      </div>

      <h1>{question.title}</h1>
      <p className="q-detail-body">{question.body}</p>

      <div className="q-card-meta">
        {/* 질문은 익명 — 기수만 */}
        {question.authorCohort}기 · {question.createdAt}
      </div>

      <hr />

      <h2 className="answers-title">답변 {answers.length}</h2>

      {error && (
        <p className="form-error">
          {ERROR_MESSAGE[error] ?? "입력을 확인하세요."}
        </p>
      )}

      {answers.length === 0 ? (
        <p className="empty">아직 답변이 없습니다.</p>
      ) : (
        <ul className="answer-list">
          {answers.map((a) => (
            <li
              key={a.id}
              className={a.isAccepted ? "answer accepted" : "answer"}
            >
              <div className="answer-head">
                {/* 답변은 이름까지 보인다 — 기여한 사람이 드러나야 점수가 의미를 갖는다 */}
                <strong>
                  {a.authorCohort}기 {a.authorName}
                </strong>
                <span className="chip">{CONTRIB_LABEL[a.contribType]}</span>
                {a.isAccepted && <span className="chip chip-ok">채택됨</span>}
                <span className="answer-date">{a.createdAt}</span>
              </div>

              <p className="answer-body">{a.body}</p>

              {/* 채택 버튼은 질문을 쓴 사람에게만, 아직 채택된 답변이 없을 때만.
                  화면에서 숨기는 것과 별개로 DB의 RLS 정책도 같은 조건을 건다. */}
              {isQuestionAuthor && !hasAccepted && (
                <form action={acceptAnswerAction} className="accept-form">
                  <input type="hidden" name="answerId" value={a.id} />
                  <input type="hidden" name="questionId" value={question.id} />
                  <button type="submit" className="btn-accept">
                    채택하기
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {user ? (
        <AnswerForm questionId={question.id} />
      ) : (
        <p className="empty">
          답변을 쓰려면 <Link href="/login">로그인</Link>이 필요합니다.
        </p>
      )}

      <Link href="/questions" className="btn-plain">
        ← 목록으로
      </Link>
    </article>
  );
}
