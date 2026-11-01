// app/questions/[id]/page.tsx  →  주소: /questions/<uuid>

import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/data/questions";
import type { QuestionStatus, QuestionType } from "@/lib/data/questions";
import type { Answer } from "@/lib/data/answers";
import {
  getAnswers,
  CONTRIB_LABEL,
  CONTRIB_POINTS,
  ACCEPT_POINTS,
} from "@/lib/data/answers";
import { requireUser, isAdmin } from "@/lib/auth";
import { deleteQuestionAction, deleteAnswerAction } from "@/app/admin/actions";
import AdminDeleteButton from "@/app/_components/AdminDeleteButton";
import { acceptAnswerAction } from "./actions";
import AnswerForm from "./_components/AnswerForm";
import {
  IconArrowLeft,
  IconCheck,
  IconCheckCircle,
  IconLock,
  IconAlert,
  IconInbox,
} from "@/app/_components/icons";

const STATUS_LABEL: Record<QuestionStatus, string> = {
  unanswered: "답변 기다리는 중",
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

export const dynamic = "force-dynamic";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // ★ Next.js 16: params·searchParams는 Promise다. await가 필요하다.
  const { id } = await params;
  const { error } = await searchParams;

  // 셋을 동시에 요청한다. 하나씩 await하면 기다리는 시간이 쌓인다.
  const [question, answers, user] = await Promise.all([
    getQuestion(id),
    getAnswers(id),
    requireUser(),
  ]);

  if (!question) notFound();

  const isQuestionAuthor = user.id === question.authorId;
  // 관리자에게만 삭제 버튼을 그린다. 버튼을 숨기는 건 편의일 뿐이고,
  // 실제로 막는 건 deleteQuestionAction/deleteAnswerAction 안의 requireAdmin()이다.
  const admin = isAdmin(user);
  const hasAccepted = answers.some((a) => a.isAccepted);

  return (
    <article>
      <Link href="/questions" className="btn-plain">
        <IconArrowLeft size={15} />
        질문 목록
      </Link>

      <div className="q-detail">
        <div className="q-detail-head">
          <span className={`badge badge-${question.status}`}>
            {STATUS_LABEL[question.status]}
          </span>
          <span className="chip">{TYPE_LABEL[question.qType]}</span>
          {question.visibility === "seniors" && (
            <span className="lock">
              <IconLock size={12} />
              선배 전용
            </span>
          )}
          <span className="q-card-tags">
            {question.tags.map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </span>
        </div>

        <h1>{question.title}</h1>
        <p className="q-detail-body">{question.body}</p>

        {/* 질문은 익명 — 기수만 */}
        <p className="q-meta">
          {question.authorCohort}기 · {question.createdAt}
        </p>

        {/* from="question": 지우고 나면 이 주소는 없어지므로 목록으로 보낸다 */}
        {admin && (
          <div className="mod-actions mod-actions-start">
            <AdminDeleteButton
              action={deleteQuestionAction}
              id={question.id}
              what="질문"
              from="question"
            />
          </div>
        )}
      </div>

      <hr className="divider" />

      <h2 className="sec-title">
        답변 <span className="count">{answers.length}</span>
      </h2>

      {error && (
        <p className="form-error" role="alert">
          <IconAlert size={16} />
          {ERROR_MESSAGE[error] ?? "입력을 확인하세요."}
        </p>
      )}

      {answers.length === 0 ? (
        <div className="empty-box">
          <IconInbox size={32} />
          <p>
            아직 답변이 없습니다.
            <br />
            아는 만큼만 적어도 도움이 됩니다.
          </p>
        </div>
      ) : (
        <ul className="answer-list">
          {answers.map((a) => (
            <li
              key={a.id}
              className={a.isAccepted ? "answer accepted" : "answer"}
            >
              {/* ★ 채택된 답변은 분명히 드러나야 한다.
                  Q&A 서비스에서 "채택된 답변이 묻히는 것"이 대표적인 설계 실패다.
                  테두리 + 상단 띠 + 아이콘, 세 가지로 표시한다. */}
              {a.isAccepted && (
                <div className="accepted-flag">
                  <IconCheckCircle size={15} />
                  질문자가 채택한 답변
                </div>
              )}

              <div className="answer-head">
                {/* 답변은 이름까지 보인다 — 기여한 사람이 드러나야 점수가 의미를 갖는다 */}
                <span className="answer-who">
                  {a.authorCohort}기 {a.authorName}
                </span>

                <span className="chip">{CONTRIB_LABEL[a.contribType]}</span>

                {/* ★ 몇 점을 받았는지 보여준다.
                    유형 이름만 적어두면 그게 점수와 어떻게 연결되는지 알 수 없다. */}
                <span className="chip chip-score">
                  +{CONTRIB_POINTS[a.contribType] + (a.isAccepted ? ACCEPT_POINTS : 0)}
                </span>

                <span className="answer-date">{a.createdAt}</span>
              </div>

              <p className="answer-body">{a.body}</p>

              <AiNote answer={a} />

              {admin && (
                <div className="mod-actions">
                  <AdminDeleteButton action={deleteAnswerAction} id={a.id} what="답변" />
                </div>
              )}

              {/* 채택 버튼은 질문을 쓴 사람에게만, 아직 채택된 답변이 없을 때만.
                  화면에서 숨기는 것과 별개로 DB의 RLS 정책도 같은 조건을 건다. */}
              {isQuestionAuthor && !hasAccepted && (
                <form action={acceptAnswerAction} className="accept-form">
                  <input type="hidden" name="answerId" value={a.id} />
                  <input type="hidden" name="questionId" value={question.id} />
                  <button type="submit" className="btn-accept">
                    <IconCheck size={15} />이 답변 채택하기
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <hr className="divider" />
      <h2 className="sec-title">답변 쓰기</h2>
      <AnswerForm questionId={question.id} />
    </article>
  );
}

/**
 * 답변 아래에 AI 판정 결과를 한 줄로 보여준다. (9차시)
 *
 * ★ 왜 이유까지 보여주나
 *   점수가 깎였는데 이유를 모르면 학생은 "AI가 멋대로 깎았다"고 느낀다.
 *   이유가 보이면 납득하거나, 적어도 무엇이 부족했는지 알 수 있다.
 *   다른 학생들도 "이 서비스는 무엇을 전체 답변으로 보는지"를 배운다.
 *
 * 깎인 건 잘못이 아니라서 빨강(--danger)을 쓰지 않는다.
 */
function AiNote({ answer: a }: { answer: Answer }) {
  // 9차시 전에 쓴 답변은 판정 기록이 없다
  if (a.claimedType === null) return null;

  const lowered = a.contribType !== a.claimedType;

  // AI 호출이 실패해서 '자료 제보'로 기록된 경우
  if (a.aiType === null) {
    return lowered ? (
      <p className="ai-note">
        <span className="ai-note-label">AI 판정</span>
        판정을 받지 못해 {CONTRIB_LABEL[a.contribType]}(으)로 기록했습니다.
      </p>
    ) : null;
  }

  return (
    <p className="ai-note">
      <span className="ai-note-label">AI 판정</span>
      {lowered && (
        <span className="ai-note-change">
          {CONTRIB_LABEL[a.claimedType]} → {CONTRIB_LABEL[a.contribType]}
        </span>
      )}
      {a.aiReason}
    </p>
  );
}
